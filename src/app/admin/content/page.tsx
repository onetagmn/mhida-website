"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { pdfName } from "@/lib/news";
import type { ContentItem } from "@/components/ContentSection";

type Section = "axis" | "ehealth" | "english" | "legal";

const SECTIONS: { value: Section; mn: string; en: string }[] = [
  { value: "axis", mn: "AXIS Карт сургалт", en: "AXIS Card training" },
  { value: "ehealth", mn: "e-Health сургалт", en: "e-Health training" },
  { value: "english", mn: "Англи хэлний курс", en: "English course" },
  { value: "legal", mn: "Хууль эрх зүй", en: "Legal acts" },
];

export default function AdminContentPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [section, setSection] = useState<Section>("axis");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pdfs, setPdfs] = useState<string[]>([]);
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
      .from("content_items")
      .select("id, section, title, body, pdf_urls, sort_order, published, created_at")
      .order("sort_order")
      .order("created_at");
    setItems(data ?? []);
    setLoading(false);
  }, [router]);

  // Standard fetch-on-mount.
  // Standard fetch-on-mount: state updates happen after async awaits.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  function resetEditor() {
    setEditingId(null); setTitle(""); setBody(""); setPdfs([]); setSortOrder("100"); setMsg(null);
  }

  function startEdit(it: ContentItem) {
    setEditingId(it.id); setTitle(it.title); setBody(it.body);
    setPdfs(it.pdf_urls ?? []); setSortOrder(String(it.sort_order));
    setSection(it.section as Section);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadPdfs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true); setMsg(null);
    for (const file of files) {
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `content/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("news-photos").upload(path, file, {
        cacheControl: "31536000",
        contentType: "application/pdf",
      });
      if (error) { setMsg(t("PDF алдаа: ", "PDF error: ") + error.message); continue; }
      const { data } = supabase.storage.from("news-photos").getPublicUrl(path);
      setPdfs((prev) => [...prev, data.publicUrl]);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setMsg(t("Гарчиг оруулна уу.", "Please enter a title.")); return; }
    setSaving(true); setMsg(null);
    const payload = {
      section,
      title: title.trim(),
      body: body.trim(),
      pdf_urls: pdfs,
      sort_order: parseInt(sortOrder) || 100,
    };
    const { error } = editingId
      ? await supabase.from("content_items").update(payload).eq("id", editingId)
      : await supabase.from("content_items").insert(payload);
    setSaving(false);
    if (error) { setMsg(t("Алдаа: ", "Error: ") + error.message); return; }
    resetEditor();
    await load();
    setMsg(t("Хадгалагдлаа!", "Saved!"));
  }

  async function togglePublish(it: ContentItem) {
    const { error } = await supabase
      .from("content_items").update({ published: !it.published }).eq("id", it.id);
    if (!error) setItems((xs) => xs.map((x) => x.id === it.id ? { ...x, published: !it.published } : x));
  }

  async function remove(it: ContentItem) {
    if (!window.confirm(t(`«${it.title}» устгах уу?`, `Delete "${it.title}"?`))) return;
    const { error } = await supabase.from("content_items").delete().eq("id", it.id);
    if (!error) setItems((xs) => xs.filter((x) => x.id !== it.id));
  }

  if (loading) return <div className="container-page flex h-64 items-center justify-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</div>;
  if (denied) return (
    <div className="container-page py-24 text-center">
      <p className="text-lg font-bold text-slate-700">{t("Хандах эрхгүй байна.", "You don't have access to this page.")}</p>
    </div>
  );

  const sectionItems = items.filter((i) => i.section === section);

  return (
    <div>
      <PageHeader
        eyebrow={t("Админ", "Admin")}
        title={t("Хуудасны агуулга", "Page Content")}
        subtitle={t(
          "AXIS, e-Health сургалт, Англи хэлний курс, Хууль эрх зүйн баримтуудыг эндээс шинэчилнэ. YouTube линк автоматаар видео болно.",
          "Manage AXIS / e-Health trainings, the English course, and Legal documents here. YouTube links become embedded videos automatically."
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
            {editingId ? t("Засах", "Edit") : t("Шинэ агуулга", "New Item")}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Хуудас", "Page")}</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value as Section)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]"
            >
              {SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>{t(s.mn, s.en)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Гарчиг", "Title")} *</label>
            <input className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              {t("Текст (YouTube линк оруулбал видео болно)", "Text (YouTube links embed as videos)")}
            </label>
            <textarea rows={6} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("PDF хавсралт", "PDF attachments")}</label>
            <input type="file" accept="application/pdf" multiple onChange={uploadPdfs} className="block w-full text-sm" />
            {uploading && <p className="mt-1 text-xs text-slate-500">{t("Илгээж байна...", "Uploading...")}</p>}
            {pdfs.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {pdfs.map((url, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs">
                    <span className="truncate">{pdfName(url)}</span>
                    <button type="button" onClick={() => setPdfs((ps) => ps.filter((_, j) => j !== i))} className="shrink-0 font-bold text-red-500">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              {t("Дараалал (бага тоо = дээр)", "Order (lower number = higher)")}
            </label>
            <input inputMode="numeric" className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]" value={sortOrder} onChange={(e) => setSortOrder(e.target.value.replace(/[^\d]/g, ""))} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving || uploading} className="rounded-md bg-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {saving ? t("Хадгалж байна...", "Saving...") : editingId ? t("Хадгалах", "Save changes") : t("Нэмэх", "Add")}
            </button>
            {editingId && (
              <button type="button" onClick={resetEditor} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600">
                {t("Болих", "Cancel")}
              </button>
            )}
          </div>
          {msg && <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-slate-700">{msg}</p>}
        </form>

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSection(s.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                  section === s.value ? "bg-[var(--brand-blue)] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t(s.mn, s.en)} ({items.filter((i) => i.section === s.value).length})
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {sectionItems.map((it) => (
              <div key={it.id} className={`flex items-center gap-3 rounded-xl border p-4 ${it.published ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50"}`}>
                <span className="w-8 shrink-0 text-center font-mono text-xs text-slate-400">{it.sort_order}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{it.title}</p>
                  <p className="text-xs text-slate-400">
                    {(it.pdf_urls ?? []).length > 0 && `${it.pdf_urls.length} PDF · `}
                    {it.published ? t("Нийтэд харагдана", "Public") : t("Нуугдсан", "Hidden")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5 text-xs font-semibold">
                  <button onClick={() => startEdit(it)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]">{t("Засах", "Edit")}</button>
                  <button onClick={() => togglePublish(it)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]">
                    {it.published ? t("Нуух", "Hide") : t("Нээх", "Show")}
                  </button>
                  <button onClick={() => remove(it)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-red-400 hover:text-red-600">✕</button>
                </div>
              </div>
            ))}
            {sectionItems.length === 0 && (
              <p className="text-sm text-slate-400">{t("Энэ хуудсанд агуулга алга.", "No items on this page yet.")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
