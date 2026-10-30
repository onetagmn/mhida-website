"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

type FormState = {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  email: string;
  officialEmail: string;
  alternativeEmail: string;
  mobilePhone: string;
  facebook: string;
  linkedin: string;
  whatsapp: string;
  medicalHistory: string;
  foodAllergies: string;
  postalAddress: string;
  emergencyContact: string;
  currentInstitution: string;
  institutionCategory: string;
  institutionType: string;
  institutionDescription: string;
  institutionWebsite: string;
  department: string;
  currentPosition: string;
  otherPositions: string;
  mainDuties: string;
  educationInstitution: string;
  educationCountry: string;
  major: string;
  yearAttained: string;
  languageEnglish: string;
  languageMandarin: string;
};

const EMPTY: FormState = {
  firstName: "", middleName: "", lastName: "", gender: "", dateOfBirth: "",
  email: "", officialEmail: "", alternativeEmail: "", mobilePhone: "",
  facebook: "", linkedin: "", whatsapp: "", medicalHistory: "", foodAllergies: "",
  postalAddress: "", emergencyContact: "",
  currentInstitution: "", institutionCategory: "", institutionType: "",
  institutionDescription: "", institutionWebsite: "", department: "",
  currentPosition: "", otherPositions: "", mainDuties: "",
  educationInstitution: "", educationCountry: "", major: "", yearAttained: "",
  languageEnglish: "", languageMandarin: "",
};

const LANG_LEVELS = ["None", "Basic", "Intermediate", "Advanced", "Fluent / Native"];

function ApplyContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const postId = searchParams.get("post");

  const [authState, setAuthState] = useState<"loading" | "out" | "in">("loading");
  const [membership, setMembership] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [trainingTitle, setTrainingTitle] = useState<string | null>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAuthState("out"); return; }

    const [{ data: member }, postRes] = await Promise.all([
      supabase
        .from("members")
        .select("id, membership, first_name, last_name, email, phone, facebook")
        .eq("id", session.user.id)
        .single(),
      postId
        ? supabase.from("news").select("id, title").eq("id", postId).single()
        : Promise.resolve({ data: null }),
    ]);

    setMemberId(member?.id ?? null);
    setMembership(member?.membership ?? "regular");
    setTrainingTitle(postRes.data?.title ?? null);

    if (member) {
      setForm((f) => ({
        ...f,
        firstName: member.first_name ?? "",
        lastName: member.last_name ?? "",
        email: member.email ?? "",
        mobilePhone: member.phone ?? "",
        facebook: member.facebook ?? "",
      }));

      if (postId) {
        const { data: existing } = await supabase
          .from("training_applications")
          .select("id")
          .eq("member_id", member.id)
          .eq("news_post_id", postId)
          .maybeSingle();
        setAlreadyApplied(!!existing);
      }
    }

    setAuthState("in");
  }, [postId]);

  // Standard fetch-on-mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  const req = (v: string) => v.trim().length > 0;

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};
    const msg = t("Заавал бөглөнө", "Required");
    if (!req(form.firstName)) e.firstName = msg;
    if (!req(form.lastName)) e.lastName = msg;
    if (!req(form.email)) e.email = msg;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = t("И-мэйл буруу байна", "Invalid email");
    if (!req(form.mobilePhone)) e.mobilePhone = msg;
    if (!req(form.currentInstitution)) e.currentInstitution = msg;
    if (!req(form.currentPosition)) e.currentPosition = msg;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!memberId) return;
    if (!validate()) return;
    setSubmitting(true);
    setServerError(null);
    const { error } = await supabase.from("training_applications").insert({
      member_id: memberId,
      news_post_id: postId,
      training_title: trainingTitle ?? t("Сургалтын өргөдөл", "Training application"),
      first_name: form.firstName.trim(),
      middle_name: form.middleName.trim() || null,
      last_name: form.lastName.trim(),
      gender: form.gender || null,
      date_of_birth: form.dateOfBirth || null,
      email: form.email.trim(),
      official_email: form.officialEmail.trim() || null,
      alternative_email: form.alternativeEmail.trim() || null,
      mobile_phone: form.mobilePhone.trim(),
      facebook: form.facebook.trim() || null,
      linkedin: form.linkedin.trim() || null,
      whatsapp: form.whatsapp.trim() || null,
      medical_history: form.medicalHistory.trim() || null,
      food_allergies: form.foodAllergies.trim() || null,
      postal_address: form.postalAddress.trim() || null,
      emergency_contact: form.emergencyContact.trim() || null,
      current_institution: form.currentInstitution.trim(),
      institution_category: form.institutionCategory || null,
      institution_type: form.institutionType.trim() || null,
      institution_description: form.institutionDescription.trim() || null,
      institution_website: form.institutionWebsite.trim() || null,
      department: form.department.trim() || null,
      current_position: form.currentPosition.trim(),
      other_positions: form.otherPositions.trim() || null,
      main_duties: form.mainDuties.trim() || null,
      education_institution: form.educationInstitution.trim() || null,
      education_country: form.educationCountry.trim() || null,
      major: form.major.trim() || null,
      year_attained: form.yearAttained.trim() || null,
      language_english: form.languageEnglish || null,
      language_mandarin: form.languageMandarin || null,
    });
    setSubmitting(false);
    if (error) {
      setServerError(
        /duplicate key/i.test(error.message)
          ? t("Та энэ сургалтад аль хэдийн өргөдөл гаргасан байна.", "You've already applied to this training.")
          : t("Алдаа гарлаа: ", "Something went wrong: ") + error.message
      );
      return;
    }
    setSubmitted(true);
  }

  const inputClass = (key: keyof FormState) =>
    `w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--brand-blue)] ${
      errors[key] ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
    }`;
  const label = "mb-1 block text-sm font-semibold text-slate-700";
  const err = (key: keyof FormState) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600">{errors[key]}</p> : null;

  if (authState === "loading") {
    return <div className="container-page flex h-64 items-center justify-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</div>;
  }

  if (authState === "out") {
    return (
      <div>
        <PageHeader eyebrow={t("Сургалт", "Training")} title={t("Сургалтад бүртгүүлэх", "Training Application")} />
        <div className="container-page py-16">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <p className="text-4xl">🔒</p>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{t("Эхлээд нэвтэрнэ үү", "Log in first")}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {t("Өргөдөл гаргахын тулд гишүүнээрээ нэвтэрнэ үү.", "Log in as a member to submit an application.")}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login" className="rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
                {t("Нэвтрэх", "Log in")}
              </Link>
              <Link href="/register" className="rounded-md border border-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-[var(--brand-red)] hover:bg-red-50">
                {t("Бүртгүүлэх", "Register")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (membership !== "professional") {
    return (
      <div>
        <PageHeader eyebrow={t("Сургалт", "Training")} title={t("Сургалтад бүртгүүлэх", "Training Application")} />
        <div className="container-page py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-10 text-center">
            <p className="text-4xl">🎓</p>
            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {t("Зөвхөн Мэргэжлийн гишүүд өргөдөл гаргах боломжтой", "Only Professional members can apply")}
            </h2>
            <p className="mt-3 text-sm text-amber-900">
              {t(
                "Энэ сургалт (жишээ нь Тайпэйд болох MHIDA–TIHTC хамтарсан сургалт) зөвхөн Мэргэжлийн гишүүнчлэлтэй гишүүдэд нээлттэй. Та одоогоор Энгийн гишүүн байна — Мэргэжлийн гишүүнчлэлд шилжсэнээр энэ болон бусад олон боломж нээгдэнэ.",
                "This training (such as the MHIDA–TIHTC partnership training in Taipei) is open only to members with Professional membership. You're currently a Regular member — upgrading to Professional unlocks this and many other opportunities."
              )}
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90"
            >
              {t("Мэргэжлийн гишүүн болох →", "Upgrade to Professional →")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (alreadyApplied && !submitted) {
    return (
      <div>
        <PageHeader eyebrow={t("Сургалт", "Training")} title={t("Сургалтад бүртгүүлэх", "Training Application")} />
        <div className="container-page py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-blue-200 bg-blue-50 p-10 text-center">
            <p className="text-4xl">✅</p>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{t("Та өргөдлөө аль хэдийн илгээсэн байна", "You've already applied")}</h2>
            <p className="mt-2 text-sm text-slate-700">
              {t(
                "Таны өргөдлийг хүлээн авсан. Холбооноос тантай холбогдох болно.",
                "Your application has been received. MHIDA will be in touch with you."
              )}
            </p>
            <Link href="/dashboard" className="mt-6 inline-block rounded-md border border-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-[var(--brand-blue)] hover:bg-blue-100">
              {t("← Миний булан", "← My dashboard")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div>
        <PageHeader eyebrow={t("Сургалт", "Training")} title={t("Сургалтад бүртгүүлэх", "Training Application")} />
        <div className="container-page py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-green-200 bg-green-50 p-10 text-center">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{t("Өргөдөл амжилттай илгээгдлээ!", "Application submitted!")}</h2>
            <p className="mt-2 text-sm text-slate-700">
              {t(
                "Баярлалаа! Таны өргөдлийг МДЭНХ-ны админ хүлээн авлаа. Удахгүй тантай холбогдох болно.",
                "Thank you! Your application has been received by MHIDA's admin team. They'll be in touch with you soon."
              )}
            </p>
            <Link href="/dashboard" className="mt-6 inline-block rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
              {t("← Миний булан", "← My dashboard")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title={t("Сургалтад бүртгүүлэх", "Training Application")}
        subtitle={
          trainingTitle
            ? `${t("Хамрагдах сургалт", "Applying for")}: ${trainingTitle}`
            : t("Доорх маягтыг бөглөнө үү.", "Please fill out the form below.")
        }
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={onSubmit} noValidate className="mt-2 space-y-8">
            {/* Personal information */}
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold text-slate-900">
                {t("Хувийн мэдээлэл", "Personal Information")}
              </legend>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={label} htmlFor="firstName">{t("Нэр", "First Name")} *</label>
                  <input id="firstName" className={inputClass("firstName")} value={form.firstName} onChange={set("firstName")} />
                  {err("firstName")}
                </div>
                <div>
                  <label className={label} htmlFor="middleName">{t("Дунд нэр", "Middle Name")}</label>
                  <input id="middleName" className={inputClass("middleName")} value={form.middleName} onChange={set("middleName")} />
                </div>
                <div>
                  <label className={label} htmlFor="lastName">{t("Овог", "Last Name")} *</label>
                  <input id="lastName" className={inputClass("lastName")} value={form.lastName} onChange={set("lastName")} />
                  {err("lastName")}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="gender">{t("Хүйс", "Gender")}</label>
                  <select id="gender" className={inputClass("gender")} value={form.gender} onChange={set("gender")}>
                    <option value="">{t("Сонгох...", "Select...")}</option>
                    <option value="Female">{t("Эмэгтэй", "Female")}</option>
                    <option value="Male">{t("Эрэгтэй", "Male")}</option>
                    <option value="Other">{t("Бусад", "Other")}</option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="dateOfBirth">{t("Төрсөн огноо", "Date of Birth")}</label>
                  <input id="dateOfBirth" type="date" className={inputClass("dateOfBirth")} value={form.dateOfBirth} onChange={set("dateOfBirth")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="email">{t("И-мэйл", "Email")} *</label>
                  <input id="email" type="email" className={inputClass("email")} value={form.email} onChange={set("email")} />
                  {err("email")}
                </div>
                <div>
                  <label className={label} htmlFor="mobilePhone">{t("Гар утас", "Mobile Phone")} *</label>
                  <input id="mobilePhone" className={inputClass("mobilePhone")} value={form.mobilePhone} onChange={set("mobilePhone")} />
                  {err("mobilePhone")}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="officialEmail">{t("Албан ёсны и-мэйл", "Official Email")}</label>
                  <input id="officialEmail" type="email" className={inputClass("officialEmail")} value={form.officialEmail} onChange={set("officialEmail")} />
                </div>
                <div>
                  <label className={label} htmlFor="alternativeEmail">{t("Нөөц и-мэйл", "Alternative Email")}</label>
                  <input id="alternativeEmail" type="email" className={inputClass("alternativeEmail")} value={form.alternativeEmail} onChange={set("alternativeEmail")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={label} htmlFor="facebook">Facebook ID / URL</label>
                  <input id="facebook" className={inputClass("facebook")} value={form.facebook} onChange={set("facebook")} />
                </div>
                <div>
                  <label className={label} htmlFor="linkedin">LinkedIn</label>
                  <input id="linkedin" className={inputClass("linkedin")} value={form.linkedin} onChange={set("linkedin")} />
                </div>
                <div>
                  <label className={label} htmlFor="whatsapp">WhatsApp</label>
                  <input id="whatsapp" className={inputClass("whatsapp")} value={form.whatsapp} onChange={set("whatsapp")} />
                </div>
              </div>

              <div>
                <label className={label} htmlFor="postalAddress">{t("Гэрийн хаяг", "Postal Address")}</label>
                <input id="postalAddress" className={inputClass("postalAddress")} value={form.postalAddress} onChange={set("postalAddress")} />
              </div>

              <div>
                <label className={label} htmlFor="emergencyContact">{t("Яаралтай үед холбогдох хүн", "Emergency Contact")}</label>
                <input id="emergencyContact" className={inputClass("emergencyContact")} value={form.emergencyContact} onChange={set("emergencyContact")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="medicalHistory">{t("Эрүүл мэндийн түүх, харшил", "Medical History & Allergies")}</label>
                  <input id="medicalHistory" className={inputClass("medicalHistory")} value={form.medicalHistory} onChange={set("medicalHistory")} placeholder={t("Байхгүй бол \"none\" гэж бичнэ үү", "Write \"none\" if not applicable")} />
                </div>
                <div>
                  <label className={label} htmlFor="foodAllergies">{t("Хүнсний харшил", "Food Allergies")}</label>
                  <input id="foodAllergies" className={inputClass("foodAllergies")} value={form.foodAllergies} onChange={set("foodAllergies")} placeholder={t("Байхгүй бол \"none\" гэж бичнэ үү", "Write \"none\" if not applicable")} />
                </div>
              </div>
            </fieldset>

            {/* Occupation */}
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold text-slate-900">
                {t("Ажил эрхлэлт", "Occupation")}
              </legend>

              <div>
                <label className={label} htmlFor="currentInstitution">{t("Ажлын байгууллага", "Current Institution")} *</label>
                <input id="currentInstitution" className={inputClass("currentInstitution")} value={form.currentInstitution} onChange={set("currentInstitution")} />
                {err("currentInstitution")}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="institutionCategory">{t("Байгууллагын хэлбэр", "Institution Category")}</label>
                  <select id="institutionCategory" className={inputClass("institutionCategory")} value={form.institutionCategory} onChange={set("institutionCategory")}>
                    <option value="">{t("Сонгох...", "Select...")}</option>
                    <option value="Government">{t("Улсын", "Government")}</option>
                    <option value="Private">{t("Хувийн", "Private")}</option>
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="institutionType">{t("Байгууллагын төрөл", "Institution Type")}</label>
                  <input id="institutionType" className={inputClass("institutionType")} value={form.institutionType} onChange={set("institutionType")} placeholder={t("ж.нь Эмнэлгийн байгууллага", "e.g. Medical Institution")} />
                </div>
              </div>

              <div>
                <label className={label} htmlFor="institutionDescription">{t("Байгууллагын товч танилцуулга", "Describe Your Institution")}</label>
                <textarea id="institutionDescription" rows={3} className={inputClass("institutionDescription")} value={form.institutionDescription} onChange={set("institutionDescription")} />
              </div>

              <div>
                <label className={label} htmlFor="institutionWebsite">{t("Байгууллагын вэбсайт", "Official Website of Your Institution")}</label>
                <input id="institutionWebsite" className={inputClass("institutionWebsite")} value={form.institutionWebsite} onChange={set("institutionWebsite")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="department">{t("Алба / Хэлтэс", "Department / Section")}</label>
                  <input id="department" className={inputClass("department")} value={form.department} onChange={set("department")} />
                </div>
                <div>
                  <label className={label} htmlFor="currentPosition">{t("Одоогийн албан тушаал", "Current Position")} *</label>
                  <input id="currentPosition" className={inputClass("currentPosition")} value={form.currentPosition} onChange={set("currentPosition")} />
                  {err("currentPosition")}
                </div>
              </div>

              <div>
                <label className={label} htmlFor="otherPositions">{t("Бусад давхар албан тушаал", "Other Concurrent Positions")}</label>
                <input id="otherPositions" className={inputClass("otherPositions")} value={form.otherPositions} onChange={set("otherPositions")} placeholder={t("Байхгүй бол \"none\" гэж бичнэ үү", "Write \"none\" if not applicable")} />
              </div>

              <div>
                <label className={label} htmlFor="mainDuties">{t("Гүйцэтгэдэг үндсэн үүрэг", "Describe Your Main Duties")}</label>
                <textarea id="mainDuties" rows={4} className={inputClass("mainDuties")} value={form.mainDuties} onChange={set("mainDuties")} />
              </div>
            </fieldset>

            {/* Education / language ability */}
            <fieldset className="space-y-4">
              <legend className="mb-2 text-lg font-bold text-slate-900">
                {t("Боловсрол / Хэлний чадвар", "Education / Language Ability")}
              </legend>

              <div>
                <label className={label} htmlFor="educationInstitution">{t("Төгссөн сургууль", "Educational Institution")}</label>
                <input id="educationInstitution" className={inputClass("educationInstitution")} value={form.educationInstitution} onChange={set("educationInstitution")} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={label} htmlFor="educationCountry">{t("Улс", "Country")}</label>
                  <input id="educationCountry" className={inputClass("educationCountry")} value={form.educationCountry} onChange={set("educationCountry")} />
                </div>
                <div>
                  <label className={label} htmlFor="major">{t("Мэргэжил", "Major")}</label>
                  <input id="major" className={inputClass("major")} value={form.major} onChange={set("major")} />
                </div>
                <div>
                  <label className={label} htmlFor="yearAttained">{t("Хугацаа (жилээр)", "Year Attained")}</label>
                  <input id="yearAttained" className={inputClass("yearAttained")} value={form.yearAttained} onChange={set("yearAttained")} placeholder={t("ж.нь 6", "e.g. 6")} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={label} htmlFor="languageEnglish">{t("Англи хэлний чадвар", "Language Ability (English)")}</label>
                  <select id="languageEnglish" className={inputClass("languageEnglish")} value={form.languageEnglish} onChange={set("languageEnglish")}>
                    <option value="">{t("Сонгох...", "Select...")}</option>
                    {LANG_LEVELS.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
                  </select>
                </div>
                <div>
                  <label className={label} htmlFor="languageMandarin">{t("Хятад хэлний чадвар", "Language Ability (Mandarin Chinese)")}</label>
                  <select id="languageMandarin" className={inputClass("languageMandarin")} value={form.languageMandarin} onChange={set("languageMandarin")}>
                    <option value="">{t("Сонгох...", "Select...")}</option>
                    {LANG_LEVELS.map((lv) => <option key={lv} value={lv}>{lv}</option>)}
                  </select>
                </div>
              </div>
            </fieldset>

            {serverError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:w-auto sm:px-10"
            >
              {submitting ? t("Илгээж байна...", "Submitting...") : t("Өргөдөл илгээх", "Submit Application")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="container-page flex h-64 items-center justify-center text-slate-400">Loading...</div>}>
      <ApplyContent />
    </Suspense>
  );
}
