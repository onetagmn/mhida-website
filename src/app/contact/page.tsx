"use client";

import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import DraftNotice from "@/components/DraftNotice";

// Assembled at click time so the addresses never sit in the visible
// page text (basic protection against email-harvesting bots).
const EMAIL_PARTS: [string, string][] = [
  ["hida.mng", "gmail.com"],
  ["chr.mhida", "gmail.com"],
  ["sg.mhida", "gmail.com"],
  ["coo.mhida", "gmail.com"],
];

function openMail() {
  const to = EMAIL_PARTS.map(([u, d]) => `${u}@${d}`).join(",");
  window.location.href = `mailto:${to}`;
}

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div>
      <PageHeader eyebrow={t("Холбоо барих", "Contact")} title={t("Бидэнтэй холбогдох", "Get in Touch")} />

      <div className="container-page grid gap-10 py-12 md:grid-cols-2">
        <div className="space-y-6">
          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t("Утас", "Phone")}
            </h2>
            <p className="flex flex-wrap gap-4 text-lg font-semibold text-slate-800">
              <a href="tel:+97699978179" className="hover:text-[var(--brand-red)]">
                ✆ 9997 8179
              </a>
              <a href="tel:+97699854040" className="hover:text-[var(--brand-red)]">
                ✆ 9985 4040
              </a>
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t("И-мэйл", "Email")}
            </h2>
            <button
              onClick={openMail}
              className="rounded-md bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t("И-мэйл илгээх", "Send Email")}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              {t(
                "Товч дарахад таны и-мэйл програм нээгдэнэ.",
                "Opens your email app with our addresses filled in."
              )}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t("Хаяг", "Address")}
            </h2>
            <DraftNotice
              note={t(
                "Байгууллагын хаягийг энд оруулна.",
                "Add the association's street address here."
              )}
            />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-bold text-slate-900">
            {t("Санал хүсэлт", "Feedback")}
          </h2>
          <DraftNotice
            note={t(
              "Санал асуулга / feedback маягтыг бүртгэлийн системтэй хамт бүтээнэ.",
              "The survey/feedback form will be built alongside the registration system."
            )}
          />
        </div>
      </div>
    </div>
  );
}
