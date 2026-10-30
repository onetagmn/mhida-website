"use client";

import { useLanguage } from "@/lib/language-context";

/**
 * Visible callout marking placeholder content that still needs to be
 * replaced with real copy from MHIDA before launch. Keep this component
 * (or remove per-section once real content is supplied) so nothing
 * placeholder-y ships to production by accident.
 */
export default function DraftNotice({ note }: { note?: string }) {
  const { t } = useLanguage();
  return (
    <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      <span className="draft-badge shrink-0">{t("Түр агуулга", "Draft content")}</span>
      <span>
        {note ??
          t(
            "Энэ хэсгийг MHIDA-ийн бодит мэдээллээр солино.",
            "Replace this section with MHIDA's actual content before launch."
          )}
      </span>
    </div>
  );
}
