// EmailJS sends the welcome email straight from the visitor's browser
// right after they register — no backend needed. Fill these three values
// in after setting up your EmailJS account; see
// EMAILJS_SETUP.md (next to this file) for the full walkthrough.
//
// These are meant to be public (same idea as the Supabase anon key in
// supabase.ts) — EmailJS's Public Key is safe to ship in client code by
// design, it's not a secret.
export const EMAILJS_SERVICE_ID: string = "service_f4tklox";
export const EMAILJS_TEMPLATE_ID: string = "template_4uw0h78";
export const EMAILJS_PUBLIC_KEY: string = "pGg_PJqnEmv-sFjZ5";

// Second template: the "congratulations, you're accepted" email, fired
// from the admin Training Applications page when a submission is marked
// "accepted". Same EmailJS account/service as above, just a different
// template. See docs/welcome-email/SETUP.md's "Training acceptance
// email" section for how to create it and get this ID.
export const EMAILJS_ACCEPTANCE_TEMPLATE_ID: string = "template_k5fhzr2";

export const EMAILJS_CONFIGURED =
  EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
  EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID" &&
  EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY";

export const EMAILJS_ACCEPTANCE_CONFIGURED =
  EMAILJS_CONFIGURED && EMAILJS_ACCEPTANCE_TEMPLATE_ID !== "YOUR_ACCEPTANCE_TEMPLATE_ID";
