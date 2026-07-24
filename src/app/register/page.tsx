"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import DraftNotice from "@/components/DraftNotice";
import { PROVINCES } from "@/lib/provinces";

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
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

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
      e.phone = t("8 оронтой дугаар оруулна уу", "Enter an 8-digit number");
    if (!form.membershipType) e.membershipType = msg;
    if (form.password.length < 8)
      e.password = t("Багадаа 8 тэмдэгт", "At least 8 characters");
    if (form.password !== form.passwordConfirm)
      e.passwordConfirm = t("Нууц үг таарахгүй байна", "Passwords do not match");
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (validate()) setSubmitted(true);
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
        <div className="container-page py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              {t("Маягт зөв бөглөгдлөө!", "Form filled out correctly!")}
            </h2>
            <p className="mt-3 text-sm text-slate-700">
              {t(
                "Энэ бол урьдчилсан хувилбар — бүртгэлийн сан холбогдоогүй тул таны мэдээлэл хараахан хадгалагдаагүй. Систем удахгүй идэвхжинэ.",
                "This is a preview — the registration database isn't connected yet, so your information has NOT been saved. The system goes live soon."
              )}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 rounded-md border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
            >
              {t("Буцах", "Back to form")}
            </button>
          </div>
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
          "Маягтыг бөглөж илгээснээр та МДЭНХ-ны гишүүнээр бүртгүүлж, нэвтрэх эрхтэй болно.",
          "Fill in the form to register as an MHIDA member and create your login."
        )}
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-2xl">
          <DraftNotice
            note={t(
              "Урьдчилсан хувилбар: маягт бүрэн ажиллана, гэхдээ бүртгэлийн сан холбогдох хүртэл мэдээлэл хадгалагдахгүй.",
              "Preview: the form works fully, but data is not saved until the registration database is connected."
            )}
          />

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-8">
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
                <input id="workplace" className={inputClass("workplace")} value={form.workplace} onChange={set("workplace")} />
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
                    {t("Даатгалын эмчээр ажилласан жил", "Years as insurance doctor")} *
                  </label>
                  <input
                    id="yearsWorked"
                    type="number"
                    min="0"
                    max="60"
                    className={inputClass("yearsWorked")}
                    value={form.yearsWorked}
                    onChange={set("yearsWorked")}
                  />
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
                  <input id="email" type="email" className={inputClass("email")} value={form.email} onChange={set("email")} />
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
                  {t("Facebook хаяг (заавал биш)", "Facebook ID (optional)")}
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
                  "Та гишүүний дугаар болон нууц үгээрээ нэвтэрнэ. Гишүүний дугаарыг бүртгэл баталгаажсаны дараа олгоно.",
                  "You'll log in with your member ID and password. Your member ID is assigned once registration is confirmed."
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

            <button
              type="submit"
              className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto sm:px-10"
            >
              {t("Бүртгүүлэх", "Register")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
