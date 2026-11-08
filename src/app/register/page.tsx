"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import emailjs from "@emailjs/browser";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { PROVINCES } from "@/lib/provinces";
import { supabase } from "@/lib/supabase";
import { asset } from "@/lib/asset";
import { useWorkplaceNames } from "@/lib/workplaces";
import { PAYMENT } from "@/lib/payment";
import PaymentInfo from "@/components/PaymentInfo";
import Faq from "@/components/Faq";
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_CONFIGURED } from "@/lib/emailjs-config";

type FormState = {
  lastName: string;
  firstName: string;
  birthDate: string;
  gender: string;
  province: string;
  workplace: string;
  position: string;
  yearsWorked: string;
  facebookId: string;
  email: string;
  phone: string;
  membershipType: "regular" | "professional" | "";
  password: string;
  passwordConfirm: string;
};

const EMPTY: FormState = {
  lastName: "",
  firstName: "",
  birthDate: "",
  gender: "",
  province: "",
  workplace: "",
  position: "",
  yearsWorked: "",
  facebookId: "",
  email: "",
  phone: "",
  membershipType: "",
  password: "",
  passwordConfirm: "",
};

export default function RegisterPage() {
  const { t, lang } = useLanguage();
  const workplaceNames = useWorkplaceNames();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [yearsSelect, setYearsSelect] = useState("");
  const [consented, setConsented] = useState(false);
  const [wasProfessional, setWasProfessional] = useState(false);

  // Registration starts by confirming the email with a 6-digit code
  // (Supabase email OTP). The code also logs the person in, so the form
  // can be filled in now or later: whoever logs in with an unfinished
  // registration is sent back here (see the dashboard).
  const [stage, setStage] = useState<"checking" | "email" | "code" | "form" | "already">("checking");
  const [otpEmail, setOtpEmail] = useState("");
  const [code, setCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  // Signed in: finished members go to "already registered", the rest to the form.
  const routeSignedIn = useCallback(async (userId: string, email: string) => {
    const { data: row } = await supabase.from("members").select("first_name, last_name").eq("id", userId).maybeSingle();
    if (row && (row.first_name || row.last_name)) { setStage("already"); return; }
    setForm((f) => ({ ...f, email }));
    setStage("form");
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.user) await routeSignedIn(session.user.id, session.user.email ?? "");
      else setStage("email");
    })();
    // Clicking the link in the email (instead of typing the code) signs in here too.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) void routeSignedIn(session.user.id, session.user.email ?? "");
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [routeSignedIn]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function sendCode(ev?: React.FormEvent) {
    ev?.preventDefault();
    const email = otpEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setOtpError(t("И-мэйл хаягаа зөв оруулна уу.", "Please enter a valid email address."));
      return;
    }
    setOtpBusy(true);
    setOtpError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}${asset("/register/")}` },
    });
    setOtpBusy(false);
    if (error) {
      setOtpError(
        /rate limit|too many|security purposes/i.test(error.message)
          ? t("Түр хүлээгээд дахин оролдоно уу (хэт олон хүсэлт).", "Please wait a moment and try again (too many requests).")
          : error.message
      );
      return;
    }
    setOtpEmail(email);
    setCode("");
    setStage("code");
    setResendIn(60);
  }

  async function verifyCode(ev: React.FormEvent) {
    ev.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      setOtpError(t("И-мэйлээр ирсэн кодыг бүтнээр нь оруулна уу.", "Enter the full code from the email."));
      return;
    }
    setOtpBusy(true);
    setOtpError(null);
    const { data, error } = await supabase.auth.verifyOtp({ email: otpEmail, token, type: "email" });
    setOtpBusy(false);
    if (error || !data.user) {
      setOtpError(t("Код буруу эсвэл хугацаа нь дууссан байна. Дахин илгээгээд оролдоно уу.", "The code is wrong or has expired. Send a new one and try again."));
      return;
    }
    await routeSignedIn(data.user.id, data.user.email ?? otpEmail);
  }

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  // Fires right after a successful signup. Sends the welcome email
  // straight from the browser via EmailJS — no backend involved. The
  // digital business card isn't attached (EmailJS attachments require a
  // paid plan); the email instead points the member to their dashboard,
  // where the same card can already be viewed/downloaded/printed. Never
  // throws: registration has already succeeded by the time this runs,
  // so a failure here shouldn't block or scare the new member. See
  // docs/welcome-email/SETUP.md for configuring the three EMAILJS_*
  // values this depends on.
  async function sendWelcomeEmail(memberId: string) {
    if (!EMAILJS_CONFIGURED) {
      console.info("Welcome email skipped: EmailJS is not configured yet (see docs/welcome-email/SETUP.md).");
      return;
    }
    try {
      const membershipNoteHtml =
        form.membershipType === "professional"
          ? `<p style="margin:0; font-size:13px; line-height:1.6; color:#334155;">Та <b>Мэргэжлийн гишүүн</b> тул бүх 10 сургалт танд нээлттэй байна.</p>
             <p style="margin:4px 0 0 0; font-size:12px; color:#94a3b8; font-style:italic;">As a Professional member, all 10 courses are already unlocked for you.</p>`
          : `<p style="margin:0; font-size:13px; line-height:1.6; color:#334155;">Одоогоор та <b>Энгийн гишүүн</b> — Мэргэжлийн гишүүнчлэлд шилжиж бүх сургалт болон нэмэлт эрхийг нээж болно. Дэлгэрэнгүйг өөрийн булангаас үзнэ үү.</p>
             <p style="margin:4px 0 0 0; font-size:12px; color:#94a3b8; font-style:italic;">You're currently a Regular member — upgrade to Professional to unlock every course and additional benefits, from your member dashboard.</p>`;

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: form.email.trim(),
          first_name: form.firstName.trim(),
          member_id: memberId,
          membership_note_html: membershipNoteHtml,
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );
    } catch (err) {
      console.error("Welcome email failed to send (registration itself still succeeded):", err);
    }
  }

  const req = (v: string) => v.trim().length > 0;

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    const msg = t("Заавал бөглөнө", "Required");
    if (!req(form.lastName)) e.lastName = msg;
    if (!req(form.firstName)) e.firstName = msg;
    if (!req(form.birthDate)) e.birthDate = msg;
    if (!req(form.gender)) e.gender = msg;
    if (!req(form.province)) e.province = msg;
    if (!req(form.workplace)) e.workplace = msg;
    if (!req(form.position)) e.position = msg;
    if (!req(form.yearsWorked)) e.yearsWorked = msg;
    if (!req(form.email)) e.email = msg;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = t("И-мэйл буруу байна", "Invalid email");
    if (!req(form.phone)) e.phone = msg;
    else if (!/^\d{8}$/.test(form.phone.replace(/[\s-]/g, "")))
      e.phone = t("8 оронтой дугаар оруулна уу", "Enter an 8-digit phone number");
    if (!form.membershipType) e.membershipType = msg;
    if (form.password.length < 8)
      e.password = t("Багадаа 8 тэмдэгт", "At least 8 characters");
    if (form.password !== form.passwordConfirm)
      e.passwordConfirm = t("Нууц үг таарахгүй байна", "Passwords do not match");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    try {
      // The account already exists (made when the email code was
      // confirmed, with an empty member row); fill in the member row and set
      // the login password. Names in capitals and phone as plain digits, as
      // the signup trigger does (migration21).
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStage("email"); throw new Error(t("Эхлээд и-мэйлээ баталгаажуулна уу.", "Please confirm your email first.")); }
      const { error: rowError } = await supabase
        .from("members")
        .update({
          last_name: form.lastName.trim().toUpperCase(),
          first_name: form.firstName.trim().toUpperCase(),
          birth_date: form.birthDate || null,
          gender: form.gender || null,
          province: form.province || null,
          workplace: form.workplace.trim() || null,
          position: form.position.trim() || null,
          years_worked: String(form.yearsWorked).trim() || null,
          facebook: form.facebookId.trim() || null,
          phone: form.phone.replace(/\D/g, "") || null,
          upgrade_requested: form.membershipType === "professional",
        })
        .eq("id", user.id);
      if (rowError) throw rowError;
      const { error: pwError } = await supabase.auth.updateUser({ password: form.password });
      if (pwError) throw pwError;

      const { data: row } = await supabase.from("members").select("member_id").eq("id", user.id).single();
      if (row?.member_id) {
        setMemberId(row.member_id);
        void sendWelcomeEmail(row.member_id);
      }
      setWasProfessional(form.membershipType === "professional");
      setSubmitted(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/already registered/i.test(msg)) {
        setServerError(
          t(
            "Энэ и-мэйл хаяг аль хэдийн бүртгэлтэй байна. Нэвтрэх эсвэл өөр и-мэйл ашиглана уу.",
            "This email is already registered. Please log in or use a different email."
          )
        );
      } else {
        setServerError(
          t("Алдаа гарлаа: ", "Something went wrong: ") + msg
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = (key: keyof FormState) =>
    `w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-blue)] ${
      errors[key] ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
    }`;

  const label = "mb-1 block text-sm font-semibold text-slate-700";
  const err = (key: keyof FormState) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null;

  if (submitted) {
    return (
      <div>
        <PageHeader eyebrow={t("Бүртгэл", "Registration")} title={t("Гишүүнээр элсэх", "Become a Member")} />
        <div className="container-page py-10 sm:py-12">
          <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              {t("Бүртгэл амжилттай!", "Registration successful!")}
            </h2>
            {memberId ? (
              <p className="mt-4 text-sm text-slate-700">
                {t("Таны гишүүний дугаар:", "Your member ID:")}{" "}
                <span className="text-lg font-extrabold text-[var(--brand-blue)]">{memberId}</span>
                <br />
                {t(
                  "Энэ дугаараа хадгалаарай — төлбөр төлөх болон МДЭНХ-той холбогдоход хэрэг болно.",
                  "Save this ID — you'll need it for payments and when contacting MHIDA."
                )}
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-700">
                {t(
                  "Таны бүртгэл хүлээн авагдлаа. Гишүүний дугаарыг и-мэйлээр илгээх болно.",
                  "Your registration has been received. Your member ID will be sent by email."
                )}
              </p>
            )}
          </div>

          {wasProfessional && (
            <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-blue-200 bg-blue-50 p-8">
              <h3 className="text-lg font-bold text-slate-900">
                {t("Мэргэжлийн гишүүнчлэлийн төлбөр", "Professional Membership Payment")}
              </h3>
              <p className="mb-4 mt-2 text-sm text-slate-700">
                {t(
                  `Жилийн татвар: ${PAYMENT.feeMnt}. Доорх дансанд шилжүүлнэ үү.`,
                  `Annual fee: ${PAYMENT.feeMnt}. Please transfer to the account below.`
                )}
              </p>
              <PaymentInfo memberId={memberId} />
              <p className="mt-3 text-xs text-slate-500">
                {t(
                  "Төлбөр баталгаажсаны дараа таны гишүүнчлэл Мэргэжлийн болж идэвхжинэ.",
                  "Once payment is confirmed, your membership is activated as Professional."
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage !== "form") {
    const box = "mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm";
    const field = "w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]";
    const button = "mt-4 w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40";
    return (
      <div>
        <PageHeader
          eyebrow={t("Бүртгэл", "Registration")}
          title={t("Гишүүнээр элсэх", "Become a Member")}
          subtitle={t(
            "Эхлээд и-мэйлээ 6 оронтой кодоор баталгаажуулна, дараа нь бүртгэлийн маягтаа бөглөнө.",
            "First confirm your email with a 6-digit code, then fill in the registration form."
          )}
        />
        <div className="container-page py-8 sm:py-10">
          {stage === "checking" && <p className="py-12 text-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</p>}

          {stage === "already" && (
            <div className={`${box} text-center`}>
              <h2 className="text-lg font-bold text-slate-900">{t("Та бүртгэлтэй байна", "You are already registered")}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {t("Энэ и-мэйлээр бүртгэл аль хэдийн бүрэн хийгдсэн байна.", "This email already has a complete registration.")}
              </p>
              <Link href="/dashboard" className="mt-5 inline-block rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
                {t("Миний булан →", "My dashboard →")}
              </Link>
            </div>
          )}

          {stage === "email" && (
            <form onSubmit={sendCode} className={box} noValidate>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-red)]">{t("Алхам 1 / 3", "Step 1 of 3")}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{t("И-мэйлээ баталгаажуулах", "Confirm your email")}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {t("Таны и-мэйл рүү 6 оронтой код илгээнэ.", "We'll send a 6-digit code to your email.")}
              </p>
              <label className="mb-1 mt-5 block text-sm font-semibold text-slate-700" htmlFor="otp-email">{t("И-мэйл", "Email")}</label>
              <input id="otp-email" type="email" autoComplete="email" className={field} value={otpEmail} onChange={(e) => { setOtpEmail(e.target.value); setOtpError(null); }} />
              {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}
              <button type="submit" disabled={otpBusy} className={button}>
                {otpBusy ? t("Илгээж байна...", "Sending...") : t("Код илгээх", "Send code")}
              </button>
              <p className="mt-4 text-center text-xs text-slate-500">
                {t("Бүртгэлтэй юу?", "Already a member?")}{" "}
                <Link href="/login" className="font-semibold text-[var(--brand-blue)]">{t("Нэвтрэх", "Log in")}</Link>
              </p>
            </form>
          )}

          {stage === "code" && (
            <form onSubmit={verifyCode} className={box} noValidate>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-red)]">{t("Алхам 2 / 3", "Step 2 of 3")}</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">{t("Кодоо оруулна уу", "Enter your code")}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {t(
                  `${otpEmail} хаяг руу код илгээлээ. Ирэхгүй бол Spam хавтсаа шалгана уу. И-мэйл дэх холбоос дээр дарж болно.`,
                  `We sent a code to ${otpEmail}. Check your Spam folder if it doesn't arrive. You can also click the link in the email.`
                )}
              </p>
              <input
                id="otp-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                placeholder="000000"
                className={`${field} mt-5 text-center font-mono text-2xl tracking-[0.4em]`}
                value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "")); setOtpError(null); }}
              />
              {otpError && <p className="mt-2 text-sm text-red-600">{otpError}</p>}
              <button type="submit" disabled={otpBusy} className={button}>
                {otpBusy ? t("Шалгаж байна...", "Checking...") : t("Баталгаажуулах", "Confirm")}
              </button>
              <div className="mt-4 flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setStage("email"); setOtpError(null); }} className="font-semibold text-slate-500 hover:text-[var(--brand-blue)]">
                  ← {t("И-мэйл солих", "Change email")}
                </button>
                <button type="button" disabled={resendIn > 0 || otpBusy} onClick={() => void sendCode()} className="font-semibold text-[var(--brand-blue)] disabled:text-slate-400">
                  {resendIn > 0 ? t(`Дахин илгээх (${resendIn})`, `Resend (${resendIn})`) : t("Дахин илгээх", "Resend code")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Бүртгэл", "Registration")}
        title={t("Гишүүнээр элсэх", "Become a Member")}
        subtitle={t(
          "Алхам 3 / 3 — и-мэйл баталгаажлаа. Маягтаа одоо эсвэл дараа нэвтэрч бөглөж болно.",
          "Step 3 of 3 — your email is confirmed. Fill in the form now, or log in later to finish."
        )}
      />

      <div className="container-page py-8 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={onSubmit} noValidate className="mt-2 space-y-8">
            {/* Personal info */}
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold text-slate-900">
                {t("Хувийн мэдээлэл", "Personal Information")}
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="lastName">
                    {t("Овог", "Last name")} *
                  </label>
                  <input id="lastName" className={inputClass("lastName")} value={form.lastName} onChange={set("lastName")} />
                  {err("lastName")}
                </div>
                <div>
                  <label className={label} htmlFor="firstName">
                    {t("Нэр", "First name")} *
                  </label>
                  <input id="firstName" className={inputClass("firstName")} value={form.firstName} onChange={set("firstName")} />
                  {err("firstName")}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="birthDate">
                    {t("Төрсөн огноо", "Date of birth")} *
                  </label>
                  <input id="birthDate" type="date" className={inputClass("birthDate")} value={form.birthDate} onChange={set("birthDate")} />
                  {err("birthDate")}
                </div>
                <div>
                  <label className={label} htmlFor="gender">
                    {t("Хүйс", "Gender")} *
                  </label>
                  <select id="gender" className={inputClass("gender")} value={form.gender} onChange={set("gender")}>
                    <option value="">{t("Сонгох...", "Select...")}</option>
                    <option value="female">{t("Эмэгтэй", "Female")}</option>
                    <option value="male">{t("Эрэгтэй", "Male")}</option>
                    <option value="other">{t("Бусад", "Other")}</option>
                  </select>
                  {err("gender")}
                </div>
              </div>
            </fieldset>

            {/* Work info */}
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold text-slate-900">
                {t("Ажлын мэдээлэл", "Work Information")}
              </legend>

              <div>
                <label className={label} htmlFor="province">
                  {t("Аймаг / хот", "Province / city")} *
                </label>
                <select id="province" className={inputClass("province")} value={form.province} onChange={set("province")}>
                  <option value="">{t("Сонгох...", "Select...")}</option>
                  {PROVINCES.map((p) => (
                    <option key={p.code} value={p.code}>
                      {lang === "mn" ? p.mn : p.en}
                    </option>
                  ))}
                </select>
                {err("province")}
              </div>

              <div>
                <label className={label} htmlFor="workplace">
                  {t("Ажлын газар", "Workplace")} *
                </label>
                <input id="workplace" list="workplace-names" autoComplete="off" className={inputClass("workplace")} value={form.workplace} onChange={set("workplace")} />
                <datalist id="workplace-names">
                  {workplaceNames.map((n) => <option key={n} value={n} />)}
                </datalist>
                <p className="mt-1 text-xs text-slate-500">
                  {t("Бичиж эхлэхэд гарах жагсаалтаас өөрийн байгууллагыг сонгоно уу.", "Start typing and pick your workplace from the list if it is there.")}
                </p>
                {err("workplace")}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="position">
                    {t("Албан тушаал", "Position")} *
                  </label>
                  <input id="position" className={inputClass("position")} value={form.position} onChange={set("position")} />
                  {err("position")}
                </div>
                <div>
                  <label className={label} htmlFor="yearsWorked">
                    {t("Даатгалын эмчээр ажилласан жил", "Years as an insurance doctor")} *
                  </label>
                  <select
                    id="yearsWorked"
                    className={inputClass("yearsWorked")}
                    value={yearsSelect}
                    onChange={(e) => {
                      setYearsSelect(e.target.value);
                      if (e.target.value !== "more") {
                        setForm((f) => ({ ...f, yearsWorked: e.target.value }));
                        setErrors((prev) => ({ ...prev, yearsWorked: undefined }));
                      } else {
                        setForm((f) => ({ ...f, yearsWorked: "" }));
                      }
                    }}
                  >
                    <option value="">{t("Сонгох...", "Select...")}</option>
                    {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                    <option value="more">{t("10-аас дээш", "More than 10")}</option>
                  </select>
                  {yearsSelect === "more" && (
                    <input
                      aria-label={t("Ажилласан жил (тоогоор)", "Years (number)")}
                      inputMode="numeric"
                      placeholder={t("Жилийн тоо", "Number of years")}
                      className={`mt-2 ${inputClass("yearsWorked")}`}
                      value={form.yearsWorked}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d]/g, "").slice(0, 2);
                        setForm((f) => ({ ...f, yearsWorked: v }));
                        setErrors((prev) => ({ ...prev, yearsWorked: undefined }));
                      }}
                    />
                  )}
                  {err("yearsWorked")}
                </div>
              </div>
            </fieldset>

            {/* Contact */}
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold text-slate-900">
                {t("Холбоо барих", "Contact")}
              </legend>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="email">
                    {t("И-мэйл", "Email")} *
                  </label>
                  <input id="email" type="email" readOnly className={`${inputClass("email")} bg-slate-50 text-slate-600`} value={form.email} />
                  <p className="mt-1 text-xs font-semibold text-green-700">{t("Баталгаажсан ✓", "Confirmed ✓")}</p>
                  {err("email")}
                </div>
                <div>
                  <label className={label} htmlFor="phone">
                    {t("Утас", "Phone")} *
                  </label>
                  <input id="phone" inputMode="numeric" placeholder="99112233" className={inputClass("phone")} value={form.phone} onChange={set("phone")} />
                  {err("phone")}
                </div>
              </div>

              <div>
                <label className={label} htmlFor="facebookId">
                  {t("Facebook хаяг", "Facebook profile")}
                </label>
                <input id="facebookId" className={inputClass("facebookId")} value={form.facebookId} onChange={set("facebookId")} />
              </div>
            </fieldset>

            {/* Membership */}
            <fieldset>
              <legend className="mb-3 text-lg font-bold text-slate-900">
                {t("Гишүүнчлэлийн төрөл", "Membership Type")} *
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <label
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-colors ${
                    form.membershipType === "regular"
                      ? "border-[var(--brand-blue)] bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="membershipType"
                    value="regular"
                    checked={form.membershipType === "regular"}
                    onChange={set("membershipType")}
                    className="sr-only"
                  />
                  <span className="block font-bold text-slate-900">{t("Энгийн", "Regular")}</span>
                  <span className="mt-1 block text-sm text-slate-600">{t("Үнэгүй", "Free")}</span>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border-2 p-5 transition-colors ${
                    form.membershipType === "professional"
                      ? "border-[var(--brand-blue)] bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="membershipType"
                    value="professional"
                    checked={form.membershipType === "professional"}
                    onChange={set("membershipType")}
                    className="sr-only"
                  />
                  <span className="block font-bold text-slate-900">{t("Мэргэжлийн", "Professional")}</span>
                  <span className="mt-1 block text-sm text-slate-600">240,000₮ / {t("жил", "year")}</span>
                </label>
              </div>
              {err("membershipType")}
            </fieldset>

            {/* Password */}
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold text-slate-900">
                {t("Нэвтрэх нууц үг", "Login Password")}
              </legend>
              <p className="text-sm text-slate-600">
                {t(
                  "Та и-мэйл хаяг болон энэ нууц үгээрээ нэвтэрнэ. Гишүүний дугаарыг бүртгэл баталгаажсаны дараа олгоно.",
                  "You'll log in with your email address and this password. Your member ID is assigned once registration is confirmed."
                )}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="password">
                    {t("Нууц үг", "Password")} *
                  </label>
                  <input id="password" type="password" className={inputClass("password")} value={form.password} onChange={set("password")} />
                  {err("password")}
                </div>
                <div>
                  <label className={label} htmlFor="passwordConfirm">
                    {t("Нууц үг давтах", "Confirm password")} *
                  </label>
                  <input id="passwordConfirm" type="password" className={inputClass("passwordConfirm")} value={form.passwordConfirm} onChange={set("passwordConfirm")} />
                  {err("passwordConfirm")}
                </div>
              </div>
            </fieldset>

            {/* Terms & consent — required for the professional (paid) tier */}
            {form.membershipType === "professional" && (
            <fieldset>
              <legend className="mb-3 text-lg font-bold text-slate-900">
                {t("Нөхцөл, журам", "Terms & Conditions")}
              </legend>
              <div className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">
                <p className="font-semibold text-slate-800">
                  «МОНГОЛЫН ДААТГАЛЫН ЭМЧ НАРЫН ХОЛБОО» ТББ (товчоор «МДЭНХ»)
                </p>
                <p>
                  Би доорх нөхцөл, журмыг сайтар уншиж танилцсан бөгөөд «Монголын даатгалын
                  эмч нарын холбоо» ТББ-ын гишүүнээр элсэх хүсэлтэй байна. Ингэснээр би
                  холбооны дүрэм, журам, эрх үүргийг бүрэн хүлээн зөвшөөрч буйгаа баталж байна.
                </p>
                <p className="font-semibold text-slate-800">
                  ХОЛБООНЫ ЗОРИЛГО, ҮЙЛ АЖИЛЛАГААНЫ ЧИГЛЭЛ
                </p>
                <p>
                  МДЭНХ нь Монгол Улсад эрүүл мэндийн даатгалын салбарыг хөгжүүлэх, даатгалын
                  эмч нарын мэргэжлийн чадавхыг дээшлүүлэх, нийгмийн эрүүл мэндийг сайжруулах,
                  эрүүл мэндийн даатгалын талаарх мэдлэг ойлголтыг нэмэгдүүлэх зорилготой.
                </p>
                <p className="font-semibold text-slate-800">ГИШҮҮНИЙ ҮҮРЭГ:</p>
                <p>
                  ✅ Даатгалын эмч нарын чадавхыг хөгжүүлэхэд хувь нэмрээ оруулах<br />
                  ✅ Судалгаа, сургалт, өвчнөөс урьдчилан сэргийлэх ажил зохион байгуулах<br />
                  ✅ Жил бүр гишүүний татвар төлөх<br />
                  ✅ Холбооны дүрэм, шийдвэрийг мөрдөж хэрэгжүүлэх<br />
                  ✅ Холбоонд хандив, дэмжлэг үзүүлэх боломжтой бол сайн дурын үндсэн дээр оролцох
                </p>
              </div>
              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors border-slate-200 has-[:checked]:border-[var(--brand-blue)] has-[:checked]:bg-blue-50">
                <input
                  type="checkbox"
                  checked={consented}
                  onChange={(e) => setConsented(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                />
                <span className="text-sm font-semibold text-slate-800">
                  {t(
                    "Би дээрх нөхцөл, шаардлагыг бүрэн ойлгож, хүлээн зөвшөөрч байна.",
                    "I have fully read, understood, and accept the terms above."
                  )}
                </span>
              </label>
            </fieldset>
            )}

            {serverError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || (form.membershipType === "professional" && !consented)}
              className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto sm:px-10"
              title={
                form.membershipType === "professional" && !consented
                  ? t("Эхлээд нөхцөлийг зөвшөөрнө үү", "Accept the terms first")
                  : undefined
              }
            >
              {submitting ? t("Илгээж байна...", "Submitting...") : t("Бүртгүүлэх", "Register")}
            </button>
          </form>

          <div className="mt-12 border-t border-slate-200 pt-8">
            <Faq />
          </div>
        </div>
      </div>
    </div>
  );
}
