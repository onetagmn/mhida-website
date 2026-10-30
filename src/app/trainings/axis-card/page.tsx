"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import ContentSection from "@/components/ContentSection";

export default function AxisCardPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title="AXIS Карт"
        subtitle={t(
          "Даатгал, эмнэлгийн тооцооны AXIS системийг ашиглах заавар, видео хичээлүүд.",
          "Guides and video lessons for using the AXIS insurance and hospital billing system."
        )}
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <ContentSection
            section="axis"
            emptyMn="Сургалтын агуулга удахгүй нэмэгдэнэ."
            emptyEn="Training content is coming soon."
          />
        </div>
      </div>
    </div>
  );
}
