"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { pdfHref, pdfName } from "@/lib/news";
import { LEGAL_SHELVES, LegalCategory, shelfOf } from "@/lib/legal";
import type { ContentItem } from "@/components/ContentSection";

type LegalDoc = ContentItem & { category?: string | null; doc_no?: string | null; doc_year?: number | null; isNew?: boolean };

const NEW_DAYS = 30;
const LINK_RE = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

// A document's body holds a short description, sometimes an adoption
// date line ("Баталсан огноо: 2015.01.29") and labelled links. Split those
// apart so the card can show them as text, meta and buttons.
function parseBody(body: string) {
  const links = [...body.matchAll(LINK_RE)].map((m) => ({ label: m[1], url: m[2] }));
  const adopted = body.match(/Баталсан огноо:\s*([\d.]+)/)?.[1] ?? null;
  const text = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith("[") && !p.startsWith("Баталсан огноо"))
    .join(" ");
  return { links, adopted, text };
}

/** Legal Acts: documents on shelves by kind (laws, resolutions, orders...), with search. */
export default function LegalPage() {
  const { t } = useLanguage();
  const [docs, setDocs] = useState<LegalDoc[] | null>(null);
  const [shelf, setShelf] = useState<LegalCategory | "all">("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("content_items")
        .select("*")
        .eq("section", "legal")
        .order("sort_order")
        .order("created_at");
      // "New" = a document of this year added in the last NEW_DAYS days
      // (an older law that was only just put on the site is not new).
      const now = Date.now();
      const year = new Date().getFullYear();
      setDocs(((data as LegalDoc[]) ?? []).map((d) => ({
        ...d,
        isNew: (d.doc_year ?? 0) >= year && now - new Date(d.created_at).getTime() < NEW_DAYS * 86_400_000,
      })));
    })();
  }, []);

  const counts = useMemo(() => {
    const m = new Map<LegalCategory, number>();
    for (const d of docs ?? []) {
      const key = shelfOf(d.category).key;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [docs]);

  // Newest first on every shelf (by document year, then the admin's order).
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (docs ?? [])
      .filter((d) => shelf === "all" || shelfOf(d.category).key === shelf)
      .filter((d) => !q || `${d.title} ${d.body} ${d.doc_no ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => (b.doc_year ?? 0) - (a.doc_year ?? 0) || a.sort_order - b.sort_order);
  }, [docs, shelf, query]);

  const grouped = shelf === "all" && !query.trim();

  return (
    <div>
      <PageHeader
        eyebrow={t("Эрх зүй", "Legal")}
        title={t("Хууль, эрх зүйн акт", "Legal Acts")}
        subtitle={t(
          "Даатгалын эмч нарын ажилд хамаатай хууль, тогтоол, тушаал — төрлөөр нь ангилсан.",
          "Laws, resolutions and orders that health insurance doctors work under — sorted by type."
        )}
      />

      <div className="container-page py-8 sm:py-10">
        {docs === null ? (
          <p className="py-8 text-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</p>
        ) : (
          <>
            {/* Shelves */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <ShelfTile
                icon="🗂️"
                label={t("Бүгд", "All documents")}
                count={docs.length}
                active={shelf === "all"}
                onClick={() => setShelf("all")}
              />
              {LEGAL_SHELVES.filter((s) => counts.get(s.key)).map((s) => (
                <ShelfTile
                  key={s.key}
                  icon={s.icon}
                  label={t(s.mn, s.en)}
                  count={counts.get(s.key) ?? 0}
                  active={shelf === s.key}
                  onClick={() => setShelf(s.key)}
                />
              ))}
            </div>

            {/* Search */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Нэр, дугаараар хайх...", "Search by name or number...")}
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-blue)] sm:max-w-md"
              />
              <p className="text-sm text-slate-500">
                {shown.length} {t("баримт бичиг", "documents")}
              </p>
            </div>

            {/* Documents */}
            <div className="mt-6">
              {shown.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  {docs.length === 0
                    ? t("Баримт бичгүүд удахгүй нэмэгдэнэ.", "Documents are coming soon.")
                    : t("Хайлтад тохирох баримт олдсонгүй.", "No documents match your search.")}
                </div>
              )}
              {grouped ? (
                <div className="space-y-8">
                  {LEGAL_SHELVES.filter((s) => counts.get(s.key)).map((s) => (
                    <section key={s.key}>
                      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <span aria-hidden="true">{s.icon}</span>
                        {t(s.mn, s.en)}
                        <span className="text-sm font-semibold text-slate-400">{counts.get(s.key)}</span>
                      </h2>
                      <div className="space-y-3">
                        {shown.filter((d) => shelfOf(d.category).key === s.key).map((d) => (
                          <DocCard key={d.id} doc={d} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {shown.map((d) => <DocCard key={d.id} doc={d} />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ShelfTile({ icon, label, count, active, onClick }: { icon: string; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white" : "border-slate-200 bg-white text-slate-800"
      }`}
    >
      <span className="text-2xl" aria-hidden="true">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-bold leading-snug">{label}</span>
        <span className={`text-xs ${active ? "text-white/75" : "text-slate-500"}`}>{count}</span>
      </span>
    </button>
  );
}

function DocCard({ doc }: { doc: LegalDoc }) {
  const { t } = useLanguage();
  const s = shelfOf(doc.category);
  const { links, adopted, text } = parseBody(doc.body);
  const meta = [
    doc.doc_no && `№${doc.doc_no}`,
    adopted ? `${t("Баталсан", "Adopted")} ${adopted}` : doc.doc_year,
  ].filter(Boolean);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2.5 py-0.5 font-bold ring-1 ${s.tag}`}>{t(s.mn, s.en)}</span>
        {meta.map((m, i) => <span key={i} className="font-semibold text-slate-500">{m}</span>)}
        {doc.isNew && <span className="rounded-full bg-green-100 px-2 py-0.5 font-bold text-green-700">{t("Шинэ", "New")}</span>}
      </div>
      <h3 className="mt-2 font-bold leading-snug text-slate-900">{doc.title}</h3>
      {text && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{text}</p>}
      {(links.length > 0 || doc.pdf_urls.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {doc.pdf_urls.map((url, i) => (
            <a
              key={url}
              href={pdfHref(url)}
              download={`${pdfName(url)}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[var(--brand-red)] px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
            >
              📄 {t("PDF татах", "Download PDF")}{doc.pdf_urls.length > 1 ? ` ${i + 1}` : ""}
            </a>
          ))}
          {links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--brand-blue)] px-3 py-1.5 text-xs font-bold text-[var(--brand-blue)] transition-colors hover:bg-blue-50"
            >
              {l.label} ↗
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
