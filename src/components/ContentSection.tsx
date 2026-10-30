"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { supabase } from "@/lib/supabase";
import NewsBody from "@/components/NewsBody";
import PdfAttachments from "@/components/PdfAttachments";

export type ContentItem = {
  id: string;
  section: string;
  title: string;
  body: string;
  pdf_urls: string[];
  sort_order: number;
  published: boolean;
  created_at: string;
};

/** Renders all published content items for a page section (admin-managed). */
export default function ContentSection({
  section,
  emptyMn,
  emptyEn,
}: {
  section: "axis" | "ehealth" | "english" | "legal" | "partnership";
  emptyMn: string;
  emptyEn: string;
}) {
  const { t } = useLanguage();
  const [items, setItems] = useState<ContentItem[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("content_items")
        .select("id, section, title, body, pdf_urls, sort_order, published, created_at")
        .eq("section", section)
        .order("sort_order")
        .order("created_at");
      setItems(data ?? []);
    })();
  }, [section]);

  if (items === null) {
    return <p className="py-8 text-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
        {t(emptyMn, emptyEn)}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {items.map((item) => (
        <article key={item.id} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
          {item.body && (
            <div className="mt-3">
              <NewsBody body={item.body} />
            </div>
          )}
          <PdfAttachments urls={item.pdf_urls} preview={section !== "legal"} />
        </article>
      ))}
    </div>
  );
}
