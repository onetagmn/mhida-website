"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { asset } from "@/lib/asset";
import PageHeader from "@/components/PageHeader";

const systemTrainings = [
  {
    href: "/trainings/axis-card",
    titleMn: "AXIS Карт",
    titleEn: "AXIS Card",
    descMn: "Даатгал, эмнэлгийн тооцооны AXIS системийн сургалтын видео, баримт бичиг.",
    descEn: "Tutorials and documents for the AXIS insurance and hospital billing system.",
  },
  {
    href: "/trainings/e-health",
    titleMn: "e-Health",
    titleEn: "e-Health",
    descMn: "Иргэний бүртгэл, эмийн бүртгэл, жоргийн e-Health системийн сургалт.",
    descEn: "Training for the e-Health system covering civil registration, drug records, and prescriptions.",
  },
];

const partnerTrainings = [
  {
    href: "/docs/TIHTC_Healthcare_Management_2026.pdf",
    titleMn: "Эрүүл мэндийн менежмент ба ҮЭМД төслийн сургалт",
    titleEn: "Healthcare Management & National Health Insurance Project Training",
    dates: "October 12–23, 2026 · Taipei, Taiwan",
  },
  {
    href: "/docs/TIHTC_Smart_Healthcare_2026.pdf",
    titleMn: "Ухаалаг эрүүл мэнд ба тогтвортой эмнэлгийн төслийн сургалт",
    titleEn: "Smart Healthcare & Sustainable Hospital Project Training",
    dates: "November 30 – December 5, 2026 · Taipei, Taiwan",
  },
];

export default function TrainingsPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалтууд", "Trainings")}
        title={t("Сургалтын модулиуд", "Training Modules")}
        subtitle={t(
          "Систем ашиглах сургалтууд болон MHIDA-ийн түншүүдийн зохион байгуулж буй мэргэжил дээшлүүлэх хөтөлбөрүүд.",
          "System-use trainings plus professional development programs run by MHIDA's partners."
        )}
      />

      <div className="container-page py-12">
        <h2 className="mb-4 text-xl font-bold text-slate-900">
          {t("Системийн сургалт", "System Trainings")}
        </h2>
        <div className="mb-14 grid gap-6 sm:grid-cols-2">
          {systemTrainings.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-xl border border-slate-200 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-[var(--brand-blue)]">
                {t(s.titleMn, s.titleEn)}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{t(s.descMn, s.descEn)}</p>
            </Link>
          ))}
        </div>

        <h2 className="mb-4 text-xl font-bold text-slate-900">
          {t("Түншийн сургалтууд (TIHTC)", "Partner Trainings (TIHTC)")}
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {partnerTrainings.map((p) => (
            <a
              key={p.href}
              href={asset(p.href)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-slate-200 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                {p.dates}
              </p>
              <h3 className="mt-2 font-bold text-slate-900">{t(p.titleMn, p.titleEn)}</h3>
              <p className="mt-4 text-sm font-semibold text-[var(--brand-red)]">
                {t("PDF татах →", "Download PDF →")}
              </p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
