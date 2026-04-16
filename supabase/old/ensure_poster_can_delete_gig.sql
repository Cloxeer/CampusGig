-- Run once in Supabase SQL Editor if DELETE on gigs fails for posters.
-- Does not modify other tables. Idempotent with run_once_campusgig_linter_fix.sql.

DROP POLICY IF EXISTS "Poster can delete own gigs" ON public.gigs;
CREATE POLICY "Poster can delete own gigs"
    ON public.gigs FOR DELETE TO authenticated
    USING ((SELECT auth.uid()) = poster_id);
