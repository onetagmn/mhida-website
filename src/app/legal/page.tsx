"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import ContentSection from "@/components/ContentSection";

export default function LegalPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader
        eyebrow={t("Эрх зүй", "Legal")}
        title={t("Хууль, эрх зүйн акт", "Legal Acts")}
        subtitle={t(
          "Хууль тогтоомж, тогтоол, шийдвэрийн жагсаалт.",
          "Laws, decisions, and regulations."
        )}
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <ContentSection
            section="legal"
            emptyMn="Баримт бичгүүд удахгүй нэмэгдэнэ."
            emptyEn="Documents are coming soon."
          />
        </div>
      </div>
    </div>
  );
}
