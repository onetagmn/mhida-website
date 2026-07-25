// EmailJS sends the welcome email straight from the visitor's browser
// right after they register — no backend needed. Fill these three values
// in after setting up your EmailJS account; see
// EMAILJS_SETUP.md (next to this file) for the full walkthrough.
//
// These are meant to be public (same idea as the Supabase anon key in
// supabase.ts) — EmailJS's Public Key is safe to ship in client code by
// design, it's not a secret.
export const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
export const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
export const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

export const EMAILJS_CONFIGURED =
  EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" &&
  EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID" &&
  EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY";
