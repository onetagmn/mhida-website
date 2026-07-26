"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  birth_date: string | null;
  gender: string | null;
  position: string | null;
  upgrade_requested: boolean;
  status: "active" | "pending" | "suspended";
};

type TierFilter = "all" | "regular" | "professional";
type StatusFilter = "all" | "pending" | "active" | "suspended";

export default function AdminPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [saving, setSaving] = useState<string | null>(null);
  const [toolMsg, setToolMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login/"); return; }
    const { data: me } = await supabase
      .from("members").select("is_admin").eq("id", session.user.id).single();
    if (!me?.is_admin) { setDenied(true); setLoading(false); return; }
    const { data } = await supabase
      .from("members")
      .select("id, member_id, first_name, last_name, membership, workplace, province, phone, email, birth_date, gender, position, upgrade_requested, status")
      .order("member_id");
    setRows(data ?? []);
    setLoading(false);
  }, [router]);

  // Standard fetch-on-mount: state updates happen after async awaits.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function toggleMembership(row: Row) {
    const next = row.membership === "professional" ? "regular" : "professional";
    setSaving(row.id);
    // Confirming a tier change also clears any pending upgrade request.
    const { error } = await supabase
      .from("members")
      .update({ membership: next, upgrade_requested: false })
      .eq("id", row.id);
    if (!error) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, membership: next, upgrade_requested: false } : r)));
    } else {
      alert(t("Алдаа: ", "Error: ") + error.message);
    }
    setSaving(null);
  }

  // Only "active" members can see the member directory (facility_members
  // lookup on the Map page) — enforced server-side too, this is just the
  // admin control for it. See migration15_directory_approval_gate.sql.
  // Freely shiftable both ways: click any of the three pills to set that
  // member's status directly (e.g. re-open access after suspending someone,
  // or pull it back if you approved by mistake).
  async function setMemberStatus(row: Row, status: Row["status"]) {
    if (row.status === status) return;
    setSaving(row.id);
    const { error } = await supabase
      .from("members")
      .update({ status })
      .eq("id", row.id);
    if (!error) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, status } : r)));
    } else {
      alert(t("Алдаа: ", "Error: ") + error.message);
    }
    setSaving(null);
  }

  async function deleteMember(row: Row) {
    const sure = window.confirm(
      t(
        `${row.member_id} ${row.first_name} ${row.last_name}-г БҮРМӨСӨН устгах уу? Нэвтрэх эрх, бүх мэдээлэл устана.`,
        `PERMANENTLY delete ${row.member_id} ${row.first_name} ${row.last_name}? Their login and all data will be removed.`
      )
    );
    if (!sure) return;
    setSaving(row.id);
    const { error } = await supabase.rpc("admin_delete_member", { target_id: row.id });
    if (!error) {
      setRows((rs) => rs.filter((r) => r.id !== row.id));
    } else {
      alert(t("Алдаа: ", "Error: ") + error.message);
    }
    setSaving(null);
  }

  const filtered = rows.filter((r) => {
    if (tier !== "all" && r.membership !== tier) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [r.member_id, r.first_name, r.last_name, r.workplace, r.phone, r.email]
      .some((v) => v && String(v).toLowerCase().includes(q));
  });

  function exportGoogleContacts() {
    const header = [
      "Name", "Given Name", "Family Name", "Birthday", "Gender",
      "E-mail 1 - Type", "E-mail 1 - Value", "Phone 1 - Type", "Phone 1 - Value",
      "Organization 1 - Type", "Organization 1 - Name", "Organization 1 - Title", "Notes",
    ];
    const q = (v: string | null | undefined) =>
      `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [header.join(",")];
    for (const r of filtered) {
      lines.push([
        q(`${r.first_name} ${r.last_name}`.trim()),
        q(r.first_name), q(r.last_name), q(r.birth_date), q(r.gender),
        q("Work"), q(r.email), q("Mobile"), q(r.phone),
        q("Work"), q(r.workplace), q(r.position),
        q(`MHIDA ${r.member_id} · ${r.membership === "professional" ? "Мэргэжлийн" : "Энгийн"}`),
      ].join(","));
    }
    // BOM so Cyrillic opens correctly everywhere
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mhida-contacts-${tier}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToolMsg(t(
      `${filtered.length} гишүүн CSV болгон татагдлаа. Google Contacts → Import хийнэ үү.`,
      `${filtered.length} members exported. In Google Contacts choose Import.`
    ));
  }

  async function copyEmails() {
    const emails = filtered.map((r) => r.email).filter(Boolean).join(", ");
    await navigator.clipboard.writeText(emails);
    setToolMsg(t(
      `${filtered.filter((r) => r.email).length} и-мэйл хууллаа — Gmail-ийн BCC талбарт буулгана уу.`,
      `${filtered.filter((r) => r.email).length} emails copied — paste into Gmail's BCC field.`
    ));
  }

  function openGmail() {
    const emails = filtered.map((r) => r.email).filter(Boolean).join(",");
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails)}`, "_blank");
  }

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
  const nPending = rows.filter((r) => r.status === "pending").length;

  return (
    <div>
      <PageHeader
        eyebrow={t("Админ", "Admin")}
        title={t("Гишүүдийн удирдлага", "Member Management")}
        subtitle={`${rows.length} ${t("гишүүн", "members")} · ${nPro} ${t("мэргэжлийн", "professional")} · ${rows.length - nPro} ${t("энгийн", "regular")}${nPending > 0 ? ` · ${nPending} ${t("баталгаажаагүй ⏳", "awaiting approval ⏳")}` : ""}`}
      />

      <div className="container-page py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/admin/news"
            className="inline-block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
          >
            {t("Мэдээ нийтлэх →", "News →")}
          </Link>
          <Link
            href="/admin/content"
            className="inline-block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
          >
            {t("Хуудасны агуулга (AXIS, e-Health, курс, хууль) →", "Page Content →")}
          </Link>
          <Link
            href="/admin/leadership"
            className="inline-block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
          >
            {t("Удирдлага →", "Leadership →")}
          </Link>
          <Link
            href="/admin/links"
            className="inline-block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
          >
            {t("Лого холбоос →", "Logo Links →")}
          </Link>
          <Link
            href="/admin/training-applications"
            className="inline-block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
          >
            {t("Сургалтын өргөдлүүд →", "Training Applications →")}
          </Link>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            placeholder={t("Хайх: нэр, дугаар, эмнэлэг, утас...", "Search: name, ID, hospital, phone...")}
            className="w-full max-w-xs rounded-md border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as TierFilter)}
            className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
          >
            <option value="all">{t("Бүх гишүүд", "All members")}</option>
            <option value="regular">{t("Зөвхөн Энгийн", "Regular only")}</option>
            <option value="professional">{t("Зөвхөн Мэргэжлийн", "Professional only")}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)]"
          >
            <option value="all">{t("Бүх төлөв", "All statuses")}</option>
            <option value="pending">{t("Баталгаажаагүй ⏳", "Awaiting approval ⏳")}</option>
            <option value="active">{t("Идэвхтэй", "Active")}</option>
            <option value="suspended">{t("Түдгэлзсэн", "Suspended")}</option>
          </select>
          <span className="text-sm text-slate-500">
            {filtered.length} {t("харагдаж байна", "shown")}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={exportGoogleContacts}
            className="rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t("Google Contacts татах (CSV)", "Export Google Contacts (CSV)")}
          </button>
          <button
            onClick={copyEmails}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
          >
            {t("И-мэйлүүд хуулах", "Copy emails")}
          </button>
          <button
            onClick={openGmail}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
          >
            {t("Gmail нээх (BCC)", "Open Gmail (BCC)")}
          </button>
        </div>
        {toolMsg && (
          <p className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-slate-700">{toolMsg}</p>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[1180px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">{t("Овог", "Last name")}</th>
                <th className="px-4 py-3">{t("Нэр", "First name")}</th>
                <th className="px-4 py-3">{t("Ажлын газар", "Workplace")}</th>
                <th className="px-4 py-3">{t("Утас", "Phone")}</th>
                <th className="px-4 py-3">{t("Гишүүнчлэл", "Membership")}</th>
                <th className="px-4 py-3">{t("Каталогийн эрх", "Directory access")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono font-semibold text-[var(--brand-blue)]">{r.member_id}</td>
                  <td className="px-4 py-2.5">{r.last_name}</td>
                  <td className="px-4 py-2.5">{r.first_name}</td>
                  <td className="max-w-[260px] truncate px-4 py-2.5 text-slate-600">{r.workplace}</td>
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
                    {r.upgrade_requested && (
                      <span
                        className="ml-1.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700"
                        title={t("Төлбөр шилжүүлснээ мэдэгдсэн — банкаа шалгаад баталгаажуулна уу", "Reported payment sent — verify in your bank, then toggle")}
                      >
                        💰 {t("Төлсөн", "Paid")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {(
                        [
                          ["pending", "⏳", t("Хүлээгдэж буй", "Pending"), "bg-amber-100 text-amber-700"],
                          ["active", "✓", t("Идэвхтэй", "Active"), "bg-green-100 text-green-700"],
                          ["suspended", "✕", t("Түдгэлзсэн", "Suspended"), "bg-red-100 text-red-700"],
                        ] as const
                      ).map(([s, icon, label, activeClass]) => (
                        <button
                          key={s}
                          onClick={() => setMemberStatus(r, s)}
                          disabled={saving === r.id}
                          title={t(
                            "Зөвхөн Идэвхтэй төлөвтэй гишүүн Газрын зураг хуудсан дээрх бусад гишүүдийн мэдээллийг харах боломжтой",
                            "Only Active members can see other members' details on the Map page"
                          )}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-opacity hover:opacity-80 disabled:opacity-40 ${
                            r.status === s ? activeClass : "bg-slate-50 text-slate-400"
                          }`}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => deleteMember(r)}
                      disabled={saving === r.id}
                      title={t("Устгах", "Delete")}
                      className="rounded-md px-2.5 py-1 text-xs font-bold text-slate-300 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {t(
            "Гишүүнчлэл дээр дарж солино · ⏳ Батлах товч дарснаар Газрын зургийн каталогийг харах эрх нээгдэнэ · ✕ дарж гишүүнийг бүрмөсөн устгана · Татах/хуулах товчнууд зөвхөн шүүгдсэн гишүүдэд үйлчилнэ.",
            "Click a membership badge to toggle · ⏳ Approve unlocks the Map page directory for that member · ✕ permanently deletes a member · Export/copy buttons act on the filtered list only."
          )}
        </p>
      </div>
    </div>
  );
}
