# System: Auth

## Answers

- How is authentication handled in GetCampusGig?
- What are the required fields for user onboarding?

## Architecture

- Handled entirely via Supabase Auth (Magic Links).
- Pre-auth checks enforce `@nmsu.edu` email validation.

## Flow

1. User enters `@nmsu.edu` email.
2. System sends a magic link with GetCampusGig branding templates.
3. User clicks link and is authenticated.
4. If it's a first-time login, the user completes the onboarding flow (name, university, basic profile logic).
