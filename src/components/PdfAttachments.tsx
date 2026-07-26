"use client";

import { useLanguage } from "@/lib/language-context";
import { pdfHref, pdfName } from "@/lib/news";

/**
 * Renders a post/content item's attached PDFs: the first one shows as an
 * embedded inline preview (readable without leaving the page), any
 * additional PDFs just show as plain download buttons below it. Works on
 * desktop browsers with a built-in PDF viewer; on phones/browsers that
 * can't preview inline the "Open in new tab" link still always works.
 */
export default function PdfAttachments({ urls }: { urls: string[] | null | undefined }) {
  const { t } = useLanguage();
  const list = urls ?? [];
  if (list.length === 0) return null;

  const [first, ...rest] = list;

  return (
    <div className="mt-4 space-y-3">
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2">
          <span className="truncate text-xs font-semibold text-slate-600">📄 {pdfName(first)}</span>
          <a
            href={pdfHref(first)}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-xs font-semibold text-[var(--brand-blue)] hover:text-[var(--brand-red)]"
          >
            {t("Шинэ цонхонд нээх ↗", "Open in new tab ↗")}
          </a>
        </div>
        <iframe
          src={`${pdfHref(first)}#view=FitH`}
          title={pdfName(first)}
          loading="lazy"
          className="h-[70vh] max-h-[600px] w-full bg-white"
        />
      </div>

      {rest.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rest.map((url, i) => (
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
  );
}
