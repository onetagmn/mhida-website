"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { asset } from "@/lib/asset";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-blue)]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}${asset("/reset-password/")}`,
      }
    );
    setBusy(false);

    if (error) {
      if (/rate limit|too many requests/i.test(error.message)) {
        setError(
          t(
            "Хэт олон удаа хүсэлт илгээсэн байна. Хэсэг хүлээгээд дахин оролдоно уу.",
            "Too many requests. Please wait a few minutes and try again."
          )
        );
      } else {
        setError(error.message);
      }
      return;
    }
    // Always show the same confirmation, whether or not the address exists,
    // so the form can't be used to discover which emails are registered.
    setSent(true);
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Гишүүд", "Members")}
        title={t("Нууц үг сэргээх", "Reset Password")}
        subtitle={t(
          "Бүртгэлтэй и-мэйл хаягаа оруулна уу. Нууц үг сэргээх холбоосыг илгээнэ.",
          "Enter your registered email address and we will send you a reset link."
        )}
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-md">
          {!sent && (
            <form onSubmit={submit} className="space-y-4">
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
                  : t("Холбоос илгээх", "Send reset link")}
              </button>
              <p className="text-center text-sm text-slate-500">
                <a
                  href={asset("/login/")}
                  className="font-semibold text-[var(--brand-blue)] hover:underline"
                >
                  {t("← Нэвтрэх хуудас руу буцах", "← Back to log in")}
                </a>
              </p>
            </form>
          )}

          {sent && (
            <div className="space-y-4">
              <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                {t(
                  "Хэрэв энэ и-мэйл бүртгэлтэй бол нууц үг сэргээх холбоосыг илгээлээ. И-мэйлээ шалгана уу. Ирээгүй бол Spam хавтсаа хараарай.",
                  "If this email is registered, a reset link has been sent. Please check your inbox, and your Spam folder if it does not appear."
                )}
              </p>
              <a
                href={asset("/login/")}
                className="block w-full rounded-md bg-[var(--brand-blue)] px-6 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                {t("Нэвтрэх", "Log in")}
              </a>
            </div>
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
