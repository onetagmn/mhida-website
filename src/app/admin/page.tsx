"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  member_id: string;
  first_name: string;
  last_name: string;
  membership: string;
  workplace: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
};

export default function AdminPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login/"); return; }
    const { data: me } = await supabase
      .from("members").select("is_admin").eq("id", session.user.id).single();
    if (!me?.is_admin) { setDenied(true); setLoading(false); return; }
    const { data } = await supabase
      .from("members")
      .select("id, member_id, first_name, last_name, membership, workplace, province, phone, email")
      .order("member_id");
    setRows(data ?? []);
    setLoading(false);
  }, [router]);

  // Standard fetch-on-mount: state updates happen after async awaits,
  // not synchronously in the effect body.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function toggleMembership(row: Row) {
    const next = row.membership === "professional" ? "regular" : "professional";
    setSaving(row.id);
    const { error } = await supabase
      .from("members").update({ membership: next }).eq("id", row.id);
    if (!error) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, membership: next } : r)));
    } else {
      alert(t("Алдаа: ", "Error: ") + error.message);
    }
    setSaving(null);
  }

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.member_id, r.first_name, r.last_name, r.workplace, r.phone, r.email]
      .some((v) => v && String(v).toLowerCase().includes(q));
  });

  if (loading) {
    return (
      <div className="container-page flex h-64 items-center justify-center text-slate-400">
        {t("Ачааллаж байна...", "Loading...")}
      </div>
    );
  }

  if (denied) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-lg font-bold text-slate-700">
          {t("Хандах эрхгүй байна.", "You don't have access to this page.")}
        </p>
      </div>
    );
  }

  const nPro = rows.filter((r) => r.membership === "professional").length;

  return (
    <div>
      <PageHeader
        eyebrow={t("Админ", "Admin")}
        title={t("Гишүүдийн удирдлага", "Member Management")}
        subtitle={`${rows.length} ${t("гишүүн", "members")} · ${nPro} ${t("мэргэжлийн", "professional")} · ${rows.length - nPro} ${t("энгийн", "regular")}`}
      />

      <div className="container-page py-10">
        <input
          placeholder={t("Хайх: нэр, дугаар, эмнэлэг, утас...", "Search: name, ID, hospital, phone...")}
          className="mb-6 w-full max-w-md rounded-md border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">{t("Овог", "Last name")}</th>
                <th className="px-4 py-3">{t("Нэр", "First name")}</th>
                <th className="px-4 py-3">{t("Ажлын газар", "Workplace")}</th>
                <th className="px-4 py-3">{t("Утас", "Phone")}</th>
                <th className="px-4 py-3">{t("Гишүүнчлэл", "Membership")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono font-semibold text-[var(--brand-blue)]">{r.member_id}</td>
                  <td className="px-4 py-2.5">{r.last_name}</td>
                  <td className="px-4 py-2.5">{r.first_name}</td>
                  <td className="max-w-[280px] truncate px-4 py-2.5 text-slate-600">{r.workplace}</td>
                  <td className="px-4 py-2.5 text-slate-600">{r.phone}</td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => toggleMembership(r)}
                      disabled={saving === r.id}
                      title={t("Дарж солино", "Click to toggle")}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40 ${
                        r.membership === "professional"
                          ? "bg-blue-100 text-[var(--brand-blue)]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {r.membership === "professional" ? t("Мэргэжлийн", "Professional") : t("Энгийн", "Regular")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {t(
            "Гишүүнчлэлийн багана дээр дарж Энгийн ↔ Мэргэжлийн хооронд шилжүүлнэ.",
            "Click a membership badge to toggle between Regular ↔ Professional."
          )}
        </p>
      </div>
    </div>
  );
}
