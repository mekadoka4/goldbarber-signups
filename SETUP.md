# GoldBarber signup

The signup page sends the barber's name, email, phone, WhatsApp, password, and profile photo to the `register-barber` Supabase Edge Function. The function validates the fields, creates the account with Supabase Auth, saves the photo in a private bucket, and writes the record to `public.barber_signups`. The profile stores only the Auth user ID (`auth_user_id`), never the password. Unique database indexes reject duplicate emails, phone numbers, WhatsApp numbers, and Auth user IDs. The browser has no direct read access to these records or photos.

## Current deployment

- Supabase project: `goldbarber-signups`
- Project ref: `qfboniifeieauwbjlifp`
- Region: São Paulo (`sa-east-1`)
- Edge Function: `register-barber`
- Function URL: `https://qfboniifeieauwbjlifp.supabase.co/functions/v1/register-barber`
- The publishable key is configured in `signup.html`; it is designed for browser use. Never add a Supabase secret/service-role key to the site or repository.

The initial database schema and private photo bucket are defined in `supabase/migrations/20261105210000_create_barber_signups.sql`; the Auth user link is added by `supabase/migrations/20261105212000_link_barber_signups_to_auth.sql`. The deployed function source is in `supabase/functions/register-barber/index.ts`.

## Hosting

The GitHub Pages workflow in `.github/workflows/pages.yml` publishes `index.html`, `signup.html`, and `login.html` over HTTPS after a push to `main`. The landing page's **Cadastrar-se** links open `/signup.html` in a new tab, and **Entrar** opens `/login.html`. The source repository contains no server secrets. Account creation uses `SUPABASE_SERVICE_ROLE_KEY` only in the Edge Function environment; the password is not logged or written to the signup table. Supabase Auth's email-confirmation behavior follows the project configuration. The login page signs in with Supabase Auth using the browser's publishable key and the registrant's email/password; passwords are sent directly to Supabase Auth and never to the signup Edge Function or stored by the site.

The signup form requires a password between 8 and 128 characters. Auth users are created unconfirmed and receive a signup confirmation email before registration succeeds. The confirmation link redirects to `https://mekadoka4.github.io/goldbarber-signups/signup.html`, where a successful Supabase Auth callback shows the active-account confirmation and removes callback tokens from the address bar. Supabase Auth's Redirect URLs allowlist must include this exact URL, and the signup email template must use Supabase's confirmation URL; otherwise, the confirmation may not return to this page. The user must confirm the email to activate the account. If storing the photo or signup profile or sending the confirmation email fails after the Auth user is created, the function attempts to remove the profile, photo, and Auth user so a partial signup is not left behind.

## View signups

In the Supabase dashboard, open **Table Editor → `barber_signups`** to view the submitted details. Profile photos are in **Storage → `barber-profile-photos`**. Keep the bucket private.

This collects personal information and profile photos. Tell registrants why the data is collected, who can access it, and how they can request correction or deletion. The current public form checks for duplicate records, but does not verify ownership of an email address or phone number and does not yet include CAPTCHA/rate limiting; add those controls before promoting the form widely.
