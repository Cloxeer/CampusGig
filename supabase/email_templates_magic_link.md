# Magic link / OTP emails — 15 minute expiry (900 seconds)

You set **OTP expiry** to **900 seconds** in **Supabase Dashboard → Authentication → [Email]** (or Auth settings). The built-in templates do **not** auto-update the human-readable text when you change seconds.

Edit these in **Authentication → Email Templates** (adjust wording to match your brand):

## Magic link (recommended copy)

**Subject (example):** `Your CampusGig sign-in link`

**Body — add a line like:**

> This link expires in **15 minutes** for your security.

If your template uses GoTrue variables, you can keep Supabase’s default link block and only add the sentence above the button or below the footer.

## Confirm signup / Magic link (if separate)

Use the same **15 minutes** line anywhere you describe validity.

## OTP code emails (only if you use `{{ .Token }}` in the template)

If users type a numeric code, mention:

> This code expires in **15 minutes**.

---

**Dashboard links**

- Email templates: open your project → **Authentication** → **Email Templates**
- OTP / magic link expiry (seconds): **Authentication** → providers / SMTP settings (same area where you set **900**)
