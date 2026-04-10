-- ============================================================
-- Migration: Allow authenticated users to insert and delete
-- their own notifications. Run in Supabase SQL Editor.
-- ============================================================
--
-- After this, run `run_once_campusgig_linter_fix.sql` to replace
-- the permissive INSERT policy with the gig-linked policy.
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications"
    ON notifications FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
