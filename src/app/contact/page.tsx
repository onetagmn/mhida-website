"use client";

import { useLanguage } from "@/lib/language-context";

// Contact details are written out as plain, readable text rather than hidden
// behind a mailto button. Verification services and directories read the page
// text, so an address that only exists inside a link is invisible to them.
const EMAIL = "info@mhida.org";
const PHONES = ["9997 8179", "9985 4040"];

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-[var(--brand-blue)]">
        {t("Холбоо барих", "Contact")}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">
        {t("Бидэнтэй холбогдох", "Get in touch")}
      </h1>
      <p className="mt-4 text-base leading-relaxed text-gray-600">
        {t(
          "Асуулт, санал хүсэлтээ доорх хаягаар илгээнэ үү.",
          "Please send any questions or suggestions to the details below."
        )}
      </p>

      <div className="mt-10 space-y-6">
        {/* Organisation */}
        <section className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("Байгууллага", "Organisation")}
          </h2>
          <p className="mt-3 text-base text-gray-800">
            {t(
              "Монголын Даатгалын Эмч Нарын Холбоо",
              "Mongolian Health Insurance Doctors Association"
            )}
          </p>
          <p className="mt-1 text-sm text-gray-600">
            {t(
              "Төрийн бус байгууллага",
              "Non-governmental organisation"
            )}
          </p>
          <p className="mt-3 text-sm text-gray-600">
            {t("Улсын бүртгэлийн дугаар:", "State registration number:")}{" "}
            <span className="font-medium text-gray-900">
              {/* TODO: replace with MHIDA's state registration number */}
              6923216
            </span>
          </p>
        </section>

        {/* Address */}
        <section className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("Хаяг", "Address")}
          </h2>
          <address className="mt-3 not-italic text-base leading-relaxed text-gray-800">
            {t(
              "Монгол Улс, Улаанбаатар хот, Баянзүрх дүүрэг, 15-р хороо, 13-р хороолол, 70-7 тоот, 13370",
              "70-7, 13th khoroolol, 15th khoroo, Bayanzurkh District, Ulaanbaatar 13370, Mongolia"
            )}
          </address>
        </section>

        {/* Email */}
        <section className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("И-мэйл", "Email")}
          </h2>
          <p className="mt-3 text-base text-gray-800">
            <a
              href={`mailto:${EMAIL}`}
              className="font-medium text-[var(--brand-blue)] underline underline-offset-4"
            >
              {EMAIL}
            </a>
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {t(
              "Албан ёсны и-мэйл хаяг.",
              "Official email address of the association."
            )}
          </p>
        </section>

        {/* Phone */}
        <section className="rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("Утас", "Phone")}
          </h2>
          <ul className="mt-3 space-y-1 text-base text-gray-800">
            {PHONES.map((phone) => (
              <li key={phone}>
                <a
                  href={`tel:+976${phone.replace(/\s/g, "")}`}
                  className="font-medium text-[var(--brand-blue)] underline underline-offset-4"
                >
                  +976 {phone}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
