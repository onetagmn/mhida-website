"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";
import { asset } from "@/lib/asset";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Image src={asset("/logo.png")} alt="MHIDA" width={32} height={32} className="h-8 w-auto" />
            <span className="font-bold text-[var(--brand-blue)]">MHIDA</span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {t(
              "Монголын Даатгалын Эмч Нарын Холбоо",
              "Mongolian Health Insurance Doctors Association"
            )}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t("Холбоосууд", "Links")}</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/about" className="hover:text-[var(--brand-red)]">
                {t("Танилцуулга", "About")}
              </Link>
            </li>
            <li>
              <Link href="/trainings" className="hover:text-[var(--brand-red)]">
                {t("Сургалтууд", "Trainings")}
              </Link>
            </li>
            <li>
              <Link href="/legal" className="hover:text-[var(--brand-red)]">
                {t("Хууль эрх зүй", "Legal Acts")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-[var(--brand-red)]">
                {t("Холбоо барих", "Contact")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">{t("Холбоо барих", "Contact")}</h3>
          <p className="mt-3 space-x-3 text-sm text-slate-600">
            <a href="tel:+97699978179" className="hover:text-[var(--brand-red)]">
              ✆ 9997 8179
            </a>
            <a href="tel:+97699854040" className="hover:text-[var(--brand-red)]">
              ✆ 9985 4040
            </a>
          </p>
          <p className="mt-2 text-sm">
            <Link href="/contact" className="text-[var(--brand-blue)] hover:text-[var(--brand-red)]">
              {t("И-мэйл илгээх →", "Send Email →")}
            </Link>
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 py-4">
        <p className="container-page text-center text-xs text-slate-500">
          © {year} MHIDA. {t("Бүх эрх хуулиар хамгаалагдсан.", "All rights reserved.")}
        </p>
      </div>
    </footer>
  );
}
