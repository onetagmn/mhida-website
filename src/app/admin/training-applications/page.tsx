"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

type Application = {
  id: string;
  training_title: string;
  status: "submitted" | "reviewed" | "accepted" | "declined";
  created_at: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  gender: string | null;
  date_of_birth: string | null;
  email: string;
  official_email: string | null;
  alternative_email: string | null;
  mobile_phone: string;
  facebook: string | null;
  linkedin: string | null;
  whatsapp: string | null;
  medical_history: string | null;
  food_allergies: string | null;
  postal_address: string | null;
  emergency_contact: string | null;
  current_institution: string;
  institution_category: string | null;
  institution_type: string | null;
  institution_description: string | null;
  institution_website: string | null;
  department: string | null;
  current_position: string;
  other_positions: string | null;
  main_duties: string | null;
  education_institution: string | null;
  education_country: string | null;
  major: string | null;
  year_attained: string | null;
  language_english: string | null;
  language_mandarin: string | null;
};

const STATUS_STYLES: Record<Application["status"], string> = {
  submitted: "bg-slate-100 text-slate-700",
  reviewed: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};

export default function AdminTrainingApplicationsPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [trainingFilter, setTrainingFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login/"); return; }
    const { data: me } = await supabase
      .from("members").select("is_admin").eq("id", session.user.id).single();
    if (!me?.is_admin) { setDenied(true); setLoading(false); return; }
    const { data } = await supabase
      .from("training_applications")
      .select("*")
      .order("created_at", { ascending: false });
    setApps(data ?? []);
    setLoading(false);
  }, [router]);

  // Standard fetch-on-mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function setStatus(id: string, status: Application["status"]) {
    const { error } = await supabase.from("training_applications").update({ status }).eq("id", id);
    if (!error) setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }

  if (loading) {
    return <div className="container-page flex h-64 items-center justify-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</div>;
  }
  if (denied) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-lg font-bold text-slate-700">{t("Хандах эрхгүй байна.", "You don't have access to this page.")}</p>
      </div>
    );
  }

  const trainings = Array.from(new Set(apps.map((a) => a.training_title)));
  const visible = trainingFilter === "all" ? apps : apps.filter((a) => a.training_title === trainingFilter);

  return (
    <div>
      <PageHeader
        eyebrow={t("Админ", "Admin")}
        title={t("Сургалтын өргөдлүүд", "Training Applications")}
        subtitle={t(
          "Мэргэжлийн гишүүдийн илгээсэн сургалтын өргөдлүүд (жишээ нь Тайпэйд болох MHIDA–TIHTC сургалт).",
          "Applications Professional members have submitted for trainings (e.g. the MHIDA–TIHTC Taipei programs)."
        )}
      />

      <div className="container-page pt-6">
        <Link
          href="/admin"
          className="inline-block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
        >
          {t("← Гишүүдийн удирдлага", "← Member Management")}
        </Link>
      </div>

      <div className="container-page py-10">
        {trainings.length > 1 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTrainingFilter("all")}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${trainingFilter === "all" ? "bg-[var(--brand-blue)] text-white" : "border border-slate-300 text-slate-600"}`}
            >
              {t("Бүгд", "All")} ({apps.length})
            </button>
            {trainings.map((title) => (
              <button
                key={title}
                onClick={() => setTrainingFilter(title)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${trainingFilter === title ? "bg-[var(--brand-blue)] text-white" : "border border-slate-300 text-slate-600"}`}
              >
                {title} ({apps.filter((a) => a.training_title === title).length})
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="text-sm text-slate-400">{t("Одоогоор өргөдөл алга.", "No applications yet.")}</p>
        ) : (
          <div className="space-y-3">
            {visible.map((a) => {
              const open = openId === a.id;
              return (
                <div key={a.id} className="rounded-xl border border-slate-200">
                  <button
                    onClick={() => setOpenId(open ? null : a.id)}
                    className="flex w-full items-center gap-4 p-4 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {a.first_name} {a.last_name}
                        <span className="ml-2 text-xs font-normal text-slate-400">{a.current_position} · {a.current_institution}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {a.training_title} · {new Date(a.created_at).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-GB")}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${STATUS_STYLES[a.status]}`}>
                      {a.status}
                    </span>
                    <span className="shrink-0 text-slate-400">{open ? "▲" : "▼"}</span>
                  </button>

                  {open && (
                    <div className="border-t border-slate-100 p-5 text-sm">
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {(["submitted", "reviewed", "accepted", "declined"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatus(a.id, s)}
                            className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase ${
                              a.status === s ? STATUS_STYLES[s] : "border border-slate-200 text-slate-500 hover:border-slate-400"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                        <Section title={t("Хувийн мэдээлэл", "Personal Information")}>
                          <Field label="Name" value={[a.first_name, a.middle_name, a.last_name].filter(Boolean).join(" ")} />
                          <Field label="Gender" value={a.gender} />
                          <Field label="Date of Birth" value={a.date_of_birth} />
                          <Field label="Email" value={a.email} />
                          <Field label="Official Email" value={a.official_email} />
                          <Field label="Alternative Email" value={a.alternative_email} />
                          <Field label="Mobile Phone" value={a.mobile_phone} />
                          <Field label="Facebook" value={a.facebook} />
                          <Field label="LinkedIn" value={a.linkedin} />
                          <Field label="WhatsApp" value={a.whatsapp} />
                          <Field label="Medical History & Allergies" value={a.medical_history} />
                          <Field label="Food Allergies" value={a.food_allergies} />
                          <Field label="Postal Address" value={a.postal_address} />
                          <Field label="Emergency Contact" value={a.emergency_contact} />
                        </Section>

                        <Section title={t("Ажил эрхлэлт", "Occupation")}>
                          <Field label="Current Institution" value={a.current_institution} />
                          <Field label="Institution Category" value={a.institution_category} />
                          <Field label="Institution Type" value={a.institution_type} />
                          <Field label="Describe Institution" value={a.institution_description} />
                          <Field label="Website" value={a.institution_website} />
                          <Field label="Department" value={a.department} />
                          <Field label="Current Position" value={a.current_position} />
                          <Field label="Other Positions" value={a.other_positions} />
                          <Field label="Main Duties" value={a.main_duties} />
                        </Section>

                        <Section title={t("Боловсрол / Хэл", "Education / Language")}>
                          <Field label="Educational Institution" value={a.education_institution} />
                          <Field label="Country" value={a.education_country} />
                          <Field label="Major" value={a.major} />
                          <Field label="Year Attained" value={a.year_attained} />
                          <Field label="English" value={a.language_english} />
                          <Field label="Mandarin Chinese" value={a.language_mandarin} />
                        </Section>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <p className="text-slate-700">
      <span className="font-semibold text-slate-500">{label}:</span> {value}
    </p>
  );
}
