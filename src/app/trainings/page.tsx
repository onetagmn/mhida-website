"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
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
    descMn: "Иргэний бүртгэл, эмийн бүртгэл, жорын мэдээллийн e-Health системийн сургалт.",
    descEn: "Training for the e-Health system covering civil registration, drug records, and prescriptions.",
  },
  {
    href: "/trainings/english",
    titleMn: "Англи хэлний курс",
    titleEn: "English Course",
    descMn: "Гишүүдэд зориулсан үнэгүй ярианы англи хэлний 10 долоо хоногийн курс.",
    descEn: "A free 10-week spoken English course for members.",
    badgeMn: "Гишүүдэд",
    badgeEn: "For members",
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
          "Систем ашиглах сургалтууд болон гишүүдэд зориулсан хөтөлбөрүүд.",
          "System-use trainings and member programs."
        )}
      />

      <div className="container-page py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {systemTrainings.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="rounded-xl border border-slate-200 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--brand-blue)]">
                {t(s.titleMn, s.titleEn)}
                {s.badgeMn && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[var(--brand-blue)]">
                    {t(s.badgeMn, s.badgeEn!)}
                  </span>
                )}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{t(s.descMn, s.descEn)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
