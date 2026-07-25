"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/language-context";
import { asset } from "@/lib/asset";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/", mn: "Нүүр", en: "Home" },
  { href: "/news", mn: "Мэдээ", en: "News" },
  { href: "/about", mn: "Танилцуулга", en: "About" },
];

const trainingLinks = [
  { href: "/trainings/axis-card", mn: "AXIS Карт", en: "AXIS Card" },
  { href: "/trainings/e-health", mn: "e-Health", en: "e-Health" },
  { href: "/trainings/english", mn: "Англи хэлний курс", en: "English Course" },
  { href: "/trainings/professional-courses", mn: "Мэргэжлийн сургалтууд", en: "Professional Courses" },
];

export default function Navbar() {
  const { t, lang, toggleLang } = useLanguage();
  const pathname = usePathname();
  const [trainingsOpen, setTrainingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setLoggedIn(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const linkClass = (active: boolean) =>
    `transition-colors hover:text-[var(--brand-red)] ${
      active ? "text-[var(--brand-red)]" : "text-slate-700"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src={asset("/logo.png")} alt="MHIDA" width={40} height={40} className="h-10 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(pathname === l.href)}>
              {t(l.mn, l.en)}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setTrainingsOpen(true)}
            onMouseLeave={() => setTrainingsOpen(false)}
          >
            <button className={linkClass(pathname.startsWith("/trainings"))}>
              {t("Сургалтууд", "Trainings")} <span aria-hidden>▾</span>
            </button>
            {trainingsOpen && (
              <div className="absolute left-0 top-full w-48 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                <Link href="/trainings" className="block px-4 py-2 text-sm hover:bg-slate-50">
                  {t("Тойм", "Overview")}
                </Link>
                {trainingLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="block px-4 py-2 text-sm hover:bg-slate-50">
                    {t(l.mn, l.en)}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/legal" className={linkClass(pathname === "/legal")}>
            {t("Хууль эрх зүй", "Legal Acts")}
          </Link>
          <Link href="/contact" className={linkClass(pathname === "/contact")}>
            {t("Холбоо барих", "Contact")}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
          >
            {lang === "mn" ? "EN" : "МН"}
          </button>
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="hidden items-center gap-1.5 rounded-md bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:inline-flex"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" aria-hidden />
              {t("Миний булан", "My Account")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md border border-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors hover:bg-blue-50 sm:inline-block"
              >
                {t("Нэвтрэх", "Log in")}
              </Link>
              <Link
                href="/register"
                className="hidden rounded-md bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:inline-block"
              >
                {t("Бүртгүүлэх", "Register")}
              </Link>
            </>
          )}
          <button
            className="flex flex-col gap-1.5 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            <span className="block h-0.5 w-6 bg-slate-700" />
            <span className="block h-0.5 w-6 bg-slate-700" />
            <span className="block h-0.5 w-6 bg-slate-700" />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 text-sm text-slate-700"
              onClick={() => setMobileOpen(false)}
            >
              {t(l.mn, l.en)}
            </Link>
          ))}
          <Link
            href="/trainings"
            className="block py-2 text-sm text-slate-700"
            onClick={() => setMobileOpen(false)}
          >
            {t("Сургалтууд", "Trainings")}
          </Link>
          {trainingLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block py-2 pl-4 text-sm text-slate-600"
              onClick={() => setMobileOpen(false)}
            >
              {t(l.mn, l.en)}
            </Link>
          ))}
          <Link
            href="/legal"
            className="block py-2 text-sm text-slate-700"
            onClick={() => setMobileOpen(false)}
          >
            {t("Хууль эрх зүй", "Legal Acts")}
          </Link>
          <Link
            href="/contact"
            className="block py-2 text-sm text-slate-700"
            onClick={() => setMobileOpen(false)}
          >
            {t("Холбоо барих", "Contact")}
          </Link>
          {loggedIn ? (
            <Link
              href="/dashboard"
              className="mt-2 block rounded-md bg-[var(--brand-blue)] px-4 py-2 text-center text-sm font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              ● {t("Миний булан", "My Account")}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="mt-2 block rounded-md border border-[var(--brand-blue)] px-4 py-2 text-center text-sm font-semibold text-[var(--brand-blue)]"
                onClick={() => setMobileOpen(false)}
              >
                {t("Нэвтрэх", "Log in")}
              </Link>
              <Link
                href="/register"
                className="mt-2 block rounded-md bg-[var(--brand-red)] px-4 py-2 text-center text-sm font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                {t("Бүртгүүлэх", "Register")}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
