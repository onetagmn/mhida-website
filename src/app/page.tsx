"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { asset } from "@/lib/asset";
import DraftNotice from "@/components/DraftNotice";

// Chat: waiting on the Facebook Messenger group link — flips to live once provided.
// Upgrade Membership: goes live with QPay payments (Phase 6).
const quickActions: {
  kind: "internal" | "file" | "external";
  href: string;
  mn: string;
  en: string;
  live: boolean;
  noteMn?: string;
  noteEn?: string;
}[] = [
  { kind: "internal", href: "/register", mn: "Бүртгүүлэх", en: "Register", live: true },
  {
    kind: "external",
    href: "#",
    mn: "Чат",
    en: "Chat",
    live: false,
    noteMn: "Facebook Messenger",
    noteEn: "Facebook Messenger",
  },
  {
    kind: "file",
    href: "/docs/MHIDA_NAME_CARD_TEMPLATE.pptx",
    mn: "Нэрийн карт",
    en: "Name Card",
    live: true,
    noteMn: "Загвар татах (PPTX)",
    noteEn: "Download template (PPTX)",
  },
  {
    kind: "internal",
    href: "/register",
    mn: "Гишүүнчлэл ахиулах",
    en: "Upgrade Membership",
    live: false,
  },
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
            <h1 className="text-3xl font-extrabold leading-tight text-[var(--brand-blue)] sm:text-4xl md:text-5xl">
              {t(
                "Монголын Эрүүл Мэндийн Даатгалын Эмч Нарын Холбоо",
                "Mongolian Health Insurance Doctors Association"
              )}
            </h1>
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
            {quickActions.map((action, idx) => {
              const className = `relative rounded-lg border bg-white p-4 text-center text-sm font-semibold shadow-sm transition-shadow hover:shadow-md ${
                action.live ? "border-slate-200 text-slate-800" : "border-dashed border-slate-300 text-slate-400"
              }`;
              const inner = (
                <>
                  {t(action.mn, action.en)}
                  {(action.noteMn || !action.live) && (
                    <span className="mt-1 block text-[10px] font-medium uppercase tracking-wide text-slate-400">
                      {!action.live
                        ? t("Тун удахгүй", "Coming soon")
                        : t(action.noteMn ?? "", action.noteEn ?? "")}
                    </span>
                  )}
                </>
              );
              if (!action.live) {
                return (
                  <div key={idx} className={className}>
                    {inner}
                  </div>
                );
              }
              if (action.kind === "internal") {
                return (
                  <Link key={idx} href={action.href} className={className}>
                    {inner}
                  </Link>
                );
              }
              return (
                <a
                  key={idx}
                  href={action.kind === "file" ? asset(action.href) : action.href}
                  target={action.kind === "external" ? "_blank" : undefined}
                  rel={action.kind === "external" ? "noopener noreferrer" : undefined}
                  download={action.kind === "file" ? true : undefined}
                  className={className}
                >
                  {inner}
                </a>
              );
            })}
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
            "Аймаг, хотоор шүүж хайх боломжтой Монголын интерактив газрын зураг: гишүүд ажилладаг эмнэлэг, эрүүл мэндийн байгууллагуудын мэдээллийг харуулна. Шинэ гишүүн бүртгүүлэх бүрд автоматаар шинэчлэгдэнэ. Нэвтэрсэн гишүүд дэлгэрэнгүй мэдээлэл харах боломжтой болно.",
            "An interactive map of Mongolia showing medical facilities where our members work — searchable and filterable by province and city, auto-updating with every new registration. Logged-in members will see additional details."
          )}
        </p>
        <DraftNotice
          note={t(
            "Газрын зураг бодит бүртгэлийн өгөгдөл бэлэн болсны дараа холбогдоно.",
            "The interactive map goes live once real registration data is available to plot."
          )}
        />
        <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 sm:h-80">
          {t("Газрын зураг — тун удахгүй", "Map — coming soon")}
        </div>
      </section>
    </div>
  );
}
