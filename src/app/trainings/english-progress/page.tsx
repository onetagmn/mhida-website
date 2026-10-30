"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

type Row = {
  member_code: string;
  first_name: string;
  last_name: string;
  completed_count: number;
  total_lessons: number;
  last_completed_at: string | null;
};

type CourseStats = {
  total_lessons: number;
  enrolled_members: number;
  completed_members: number;
  avg_completed: number;
};

const AVATAR_COLORS = ["#015196", "#c42730", "#0f766e", "#7c3aed", "#ea580c", "#0369a1", "#65a30d", "#b45309"];
const MEDALS = ["🥇", "🥈", "🥉"];

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?";
}

export default function EnglishProgressPage() {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      if (session) {
        const [tableRes, statsRes] = await Promise.all([
          supabase.rpc("course_progress_table"),
          supabase.rpc("course_progress_stats").maybeSingle(),
        ]);
        setRows((tableRes.data as Row[]) ?? []);
        setStats((statsRes.data as CourseStats) ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.member_code.toLowerCase().includes(q) ||
        r.first_name.toLowerCase().includes(q) ||
        r.last_name.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const totalLessons = stats?.total_lessons ?? rows[0]?.total_lessons ?? 30;

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title={t("Англи хэлний курсын явц", "English Course Progress")}
        subtitle={t(
          "Курс эхэлсэн гишүүдийн 30 өдрийн явц, бодит цагийн жагсаалт.",
          "Real-time progress of members who have started the 30-day course."
        )}
      />

      <div className="container-page py-10">
        {loading ? (
          <p className="text-sm text-slate-400">{t("Ачааллаж байна...", "Loading...")}</p>
        ) : !loggedIn ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
            {t("Дэлгэрэнгүй хүснэгтийг харахын тулд", "To see the detailed table,")}{" "}
            <Link href="/login" className="font-semibold underline">
              {t("нэвтэрнэ үү", "log in")}
            </Link>
            .
          </div>
        ) : (
          <>
            {stats && (
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">👥</span>
                  <div>
                    <b className="block text-xl font-extrabold text-slate-900">{stats.enrolled_members}</b>
                    <span className="text-[11.5px] font-semibold text-slate-500">{t("Элссэн гишүүд", "Enrolled")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">📈</span>
                  <div>
                    <b className="block text-xl font-extrabold text-slate-900">
                      {stats.avg_completed}/{stats.total_lessons}
                    </b>
                    <span className="text-[11.5px] font-semibold text-slate-500">{t("Дундаж өдөр", "Avg. day")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-xl">🏆</span>
                  <div>
                    <b className="block text-xl font-extrabold text-slate-900">{stats.completed_members}</b>
                    <span className="text-[11.5px] font-semibold text-slate-500">{t("Курс төгссөн", "Finished")}</span>
                  </div>
                </div>
              </div>
            )}

            <input
              placeholder={t("MD дугаар эсвэл нэрээр хайх...", "Search by MD number or name...")}
              className="mb-4 w-full max-w-sm rounded-md border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)] sm:w-auto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-slate-50 text-left text-[10.5px] font-extrabold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t("№", "#")}</th>
                    <th className="px-4 py-3">MD</th>
                    <th className="px-4 py-3">{t("Нэр", "Name")}</th>
                    <th className="px-4 py-3">{t("Явц", "Progress")}</th>
                    <th className="px-4 py-3">{t("Өдөр", "Day")}</th>
                    <th className="px-4 py-3">{t("Сүүлд идэвхтэй байсан", "Last active")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((r, i) => {
                    const pct = r.total_lessons > 0 ? Math.round((r.completed_count / r.total_lessons) * 100) : 0;
                    const done = pct === 100;
                    const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                    return (
                      <tr key={r.member_code} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-extrabold text-slate-400">
                          {i < 3 ? <span className="text-base">{MEDALS[i]}</span> : i + 1}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--brand-blue)]">
                          {r.member_code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                              style={{ background: color }}
                            >
                              {initials(r.first_name, r.last_name)}
                            </span>
                            <span className="font-medium text-slate-800">
                              {r.first_name} {r.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-[7px] w-32 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${done ? "bg-green-500" : "bg-[var(--brand-blue)]"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-500">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {r.completed_count}/{r.total_lessons}
                          {done && (
                            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-extrabold text-green-700">
                              {t("Төгссөн", "Finished")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-400">
                          {r.last_completed_at
                            ? new Date(r.last_completed_at).toLocaleDateString(lang === "mn" ? "mn-MN" : "en-US")
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        {rows.length === 0
                          ? t("Хараахан хэн ч курс эхлээгүй байна.", "No one has started the course yet.")
                          : t("Илэрц олдсонгүй.", "No results.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {t(`Нийт ${totalLessons} өдрийн курс.`, `Course totals ${totalLessons} days.`)}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
