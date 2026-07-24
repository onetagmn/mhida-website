"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

type Mode = "otp" | "password";

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-blue)]";

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null); setInfo(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) {
      if (/signups not allowed|user not found/i.test(error.message)) {
        setError(t(
          "Энэ и-мэйл бүртгэлгүй байна. Эхлээд бүртгүүлнэ үү.",
          "This email is not registered. Please register first."
        ));
      } else {
        setError(error.message);
      }
      return;
    }
    setOtpSent(true);
    setInfo(t(
      "Таны и-мэйл рүү 6 оронтой код илгээлээ. Ирсэн кодыг доор оруулна уу.",
      "A 6-digit code was sent to your email. Enter it below."
    ));
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otpCode.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      setError(t("Код буруу эсвэл хугацаа дууссан байна.", "Invalid or expired code."));
      return;
    }
    router.push("/dashboard/");
  }

  async function loginPassword(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (error) {
      setError(t(
        "И-мэйл эсвэл нууц үг буруу байна.",
        "Incorrect email or password."
      ));
      return;
    }
    router.push("/dashboard/");
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Гишүүд", "Members")}
        title={t("Нэвтрэх", "Log In")}
        subtitle={t(
          "Анх удаа нэвтэрч байгаа бол и-мэйл код ашиглана уу — нууц үг шаардлагагүй.",
          "First time logging in? Use the email code option — no password needed."
        )}
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-6 grid grid-cols-2 rounded-lg border border-slate-200 p-1 text-sm font-semibold">
            <button
              onClick={() => { setMode("otp"); setError(null); }}
              className={`rounded-md px-3 py-2 transition-colors ${mode === "otp" ? "bg-[var(--brand-blue)] text-white" : "text-slate-600"}`}
            >
              {t("И-мэйл код", "Email code")}
            </button>
            <button
              onClick={() => { setMode("password"); setError(null); }}
              className={`rounded-md px-3 py-2 transition-colors ${mode === "password" ? "bg-[var(--brand-blue)] text-white" : "text-slate-600"}`}
            >
              {t("Нууц үг", "Password")}
            </button>
          </div>

          {mode === "otp" && !otpSent && (
            <form onSubmit={sendOtp} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="email">
                  {t("И-мэйл", "Email")}
                </label>
                <input id="email" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? t("Илгээж байна...", "Sending...") : t("Код илгээх", "Send code")}
              </button>
            </form>
          )}

          {mode === "otp" && otpSent && (
            <form onSubmit={verifyOtp} className="space-y-4">
              {info && <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-slate-700">{info}</p>}
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="otp">
                  {t("6 оронтой код", "6-digit code")}
                </label>
                <input
                  id="otp"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className={`${inputClass} text-center text-xl tracking-[0.5em]`}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ""))}
                />
              </div>
              <button
                type="submit"
                disabled={busy || otpCode.length !== 6}
                className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? t("Шалгаж байна...", "Verifying...") : t("Нэвтрэх", "Log in")}
              </button>
              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtpCode(""); setInfo(null); }}
                className="w-full text-center text-sm text-slate-500 hover:text-[var(--brand-blue)]"
              >
                {t("← Өөр и-мэйл ашиглах", "← Use a different email")}
              </button>
            </form>
          )}

          {mode === "password" && (
            <form onSubmit={loginPassword} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="email2">
                  {t("И-мэйл", "Email")}
                </label>
                <input id="email2" type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="pw">
                  {t("Нууц үг", "Password")}
                </label>
                <input id="pw" type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busy ? t("Нэвтэрч байна...", "Logging in...") : t("Нэвтрэх", "Log in")}
              </button>
            </form>
          )}

          {error && (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
