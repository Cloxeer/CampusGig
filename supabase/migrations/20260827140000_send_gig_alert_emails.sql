-- Transactional gig/review mail: on notifications INSERT, ping send-gig-alert.
-- Copy stays the in-app title/body. Auth magic-link mail is unchanged (GoTrue).

CREATE EXTENSION IF NOT EXISTS pg_net;

COMMENT ON COLUMN public.users.email_alerts_enabled IS
  'When true, send transactional gig/review mail to the sign-in address (auth.users.email). Settings → Email notifications.';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM vault.secrets WHERE name = 'gig_alert_webhook_secret'
  ) THEN
    PERFORM vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'gig_alert_webhook_secret',
      'Bearer token for Edge Function send-gig-alert'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public._cg_authorize_gig_alert_mail(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'vault', 'pg_temp'
AS $$
DECLARE
  expected text;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN false;
  END IF;
  SELECT decrypted_secret INTO expected
  FROM vault.decrypted_secrets
  WHERE name = 'gig_alert_webhook_secret';
  RETURN expected IS NOT NULL AND expected = p_token;
END;
$$;

REVOKE ALL ON FUNCTION public._cg_authorize_gig_alert_mail(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._cg_authorize_gig_alert_mail(text) TO service_role;

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
  IF NEW.type = 'gig_accepted' AND role = 'poster' THEN
    RETURN NEW;
  END IF;
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

REVOKE ALL ON FUNCTION private.enqueue_gig_alert_mail() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.enqueue_gig_alert_mail() TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_enqueue_gig_alert_mail ON public.notifications;
CREATE TRIGGER trg_enqueue_gig_alert_mail
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION private.enqueue_gig_alert_mail();
