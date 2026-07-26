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

export default function EnglishProgressPage() {
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setLoggedIn(!!session);
      if (session) {
        const { data } = await supabase.rpc("course_progress_table");
        setRows((data as Row[]) ?? []);
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

  const totalLessons = rows[0]?.total_lessons ?? 30;

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
            <input
              placeholder={t("MD дугаар эсвэл нэрээр хайх...", "Search by MD number or name...")}
              className="mb-4 w-full max-w-sm rounded-md border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)] sm:w-auto"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                    return (
                      <tr key={r.member_code} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-[var(--brand-blue)]">
                          {r.member_code}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {r.first_name} {r.last_name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${pct === 100 ? "bg-green-500" : "bg-[var(--brand-blue)]"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-slate-500">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {r.completed_count}/{r.total_lessons}
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
