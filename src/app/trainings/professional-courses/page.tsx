"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  titleMn: string;
  titleEn: string;
  provider: string;
  descMn: string;
  descEn: string;
  format: string;
  url: string;
  /** true = free & open to every MHIDA member; false = professional members only */
  freeForAll: boolean;
  certNoteMn: string;
  certNoteEn: string;
};

// Curated from real, currently-live free courses (video-based, from
// well-known universities/WHO). Nine are gated to professional members;
// the WHO OpenWHO course is genuinely free end-to-end (course + official
// certificate, no payment or financial-aid application needed), so it
// stays open to every member as a taste of what's available.
const COURSES: Course[] = [
  {
    id: "coding-necessity",
    titleMn: "Эмнэлгийн код ба нэхэмжлэлийн үндэслэл",
    titleEn: "Medical Coding & Medical Necessity",
    provider: "AAPC · Coursera",
    descMn: "CPT, HCPCS, ICD-10 код болон нэхэмжлэлийг зөвшөөрөх \"эмнэлгийн зайлшгүй шаардлага\"-ын зарчим — даатгалын эмчийн өдөр тутмын ажилтай хамгийн шууд холбоотой сэдэв.",
    descEn: "CPT, HCPCS, and ICD-10 coding, and the \"medical necessity\" principle that determines whether a claim is approved — the closest match to day-to-day insurance-doctor work.",
    format: "~3 долоо хоног · видео",
    url: "https://www.coursera.org/learn/cbp-coding-medical",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
  {
    id: "patient-safety",
    titleMn: "Өвчтөний аюулгүй байдал",
    titleEn: "Patient Safety",
    provider: "Johns Hopkins University",
    descMn: "Эмнэлгийн алдаа яагаад гардаг, тогтолцооны түвшинд хэрхэн үнэлэх вэ — нэхэмжлэлд гарсан хүндрэл, эмнэлгийн алдааг үнэлэхэд шууд хэрэгтэй.",
    descEn: "Why medical errors happen and how to evaluate care through a systems lens — directly useful for judging claims involving complications or adverse events.",
    format: "Олон хэсэгтэй хөтөлбөр · видео",
    url: "https://www.coursera.org/learn/patient-safety-systems-view",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
  {
    id: "quality-improvement",
    titleMn: "Эрүүл мэндийн тусламжийн чанарыг сайжруулах",
    titleEn: "Quality Improvement in Healthcare",
    provider: "Imperial College London",
    descMn: "Эмчилгээний чанарыг хэрхэн хэмжиж, үнэлж, сайжруулах вэ — нэхэмжлэл дэх эмчилгээний шийдвэр зохистой байсан эсэхийг үнэлэхэд тустай.",
    descEn: "How to measure and improve the quality of medical care — useful for judging whether treatment decisions in a claim were appropriate.",
    format: "Олон хэсэгтэй хөтөлбөр · видео",
    url: "https://www.coursera.org/specializations/quality-improvement-healthcare",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
  {
    id: "health-economics",
    titleMn: "Эрүүл мэндийн даатгалын эдийн засаг",
    titleEn: "The Economics of Health Care Delivery",
    provider: "University of Pennsylvania (Wharton)",
    descMn: "Даатгалын эдийн засгийн үндэс — эрсдэл, ёс зүйгүй зан үйл, зардал хуваалцах, эмнэлэг/эмчид хэрхэн төлбөр хийгддэг тухай.",
    descEn: "The economics behind insurance itself — risk, moral hazard, cost-sharing, and how providers get paid.",
    format: "Ганц курс · видео",
    url: "https://www.coursera.org/learn/health-economics-us-healthcare-systems",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
  {
    id: "medical-research",
    titleMn: "Эмнэлгийн судалгааг шүүмжлэлтэй унших",
    titleEn: "Understanding Medical Research",
    provider: "Yale University",
    descMn: "Эмнэлгийн судалгаа, нотолгоог хэрхэн шалгаж, үнэлэх вэ — нэхэмжлэлийн үндэслэл болсон эмчилгээ жинхэнэ нотолгоотой эсэхийг дүгнэхэд тустай.",
    descEn: "How to critically evaluate medical studies — useful for judging whether a treatment behind a claim is actually well-supported.",
    format: "~4 долоо хоног · видео",
    url: "https://www.coursera.org/learn/medical-research",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
  {
    id: "epidemiology",
    titleMn: "Тархвар судлал",
    titleEn: "Epidemiology in Public Health Practice",
    provider: "Johns Hopkins Bloomberg School of Public Health",
    descMn: "Өвчний тандалт, дэгдэлтийн судалгааны үндсэн хэрэгслүүд — дэлхийд тэргүүлэх нийгмийн эрүүл мэндийн сургуулиас.",
    descEn: "Core epidemiology tools and outbreak investigation, from one of the world's leading public health schools.",
    format: "5 курсын хөтөлбөр · ~27 цаг · видео",
    url: "https://www.coursera.org/specializations/professional-epidemiology",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
  {
    id: "health-informatics",
    titleMn: "Эрүүл мэндийн мэдээллийн технологи",
    titleEn: "Health Informatics for Healthcare Professionals",
    provider: "Northeastern University",
    descMn: "Цахим эмнэлгийн бүртгэл, мэдээллийн стандарт (FHIR, DICOM) — эмнэлэг, даатгалын систем улам цахимжиж байгаа энэ үед хэрэгтэй.",
    descEn: "Electronic health records and data standards (FHIR, DICOM) — useful as insurance and hospital systems digitize.",
    format: "Ганц курс · 4 хэсэг · видео",
    url: "https://www.coursera.org/learn/health-informatics-for-healthcare-professionals",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
  {
    id: "vaccines",
    titleMn: "Вакцины шинжлэх ухаан",
    titleEn: "Vaccines",
    provider: "University of Pennsylvania",
    descMn: "Вакцин хэрхэн бүтээгддэг, туршигддаг, зохицуулагддаг, буруу мэдээлэлтэй хэрхэн харьцах тухай.",
    descEn: "How vaccines are developed, tested, and regulated, and how to address vaccine misinformation.",
    format: "Ганц курс · видео",
    url: "https://www.coursera.org/learn/vaccines",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
  {
    id: "openwho-ipc",
    titleMn: "Халдвар хамгаалал ба гарцаагүй хариу арга хэмжээ",
    titleEn: "Infection Prevention & Outbreak Response",
    provider: "World Health Organization · OpenWHO",
    descMn: "ДЭМБ-аас өөрөө боловсруулсан, эхнээс нь дуустал бүрэн үнэгүй сургалт — курс болон албан ёсны гэрчилгээ хоёулаа үнэ төлбөргүй.",
    descEn: "Straight from WHO itself — genuinely free from start to finish, including the official certificate.",
    format: "Богино хугацаатай · видео + шалгалт",
    url: "https://openwho.org",
    freeForAll: true,
    certNoteMn: "Курс болон гэрчилгээ хоёулаа бүрэн үнэгүй",
    certNoteEn: "Course and certificate are both completely free",
  },
  {
    id: "global-health",
    titleMn: "Дэлхийн эрүүл мэндийн тогтолцоо",
    titleEn: "The Challenges of Global Health",
    provider: "Duke University",
    descMn: "Дэлхийн улс орнуудын эрүүл мэндийн тогтолцоо, бодлого хэрхэн ажилладаг, хаана бүтэлгүйтдэг тухай.",
    descEn: "How health systems and policy work (and fail) around the world.",
    format: "Ганц курс · видео",
    url: "https://www.classcentral.com/course/challengesgh-2376",
    freeForAll: false,
    certNoteMn: "Үзэхэд үнэгүй, гэрчилгээ төлбөртэй (санхүүгийн тусламж боломжтой)",
    certNoteEn: "Free to watch; certificate is paid (financial aid available)",
  },
];

export default function ProfessionalCoursesPage() {
  const { t } = useLanguage();
  const [authState, setAuthState] = useState<"loading" | "out" | "in">("loading");
  const [membership, setMembership] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setAuthState("out"); return; }
    const { data } = await supabase
      .from("members")
      .select("membership")
      .eq("id", session.user.id)
      .single();
    setMembership(data?.membership ?? "regular");
    setAuthState("in");
  }, []);

  // Standard fetch-on-mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  if (authState === "loading") {
    return <div className="container-page flex h-64 items-center justify-center text-slate-400">{t("Ачааллаж байна...", "Loading...")}</div>;
  }

  if (authState === "out") {
    return (
      <div>
        <PageHeader
          eyebrow={t("Сургалт", "Training")}
          title={t("Мэргэжлийн сургалтууд", "Professional Courses")}
          subtitle={t(
            "Дэлхийн шилдэг их сургуулиудын үнэгүй видео курсууд",
            "Free video courses from top universities worldwide"
          )}
        />
        <div className="container-page py-16">
          <div className="mx-auto max-w-md rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <p className="text-4xl">🔒</p>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{t("Зөвхөн гишүүдэд", "Members Only")}</h2>
            <p className="mt-2 text-sm text-slate-600">
              {t(
                "Жагсаалтыг харахын тулд нэвтэрнэ үү.",
                "Log in to see the course list."
              )}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/login" className="rounded-md bg-[var(--brand-blue)] px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
                {t("Нэвтрэх", "Log in")}
              </Link>
              <Link href="/register" className="rounded-md border border-[var(--brand-red)] px-6 py-2.5 text-sm font-bold text-[var(--brand-red)] hover:bg-red-50">
                {t("Бүртгүүлэх", "Register")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isProfessional = membership === "professional";

  return (
    <div>
      <PageHeader
        eyebrow={t("Сургалт", "Training")}
        title={t("Мэргэжлийн сургалтууд", "Professional Courses")}
        subtitle={t(
          "Дэлхийн шилдэг их сургуулиудын (Johns Hopkins, Yale, Imperial College London, Duke, ДЭМБ гэх мэт) даатгалын эмчид тохирсон 10 үнэгүй видео курс",
          "10 free video courses from top universities (Johns Hopkins, Yale, Imperial College London, Duke, WHO) matched to insurance-doctor work"
        )}
      />

      <div className="container-page py-12">
        {!isProfessional && (
          <div className="mx-auto mb-8 max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">
              {t(
                "Эдгээр 10 курсын 9 нь Мэргэжлийн гишүүдэд зориулагдсан.",
                "9 of these 10 courses are reserved for Professional members."
              )}
            </p>
            <p className="mt-1">
              {t(
                "Доорх ДЭМБ-ын курс бүх гишүүнд нээлттэй — үлдсэн 9-ийг үзэхийн тулд Мэргэжлийн гишүүнчлэлд шилжинэ үү.",
                "The WHO course below is open to every member — upgrade to Professional membership to unlock the other 9."
              )}
            </p>
            <Link
              href="/dashboard"
              className="mt-3 inline-block rounded-md bg-[var(--brand-blue)] px-5 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              {t("Мэргэжлийн гишүүн болох →", "Upgrade to Professional →")}
            </Link>
          </div>
        )}

        <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2">
          {COURSES.map((c) => {
            const unlocked = c.freeForAll || isProfessional;
            return (
              <div
                key={c.id}
                className={`relative rounded-xl border p-6 shadow-sm transition-shadow ${
                  unlocked ? "border-slate-200 hover:shadow-md" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-slate-900">{t(c.titleMn, c.titleEn)}</h3>
                  {c.freeForAll ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-800">
                      {t("Бүх гишүүнд", "All members")}
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-[var(--brand-blue)]">
                      {t("Мэргэжлийн", "Professional")}
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-400">{c.provider}</p>
                <p className="mt-2 text-sm text-slate-600">{t(c.descMn, c.descEn)}</p>
                <p className="mt-3 text-xs text-slate-400">{c.format}</p>
                <p className="mt-1 text-xs text-slate-400">{t(c.certNoteMn, c.certNoteEn)}</p>

                {unlocked ? (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block rounded-md bg-[var(--brand-blue)] px-5 py-2 text-sm font-bold text-white hover:opacity-90"
                  >
                    {t("Курс руу очих →", "Go to course →")}
                  </a>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-400">
                    🔒 {t("Мэргэжлийн гишүүнд зориулав", "Professional members only")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
