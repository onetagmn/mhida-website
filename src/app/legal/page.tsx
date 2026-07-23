"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import DraftNotice from "@/components/DraftNotice";

export default function LegalPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader
        eyebrow={t("Эрх зүй", "Legal")}
        title={t("Хууль, эрх зүйн акт", "Legal Acts")}
        subtitle={t(
          "MHIDA-тай холбоотой хууль тогтоомж, тогтоол, шийдвэрийн жагсаалт.",
          "Laws, decisions, and regulations relevant to MHIDA."
        )}
      />

      <div className="container-page py-12">
        <DraftNotice
          note={t(
            "Одоогийн сайтаас татаж авсан PDF баримт бичгүүдийг энд байршуулна.",
            "Upload the PDF legal/decision documents carried over from the current site here."
          )}
        />
        <ul className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-center justify-between px-5 py-4 text-sm text-slate-400">
              <span>{t("[Баримт бичгийн нэр]", "[Document title]")}</span>
              <span className="draft-badge">{t("Түр", "Placeholder")}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
