"use client";

import { useLanguage } from "@/lib/language-context";
import { pdfHref, pdfName } from "@/lib/news";

/**
 * Renders a post/content item's attached PDFs.
 *
 * By default the first one shows as an embedded inline preview (readable
 * without leaving the page), and any additional PDFs show as plain
 * download buttons below it. Pass `preview={false}` (used for the Legal
 * section, where documents are meant to be downloaded/filed, not read
 * inline) to skip the embed entirely and list every PDF as a plain
 * download button instead.
 */
export default function PdfAttachments({
  urls,
  preview = true,
}: {
  urls: string[] | null | undefined;
  preview?: boolean;
}) {
  const { t } = useLanguage();
  const list = urls ?? [];
  if (list.length === 0) return null;

  const downloadButton = (url: string, key: number) => (
    <a
      key={key}
      href={pdfHref(url)}
      download={`${pdfName(url)}.pdf`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--brand-red)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-red)] transition-colors hover:bg-red-50"
    >
      📄 {pdfName(url)} — {t("PDF татах", "Download PDF")}
    </a>
  );

  if (!preview) {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {list.map((url, i) => downloadButton(url, i))}
      </div>
    );
  }

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
          {rest.map((url, i) => downloadButton(url, i))}
        </div>
      )}
    </div>
  );
}
