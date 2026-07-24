"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";
import { NewsPost, formatDate, pdfHref, pdfName } from "@/lib/news";
import NewsBody from "@/components/NewsBody";

export default function NewsPage() {
  const { t, lang } = useLanguage();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Standard fetch-on-mount.
   
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("news")
        .select("id, title, body, image_urls, pdf_urls, category, published, created_at")
        .order("created_at", { ascending: false });
      setPosts(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow={t("Мэдээ", "News")}
        title={t("Мэдээ мэдээлэл", "News & Announcements")}
      />

      <div className="container-page py-12">
        {loading && (
          <p className="py-12 text-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</p>
        )}
        {!loading && posts.length === 0 && (
          <p className="py-12 text-center text-slate-400">
            {t("Одоогоор мэдээ алга.", "No news yet.")}
          </p>
        )}

        <div className="mx-auto max-w-2xl space-y-10">
          {posts.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              {p.image_urls.length > 0 && (
                <div className={`grid gap-1 ${p.image_urls.length > 1 ? "grid-cols-2" : ""}`}>
                  {p.image_urls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="max-h-[420px] w-full object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
              <div className="p-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {formatDate(p.created_at, lang)}
                </p>
                <h2 className="text-xl font-bold text-slate-900">{p.title}</h2>
                <div className="mt-3">
                  <NewsBody body={p.body} />
                </div>
                {(p.pdf_urls ?? []).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.pdf_urls.map((url, i) => (
                      <a
                        key={i}
                        href={pdfHref(url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--brand-red)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-red)] transition-colors hover:bg-red-50"
                      >
                        📄 {pdfName(url)} — {t("PDF татах", "Download PDF")}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
