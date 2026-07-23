"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import DraftNotice from "@/components/DraftNotice";

export default function EHealthPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title="e-Health"
        subtitle={t(
          "Иргэний бүртгэл, эмийн бүртгэл, жоргийн e-Health системийг ашиглах заавар, видео хичээлүүд.",
          "Guides and video lessons for the e-Health system covering civil registration, drug records, and prescriptions."
        )}
      />

      <div className="container-page py-12">
        <h2 className="mb-3 text-xl font-bold text-slate-900">
          {t("Видео хичээлүүд", "Video Lessons")}
        </h2>
        <DraftNotice
          note={t(
            "Одоо байгаа сайт дээрх YouTube видеонуудын холбоосыг энд нэмнэ.",
            "Embed the existing e-Health training YouTube videos from the current site here."
          )}
        />
        <div className="mb-12 flex h-56 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
          {t("Видео байршуулна", "Video embeds go here")}
        </div>

        <h2 className="mb-3 text-xl font-bold text-slate-900">
          {t("Эрх зүйн баримт бичиг", "Legal / Decision Documents")}
        </h2>
        <DraftNotice
          note={t(
            "PDF хэлбэрээр татаж авах эрх зүйн баримтуудын жагсаалтыг энд нэмнэ.",
            "Add the downloadable PDF legal/decision documents list here."
          )}
        />
      </div>
    </div>
  );
}
