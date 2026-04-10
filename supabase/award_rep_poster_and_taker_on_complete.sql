-- Run in Supabase → SQL Editor (one shot).
-- Completing a gig: +10 rep for poster (who taps Done) and +10 for taker (who did the work).

CREATE OR REPLACE FUNCTION award_rep_on_gig_complete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE public.users SET rep_score = rep_score + 10 WHERE id = NEW.poster_id;
        IF NEW.taker_id IS NOT NULL THEN
            UPDATE public.users SET rep_score = rep_score + 10 WHERE id = NEW.taker_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
