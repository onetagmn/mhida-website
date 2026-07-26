"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { NewsPost, formatDate, pdfName } from "@/lib/news";

export default function AdminNewsPage() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  // editor state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [pdfs, setPdfs] = useState<string[]>([]);
  const [category, setCategory] = useState<"news" | "partner">("news");
  const [uploading, setUploading] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login/"); return; }
    const { data: me } = await supabase
      .from("members").select("is_admin").eq("id", session.user.id).single();
    if (!me?.is_admin) { setDenied(true); setLoading(false); return; }
    const { data } = await supabase
      .from("news")
      .select("id, title, body, image_urls, pdf_urls, category, published, created_at")
      .order("created_at", { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  }, [router]);

  // Standard fetch-on-mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  function resetEditor() {
    setEditingId(null); setTitle(""); setBody(""); setImages([]); setPdfs([]);
    setCategory("news"); setMsg(null);
  }

  function startEdit(p: NewsPost) {
    setEditingId(p.id); setTitle(p.title); setBody(p.body); setImages(p.image_urls);
    setPdfs(p.pdf_urls ?? []); setCategory(p.category ?? "news");
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadPdfs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true); setMsg(null);
    for (const file of files) {
      // \w is ASCII-only, so Cyrillic/Mongolian file names used to get
      // stripped down to nothing, leaving just the upload timestamp as the
      // displayed name. \p{L}/\p{N} keep letters and digits in any script.
      const safe = file.name.replace(/[^\p{L}\p{N}.\-]+/gu, "_");
      const path = `pdf/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from("news-photos").upload(path, file, {
        cacheControl: "31536000",
        contentType: "application/pdf",
      });
      if (error) { setMsg(t("PDF илгээхэд алдаа: ", "PDF upload error: ") + error.message); continue; }
      const { data } = supabase.storage.from("news-photos").getPublicUrl(path);
      setPdfs((prev) => [...prev, data.publicUrl]);
    }
    setUploading(false);
    e.target.value = "";
  }

  async function uploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true); setMsg(null);
    const uploaded: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("news-photos").upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
      });
      if (error) { setMsg(t("Зураг илгээхэд алдаа: ", "Upload error: ") + error.message); continue; }
      const { data } = supabase.storage.from("news-photos").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setImages((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }

  async function savePost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setMsg(t("Гарчиг оруулна уу.", "Please enter a title.")); return; }
    setSavingPost(true); setMsg(null);
    const payload = {
      title: title.trim(),
      body: body.trim(),
      image_urls: images,
      pdf_urls: pdfs,
      category,
      updated_at: new Date().toISOString(),
    };
    const { error } = editingId
      ? await supabase.from("news").update(payload).eq("id", editingId)
      : await supabase.from("news").insert(payload);
    setSavingPost(false);
    if (error) { setMsg(t("Алдаа: ", "Error: ") + error.message); return; }
    resetEditor();
    await load();
    setMsg(t("Хадгалагдлаа!", "Saved!"));
  }

  async function togglePublish(p: NewsPost) {
    const { error } = await supabase
      .from("news").update({ published: !p.published }).eq("id", p.id);
    if (!error) setPosts((ps) => ps.map((x) => x.id === p.id ? { ...x, published: !p.published } : x));
  }

  async function deletePost(p: NewsPost) {
    if (!window.confirm(t(`«${p.title}» мэдээг устгах уу?`, `Delete "${p.title}"?`))) return;
    const { error } = await supabase.from("news").delete().eq("id", p.id);
    if (!error) setPosts((ps) => ps.filter((x) => x.id !== p.id));
  }

  if (loading) {
    return <div className="container-page flex h-64 items-center justify-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</div>;
  }
  if (denied) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-lg font-bold text-slate-700">{t("Хандах эрхгүй байна.", "You don't have access to this page.")}</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow={t("Админ", "Admin")}
        title={t("Мэдээ нийтлэх", "News Publishing")}
        subtitle={t(
          "Гарчиг, текст бичээд зурагаа хавсаргаад Нийтлэх дарахад сайт дээр шууд гарна.",
          "Write a title and text, attach photos, hit Publish — it appears on the site instantly."
        )}
      />

      <div className="container-page pt-6">
        <Link
          href="/admin"
          className="inline-block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
        >
          {t("← Гишүүдийн удирдлага", "← Member Management")}
        </Link>
      </div>

      <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
        {/* Editor */}
        <form onSubmit={savePost} className="space-y-4 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900">
            {editingId ? t("Мэдээ засах", "Edit Post") : t("Шинэ мэдээ", "New Post")}
          </h2>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Төрөл", "Type")}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as "news" | "partner")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]"
            >
              <option value="news">{t("Мэдээ (Мэдээ хуудас + нүүр)", "News (news feed + homepage)")}</option>
              <option value="partner">{t("Түншлэл ба мэдээ (TIHTC г.м.)", "Partnership & News (TIHTC etc.)")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Гарчиг", "Title")} *</label>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Текст", "Text")}</label>
            <textarea
              rows={8}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--brand-blue)]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">{t("Зураг", "Photos")}</label>
            <input type="file" accept="image/*" multiple onChange={uploadPhotos} className="block w-full text-sm" />
            {uploading && <p className="mt-1 text-xs text-slate-500">{t("Илгээж байна...", "Uploading...")}</p>}
            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-20 w-20 rounded-md object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((im) => im.filter((_, j) => j !== i))}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              {t("PDF хавсралт", "PDF attachments")}
            </label>
            <input type="file" accept="application/pdf" multiple onChange={uploadPdfs} className="block w-full text-sm" />
            {pdfs.length > 0 && (
              <ul className="mt-2 space-y-1.5">
                {pdfs.map((url, i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-xs">
                    <span className="truncate">{pdfName(url)}</span>
                    <button
                      type="button"
                      onClick={() => setPdfs((ps) => ps.filter((_, j) => j !== i))}
                      className="shrink-0 font-bold text-red-500"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={savingPost || uploading}
              className="rounded-md bg-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {savingPost ? t("Хадгалж байна...", "Saving...") : editingId ? t("Хадгалах", "Save changes") : t("Нийтлэх", "Publish")}
            </button>
            {editingId && (
              <button type="button" onClick={resetEditor} className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600">
                {t("Болих", "Cancel")}
              </button>
            )}
          </div>
          {msg && <p className="rounded-md border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-slate-700">{msg}</p>}
        </form>

        {/* Existing posts */}
        <div>
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            {t("Нийтлэгдсэн мэдээ", "Posts")} ({posts.length})
          </h2>
          <div className="space-y-3">
            {posts.map((p) => (
              <div key={p.id} className={`flex items-center gap-4 rounded-xl border p-4 ${p.published ? "border-slate-200" : "border-dashed border-slate-300 bg-slate-50"}`}>
                {p.image_urls[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image_urls[0]} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-400">
                    {p.category === "partner" && (
                      <span className="mr-1.5 rounded bg-blue-100 px-1.5 py-0.5 font-bold text-[var(--brand-blue)]">
                        {t("Түншлэл", "Partner")}
                      </span>
                    )}
                    {formatDate(p.created_at, lang)} · {p.published ? t("Нийтэд харагдана", "Public") : t("Нуугдсан", "Hidden")}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5 text-xs font-semibold">
                  <button onClick={() => startEdit(p)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]">
                    {t("Засах", "Edit")}
                  </button>
                  <button onClick={() => togglePublish(p)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]">
                    {p.published ? t("Нуух", "Hide") : t("Нээх", "Show")}
                  </button>
                  <button onClick={() => deletePost(p)} className="rounded-md border border-slate-300 px-2.5 py-1.5 text-slate-600 hover:border-red-400 hover:text-red-600">
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-sm text-slate-400">{t("Мэдээ алга — эхнийхээ нийтлээрэй!", "No posts yet — publish your first!")}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
