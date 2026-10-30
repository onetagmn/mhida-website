"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { PROVINCES } from "@/lib/provinces";
import { supabase } from "@/lib/supabase";

export type ProfileMember = {
  id: string;
  member_id: string;
  last_name: string;
  first_name: string;
  birth_date: string | null;
  gender: string | null;
  province: string | null;
  workplace: string | null;
  position: string | null;
  years_worked: string | null;
  facebook: string | null;
  email: string | null;
  phone: string | null;
  membership: string;
};

type FormState = {
  last_name: string;
  first_name: string;
  birth_date: string;
  gender: string;
  province: string;
  workplace: string;
  position: string;
  years_worked: string;
  facebook: string;
  phone: string;
};

function toForm(m: ProfileMember): FormState {
  return {
    last_name: m.last_name ?? "",
    first_name: m.first_name ?? "",
    birth_date: m.birth_date ?? "",
    gender: m.gender ?? "",
    province: m.province ?? "",
    workplace: m.workplace ?? "",
    position: m.position ?? "",
    years_worked: m.years_worked ?? "",
    facebook: m.facebook ?? "",
    phone: m.phone ?? "",
  };
}

const genderLabel = (g: string | null, t: (mn: string, en: string) => string) =>
  g === "female" ? t("Эмэгтэй", "Female") : g === "male" ? t("Эрэгтэй", "Male") : g === "other" ? t("Бусад", "Other") : "—";

const provinceLabel = (code: string | null, lang: "mn" | "en") => {
  const p = PROVINCES.find((p) => p.code === code);
  return p ? (lang === "mn" ? p.mn : p.en) : "—";
};

/**
 * Profile card: shows the member's info and lets them edit it in place.
 * Membership type, member ID, and status are intentionally not editable
 * here — those are protected columns (see schema.sql's
 * protect_member_columns trigger, which also rejects these at the DB
 * level even if someone bypassed the UI). Email is shown read-only too:
 * it's the login credential, so changing it needs its own confirmed
 * flow rather than a plain profile edit.
 */
export default function EditProfileForm({
  member,
  onSaved,
}: {
  member: ProfileMember;
  onSaved: (updated: ProfileMember) => void;
}) {
  const { t, lang } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(() => toForm(member));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setError(null);
    };

  function startEditing() {
    setForm(toForm(member));
    setSavedMsg(null);
    setError(null);
    setEditing(true);
  }

  function cancel() {
    setForm(toForm(member));
    setError(null);
    setEditing(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.last_name.trim() || !form.first_name.trim()) {
      setError(t("Овог, нэрээ бөглөнө үү.", "Please fill in your last and first name."));
      return;
    }
    const cleanPhone = form.phone.replace(/[\s-]/g, "");
    if (cleanPhone && !/^\d{8}$/.test(cleanPhone)) {
      setError(t("Утасны дугаар 8 оронтой байх ёстой.", "Phone number must be 8 digits."));
      return;
    }

    setSaving(true);
    const payload = {
      last_name: form.last_name.trim(),
      first_name: form.first_name.trim(),
      birth_date: form.birth_date || null,
      gender: form.gender || null,
      province: form.province || null,
      workplace: form.workplace.trim() || null,
      position: form.position.trim() || null,
      years_worked: form.years_worked.trim() || null,
      facebook: form.facebook.trim() || null,
      phone: cleanPhone || null,
    };
    const { error: err } = await supabase
      .from("members")
      .update(payload)
      .eq("id", member.id);
    setSaving(false);

    if (err) {
      setError(t("Алдаа гарлаа: ", "Something went wrong: ") + err.message);
      return;
    }
    onSaved({ ...member, ...payload });
    setSavedMsg(t("Мэдээлэл шинэчлэгдлээ!", "Your information was updated!"));
    setEditing(false);
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]";
  const label = "mb-1 block text-xs font-semibold text-slate-500";

  if (!editing) {
    return (
      <div className="rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{t("Миний мэдээлэл", "My Profile")}</h2>
          <button
            onClick={startEditing}
            className="rounded-md border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
          >
            {t("Засах", "Edit")}
          </button>
        </div>
        {savedMsg && (
          <p className="mb-4 mt-3 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
            {savedMsg}
          </p>
        )}
        <dl className={`grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2 ${savedMsg ? "" : "mt-4"}`}>
          <div>
            <dt className="font-semibold text-slate-500">{t("Гишүүнчлэл", "Membership")}</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  member.membership === "professional"
                    ? "bg-blue-100 text-[var(--brand-blue)]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {member.membership === "professional" ? t("Мэргэжлийн", "Professional") : t("Энгийн", "Regular")}
              </span>
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">{t("Төрсөн огноо", "Date of birth")}</dt>
            <dd className="mt-0.5 text-slate-800">{member.birth_date ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">{t("Хүйс", "Gender")}</dt>
            <dd className="mt-0.5 text-slate-800">{genderLabel(member.gender, t)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">{t("Аймаг/Хот", "Province")}</dt>
            <dd className="mt-0.5 text-slate-800">{provinceLabel(member.province, lang)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">{t("Ажлын газар", "Workplace")}</dt>
            <dd className="mt-0.5 text-slate-800">{member.workplace ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">{t("Албан тушаал", "Position")}</dt>
            <dd className="mt-0.5 text-slate-800">{member.position ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">{t("Ажилласан жил", "Years worked")}</dt>
            <dd className="mt-0.5 text-slate-800">{member.years_worked ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">{t("И-мэйл", "Email")}</dt>
            <dd className="mt-0.5 text-slate-800">{member.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">{t("Утас", "Phone")}</dt>
            <dd className="mt-0.5 text-slate-800">{member.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Facebook</dt>
            <dd className="mt-0.5 text-slate-800">{member.facebook ?? "—"}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="rounded-xl border border-[var(--brand-blue)] p-6">
      <h2 className="mb-4 text-lg font-bold text-slate-900">
        {t("Мэдээлэл засах", "Edit My Information")}
      </h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="ep-last-name">{t("Овог", "Last name")}</label>
          <input id="ep-last-name" className={inputClass} value={form.last_name} onChange={set("last_name")} />
        </div>
        <div>
          <label className={label} htmlFor="ep-first-name">{t("Нэр", "First name")}</label>
          <input id="ep-first-name" className={inputClass} value={form.first_name} onChange={set("first_name")} />
        </div>
        <div>
          <label className={label} htmlFor="ep-birth-date">{t("Төрсөн огноо", "Date of birth")}</label>
          <input id="ep-birth-date" type="date" className={inputClass} value={form.birth_date} onChange={set("birth_date")} />
        </div>
        <div>
          <label className={label} htmlFor="ep-gender">{t("Хүйс", "Gender")}</label>
          <select id="ep-gender" className={inputClass} value={form.gender} onChange={set("gender")}>
            <option value="">{t("Сонгох...", "Select...")}</option>
            <option value="female">{t("Эмэгтэй", "Female")}</option>
            <option value="male">{t("Эрэгтэй", "Male")}</option>
            <option value="other">{t("Бусад", "Other")}</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="ep-province">{t("Аймаг / хот", "Province / city")}</label>
          <select id="ep-province" className={inputClass} value={form.province} onChange={set("province")}>
            <option value="">{t("Сонгох...", "Select...")}</option>
            {PROVINCES.map((p) => (
              <option key={p.code} value={p.code}>{lang === "mn" ? p.mn : p.en}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="ep-phone">{t("Утас", "Phone")}</label>
          <input id="ep-phone" inputMode="numeric" placeholder="99112233" className={inputClass} value={form.phone} onChange={set("phone")} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="ep-workplace">{t("Ажлын газар", "Workplace")}</label>
          <input id="ep-workplace" className={inputClass} value={form.workplace} onChange={set("workplace")} />
        </div>
        <div>
          <label className={label} htmlFor="ep-position">{t("Албан тушаал", "Position")}</label>
          <input id="ep-position" className={inputClass} value={form.position} onChange={set("position")} />
        </div>
        <div>
          <label className={label} htmlFor="ep-years">{t("Ажилласан жил", "Years worked")}</label>
          <input id="ep-years" inputMode="numeric" className={inputClass} value={form.years_worked} onChange={set("years_worked")} />
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="ep-facebook">{t("Facebook хаяг (заавал биш)", "Facebook ID (optional)")}</label>
          <input id="ep-facebook" className={inputClass} value={form.facebook} onChange={set("facebook")} />
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        {t(
          "И-мэйл хаягаа солих шаардлагатай бол бидэнтэй холбогдоно уу.",
          "To change your email address (used for login), please contact us."
        )}
      </p>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t("Хадгалж байна...", "Saving...") : t("Хадгалах", "Save")}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={saving}
          className="rounded-md border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-50"
        >
          {t("Цуцлах", "Cancel")}
        </button>
      </div>
    </form>
  );
}
