# Deploying the welcome email

This function can't be deployed from the Claude session — it needs to run
with your real Supabase project credentials, from a machine that can reach
Supabase (the sandbox this session runs in can only reach GitHub and package
registries). Here's the full path, in order. It's mostly copy-paste.

## 1. Get a Resend API key

1. Go to https://resend.com and sign up (free, no credit card — 100
   emails/day, 3,000/month).
2. In the dashboard, go to **API Keys → Create API Key**. Copy it — you'll
   need it in step 3.
3. (Recommended, not required to test) Go to **Domains → Add Domain**, add
   `mhida.org`, and add the DNS records it gives you wherever your domain's
   DNS is managed. Until this is verified, emails send from Resend's shared
   `onboarding@resend.dev` address, which works for testing but has sending
   restrictions — you'll want your own domain verified before sending to
   real members at scale.

## 2. Install the Supabase CLI (once, on your computer)

```bash
npm install -g supabase
supabase login
```

This opens a browser to authorize the CLI against your Supabase account.

## 3. Link this repo to your Supabase project

From inside the `mhida-website` folder:

```bash
supabase link --project-ref xtcztnyyfdaubnunfvws
```

(That's the project ref already used in `src/lib/supabase.ts`. It'll ask
you to confirm via your Supabase account.)

## 4. Set the function's secrets

```bash
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set WEBHOOK_SECRET=some-long-random-string-you-make-up
```

`WEBHOOK_SECRET` is just a shared password between Supabase's webhook and
this function, so random requests from the internet can't trigger emails.
Generate any long random string for it, e.g.:

```bash
openssl rand -hex 24
```

Optional — once your domain is verified in Resend:

```bash
supabase secrets set RESEND_FROM="MHIDA <welcome@mhida.org>"
```

## 5. Deploy the function

```bash
supabase functions deploy send-welcome-email --no-verify-jwt
```

`--no-verify-jwt` is required here: Database Webhooks call the function
directly (not through a logged-in user's session), so there's no Supabase
JWT to check — the function checks the `WEBHOOK_SECRET` header instead
(see step 6).

## 6. Create the Database Webhook

In the Supabase Dashboard:

1. **Database → Webhooks → Create a new webhook**
2. Name: `send-welcome-email`
3. Table: `members`
4. Events: check **Insert** only
5. Type: **Supabase Edge Functions**
6. Edge Function: select `send-welcome-email`
7. Under **HTTP Headers**, add one:
   - Key: `Authorization`
   - Value: `Bearer some-long-random-string-you-make-up` (the exact same
     value you set as `WEBHOOK_SECRET` in step 4)
8. Save.

## 7. Test it

Register a new test account on the live site (mhida.org/register). Within
a few seconds you should get the welcome email at the address you
registered with.

If it doesn't arrive:

- **Supabase Dashboard → Edge Functions → send-welcome-email → Logs** shows
  every invocation and any errors — this is the first place to look.
- If the email arrives but without the card image attached, that means
  card generation failed but the function still sent the rest of the email
  successfully (this is intentional — see the comment at the top of
  `index.ts`). The logs will show why.
- **Resend Dashboard → Logs** shows every send attempt and delivery status
  from Resend's side.

Paste me whatever shows up in either log and I'll help debug from there.
