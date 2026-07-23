"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import DraftNotice from "@/components/DraftNotice";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader
        eyebrow={t("Танилцуулга", "About")}
        title={t(
          "Монголын Эрүүл Мэндийн Даатгалын Эмч Нарын Холбоо",
          "Mongolian Health Insurance Doctors Association"
        )}
        subtitle={t(
          "MHIDA нь эрүүл мэндийн даатгалын чиглэлээр ажилладаг эмч нарыг нэгтгэсэн мэргэжлийн байгууллага юм.",
          "MHIDA is a professional association bringing together doctors who work in health insurance."
        )}
      />

      <div className="container-page grid gap-12 py-12 md:grid-cols-3">
        <div className="space-y-10 md:col-span-2">
          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              {t("Эрхэм зорилго", "Mission")}
            </h2>
            <DraftNotice
              note={t(
                "MHIDA-ийн албан ёсны эрхэм зорилгын бичвэрийг энд оруулна.",
                "Insert MHIDA's official mission statement here."
              )}
            />
            <p className="text-slate-600">
              {t(
                "[Эрхэм зорилгын бичвэр энд орно]",
                "[Mission statement text goes here]"
              )}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              {t("Түүх", "History")}
            </h2>
            <DraftNotice
              note={t(
                "Байгууллагын түүх, байгуулагдсан он, чухал үйл явдлуудыг энд бичнэ.",
                "Add the association's founding year and key milestones here."
              )}
            />
            <p className="text-slate-600">
              {t("[Түүхийн бичвэр энд орно]", "[History content goes here]")}
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              {t("Удирдлага", "Leadership")}
            </h2>
            <DraftNotice
              note={t(
                "Удирдах зөвлөлийн гишүүдийн нэр, зураг, албан тушаалыг энд нэмнэ.",
                "Add board/leadership members' names, photos, and titles here."
              )}
            />
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold text-slate-900">
              {t(
                "Түншлэл: Тайванийн Олон Улсын Эрүүл Мэндийн Сургалтын Төв (TIHTC)",
                "Partnership: Taiwan International Healthcare Training Center (TIHTC)"
              )}
            </h2>
            <p className="text-slate-600">
              {t(
                "TIHTC нь 2002 онд Тайваний Эрүүл мэнд, халамжийн яамнаас байгуулагдсан бөгөөд Тайбэйн эмнэлгээр удирдуулдаг. Сүүлийн 24 жилд 84 орны 2,300 гаруй эрүүл мэндийн мэргэжилтнийг сургасан. MHIDA нь TIHTC-тэй хамтран гишүүн эмч нартаа зориулсан мэргэжил дээшлүүлэх сургалтуудыг зохион байгуулж байна.",
                "TIHTC was established in 2002 by Taiwan's Ministry of Health and Welfare and is administered by Taipei Hospital. Over the past 24 years it has trained more than 2,300 healthcare professionals from 84 countries. MHIDA partners with TIHTC to offer continuing professional development trainings to member doctors — see the Trainings page for current programs."
              )}
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t("Одоогийн байдал", "At a glance")}
            </h3>
            <DraftNotice
              note={t(
                "Гишүүдийн тоо, аймгийн тоо зэрэг статистикийг бодит бүртгэлийн өгөгдөл бэлэн болсны дараа энд харуулна.",
                "Member count, province coverage, and similar stats will display here once real registration data is available."
              )}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
