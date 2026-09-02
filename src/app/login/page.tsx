"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { asset } from "@/lib/asset";
import { supabase } from "@/lib/supabase";

type Mode = "link" | "password";

// Email-link (magic link) sign-in sends mail through Supabase's built-in
// mailer, which is currently rate-limited/blocked. Flip this back to true
// once custom SMTP is configured — nothing else needs to change.
const EMAIL_LINK_ENABLED = false;

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(EMAIL_LINK_ENABLED ? "link" : "password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-blue)]";

  const cleanEmail = () => email.trim().toLowerCase();

  // If this page was opened from the sign-in link in the email, Supabase's
  // client picks up the session from the URL automatically — this just
  // catches that moment and moves on to the dashboard.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/dashboard/");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  // Already signed in? Skip the form entirely.
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) router.replace("/dashboard/");
    });
    return () => {
      active = false;
    };
  }, [router]);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}${asset("/login/")}`,
      },
    });
    setBusy(false);

    if (error) {
      if (/signups not allowed|user not found/i.test(error.message)) {
        setError(
          t(
            "Энэ и-мэйл бүртгэлгүй байна. Эхлээд бүртгүүлнэ үү.",
            "This email is not registered. Please register first."
          )
        );
      } else if (/rate limit|too many requests/i.test(error.message)) {
        setError(
          t(
            "И-мэйл илгээх хязгаарт хүрсэн байна. Нууц үгээрээ нэвтэрнэ үү.",
            "The email sending limit has been reached. Please log in with your password."
          )
        );
        setMode("password");
      } else {
        setError(error.message);
      }
      return;
    }
    setLinkSent(true);
  }

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail(),
      password,
    });

    if (error) {
      setBusy(false);
      setError(
        t("И-мэйл эсвэл нууц үг буруу байна.", "Incorrect email or password.")
      );
      return;
    }
    // Keep the button disabled through the redirect so it can't be double-fired.
    router.replace("/dashboard/");
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Гишүүд", "Members")}
        title={t("Нэвтрэх", "Log In")}
        subtitle={
          EMAIL_LINK_ENABLED
            ? t(
                "Анх удаа нэвтэрч байгаа бол и-мэйл холбоос ашиглана уу — нууц үг шаардлагагүй.",
                "First time logging in? Use the email link option — no password needed."
              )
            : t(
                "И-мэйл хаяг, нууц үгээ оруулан нэвтэрнэ үү.",
                "Enter your email and password to log in."
              )
        }
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-md">
          {EMAIL_LINK_ENABLED && (
            <div className="mb-6 grid grid-cols-2 rounded-lg border border-slate-200 p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode("link");
                  setError(null);
                }}
                className={`rounded-md px-3 py-2 transition-colors ${
                  mode === "link"
                    ? "bg-[var(--brand-blue)] text-white"
                    : "text-slate-600"
                }`}
              >
                {t("И-мэйл холбоос", "Email link")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("password");
                  setError(null);
                }}
                className={`rounded-md px-3 py-2 transition-colors ${
                  mode === "password"
                    ? "bg-[var(--brand-blue)] text-white"
                    : "text-slate-600"
                }`}
              >
                {t("Нууц үг", "Password")}
              </button>
            </div>
          )}

          {EMAIL_LINK_ENABLED && mode === "link" && !linkSent && (
            <form onSubmit={sendLink} className="space-y-4">
              <div>
                <label
                  className="mb-1 block text-sm font-semibold text-slate-700"
                  htmlFor="email"
                >
                  {t("И-мэйл", "Email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy
                  ? t("Илгээж байна...", "Sending...")
                  : t("Холбоос илгээх", "Send sign-in link")}
              </button>
            </form>
          )}

          {EMAIL_LINK_ENABLED && mode === "link" && linkSent && (
            <div className="space-y-4">
              <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                {t(
                  'Таны и-мэйл рүү нэвтрэх холбоос илгээлээ. И-мэйлээ нээгээд "Sign in" холбоос дээр дарна уу.',
                  'A sign-in link was sent to your email. Open your email and click "Sign in".'
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setLinkSent(false);
                  setError(null);
                }}
                className="w-full text-center text-sm text-slate-500 hover:text-[var(--brand-blue)]"
              >
                {t("← Өөр и-мэйл ашиглах", "← Use a different email")}
              </button>
            </div>
          )}

          {mode === "password" && (
            <form onSubmit={loginPassword} className="space-y-4">
              <div>
                <label
                  className="mb-1 block text-sm font-semibold text-slate-700"
                  htmlFor="email2"
                >
                  {t("И-мэйл", "Email")}
                </label>
                <input
                  id="email2"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-semibold text-slate-700"
                  htmlFor="pw"
                >
                  {t("Нууц үг", "Password")}
                </label>
                <input
                  id="pw"
                  type="password"
                  required
                  autoComplete="current-password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy
                  ? t("Нэвтэрч байна...", "Logging in...")
                  : t("Нэвтрэх", "Log in")}
              </button>
              <p className="text-center text-sm text-slate-500">
                {t("Бүртгэлгүй юу?", "No account yet?")}{" "}
                <a
                  href={asset("/register/")}
                  className="font-semibold text-[var(--brand-blue)] hover:underline"
                >
                  {t("Бүртгүүлэх", "Register")}
                </a>
              </p>
            </form>
          )}

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
