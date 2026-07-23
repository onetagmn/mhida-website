"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/language-context";

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="MHIDA" width={32} height={32} className="h-8 w-auto" />
            <span className="font-bold text-[var(--brand-blue)]">MHIDA</span>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {t(
              "Монголын Эрүүл Мэндийн Даатгалын Эмч Нарын Холбоо",
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
          <p className="mt-3 text-sm text-slate-500">
            <span className="draft-badge">{t("Түр агуулга", "Draft")}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {t("И-мэйл, утасны дугаар энд орно.", "Email and phone number to be added here.")}
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
