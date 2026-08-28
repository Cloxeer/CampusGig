CREATE OR REPLACE FUNCTION private.flush_gig_alert_mail_queue()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  q_id uuid;
  n_user uuid;
  n_type text;
  n_meta jsonb;
  gig uuid;
BEGIN
  FOR q_id IN
    SELECT q.notification_id
    FROM private.gig_alert_mail_queue q
    WHERE q.processed_at IS NULL
      AND q.send_at <= now()
    ORDER BY q.send_at
    LIMIT 50
    FOR UPDATE OF q SKIP LOCKED
  LOOP
    n_user := NULL;
    n_type := NULL;
    n_meta := NULL;
    SELECT n.user_id, n.type, n.metadata
    INTO n_user, n_type, n_meta
    FROM public.notifications n
    WHERE n.id = q_id;

    IF NOT FOUND THEN
      UPDATE private.gig_alert_mail_queue
      SET processed_at = now(), skip_reason = 'not_found'
      WHERE notification_id = q_id;
      CONTINUE;
    END IF;

    IF n_type = 'gig_completed' THEN
      gig := NULLIF(n_meta->>'gig_id', '')::uuid;
      IF gig IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.gig_id = gig AND r.reviewer_id = n_user
      ) THEN
        UPDATE private.gig_alert_mail_queue
        SET processed_at = now(), skip_reason = 'already_reviewed'
        WHERE notification_id = q_id;
        CONTINUE;
      END IF;
    END IF;

    BEGIN
      PERFORM private.post_gig_alert_mail(q_id);
      UPDATE private.gig_alert_mail_queue
      SET processed_at = now()
      WHERE notification_id = q_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'flush_gig_alert_mail_queue failed for %: %', q_id, SQLERRM;
    END;
  END LOOP;
END;
$$;
