-- =============================================================================
-- CampusGig — Expand user_private_contact (PII): social + payment options, NMSU email
-- Run once in Supabase SQL Editor (or via MCP apply_migration).
-- =============================================================================

BEGIN;

-- ── Columns (PII — visibility controlled by existing RLS on user_private_contact)
ALTER TABLE public.user_private_contact
  ADD COLUMN IF NOT EXISTS instagram VARCHAR(255),
  ADD COLUMN IF NOT EXISTS discord VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zelle VARCHAR(255),
  ADD COLUMN IF NOT EXISTS apple_pay VARCHAR(255),
  ADD COLUMN IF NOT EXISTS google_pay VARCHAR(255);

COMMENT ON TABLE public.user_private_contact IS
  'PII: school email, phone, payments, social handles. Row visible to owner and vetted counterparties (see RLS).';

COMMENT ON COLUMN public.user_private_contact.email IS 'NMSU school email; must match @nmsu.edu';
COMMENT ON COLUMN public.user_private_contact.phone IS 'Contact phone (required at signup)';
COMMENT ON COLUMN public.user_private_contact.venmo IS 'Venmo handle';
COMMENT ON COLUMN public.user_private_contact.cashapp IS 'Cash App cashtag';
COMMENT ON COLUMN public.user_private_contact.paypal IS 'PayPal email or handle';
COMMENT ON COLUMN public.user_private_contact.snapchat IS 'Snapchat username';
COMMENT ON COLUMN public.user_private_contact.instagram IS 'Instagram username or URL fragment';
COMMENT ON COLUMN public.user_private_contact.discord IS 'Discord username or tag';
COMMENT ON COLUMN public.user_private_contact.zelle IS 'Zelle email or phone';
COMMENT ON COLUMN public.user_private_contact.apple_pay IS 'Apple Cash / Apple Pay contact hint';
COMMENT ON COLUMN public.user_private_contact.google_pay IS 'Google Pay email or phone';

-- ── Uniqueness where handles must be globally unique (same pattern as existing columns)
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_instagram_key
  ON public.user_private_contact (instagram) WHERE instagram IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_discord_key
  ON public.user_private_contact (discord) WHERE discord IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_zelle_key
  ON public.user_private_contact (zelle) WHERE zelle IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_apple_pay_key
  ON public.user_private_contact (apple_pay) WHERE apple_pay IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS user_private_contact_google_pay_key
  ON public.user_private_contact (google_pay) WHERE google_pay IS NOT NULL;

-- ── Defensive: email column must stay @nmsu.edu (re-apply if upgrading from generic .edu)
ALTER TABLE public.user_private_contact DROP CONSTRAINT IF EXISTS user_private_contact_email_nmsu;
ALTER TABLE public.user_private_contact ADD CONSTRAINT user_private_contact_email_nmsu
  CHECK (email ~* '@nmsu\.edu$');

CREATE OR REPLACE FUNCTION public.enforce_private_contact_email_nmsu()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.email IS NOT NULL AND NEW.email !~* '@nmsu\.edu$' THEN
    RAISE EXCEPTION 'School email must be an @nmsu.edu address';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_private_contact_email_nmsu ON public.user_private_contact;
CREATE TRIGGER trg_private_contact_email_nmsu
  BEFORE INSERT OR UPDATE OF email ON public.user_private_contact
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_private_contact_email_nmsu();

COMMIT;
