-- Easy Access Passcode: profile flags + private bcrypt hash table + RPC.
-- For paste-into-dashboard workflow see: migration_easy_access_passcode_one_shot.sql

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS has_easy_access_passcode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS easy_access_passcode_set_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS easy_access_passcode_prompt_dismissed_at TIMESTAMPTZ NULL;

CREATE TABLE IF NOT EXISTS public.user_easy_access_passcode (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  passcode_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.user_easy_access_passcode ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner can read own passcode record" ON public.user_easy_access_passcode;
DROP POLICY IF EXISTS "Owner can insert own passcode record" ON public.user_easy_access_passcode;
DROP POLICY IF EXISTS "Owner can update own passcode record" ON public.user_easy_access_passcode;
DROP POLICY IF EXISTS "Owner can delete own passcode record" ON public.user_easy_access_passcode;

CREATE POLICY "Owner can read own passcode record"
  ON public.user_easy_access_passcode FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owner can insert own passcode record"
  ON public.user_easy_access_passcode FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owner can update own passcode record"
  ON public.user_easy_access_passcode FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Owner can delete own passcode record"
  ON public.user_easy_access_passcode FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.set_easy_access_passcode_record(p_passcode TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
  uid UUID := auth.uid();
  trimmed TEXT;
  trivial TEXT[] := ARRAY[
    '000000', '111111', '222222', '333333', '444444', '555555',
    '666666', '777777', '888888', '999999', '123456', '654321',
    '012345', '543210', '121212', '101010'
  ];
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  trimmed := trim(p_passcode);
  IF trimmed !~ '^\d{6}$' THEN RAISE EXCEPTION 'Passcode must be exactly 6 digits'; END IF;
  IF trimmed = ANY (trivial) THEN RAISE EXCEPTION 'Choose a less obvious passcode'; END IF;
  INSERT INTO public.user_easy_access_passcode (user_id, passcode_hash, updated_at)
  VALUES (uid, crypt(trimmed, gen_salt('bf', 10)), CURRENT_TIMESTAMP)
  ON CONFLICT (user_id) DO UPDATE
    SET passcode_hash = EXCLUDED.passcode_hash, updated_at = CURRENT_TIMESTAMP;
  UPDATE public.users
  SET has_easy_access_passcode = true, easy_access_passcode_set_at = CURRENT_TIMESTAMP
  WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.set_easy_access_passcode_record(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_easy_access_passcode_record(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_easy_access_passcode_record(TEXT) TO authenticated;

COMMIT;
