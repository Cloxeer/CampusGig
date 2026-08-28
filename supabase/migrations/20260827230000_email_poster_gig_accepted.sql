-- Email the poster when they accept a taker, and use "X is taking your gig" copy.
-- Previously poster gig_accepted mail was skipped (only the taker was emailed).

CREATE OR REPLACE FUNCTION private.accept_gig_request(p_request_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'pg_temp' AS $$
DECLARE uid UUID := auth.uid(); r RECORD; g RECORD; gtitle TEXT; pname TEXT; reqname TEXT;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO r FROM public.gig_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Request is not pending'; END IF;
  SELECT * INTO g FROM public.gigs WHERE id = r.gig_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Gig not found'; END IF;
  IF g.poster_id <> uid THEN RAISE EXCEPTION 'Only the poster can accept'; END IF;
  IF g.status NOT IN ('open', 'requested') THEN RAISE EXCEPTION 'Gig cannot be accepted in this state'; END IF;
  UPDATE public.gig_requests SET status = 'accepted' WHERE id = p_request_id;
  UPDATE public.gig_requests SET status = 'rejected' WHERE gig_id = g.id AND id <> p_request_id AND status = 'pending';
  PERFORM public._cg_set_gig_lifecycle_ok();
  UPDATE public.gigs SET taker_id = r.requester_id, status = 'active' WHERE id = g.id;
  gtitle := g.title;
  pname := public._cg_display_name(uid);
  reqname := public._cg_display_name(r.requester_id);
  PERFORM private.notify_gig(r.requester_id, 'gig_accepted', pname || ' accepted your request!', gtitle || ' · Tap to see contact info', g.id, p_request_id, r.requester_id, g.poster_id, 'requester', pname);
  PERFORM private.notify_gig(uid, 'gig_accepted', reqname || ' is taking your gig', gtitle || ' · Tap to see contact info', g.id, p_request_id, r.requester_id, g.poster_id, 'poster', reqname);
END;
$$;

CREATE OR REPLACE FUNCTION private.enqueue_gig_alert_mail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net', 'vault', 'pg_temp'
AS $$
DECLARE
  hook_token text;
  role text;
BEGIN
  IF NEW.type NOT IN (
    'gig_requested', 'gig_accepted', 'gig_rejected', 'gig_completed', 'review_received'
  ) THEN
    RETURN NEW;
  END IF;

  role := COALESCE(NEW.metadata->>'role', '');
  IF NEW.type = 'gig_completed' AND role = 'poster' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret INTO hook_token
  FROM vault.decrypted_secrets
  WHERE name = 'gig_alert_webhook_secret';

  IF hook_token IS NULL THEN
    RAISE WARNING 'gig_alert_webhook_secret missing; skip mail enqueue';
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := 'https://hdiguksmsoalrxswrpfq.supabase.co/functions/v1/send-gig-alert',
      body := jsonb_build_object('notification_id', NEW.id),
      params := '{}'::jsonb,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || hook_token
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'enqueue_gig_alert_mail failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;
