"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { asset } from "@/lib/asset";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-blue)]";

  // The recovery link puts the tokens in the URL hash; the Supabase client
  // exchanges them for a session on load. Either the PASSWORD_RECOVERY event
  // fires, or a session is already present by the time we check.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (password.length < 8) {
      setError(
        t(
          "Нууц үг дор хаяж 8 тэмдэгт байх ёстой.",
          "Password must be at least 8 characters."
        )
      );
      return;
    }
    if (password !== confirm) {
      setError(t("Нууц үг таарахгүй байна.", "Passwords do not match."));
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/dashboard/"), 2000);
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Гишүүд", "Members")}
        title={t("Шинэ нууц үг", "New Password")}
        subtitle={t(
          "Шинэ нууц үгээ оруулна уу.",
          "Choose a new password for your account."
        )}
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-md">
          {checking && (
            <p className="text-center text-sm text-slate-500">
              {t("Уншиж байна...", "Loading...")}
            </p>
          )}

          {!checking && !ready && (
            <div className="space-y-4">
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {t(
                  "Холбоосын хугацаа дууссан эсвэл хүчингүй байна. Нууц үг сэргээх хүсэлтээ дахин илгээнэ үү.",
                  "This link is invalid or has expired. Please request a new reset link."
                )}
              </p>
              <a
                href={asset("/forgot-password/")}
                className="block w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-center text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                {t("Дахин илгээх", "Request a new link")}
              </a>
            </div>
          )}

          {!checking && ready && !done && (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label
                  className="mb-1 block text-sm font-semibold text-slate-700"
                  htmlFor="pw"
                >
                  {t("Шинэ нууц үг", "New password")}
                </label>
                <input
                  id="pw"
                  type="password"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {t("Дор хаяж 8 тэмдэгт.", "At least 8 characters.")}
                </p>
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-semibold text-slate-700"
                  htmlFor="pw2"
                >
                  {t("Нууц үг давтах", "Confirm password")}
                </label>
                <input
                  id="pw2"
                  type="password"
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy
                  ? t("Хадгалж байна...", "Saving...")
                  : t("Нууц үг хадгалах", "Save new password")}
              </button>
            </form>
          )}

          {done && (
            <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-slate-700">
              {t(
                "Нууц үг амжилттай солигдлоо. Хянах самбар руу шилжиж байна...",
                "Password updated. Redirecting to your dashboard..."
              )}
            </p>
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
