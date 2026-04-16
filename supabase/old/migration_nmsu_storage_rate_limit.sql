-- =============================================================================
-- CampusGig — NMSU-only email, storage listing fix, gig post rate limit
-- Applied to production via Supabase MCP migration: nmsu_domain_storage_gig_rate_limit
-- Safe to re-run: uses IF EXISTS / DROP IF EXISTS patterns where applicable.
-- =============================================================================

-- 1) Private contact: @nmsu.edu only
ALTER TABLE public.user_private_contact DROP CONSTRAINT IF EXISTS user_private_contact_email_edu;
ALTER TABLE public.user_private_contact DROP CONSTRAINT IF EXISTS user_private_contact_email_nmsu;
ALTER TABLE public.user_private_contact ADD CONSTRAINT user_private_contact_email_nmsu
  CHECK (email ~* '@nmsu\.edu$');

-- 2) Legacy public.users.email if column still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS email_must_be_edu;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS email_must_be_nmsu;
    ALTER TABLE public.users ADD CONSTRAINT email_must_be_nmsu CHECK (email ~* '@nmsu\.edu$');
  END IF;
END $$;

-- 3) Rate limit: max 5 new gigs per poster per rolling hour
CREATE OR REPLACE FUNCTION public.enforce_gig_post_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.gigs
  WHERE poster_id = NEW.poster_id
    AND created_at > NOW() - INTERVAL '1 hour';
  IF cnt >= 5 THEN
    RAISE EXCEPTION 'You can post at most 5 gigs per hour. Try again later.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gig_rate_limit ON public.gigs;
CREATE TRIGGER trg_gig_rate_limit
  BEFORE INSERT ON public.gigs
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_gig_post_rate_limit();

-- 4) Storage: remove broad public SELECT (stops bucket listing; public object URLs unchanged)
DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;

-- 5) Auth: block non-@nmsu.edu at signup / email change (requires permission on auth.users)
CREATE OR REPLACE FUNCTION public.enforce_auth_email_nmsu()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email !~* '@nmsu\.edu$' THEN
    RAISE EXCEPTION 'Only @nmsu.edu email addresses are allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_auth_email_nmsu_trigger ON auth.users;
CREATE TRIGGER enforce_auth_email_nmsu_trigger
  BEFORE INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_auth_email_nmsu();
