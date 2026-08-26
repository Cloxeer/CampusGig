-- Cash-in-person for now: not a handle, just a payment preference.
ALTER TABLE public.user_private_contact
  ADD COLUMN IF NOT EXISTS accepts_cash boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_private_contact.accepts_cash IS
  'User will take cash in person for now; can add Venmo/Cash App later. Not a unique handle.';
