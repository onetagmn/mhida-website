# Setting up the welcome email (EmailJS + Gmail)

No server, no deployment, no CLI — just a few clicks on emailjs.com and
three values pasted into one file. Takes about 10-15 minutes.

The registration page itself generates the member's business card (as a
PNG, reusing the exact same design already on the site) the moment
someone registers, and sends the welcome email straight from their
browser via EmailJS — using your Gmail account as the actual sender.

## 1. Create an EmailJS account

Go to https://www.emailjs.com and sign up (free — 200 emails/month).

## 2. Connect Gmail as an email service

1. Dashboard → **Email Services** → **Add New Service**.
2. Choose **Gmail**, then follow the Google sign-in prompt to connect the
   account you want emails to send *from* (e.g. your MHIDA Gmail).
3. Once connected, copy the **Service ID** shown (looks like
   `service_xxxxxxx`).

Note from EmailJS's own docs: personal Gmail accounts are meant for
low-volume sending — fine for a members' association, but if you ever
send large batches at once, Gmail may temporarily rate-limit or flag the
account. For registration emails trickling in one at a time, this isn't
a concern.

## 3. Create the email template

1. Dashboard → **Email Templates** → **Create New Template**.
2. In the editor, switch to the **Code Editor** view (usually a `<>`
   icon) and paste the full contents of `TEMPLATE.html (next to
   this file) as the template body.
3. Set the **Subject** field to:
   `Тавтай морил / Welcome to MHIDA — {{member_id}}`
4. Under the template's settings (recipient/sender fields):
   - **To Email**: `{{to_email}}`
   - **From Name**: `MHIDA`
   - **Reply To**: leave as your connected Gmail, or set to a contact
     address of your choice.
5. Save the template, then copy its **Template ID** (looks like
   `template_xxxxxxx`).

Note: the digital business card is **not** attached to this email —
EmailJS attachments require a paid plan ($9/mo minimum). The email
instead tells the member to view/download/print their card from their
dashboard after logging in, where the same card is already available.
If you'd rather attach it directly, upgrading to EmailJS's Personal
plan and adding a Variable Attachment (parameter name `content`) would
enable that — ask and we can wire it back in.

## 4. Get your Public Key

Dashboard → **Account** → **API Keys** → copy the **Public Key**. This
one is meant to be public (same idea as the Supabase anon key already in
this codebase) — it's safe to ship in the site's client-side code.

## 5. Fill in the three values

Open `src/lib/emailjs-config.ts` and replace the three placeholders:

```ts
export const EMAILJS_SERVICE_ID = "service_xxxxxxx";
export const EMAILJS_TEMPLATE_ID = "template_xxxxxxx";
export const EMAILJS_PUBLIC_KEY = "your_public_key_here";
```

Commit and push — GitHub Pages rebuilds automatically.

## 6. Test it

Register a new test account on the live site. Within a few seconds the
welcome email should land in that inbox, card attached.

If it doesn't arrive:

- Open the browser console (F12) right after submitting the registration
  form — the register page logs an error there if the EmailJS send
  fails (it never blocks registration itself; the account is created
  either way).
- **EmailJS Dashboard → Email Logs** shows every send attempt and any
  errors, from EmailJS's side.
- Common issues: a placeholder value still left in `emailjs-config.ts`
  (the email send is silently skipped until all three are filled in —
  intentional, so a half-configured site doesn't throw errors at
  everyone registering), or the Attachments tab parameter name not
  matching `content` exactly.

Paste me whatever shows up in either place and I'll help debug from
there.

## 7. Training acceptance email (optional second template)

Same EmailJS account and Gmail service as above — just one more
template. This one fires automatically from the admin Training
Applications page when you mark a submission "accepted", congratulating
the applicant and naming the training they were accepted into.

1. Dashboard → **Email Templates** → **Create New Template** (pick any
   starter, it doesn't matter — we'll replace the content).
2. Switch to **Code Editor** and paste the full contents of
   `TRAINING_ACCEPTANCE_TEMPLATE.html` (next to this file).
3. Set the **Subject** field to:
   `Баяр хүргэе! / Congratulations — {{training_title}}`
4. **To Email**: `{{to_email}}` · **From Name**: `MHIDA` · **Reply To**:
   your connected Gmail (same as before).
5. Save, then copy this template's **Template ID** — it'll be a
   *different* ID from the welcome-email template.
6. Open `src/lib/emailjs-config.ts` and replace the placeholder:
   ```ts
   export const EMAILJS_ACCEPTANCE_TEMPLATE_ID: string = "template_xxxxxxx";
   ```

Until that value is filled in, marking an application "accepted" still
works — it just skips sending the email (logged to the console) and
you'll see a "⚠️ Email not sent yet — Send now" link on that application
in the admin page, which you can click once the template is configured.
