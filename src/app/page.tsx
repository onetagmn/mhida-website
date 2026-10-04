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
import { MAP_KEY_TO_MN, MAP_KEYS_WEST_TO_EAST, countColor } from "@/lib/map-provinces";
import { PROVINCES } from "@/lib/provinces";
import PartnerLogos from "@/components/PartnerLogos";
import HeartbeatLine from "@/components/HeartbeatLine";
import { useInView } from "@/lib/use-in-view";

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
  const [mapStatsLoaded, setMapStatsLoaded] = useState(false);
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
          .limit(8),
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
      setMapStatsLoaded(true);
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
  const [mapRef, mapSeen] = useInView<HTMLDivElement>();
  const mapFill = useMapFillIn(mapColors, mapSeen);

  const memberSummary = useMemo(() => {
    const totalMembers = mapStats.reduce((a, s) => a + Number(s.member_count), 0);
    const totalFacilities = mapStats.length;
    const provincesCovered = new Set(mapStats.filter((s) => s.province).map((s) => s.province)).size;
    return { totalMembers, totalFacilities, provincesCovered, totalProvinces: PROVINCES.length };
  }, [mapStats]);

  // The Latest News grid is 4 across. Keep it to exactly two full rows (8 tiles),
  // counting the Map and English Course cards that share the grid.
  const NEWS_GRID_TILES = 8;
  const newsTiles = latest.slice(
    0,
    NEWS_GRID_TILES - (mapStatsLoaded ? 1 : 0) - (courseStats ? 1 : 0)
  );

  return (
    <div>
      {/* Hero — with a heartbeat pulse running along a faint ECG line
          behind it (HeartbeatLine) and the logo floating gently. */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50 via-white to-white">
        <HeartbeatLine className="absolute inset-x-0 bottom-1 h-16 w-full sm:bottom-2 sm:h-20" />
        <div className="container-page relative grid items-center gap-10 py-16 sm:py-20 md:grid-cols-2">
          <div>
            <h1 className="hero-rise text-3xl font-extrabold leading-tight text-[var(--brand-blue)] sm:text-4xl md:text-5xl">
              {t(
                "Монголын Даатгалын Эмч Нарын Холбоо",
                "Mongolian Health Insurance Doctors Association"
              )}
            </h1>
            <p className="hero-rise hero-delay-1 mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              {t(
                "Даатгалын эмч нарын мэргэжлийн холбоо — сургалт, эрх зүйн мэдээлэл, туршлага солилцоо нэг дороос.",
                "The professional association for health insurance doctors — training, legal resources, and shared expertise in one place."
              )}
            </p>
            <div className="hero-rise hero-delay-3 mt-7 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="btn-shine rounded-lg bg-[var(--brand-red)] px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[var(--brand-red-dark)]"
              >
                {t("Бүртгүүлэх", "Register")}
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold text-[var(--brand-blue)] transition-opacity hover:opacity-70"
              >
                {t("Танилцуулга →", "About us →")}
              </Link>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <div className="logo-float">
              <Image
                src={asset("/logo.png")}
                alt="MHIDA logo"
                width={320}
                height={330}
                className="hero-rise hero-delay-2 h-56 w-auto sm:h-72"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Latest news (from the live database) */}
      {(latest.length > 0 || courseStats || mapStatsLoaded) && (
        <section className="border-b border-slate-200 bg-white">
          <div className="container-page py-14">
            <div className="reveal mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{t("Сүүлийн мэдээ", "Latest News")}</h2>
              <Link href="/news" className="text-sm font-semibold text-[var(--brand-red)] hover:opacity-80">
                {t("Бүх мэдээ →", "All news →")}
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {mapStatsLoaded && (
                <Link
                  href="/map"
                  className="reveal group flex flex-col justify-between overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--brand-blue)]">
                      <LiveDot />
                      🗺️ {t("Гишүүдийн тархалт", "Member Map")}
                    </p>
                    <h3 className="mb-3 font-extrabold text-slate-900 group-hover:text-[var(--brand-red)]">
                      {t("Бүх орон даяар өргөжиж байна", "Growing across the country")}
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-blue-100 text-[var(--brand-blue)]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                        </span>
                        <span>
                          <span className="block text-[15px] font-extrabold leading-none text-slate-900"><CountUp value={memberSummary.totalMembers} /></span>
                          <span className="text-[10.5px] font-semibold text-slate-500">{t("Гишүүн", "Members")}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-blue-100 text-[var(--brand-blue)]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="2" width="16" height="20" rx="1" />
                            <line x1="9" y1="7" x2="9" y2="7.01" />
                            <line x1="15" y1="7" x2="15" y2="7.01" />
                            <line x1="9" y1="12" x2="9" y2="12.01" />
                            <line x1="15" y1="12" x2="15" y2="12.01" />
                            <line x1="9" y1="17" x2="15" y2="17" />
                          </svg>
                        </span>
                        <span>
                          <span className="block text-[15px] font-extrabold leading-none text-slate-900"><CountUp value={memberSummary.totalFacilities} /></span>
                          <span className="text-[10.5px] font-semibold text-slate-500">{t("Эмнэлэг, байгууллага", "Facilities")}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-blue-100 text-[var(--brand-blue)]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        </span>
                        <span>
                          <span className="block text-[15px] font-extrabold leading-none text-slate-900">
                            <CountUp value={memberSummary.provincesCovered} /> /{memberSummary.totalProvinces}
                          </span>
                          <span className="text-[10.5px] font-semibold text-slate-500">{t("Аймаг, хот", "Regions")}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-[var(--brand-blue)] px-3 py-2.5 text-[12.5px] font-bold text-white">
                    <span>{t("Газрын зураг харах", "View the map")}</span>
                    <span>→</span>
                  </div>
                </Link>
              )}
              {courseStats && (() => {
                const pct = courseStats.total_lessons > 0
                  ? Math.min(100, Math.round((courseStats.avg_completed / courseStats.total_lessons) * 100))
                  : 0;
                return (
                  <Link
                    href="/trainings/english-progress"
                    className="reveal group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <span className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(1,81,150,0.10),transparent_70%)]" />
                    <div>
                      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-[var(--brand-blue)]">
                        <LiveDot />
                        🎓 {t("Англи хэлний курс", "English Course")}
                      </p>
                      <h3 className="mb-3 font-extrabold text-slate-900 group-hover:text-[var(--brand-red)]">
                        {t("Гишүүдийн явц бодит цагаар", "Live member progress")}
                      </h3>
                      <div className="flex items-center gap-4">
                        <CourseRing pct={pct} avgLabel={t("ДУНДАЖ", "AVG")} />
                        <div className="flex flex-1 flex-col gap-1.5 text-[12.5px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">👥 {t("Элссэн гишүүд", "Enrolled")}</span>
                            <span className="font-extrabold text-slate-900"><CountUp value={courseStats.enrolled_members} /></span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">📈 {t("Дундаж өдөр", "Avg. day")}</span>
                            <span className="font-extrabold text-slate-900">
                              {courseStats.avg_completed}/{courseStats.total_lessons}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">🏆 {t("Төгссөн", "Finished")}</span>
                            <span className="font-extrabold text-slate-900"><CountUp value={courseStats.completed_members} /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-lg bg-[var(--brand-blue)] px-3 py-2.5 text-[12.5px] font-bold text-white">
                      <span>{t("Дэлгэрэнгүй хүснэгт харах", "Full table")}</span>
                      <span>→</span>
                    </div>
                  </Link>
                );
              })()}
              {newsTiles.map((p) => {
                const thumb = p.image_urls[0] ?? firstYoutubeThumb(p.body);
                const isVideo = !p.image_urls[0] && !!thumb;
                return (
                <Link
                  key={p.id}
                  href="/news"
                  className="reveal group overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
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
        <h2 className="reveal mb-8 text-2xl font-bold text-slate-900">
          {t("Түншлэл ба мэдээ", "Partnership & News")}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {partner.map((item) => (
            <div
              key={item.id}
              className="reveal overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md"
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
          <h2 className="reveal mb-6 text-2xl font-bold text-slate-900">
            {t("Түргэн холбоос", "Quick Actions")}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {quickActions.map((action, idx) => {
              const className = `reveal group relative rounded-lg p-4 text-center text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
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
        <h2 className="reveal mb-6 text-2xl font-bold text-slate-900">
          {t("Гишүүдийн газрын зураг", "Member Map")}
        </h2>
        {/* Provinces with members colour in one after another, west to
            east, when the map scrolls into view (useMapFillIn). */}
        <div
          ref={mapRef}
          onClick={() => router.push("/map")}
          className={`reveal flex cursor-pointer justify-center rounded-2xl border border-slate-200 p-4 transition-shadow hover:shadow-md ${
            mapFill.filling ? "map-filling" : ""
          }`}
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
            cityColors={mapFill.colors}
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

// The green "live" dot on the stat cards, with a soft pulse around it.
function LiveDot() {
  return (
    <span className="relative flex h-1.5 w-1.5 shrink-0">
      <span className="absolute inset-0 rounded-full bg-green-500 opacity-75 motion-safe:animate-ping" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_0_3px_rgba(34,197,94,0.25)]" />
    </span>
  );
}

// A number counting up from 0 when it scrolls into view; shown straight
// away for visitors who ask for reduced motion.
function CountUp({ value }: { value: number }) {
  const [ref, seen] = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1200;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = duration ? Math.min(1, (now - start) / duration) : 1;
      setShown(Math.round(value * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [seen, value]);
  return <span ref={ref}>{shown}</span>;
}

// The English course's average-progress ring; it fills from empty and
// the percentage counts up when the card scrolls into view.
function CourseRing({ pct, avgLabel }: { pct: number; avgLabel: string }) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const r = 32;
  const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className="relative h-[76px] w-[76px] shrink-0">
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="#dbe9f5" strokeWidth="8" />
        <circle
          cx="38" cy="38" r={r} fill="none" stroke="var(--brand-blue)" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={seen ? c * (1 - pct / 100) : c}
          className="ring-fill"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <b className="text-[15px] leading-none text-slate-900"><CountUp value={pct} />%</b>
        <span className="text-[8.5px] font-bold text-slate-500">{avgLabel}</span>
      </div>
    </div>
  );
}

// The home page map's fill-in: once the map is in view, the provinces
// with members take their colour one after another from west to east,
// each lighting up in the map's hover pink for a moment first. While it
// runs the provinces fade between colours (.map-filling in globals.css);
// afterwards hovering is instant again. With reduced motion the map
// simply shows its colours once it's in view.
const FILL_FLASH = "#d98d92";
const FILL_TAIL_STEPS = 3; // let the last province finish fading

function useMapFillIn(colors: Record<string, string>, seen: boolean) {
  const order = useMemo(
    () => MAP_KEYS_WEST_TO_EAST.filter((k) => colors[k] && colors[k] !== countColor(0)),
    [colors]
  );
  const [step, setStep] = useState(0);
  const total = order.length + FILL_TAIL_STEPS;
  const done = step >= total;
  useEffect(() => {
    if (!seen || order.length === 0 || done) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const delay = reduce ? 0 : Math.max(120, Math.min(240, 2000 / order.length));
    const timer = setTimeout(() => setStep(reduce ? total : step + 1), delay);
    return () => clearTimeout(timer);
  }, [seen, order.length, done, step, total]);
  const shown = useMemo(() => {
    if (done) return colors;
    const partial: Record<string, string> = {};
    order.slice(0, step).forEach((k, i) => {
      partial[k] = i === step - 1 ? FILL_FLASH : colors[k];
    });
    return partial;
  }, [colors, order, step, done]);
  return { colors: shown, filling: seen && order.length > 0 && !done };
}
