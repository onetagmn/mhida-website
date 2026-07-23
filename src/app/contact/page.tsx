"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import DraftNotice from "@/components/DraftNotice";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader eyebrow={t("Холбоо барих", "Contact")} title={t("Бидэнтэй холбогдох", "Get in Touch")} />

      <div className="container-page grid gap-10 py-12 md:grid-cols-2">
        <div>
          <DraftNotice
            note={t(
              "MHIDA-ийн албан ёсны и-мэйл, утасны дугаар, хаягийг энд оруулна.",
              "Add MHIDA's official email, phone number, and address here."
            )}
          />
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-500">{t("И-мэйл", "Email")}</dt>
              <dd className="text-slate-700">[email@mhida.org]</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">{t("Утас", "Phone")}</dt>
              <dd className="text-slate-700">[+976 __ __ __ __]</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">{t("Хаяг", "Address")}</dt>
              <dd className="text-slate-700">[Улаанбаатар хот, ...]</dd>
            </div>
          </dl>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            {t("Санал хүсэлт", "Feedback")}
          </h2>
          <DraftNotice
            note={t(
              "Санал асуулга / feedback маягтыг Phase 2-т бусад маягтуудтай хамт бүтээнэ.",
              "The survey/feedback form will be built in Phase 2 alongside the other forms."
            )}
          />
        </div>
      </div>
    </div>
  );
}
