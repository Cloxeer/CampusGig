-- ============================================================
-- Migration: Allow authenticated users to insert and delete
-- their own notifications. Run in Supabase SQL Editor.
-- ============================================================

-- Notifications INSERT policy (was missing — clients couldn't create notifications)
CREATE POLICY "Authenticated users can insert notifications"
    ON notifications FOR INSERT TO authenticated
    WITH CHECK (true);

-- Notifications DELETE policy (for swipe-to-delete)
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE TO authenticated
    USING (auth.uid() = user_id);
