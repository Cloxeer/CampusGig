# Auth email templates (GoTrue)

OTP expiry is **900 seconds**. Paste these in **Authentication → Email Templates**.
Gig activity mail is a separate Edge Function (`send-gig-alert`) and uses the same card chrome.

## Magic link

**Subject:** `Your CampusGig sign-in link`

**Body:** paste `supabase/email_templates/magic_link.html` (source HTML, not this markdown).

Confirm signup / invite / recovery: same card, only the headline and button label change. Keep `{{ .ConfirmationURL }}` and `{{ .Email }}`. Do not put gig-request copy in a login template.
