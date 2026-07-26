"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { MAP_KEY_TO_MN, MN_TO_MAP_KEY, countColor } from "@/lib/map-provinces";
import { PROVINCES } from "@/lib/provinces";

const Mongolia = dynamic(() => import("@react-map/mongolia"), { ssr: false });

type FacilityStat = { province: string | null; workplace: string; member_count: number };
type FacilityMember = {
  member_id: string; first_name: string; last_name: string;
  position: string | null; membership: string;
  email: string | null; phone: string | null;
};

const MN_TO_EN: Record<string, string> = Object.fromEntries(
  PROVINCES.map((p) => [p.mn, p.en])
);

type Tooltip = { x: number; y: number; mn: string; en: string; count: number };

export default function MapPage() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<FacilityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [directoryUnlocked, setDirectoryUnlocked] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [members, setMembers] = useState<Record<string, FacilityMember[]>>({});
  const [mapSize, setMapSize] = useState(760);
  const [tip, setTip] = useState<Tooltip | null>(null);

  const provinceLabel = (mn: string) =>
    lang === "mn" ? mn : MN_TO_EN[mn] ?? mn;

  // Fetch stats + session once on mount.
   
  useEffect(() => {
    (async () => {
      const [{ data }, { data: { session } }] = await Promise.all([
        supabase.rpc("facility_stats"),
        supabase.auth.getSession(),
      ]);
      setStats((data as FacilityStat[]) ?? []);
      setLoggedIn(!!session);
      // The directory (facility_members) only opens up once an admin has
      // approved the account (status = 'active') — see
      // migration15_directory_approval_gate.sql. New signups start
      // 'pending' and see a waiting message instead, on both this page
      // and (enforced for real) in the RPC itself.
      if (session) {
        const { data: me } = await supabase
          .from("members")
          .select("status, is_admin")
          .eq("id", session.user.id)
          .single();
        setDirectoryUnlocked(!!me && (me.status === "active" || me.is_admin));
      }
      setLoading(false);
    })();
    const update = () => setMapSize(Math.min(760, window.innerWidth - 48));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const byProvince = useMemo(() => {
    const m = new Map<string, FacilityStat[]>();
    for (const s of stats) {
      const key = s.province ?? "__unknown__";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(s);
    }
    for (const list of m.values()) list.sort((a, b) => b.member_count - a.member_count);
    return m;
  }, [stats]);

  const provinceCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of stats) {
      if (!s.province) continue;
      m.set(s.province, (m.get(s.province) ?? 0) + Number(s.member_count));
    }
    return m;
  }, [stats]);

  const cityColors = useMemo(() => {
    const colors: Record<string, string> = {};
    for (const [mapKey, mn] of Object.entries(MAP_KEY_TO_MN)) {
      colors[mapKey] = countColor(provinceCounts.get(mn) ?? 0);
    }
    if (selectedProvince && MN_TO_MAP_KEY[selectedProvince]) {
      colors[MN_TO_MAP_KEY[selectedProvince]] = "#c42730";
    }
    return colors;
  }, [provinceCounts, selectedProvince]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return stats
      .filter((s) => s.workplace.toLowerCase().includes(q))
      .sort((a, b) => b.member_count - a.member_count)
      .slice(0, 20);
  }, [search, stats]);

  const shownFacilities: FacilityStat[] = search.trim()
    ? searchResults
    : selectedProvince
      ? byProvince.get(selectedProvince) ?? []
      : [];

  async function toggleFacility(workplace: string) {
    if (expanded === workplace) { setExpanded(null); return; }
    setExpanded(workplace);
    if (!directoryUnlocked || members[workplace]) return;
    const { data } = await supabase.rpc("facility_members", { p_workplace: workplace });
    setMembers((m) => ({ ...m, [workplace]: (data as FacilityMember[]) ?? [] }));
  }

  const totalMembers = stats.reduce((a, s) => a + Number(s.member_count), 0);
  const totalFacilities = stats.length;
  const unknownList = byProvince.get("__unknown__") ?? [];

  // Custom bilingual tooltip: the SVG paths carry ids like "<code>-<n>",
  // so hover resolves the province and we render our own label.
  function handleMapMove(e: React.MouseEvent) {
    const path = (e.target as Element).closest?.("path");
    if (!path?.id) { setTip(null); return; }
    const key = Object.keys(MAP_KEY_TO_MN).find((k) => path.id.startsWith(k + "-"));
    if (!key) { setTip(null); return; }
    const mn = MAP_KEY_TO_MN[key];
    setTip({
      x: e.clientX,
      y: e.clientY,
      mn,
      en: MN_TO_EN[mn] ?? key,
      count: provinceCounts.get(mn) ?? 0,
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Гишүүд", "Members")}
        title={t("Гишүүдийн газрын зураг", "Member Map")}
        subtitle={`${totalMembers} ${t("гишүүн", "members")} · ${totalFacilities} ${t("эмнэлэг, байгууллага", "facilities")} · ${provinceCounts.size} ${t("аймаг/хот", "provinces")}`}
      />

      <div className="container-page grid gap-8 py-10 lg:grid-cols-5">
        {/* Map */}
        <div className="lg:col-span-3">
          <div
            className="overflow-x-auto rounded-2xl border border-slate-200 p-4"
            onMouseMove={handleMapMove}
            onMouseLeave={() => setTip(null)}
          >
            {loading ? (
              <div className="flex h-72 items-center justify-center text-slate-400">
                {t("Ачааллаж байна...", "Loading...")}
              </div>
            ) : (
              <Mongolia
                type="select-single"
                size={mapSize}
                mapColor="#EDF1F6"
                strokeColor="#ffffff"
                strokeWidth={1}
                hoverColor="#d98d92"
                selectColor="#c42730"
                hints={false}
                cityColors={cityColors}
                onSelect={(state) => {
                  setSearch("");
                  setExpanded(null);
                  setSelectedProvince(state ? MAP_KEY_TO_MN[state] ?? null : null);
                }}
              />
            )}
          </div>
          {tip && (
            <div
              className="pointer-events-none fixed z-50 rounded-md bg-[#0f2f4f] px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
              style={{ left: tip.x + 14, top: tip.y + 14 }}
            >
              {lang === "mn" ? tip.mn : tip.en}
              <span className="ml-1.5 font-normal opacity-75">
                · {tip.count} {t("гишүүн", "members")}
              </span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-semibold">{t("Гишүүдийн тоо:", "Members:")}</span>
            {[["0", "#EDF1F6"], ["1–2", "#BBD2E8"], ["3–5", "#7AA6CE"], ["6–10", "#3E7BB0"], ["10+", "#015196"]].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="inline-block h-3.5 w-3.5 rounded-sm border border-slate-200" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:col-span-2">
          <input
            placeholder={t("Эмнэлэг, байгууллага хайх...", "Search facilities...")}
            className="mb-4 w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setExpanded(null); }}
          />

          {!search.trim() && !selectedProvince && (
            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              {t(
                "Газрын зургаас аймаг/хот сонгох эсвэл дээрх талбараар хайна уу.",
                "Click a province on the map, or search above."
              )}
            </p>
          )}

          {selectedProvince && !search.trim() && (
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {provinceLabel(selectedProvince)}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  {provinceCounts.get(selectedProvince) ?? 0} {t("гишүүн", "members")}
                </span>
              </h2>
              <button
                onClick={() => setSelectedProvince(null)}
                className="text-xs font-semibold text-slate-400 hover:text-[var(--brand-red)]"
              >
                {t("Цэвэрлэх ✕", "Clear ✕")}
              </button>
            </div>
          )}

          <div className="space-y-2">
            {shownFacilities.map((f) => (
              <div key={f.workplace} className="rounded-xl border border-slate-200">
                <button
                  onClick={() => toggleFacility(f.workplace)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">{f.workplace}</span>
                    {search.trim() && f.province && (
                      <span className="text-xs text-slate-400">{provinceLabel(f.province)}</span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[var(--brand-blue)]">
                    {f.member_count}
                  </span>
                </button>
                {expanded === f.workplace && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    {!loggedIn ? (
                      <p className="text-xs text-slate-500">
                        {t("Гишүүдийн нэрсийг харахын тулд", "To see the members here,")}{" "}
                        <Link href="/login" className="font-semibold text-[var(--brand-blue)] underline">
                          {t("нэвтэрнэ үү", "log in")}
                        </Link>
                        .
                      </p>
                    ) : !directoryUnlocked ? (
                      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        ⏳ {t(
                          "Таны бүртгэл админ баталгаажуулахыг хүлээж байна. Баталгаажсны дараа гишүүдийн мэдээллийг эндээс харах боломжтой болно.",
                          "Your account is waiting for admin approval. Once approved, you'll be able to see member details here."
                        )}
                      </p>
                    ) : !members[f.workplace] ? (
                      <p className="text-xs text-slate-400">{t("Ачааллаж байна...", "Loading...")}</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {members[f.workplace].map((m) => (
                          <li key={m.member_id} className="text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate">
                                <span className="font-mono text-xs font-semibold text-[var(--brand-blue)]">{m.member_id}</span>{" "}
                                {m.first_name} {m.last_name}
                                {m.position && <span className="text-xs text-slate-400"> · {m.position}</span>}
                              </span>
                              {m.membership === "professional" && (
                                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-[var(--brand-blue)]">
                                  {t("Мэргэжлийн", "Pro")}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs text-slate-500">
                              {m.phone && (
                                <a href={`tel:+976${m.phone}`} className="hover:text-[var(--brand-red)]">
                                  ✆ {m.phone}
                                </a>
                              )}
                              {m.email && (
                                <a href={`mailto:${m.email}`} className="truncate hover:text-[var(--brand-red)]">
                                  ✉ {m.email}
                                </a>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!search.trim() && !selectedProvince && unknownList.length > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold text-slate-400">
                {t("Аймаг тодорхойгүй байгууллагууд", "Facilities without a province")} ({unknownList.length})
              </summary>
              <div className="mt-2 space-y-2">
                {unknownList.map((f) => (
                  <div key={f.workplace} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span className="truncate">{f.workplace}</span>
                    <span className="ml-2 shrink-0 text-xs font-bold text-slate-400">{f.member_count}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
