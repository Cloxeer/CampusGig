# System: Auth

## Answers

- How is authentication handled in GetCampusGig?
- What are the required fields for user onboarding?

## Architecture

- Handled via Supabase Auth with two sign-in paths:
  - **Magic links** (primary; required for account creation and as fallback).
  - **Easy access passcode** (optional 6-digit PIN stored as Supabase Auth password).
- Pre-auth checks enforce `@nmsu.edu` email validation.

## Sign-in flows

### Magic link (default)

1. User enters `@nmsu.edu` email on `/auth`.
2. System sends a magic link with GetCampusGig branding templates.
3. User clicks link and is authenticated.

### Passcode (sign-in only)

1. On `/auth` (login mode), user switches to the **Passcode** tab.
2. User enters `@nmsu.edu` email + 6-digit passcode.
3. `signInWithPassword` establishes session immediately (no `/magic` page).

Signup (`/auth?mode=signup`) remains magic-link only.

## Passcode setup

- First visit to own **Profile** without a passcode shows a prompt modal:
  - **Set passcode** — create 6-digit code.
  - **Ask me later** — hidden until next browser session.
  - **Don't ask again** — stored on profile (`easy_access_passcode_prompt_dismissed_at`).
- Users can also set or change passcode in **Settings**.

Profile flags on `public.users`:

- `has_easy_access_passcode` — boolean flag for UI.
- `easy_access_passcode_set_at` — when passcode was configured.
- `easy_access_passcode_prompt_dismissed_at` — permanent prompt dismissal.

Bcrypt hash stored in `public.user_easy_access_passcode` (owner-only RLS) via RPC `set_easy_access_passcode_record`. Plaintext is never stored in `users`.

Canonical migration: [`supabase/migrations/20250607000000_easy_access_passcode.sql`](../../supabase/migrations/20250607000000_easy_access_passcode.sql). A paste-into-dashboard copy is archived under `supabase/old/`.

## Post-auth

If it's a first-time login, the user completes the onboarding flow (name, university, basic profile logic).
