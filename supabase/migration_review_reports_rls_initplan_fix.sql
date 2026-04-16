-- CampusGig — auth_rls_initplan on public.reports (was review_reports; table renamed/unified)
-- Re-run safe: drops and recreates same policy semantics.

BEGIN;

DROP POLICY IF EXISTS reports_insert_own ON public.reports;
DROP POLICY IF EXISTS reports_select_own ON public.reports;

CREATE POLICY reports_insert_own ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY reports_select_own ON public.reports
  FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()));

COMMIT;
