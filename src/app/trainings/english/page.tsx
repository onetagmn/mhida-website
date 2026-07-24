"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import ContentSection from "@/components/ContentSection";

export default function EnglishCoursePage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title={t("Англи хэлний курс", "English Course")}
        subtitle={t(
          "Гишүүдэд зориулсан үнэгүй ярианы англи хэлний курс. Бүрэн хөтөлбөр удахгүй — нэвтэрсэн гишүүд хичээлдээ эндээс орно.",
          "A free spoken-English course for members. The full program arrives soon — logged-in members will access lessons here."
        )}
      />

      <div className="container-page py-12">
        <div className="mx-auto max-w-3xl">
          <ContentSection
            section="english"
            emptyMn="Хичээлүүд удахгүй нэмэгдэнэ."
            emptyEn="Lessons are coming soon."
          />
        </div>
      </div>
    </div>
  );
}
