"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

type PartnerLink = {
  id: string;
  name: string;
  logo_url: string;
  url: string;
  sort_order: number;
};

export default function AdminLinksPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [links, setLinks] = useState<PartnerLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState("100");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login/"); return; }
    const { data: me } = await supabase
      .from("members").select("is_admin").eq("id", session.user.id).single();
    if (!me?.is_admin) { setDenied(true); setLoading(false); return; }
    const { data } = await supabase
      .from("partner_links")
      .select("id, name, logo_url, url, sort_order")
      .order("sort_order");
    setLinks(data ?? []);
    setLoading(false);
  }, [router]);

  // Standard fetch-on-mount: state updates happen after async awaits.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  function resetEditor() {
    setEditingId(null); setName(""); setUrl(""); setLogo(null); setSortOrder("100"); setMsg(null);
  }

  function startEdit(l: PartnerLink) {
    setEditingId(l.id); setName(l.name); setUrl(l.url);
    setLogo(l.logo_url); setSortOrder(String(l.sort_order)); setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `links/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("news-photos").upload(path, file, {
      cacheControl: "31536000",
      contentType: file.type,
    });
    if (error) {
      setMsg(t("Зураг алдаа: ", "Image error: ") + error.message);
    } else {
      const { data } = supabase.storage.from("news-photos").getPublicUrl(path);
      setLogo(data.publicUrl);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !logo || !url.trim()) {
      setMsg(t("Нэр, лого, линк гурвуулаа шаардлагатай.", "Name, logo, and link are all required."));
      return;
    }
    const cleanUrl = /^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    setSaving(true); setMsg(null);
    const payload = { name: name.trim(), url: cleanUrl, logo_url: logo, sort_order: parseInt(sortOrder) || 100 };
    const { error } = editingId
      ? await supabase.from("partner_links").update(payload).eq("id", editingId)
      : await supabase.from("partner_links").insert(payload);
    setSaving(false);
    if (error) { setMsg(t("Алдаа: ", "Error: ") + error.message); return; }
    resetEditor();
    await load();
    setMsg(t("Хадгалагдлаа!", "Saved!"));
  }

  async function remove(l: PartnerLink) {
    if (!window.confirm(t(`${l.name}-г устгах уу?`, `Delete ${l.name}?`))) return;
    const { error } = await supabase.from("partner_links").delete().eq("id", l.id);
    if (!error) setLinks((xs) => xs.filter((x) => x.id !== l.id));
  }

  if (loading) return <div className="container-page flex h-64 items-center justify-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</div>;
  if (denied) return (
    <div className="container-page py-24 text-center">
      <p className="text-lg font-bold text-slate-700">{t("Хандах эрхгүй байна.", "You don't have access to this page.")}</p>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow={t("Админ", "Admin")}
        title={t("Лого холбоосууд", "Logo Links")}
        subtitle={t(
          "Нүүр хуудасны доод хэсэгт харагдах лого-нууд: Facebook хуудас, түншүүдийн вэбсайт г.м. Лого дээр дарахад линк нээгдэнэ.",
          "Logos shown at the bottom of the homepage: your Facebook page, partner websites, etc. Clicking a logo opens its link."
        )}
      />

      <div className="container-page pt-6">
        <Link href="/admin" className="inline-block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50">
          {t("← Гишүүдийн удирдлага", "← Member Management")}
        </Link>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
        <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? t("Засах", "Edit") : t("Шинэ холбоос", "New Link")}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Нэр", "Name")} *</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("ж: MHIDA Facebook, TIHTC...", "e.g. MHIDA Facebook, TIHTC...")} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Линк (URL)", "Link (URL)")} *</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Лого зураг", "Logo image")} *</label>
            <input type="file" accept="image/*" onChange={uploadLogo} className="block w-full text-sm" />
            {uploading && <p className="mt-1 text-xs text-slate-500">{t("Илгээж байна...", "Uploading...")}</p>}
            {logo && (
              <div className="relative mt-2 inline-block rounded-md border border-slate-200 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" className="h-14 w-auto max-w-[160px] object-contain" />
                <button type="button" onClick={() => setLogo(null)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">✕</button>
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Дараалал", "Order")}</label>
            <input inputMode="numeric" className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]" value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^\d]/g, ""))} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving || uploading} className="rounded-md bg-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? t("Хадгалж байна...", "Saving...") : editingId ? t("Хадгалах", "Save") : t("Нэмэх", "Add")}
            </button>
            {editingId && (
              <button type="button" onClick={resetEditor} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600">{t("Болих", "Cancel")}</button>
            )}
          </div>
          {msg && <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-slate-700">{msg}</p>}
        </form>

        <div className="space-y-3">
          {links.map((l) => (
            <div key={l.id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.logo_url} alt="" className="h-10 w-16 shrink-0 object-contain" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{l.name}</p>
                <p className="truncate text-xs text-slate-400">{l.url}</p>
              </div>
              <div className="flex shrink-0 gap-1.5 text-xs font-semibold">
                <button onClick={() => startEdit(l)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]">{t("Засах", "Edit")}</button>
                <button onClick={() => remove(l)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-red-400 hover:text-red-600">✕</button>
              </div>
            </div>
          ))}
          {links.length === 0 && <p className="text-sm text-slate-400">{t("Холбоос нэмээгүй байна.", "No links added yet.")}</p>}
        </div>
      </div>
    </div>
  );
}
