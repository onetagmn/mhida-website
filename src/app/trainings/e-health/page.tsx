"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import ContentSection from "@/components/ContentSection";

export default function EHealthPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title="e-Health"
        subtitle={t(
          "Иргэний бүртгэл, эмийн бүртгэл, жорын мэдээллийн e-Health системийг ашиглах заавар, видео хичээлүүд.",
          "Guides and video lessons for the e-Health system covering civil registration, drug records, and prescriptions."
        )}
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <ContentSection
            section="ehealth"
            emptyMn="Сургалтын агуулга удахгүй нэмэгдэнэ."
            emptyEn="Training content is coming soon."
          />
        </div>
      </div>
    </div>
  );
}
