-- Restore in-app alerts for gig request / accept / reject / complete.
-- Source of truth: private.* DEFINER RPCs insert into public.notifications.
-- The Alerts UI only reads that table; it must not invent rows.

CREATE OR REPLACE FUNCTION private.notify_gig(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_gig_id uuid,
  p_request_id uuid,
  p_requester_id uuid,
  p_poster_id uuid,
  p_role text,
  p_other_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;
  INSERT INTO public.notifications (user_id, type, title, body, metadata)
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_body,
    jsonb_strip_nulls(jsonb_build_object(
      'gig_id', p_gig_id,
      'request_id', p_request_id,
      'requester_id', p_requester_id,
      'poster_id', p_poster_id,
      'role', p_role,
      'other_name', p_other_name
    ))
  );
END;
$$;

REVOKE ALL ON FUNCTION private.notify_gig(uuid, text, text, text, uuid, uuid, uuid, uuid, text, text)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.request_gig(p_gig_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  uid uuid := auth.uid();
  g record;
  rid uuid;
  pname text;
  rname text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = uid AND is_verified_student) THEN
    RAISE EXCEPTION 'Only verified NMSU students can take on gigs';
  END IF;

  SELECT * INTO g FROM public.gigs WHERE id = p_gig_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;
  IF g.poster_id = uid THEN
    RAISE EXCEPTION 'You cannot request your own gig';
  END IF;
  IF g.status NOT IN ('open', 'requested') THEN
    RAISE EXCEPTION 'Gig is not accepting requests';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.gig_requests
    WHERE gig_id = p_gig_id AND requester_id = uid
  ) THEN
    RAISE EXCEPTION 'You already requested this gig';
  END IF;

  INSERT INTO public.gig_requests (gig_id, requester_id, status)
  VALUES (p_gig_id, uid, 'pending')
  RETURNING id INTO rid;

  PERFORM public._cg_set_gig_lifecycle_ok();
  IF g.status = 'open' THEN
    UPDATE public.gigs SET status = 'requested' WHERE id = p_gig_id;
  END IF;

  pname := public._cg_display_name(g.poster_id);
  rname := public._cg_display_name(uid);

  PERFORM private.notify_gig(
    g.poster_id, 'gig_requested',
    rname || ' wants to take your gig', g.title,
    p_gig_id, rid, uid, g.poster_id, 'poster', rname
  );
  PERFORM private.notify_gig(
    uid, 'gig_request_sent',
    'You requested a gig', g.title || ' · Waiting for ' || pname || ' to accept',
    p_gig_id, rid, uid, g.poster_id, 'requester', pname
  );

  RETURN rid;
END;
$$;

CREATE OR REPLACE FUNCTION private.accept_gig_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  uid uuid := auth.uid();
  r record;
  g record;
  gtitle text;
  pname text;
  reqname text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM public.gig_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;
  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  SELECT * INTO g FROM public.gigs WHERE id = r.gig_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;
  IF g.poster_id <> uid THEN
    RAISE EXCEPTION 'Only the poster can accept';
  END IF;
  IF g.status NOT IN ('open', 'requested') THEN
    RAISE EXCEPTION 'Gig cannot be accepted in this state';
  END IF;

  UPDATE public.gig_requests SET status = 'accepted' WHERE id = p_request_id;
  UPDATE public.gig_requests
    SET status = 'rejected'
    WHERE gig_id = g.id AND id <> p_request_id AND status = 'pending';

  PERFORM public._cg_set_gig_lifecycle_ok();
  UPDATE public.gigs
  SET taker_id = r.requester_id, status = 'active'
  WHERE id = g.id;

  gtitle := g.title;
  pname := public._cg_display_name(uid);
  reqname := public._cg_display_name(r.requester_id);

  PERFORM private.notify_gig(
    r.requester_id, 'gig_accepted',
    pname || ' accepted your request!', gtitle || ' · Tap to see contact info',
    g.id, p_request_id, r.requester_id, g.poster_id, 'requester', pname
  );
  PERFORM private.notify_gig(
    uid, 'gig_accepted',
    'You accepted ' || reqname || '''s request', gtitle || ' · Tap to see contact info',
    g.id, p_request_id, r.requester_id, g.poster_id, 'poster', reqname
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.reject_gig_request(p_request_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  uid uuid := auth.uid();
  r record;
  g record;
  pname text;
  pending_left int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO r FROM public.gig_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  SELECT * INTO g FROM public.gigs WHERE id = r.gig_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;
  IF g.poster_id <> uid THEN
    RAISE EXCEPTION 'Only the poster can reject';
  END IF;
  IF r.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  UPDATE public.gig_requests SET status = 'rejected' WHERE id = p_request_id AND status = 'pending';

  SELECT COUNT(*) INTO pending_left FROM public.gig_requests
  WHERE gig_id = g.id AND status = 'pending';

  IF pending_left = 0 AND g.status = 'requested' THEN
    PERFORM public._cg_set_gig_lifecycle_ok();
    UPDATE public.gigs SET status = 'open' WHERE id = g.id;
  END IF;

  pname := public._cg_display_name(uid);

  PERFORM private.notify_gig(
    r.requester_id, 'gig_rejected',
    'Your gig request was declined', COALESCE(g.title, 'The poster chose someone else'),
    g.id, p_request_id, r.requester_id, g.poster_id, 'requester', pname
  );
END;
$$;

CREATE OR REPLACE FUNCTION private.complete_gig(p_gig_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  uid uuid := auth.uid();
  g record;
  tname text;
  pname text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT * INTO g FROM public.gigs WHERE id = p_gig_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gig not found';
  END IF;
  IF g.poster_id <> uid THEN
    RAISE EXCEPTION 'Only the poster can mark a gig as done';
  END IF;
  IF g.status <> 'active' THEN
    RAISE EXCEPTION 'Gig must be active to complete';
  END IF;

  PERFORM public._cg_set_gig_lifecycle_ok();
  UPDATE public.gigs SET status = 'completed', completed_at = now() WHERE id = p_gig_id;

  tname := COALESCE(public._cg_display_name(g.taker_id), 'Someone');
  pname := COALESCE(public._cg_display_name(g.poster_id), 'Someone');

  IF g.taker_id IS NOT NULL THEN
    PERFORM private.notify_gig(
      g.taker_id, 'gig_completed',
      'Gig completed! +10 Rep',
      g.title || ' · ' || pname || ' marked it done — you earned +10 Rep',
      p_gig_id, NULL, g.taker_id, g.poster_id, 'requester', pname
    );
  END IF;

  PERFORM private.notify_gig(
    uid, 'gig_completed',
    'Gig marked as done! +8 Rep',
    CASE
      WHEN g.taker_id IS NOT NULL
      THEN g.title || ' · You earned +8 · ' || tname || ' earned +10'
      ELSE g.title || ' · +8 Rep'
    END,
    p_gig_id, NULL, g.taker_id, g.poster_id, 'poster', tname
  );
END;
$$;

-- Pending requests that never got Alerts rows (student-gate rewrite).
INSERT INTO public.notifications (user_id, type, title, body, metadata)
SELECT
  g.poster_id,
  'gig_requested',
  public._cg_display_name(gr.requester_id) || ' wants to take your gig',
  g.title,
  jsonb_build_object(
    'gig_id', gr.gig_id,
    'request_id', gr.id,
    'requester_id', gr.requester_id,
    'poster_id', g.poster_id,
    'role', 'poster',
    'other_name', public._cg_display_name(gr.requester_id)
  )
FROM public.gig_requests gr
JOIN public.gigs g ON g.id = gr.gig_id
WHERE gr.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.type = 'gig_requested'
      AND n.metadata->>'request_id' = gr.id::text
  );

INSERT INTO public.notifications (user_id, type, title, body, metadata)
SELECT
  gr.requester_id,
  'gig_request_sent',
  'You requested a gig',
  g.title || ' · Waiting for ' || public._cg_display_name(g.poster_id) || ' to accept',
  jsonb_build_object(
    'gig_id', gr.gig_id,
    'request_id', gr.id,
    'requester_id', gr.requester_id,
    'poster_id', g.poster_id,
    'role', 'requester',
    'other_name', public._cg_display_name(g.poster_id)
  )
FROM public.gig_requests gr
JOIN public.gigs g ON g.id = gr.gig_id
WHERE gr.status = 'pending'
  AND NOT EXISTS (
    SELECT 1 FROM public.notifications n
    WHERE n.type = 'gig_request_sent'
      AND n.metadata->>'request_id' = gr.id::text
  );
