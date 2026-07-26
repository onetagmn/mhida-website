"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { asset } from "@/lib/asset";
import { supabase } from "@/lib/supabase";
import { NewsPost, formatDate, firstYoutubeThumb, pdfHref, pdfName } from "@/lib/news";
import { MAP_KEY_TO_MN, countColor } from "@/lib/map-provinces";
import PartnerLogos from "@/components/PartnerLogos";

const Mongolia = dynamic(() => import("@react-map/mongolia"), { ssr: false });

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
    href: "https://m.me/j/AbYXmAkq96iY984q/",
    mn: "Чат",
    en: "Chat",
    live: true,
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
    kind: "external",
    href: "https://app.jotform.com/233173421900446?utm_source=copy-link&utm_medium=website&utm_campaign=portal-app&utm_term=233173421900446",
    mn: "Гар утасны апп",
    en: "Mobile App",
    live: true,
    noteMn: "Jotform апп нээх / татах",
    noteEn: "Open / install Jotform app",
  },
];

type FacilityStat = { province: string | null; workplace: string; member_count: number };
type CourseStats = {
  total_lessons: number;
  enrolled_members: number;
  completed_members: number;
  avg_completed: number;
};

export default function Home() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [latest, setLatest] = useState<NewsPost[]>([]);
  const [partner, setPartner] = useState<NewsPost[]>([]);
  const [mapStats, setMapStats] = useState<FacilityStat[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [mapSize, setMapSize] = useState(640);

  // Fetch latest news, partner posts, map stats, and course progress.
  useEffect(() => {
    (async () => {
      const [newsRes, partnerRes, statsRes, courseRes] = await Promise.all([
        supabase
          .from("news")
          .select("id, title, body, image_urls, pdf_urls, category, published, created_at")
          .eq("category", "news")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("news")
          .select("id, title, body, image_urls, pdf_urls, category, published, created_at")
          .eq("category", "partner")
          .order("created_at", { ascending: false })
          .limit(4),
        supabase.rpc("facility_stats"),
        supabase.rpc("course_progress_stats").maybeSingle(),
      ]);
      setLatest(newsRes.data ?? []);
      setPartner(partnerRes.data ?? []);
      setMapStats((statsRes.data as FacilityStat[]) ?? []);
      setCourseStats((courseRes.data as CourseStats) ?? null);
    })();
    const update = () => setMapSize(Math.min(680, window.innerWidth - 48));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const mapColors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of mapStats) {
      if (!s.province) continue;
      counts.set(s.province, (counts.get(s.province) ?? 0) + Number(s.member_count));
    }
    const colors: Record<string, string> = {};
    for (const [mapKey, mn] of Object.entries(MAP_KEY_TO_MN)) {
      colors[mapKey] = countColor(counts.get(mn) ?? 0);
    }
    return colors;
  }, [mapStats]);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <div className="container-page grid items-center gap-10 py-16 sm:py-20 md:grid-cols-2">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight text-[var(--brand-blue)] sm:text-4xl md:text-5xl">
              {t(
                "Монголын Даатгалын Эмч Нарын Холбоо",
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

      {/* Latest news (from the live database) */}
      {(latest.length > 0 || courseStats) && (
        <section className="border-b border-slate-200 bg-white">
          <div className="container-page py-14">
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{t("Сүүлийн мэдээ", "Latest News")}</h2>
              <Link href="/news" className="text-sm font-semibold text-[var(--brand-red)] hover:opacity-80">
                {t("Бүх мэдээ →", "All news →")}
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {courseStats && (
                <Link
                  href="/trainings/english-progress"
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--brand-blue)]">
                      🎓 {t("Англи хэлний курс", "English Course")}
                    </p>
                    <h3 className="font-bold text-slate-900 group-hover:text-[var(--brand-red)]">
                      {t("Гишүүдийн явц бодит цагаар", "Live member progress")}
                    </h3>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                      <div
                        className="h-full rounded-full bg-[var(--brand-blue)]"
                        style={{
                          width: `${courseStats.total_lessons > 0 ? Math.min(100, Math.round((courseStats.avg_completed / courseStats.total_lessons) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                    <p className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <span>
                        <span className="block text-lg font-extrabold text-slate-900">{courseStats.enrolled_members}</span>
                        <span className="block text-[10px] text-slate-500">{t("гишүүн", "members")}</span>
                      </span>
                      <span>
                        <span className="block text-lg font-extrabold text-slate-900">
                          {courseStats.avg_completed}/{courseStats.total_lessons}
                        </span>
                        <span className="block text-[10px] text-slate-500">{t("дундаж өдөр", "avg. day")}</span>
                      </span>
                      <span>
                        <span className="block text-lg font-extrabold text-slate-900">{courseStats.completed_members}</span>
                        <span className="block text-[10px] text-slate-500">{t("төгссөн", "finished")}</span>
                      </span>
                    </p>
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--brand-red)]">
                    {t("Дэлгэрэнгүй хүснэгт →", "Full table →")}
                  </p>
                </Link>
              )}
              {latest.map((p) => {
                const thumb = p.image_urls[0] ?? firstYoutubeThumb(p.body);
                const isVideo = !p.image_urls[0] && !!thumb;
                return (
                <Link
                  key={p.id}
                  href="/news"
                  className="group overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
                >
                  {thumb && (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt="" className="h-40 w-full object-cover" loading="lazy" />
                      {isVideo && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 pl-1 text-xl text-white">
                            ▶
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {formatDate(p.created_at, lang)}
                    </p>
                    <h3 className="font-bold text-slate-900 group-hover:text-[var(--brand-red)]">{p.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{p.body}</p>
                  </div>
                </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Partnership / News */}
      <section className="container-page py-14">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">
          {t("Түншлэл ба мэдээ", "Partnership & News")}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {partner.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
            >
              <Link href={`/trainings/apply?post=${item.id}`} className="group block">
                {(item.image_urls ?? []).length > 0 && (
                  <div className={`grid gap-0.5 ${item.image_urls.length > 1 ? "grid-cols-2" : ""}`}>
                    {item.image_urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt="" className="h-80 w-full object-cover" loading="lazy" />
                    ))}
                  </div>
                )}
                <div className="p-6 pb-3">
                  <h3 className="font-bold text-slate-900 group-hover:text-[var(--brand-red)]">{item.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{item.body}</p>
                  <p className="mt-3 text-sm font-semibold text-[var(--brand-red)]">
                    {t("Дэлгэрэнгүй / Өргөдөл гаргах →", "Details / Apply →")}
                  </p>
                </div>
              </Link>
              {(item.pdf_urls ?? []).length > 0 && (
                <div className="px-6 pb-6">
                  {item.pdf_urls.map((url, i) => (
                    <a
                      key={i}
                      href={pdfHref(url)}
                      download={`${pdfName(url)}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm font-semibold text-[var(--brand-blue)] hover:opacity-80"
                    >
                      📄 {pdfName(url)} — {t("PDF татах →", "Download PDF →")}
                    </a>
                  ))}
                </div>
              )}
            </div>
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
              const className = `group relative rounded-lg p-4 text-center text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                action.live
                  ? "bg-[var(--brand-blue)] text-white hover:bg-[#013f78]"
                  : "border border-dashed border-slate-300 bg-white text-slate-400"
              }`;
              const inner = (
                <>
                  <span
                    className={action.live ? "transition-colors duration-200 group-hover:text-amber-300" : undefined}
                  >
                    {t(action.mn, action.en)}
                  </span>
                  {(action.noteMn || !action.live) && (
                    <span
                      className={`mt-1 block text-[10px] font-medium uppercase tracking-wide ${
                        action.live ? "text-white/70" : "text-slate-400"
                      }`}
                    >
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

      {/* Member map — live preview, click anywhere to open the full page */}
      <section className="container-page py-14">
        <h2 className="mb-6 text-2xl font-bold text-slate-900">
          {t("Гишүүдийн газрын зураг", "Member Map")}
        </h2>
        <div
          onClick={() => router.push("/map")}
          className="flex cursor-pointer justify-center rounded-2xl border border-slate-200 p-4 transition-shadow hover:shadow-md"
          title={t("Дэлгэрэнгүй газрын зураг нээх", "Open the full map")}
        >
          <Mongolia
            type="select-single"
            size={mapSize}
            mapColor="#EDF1F6"
            strokeColor="#ffffff"
            strokeWidth={1}
            hoverColor="#d98d92"
            selectColor="#c42730"
            hints={false}
            cityColors={mapColors}
            onSelect={() => router.push("/map")}
          />
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/map"
            className="inline-block rounded-md bg-[var(--brand-blue)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("Газрын зураг нээх →", "Open the map →")}
          </Link>
        </div>
      </section>

      {/* Partner / social logo links (admin-managed) */}
      <PartnerLogos />
    </div>
  );
}
