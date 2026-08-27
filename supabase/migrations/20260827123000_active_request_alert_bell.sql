-- Active-request bell: visiting Alerts does not dismiss gig_requested.
-- The request leaving pending (accept/reject) marks those rows read.

CREATE OR REPLACE FUNCTION private.trg_clear_active_request_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status IS DISTINCT FROM 'pending' THEN
    IF NEW.status = 'accepted' THEN
      UPDATE public.notifications
      SET read = true
      WHERE type = 'gig_requested'
        AND metadata->>'gig_id' = NEW.gig_id::text
        AND read = false;
    ELSE
      UPDATE public.notifications
      SET read = true
      WHERE type = 'gig_requested'
        AND metadata->>'request_id' = NEW.id::text
        AND read = false;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clear_active_request_alerts ON public.gig_requests;
CREATE TRIGGER trg_clear_active_request_alerts
  AFTER UPDATE OF status ON public.gig_requests
  FOR EACH ROW
  EXECUTE FUNCTION private.trg_clear_active_request_alerts();

-- Restore the bell for requests that are still waiting on accept.
UPDATE public.notifications n
SET read = false
WHERE n.type = 'gig_requested'
  AND EXISTS (
    SELECT 1 FROM public.gig_requests gr
    WHERE gr.id = (n.metadata->>'request_id')::uuid
      AND gr.status = 'pending'
  );
