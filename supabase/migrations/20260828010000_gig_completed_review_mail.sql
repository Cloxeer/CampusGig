-- After mark-as-done: thank-you/review mail to poster + taker, delayed so they
-- can leave a review in-app first (lands within ~1 minute). Skip if already reviewed.
-- Do not email the poster for their own Accept tap.

CREATE TABLE IF NOT EXISTS private.gig_alert_mail_queue (
  notification_id uuid PRIMARY KEY REFERENCES public.notifications(id) ON DELETE CASCADE,
  send_at timestamptz NOT NULL,
  processed_at timestamptz,
  skip_reason text
);

CREATE INDEX IF NOT EXISTS gig_alert_mail_queue_due_idx
  ON private.gig_alert_mail_queue (send_at)
  WHERE processed_at IS NULL;

REVOKE ALL ON TABLE private.gig_alert_mail_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE private.gig_alert_mail_queue TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.post_gig_alert_mail(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net', 'vault', 'pg_temp'
AS $$
DECLARE
  hook_token text;
BEGIN
  SELECT decrypted_secret INTO hook_token
  FROM vault.decrypted_secrets
  WHERE name = 'gig_alert_webhook_secret';

  IF hook_token IS NULL THEN
    RAISE WARNING 'gig_alert_webhook_secret missing; skip mail post';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://hdiguksmsoalrxswrpfq.supabase.co/functions/v1/send-gig-alert',
    body := jsonb_build_object('notification_id', p_notification_id),
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || hook_token
    ),
    timeout_milliseconds := 5000
  );
END;
$$;

REVOKE ALL ON FUNCTION private.post_gig_alert_mail(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.post_gig_alert_mail(uuid) TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.enqueue_gig_alert_mail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net', 'vault', 'pg_temp'
AS $$
DECLARE
  role text;
BEGIN
  IF NEW.type NOT IN (
    'gig_requested', 'gig_accepted', 'gig_rejected', 'gig_completed', 'review_received'
  ) THEN
    RETURN NEW;
  END IF;

  role := COALESCE(NEW.metadata->>'role', '');

  -- Poster just tapped Accept — in-app is enough.
  IF NEW.type = 'gig_accepted' AND role = 'poster' THEN
    RETURN NEW;
  END IF;

  IF NEW.type = 'gig_completed' THEN
    -- No taker → nobody to review.
    IF NEW.metadata->>'requester_id' IS NULL OR NEW.metadata->>'gig_id' IS NULL THEN
      RETURN NEW;
    END IF;
    INSERT INTO private.gig_alert_mail_queue (notification_id, send_at)
    VALUES (NEW.id, now() + interval '30 seconds')
    ON CONFLICT (notification_id) DO NOTHING;
    RETURN NEW;
  END IF;

  BEGIN
    PERFORM private.post_gig_alert_mail(NEW.id);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'enqueue_gig_alert_mail failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

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
    SELECT n.user_id, n.type, n.metadata
    INTO n_user, n_type, n_meta
    FROM public.notifications n
    WHERE n.id = q_id;

    IF n_user IS NULL THEN
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

REVOKE ALL ON FUNCTION private.flush_gig_alert_mail_queue() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.flush_gig_alert_mail_queue() TO postgres, service_role;

DO $$
BEGIN
  PERFORM cron.unschedule('campusgig-flush-gig-alert-mail');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

SELECT cron.schedule(
  'campusgig-flush-gig-alert-mail',
  '30 seconds',
  $$SELECT private.flush_gig_alert_mail_queue();$$
);
