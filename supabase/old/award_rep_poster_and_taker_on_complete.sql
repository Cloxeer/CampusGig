-- Run in Supabase → SQL Editor (one shot).
-- Completing a gig: +9 rep for poster (who taps Done) and +10 for taker (who did the work).
-- For search_path + linter fixes, use `run_once_campusgig_linter_fix.sql` instead (includes this logic).

CREATE OR REPLACE FUNCTION award_rep_on_gig_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE users SET rep_score = rep_score + 9 WHERE id = NEW.poster_id;
        IF NEW.taker_id IS NOT NULL THEN
            UPDATE users SET rep_score = rep_score + 10 WHERE id = NEW.taker_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
