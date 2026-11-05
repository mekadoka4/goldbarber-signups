# GoldBarber signup

The signup page sends the barber's name, email, phone, WhatsApp, and profile photo to the `register-barber` Supabase Edge Function. The function validates the fields, saves the photo in a private bucket, and writes the record to `public.barber_signups`. Unique database indexes reject duplicate emails, phone numbers, and WhatsApp numbers. The browser has no direct read access to these records or photos.

## Current deployment

- Supabase project: `goldbarber-signups`
- Project ref: `qfboniifeieauwbjlifp`
- Region: São Paulo (`sa-east-1`)
- Edge Function: `register-barber`
- Function URL: `https://qfboniifeieauwbjlifp.supabase.co/functions/v1/register-barber`
- The publishable key is configured in `signup.html`; it is designed for browser use. Never add a Supabase secret/service-role key to the site or repository.

The database schema and private photo bucket are defined in `supabase/migrations/20261105210000_create_barber_signups.sql`. The deployed function source is in `supabase/functions/register-barber/index.ts`.

## Hosting

The GitHub Pages workflow in `.github/workflows/pages.yml` publishes `index.html` and `signup.html` over HTTPS after a push to `main`. The landing page's **Cadastrar-se** links open `/signup.html` in a new tab. The source repository contains no server secrets. Login is not connected yet.

## View signups

In the Supabase dashboard, open **Table Editor → `barber_signups`** to view the submitted details. Profile photos are in **Storage → `barber-profile-photos`**. Keep the bucket private.

This collects personal information and profile photos. Tell registrants why the data is collected, who can access it, and how they can request correction or deletion. The current public form checks for duplicate records, but does not verify ownership of an email address or phone number and does not yet include CAPTCHA/rate limiting; add those controls before promoting the form widely.
