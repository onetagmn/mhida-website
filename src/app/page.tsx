"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { asset } from "@/lib/asset";
import DraftNotice from "@/components/DraftNotice";

const quickActions = [
  { href: "/register", mn: "Бүртгүүлэх", en: "Register", live: true },
  { href: "/contact", mn: "Холбоо барих", en: "Contact", live: true },
  { href: "/about", mn: "Танилцуулга", en: "About", live: true },
  { href: "/trainings", mn: "Модулиуд", en: "Modules", live: true },
  { href: "/legal", mn: "Хууль эрх зүй", en: "Legal Acts", live: true },
  { href: "/contact", mn: "Чат", en: "Chat", live: false },
  { href: "/contact", mn: "Нэрийн карт", en: "Name Card", live: false },
  { href: "/contact", mn: "Хандив өргөх", en: "Donate", live: false },
];

const trainingNews = [
  {
    title: "Healthcare Management & National Health Insurance Project Training",
    titleMn: "Эрүүл мэндийн менежмент ба Үндэсний эрүүл мэндийн даатгалын төслийн сургалт",
    dates: "October 12–23, 2026",
    location: "Taipei, Taiwan",
    href: "/docs/TIHTC_Healthcare_Management_2026.pdf",
    deadline: "September 12, 2026",
  },
  {
    title: "Smart Healthcare & Sustainable Hospital Project Training",
    titleMn: "Ухаалаг эрүүл мэндийн үйлчилгээ ба тогтвортой эмнэлгийн төслийн сургалт",
    dates: "November 30 – December 5, 2026",
    location: "Taipei, Taiwan",
    href: "/docs/TIHTC_Smart_Healthcare_2026.pdf",
    deadline: "October 30, 2026",
  },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="container-page grid items-center gap-10 py-16 sm:py-20 md:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              MHIDA
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-[var(--brand-blue)] sm:text-4xl md:text-5xl">
              {t(
                "Монголын Эрүүл Мэндийн Даатгалын Эмч Нарын Холбоо",
                "Mongolian Health Insurance Doctors Association"
              )}
            </h1>
            <p className="mt-5 max-w-xl text-slate-600">
              {t(
                "Гишүүнчлэл, сургалт, AXIS болон e-Health системийн мэдээлэл, эрх зүйн баримт бичгүүдийг нэг дор.",
                "Membership, trainings, AXIS and e-Health system resources, and legal documents — all in one place."
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-md bg-[var(--brand-red)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                {t("Бүртгүүлэх", "Register now")}
              </Link>
              <Link
                href="/about"
                className="rounded-md border border-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
              >
                {t("Дэлгэрэнгүй", "Learn more")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <Image
              src={asset("/logo.png")}
              alt="MHIDA logo"
              width={320}
              height={330}
              className="h-56 w-auto sm:h-72"
              priority
            />
          </div>
        </div>
      </section>

      {/* Partnership / News */}
      <section className="container-page py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand-red)]">
              {t("Түншлэл ба мэдээ", "Partnership & News")}
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {t(
                "Тайванийн Олон Улсын Эрүүл Мэндийн Сургалтын Төв (TIHTC)",
                "Taiwan International Healthcare Training Center (TIHTC)"
              )}
            </h2>
          </div>
        </div>

        <p className="mb-6 max-w-3xl text-sm text-slate-600">
          {t(
            "MHIDA-TIHTC хамтын ажиллагааны хүрээнд гишүүн эмч нарт зориулсан 2026 оны сургалтын хөтөлбөрүүд. Дэлгэрэнгүй мэдээллийг PDF файлаас үзнэ үү.",
            "2026 training programs for MHIDA member doctors, offered through the MHIDA–TIHTC partnership. See the PDF for full details."
          )}
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {trainingNews.map((item) => (
            <a
              key={item.href}
              href={asset(item.href)}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-xl border border-slate-200 p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                {item.dates} · {item.location}
              </p>
              <h3 className="mt-2 font-bold text-slate-900 group-hover:text-[var(--brand-red)]">
                {t(item.titleMn, item.title)}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                {t("Өргөдлийн эцсийн хугацаа:", "Application deadline:")} {item.deadline}
              </p>
              <p className="mt-4 text-sm font-semibold text-[var(--brand-red)]">
                {t("PDF татах →", "Download PDF →")}
              </p>
            </a>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="container-page">
          <h2 className="mb-6 text-2xl font-bold text-slate-900">
            {t("Түргэн холбоос", "Quick Actions")}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {quickActions.map((action, idx) => (
              <Link
                key={`${action.href}-${idx}`}
                href={action.href}
                className={`relative rounded-lg border bg-white p-4 text-center text-sm font-semibold shadow-sm transition-shadow hover:shadow-md ${
                  action.live ? "border-slate-200 text-slate-800" : "border-dashed border-slate-300 text-slate-400"
                }`}
              >
                {t(action.mn, action.en)}
                {!action.live && (
                  <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                    {t("Тун удахгүй", "Coming soon")}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Member map placeholder */}
      <section className="container-page py-14">
        <h2 className="mb-2 text-2xl font-bold text-slate-900">
          {t("Гишүүдийн газрын зураг", "Member Map")}
        </h2>
        <p className="mb-6 max-w-2xl text-sm text-slate-600">
          {t(
            "Аймаг тус бүрээр гишүүдийн байршлыг харуулах интерактив газрын зураг гишүүний бүртгэлийн санд суурилж автоматаар шинэчлэгдэнэ.",
            "An interactive map showing member locations by province, auto-updating from the live member database."
          )}
        </p>
        <DraftNotice
          note={t(
            "Гишүүдийн газрын зураг Phase 5-т, бодит бүртгэлийн өгөгдөл бэлэн болсны дараа холбогдоно.",
            "The live member map ships in Phase 5, once real registration data is available to plot."
          )}
        />
        <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 sm:h-80">
          {t("Газрын зураг — тун удахгүй", "Map — coming soon")}
        </div>
      </section>
    </div>
  );
}
