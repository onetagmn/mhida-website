"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import PageHeader from "@/components/PageHeader";
import DraftNotice from "@/components/DraftNotice";
import { supabase } from "@/lib/supabase";

type Leader = {
  id: string;
  name: string;
  title: string;
  photo_url: string | null;
  is_president: boolean;
  sort_order: number;
};

type Stats = { members: number; facilities: number; provinces: number };

const activities: { mn: string; en: string }[] = [
  {
    mn: "Монгол улсад эрүүл мэндийн даатгалыг хөгжүүлэх бодлого, чиглэлийг боловсруулахад оролцох",
    en: "Participate in developing policy and strategic direction for health insurance in Mongolia",
  },
  {
    mn: "Эрүүл мэндийн даатгалын нэгжтэй бүхий л хуулийн этгээдийн үйл ажиллагааг тал бүрээр дэмжин ажиллах",
    en: "Comprehensively support the work of all legal entities operating health insurance units",
  },
  {
    mn: "Эрүүл мэндийн даатгалын эмч болон бусад мэргэжилтнийг мэргэшүүлэх, мэргэжил дээшлүүлэх тасралтгүй сургалтын үйл ажиллагааг тал бүрээр дэмжих",
    en: "Support continuous specialization and professional development training for health insurance doctors and other professionals",
  },
  {
    mn: "Даатгалын эмч нарын анагаах ухааны судалгааны ажлыг дэмжиж, онол практикийн хурал, зөвлөгөөн, семинар, сургалт зохион байгуулах",
    en: "Support medical research by insurance doctors and organize scientific-practical conferences, consultations, seminars, and trainings",
  },
  {
    mn: "Даатгалын эмч нарын мэргэжлийн зэрэг хамгаалах, ахиулах үйл ажиллагааг холбогдох байгууллагуудтай хамтран дэмжих",
    en: "Support professional degree attainment and advancement in cooperation with relevant organizations",
  },
  {
    mn: "Эрүүл мэндийн даатгалын чиглэлээр сонин, сэтгүүл, ном, товхимол гаргах зэрэг хэвлэл нийтлэлийн үйл ажиллагаа явуулах",
    en: "Publish newspapers, journals, books, and booklets in the field of health insurance",
  },
  {
    mn: "Эрүүл мэндийн даатгалын чиглэлээр олон нийтэд боловсрол олгох",
    en: "Provide public education on health insurance",
  },
  {
    mn: "Даатгалын эмч нарын хууль ёсны эрх ашгийг хамгаалж, тэдний үйл ажиллагааг дэмжих олон талт арга хэмжээг холбогдох байгууллагуудтай хамтран зохион байгуулах",
    en: "Protect the legal rights and interests of insurance doctors and organize multifaceted supporting measures with relevant organizations",
  },
  {
    mn: "Олон улсын болон гадаадын ижил төрлийн байгууллагуудтай холбоо тогтоож, эмч мэргэжилтэн, төлөөлөгч, мэдээлэл солилцох зэргээр гадаад харилцааг хөгжүүлэх",
    en: "Develop international relations — cooperating with peer organizations abroad and exchanging doctors, specialists, delegates, and information",
  },
];

const duties: { mn: string; en: string }[] = [
  {
    mn: "Даатгалын эмч нарын чадавхыг хөгжүүлэхэд хүчин зүтгэж, хувь нэмрээ оруулах",
    en: "Contribute actively to developing the professional capacity of insurance doctors",
  },
  {
    mn: "Судалгаа, сургалт, олон нийтийг эрүүлжүүлэх, өвчнөөс урьдчилан сэргийлэх ажил зохион байгуулах",
    en: "Organize research, training, public health promotion, and disease prevention activities",
  },
  {
    mn: "Холбооны гишүүний татварыг жил бүр төлөх",
    en: "Pay the annual membership fee",
  },
  {
    mn: "Холбооны шийдвэрийг хэрэгжүүлэх",
    en: "Implement the decisions of the Association",
  },
  {
    mn: "Холбоонд хандив, туслалцаа үзүүлэх",
    en: "Provide donations and support to the Association",
  },
];

export default function AboutPage() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    (async () => {
      const [statsRes, leadersRes] = await Promise.all([
        supabase.rpc("facility_stats"),
        supabase
          .from("leadership")
          .select("id, name, title, photo_url, is_president, sort_order")
          .order("is_president", { ascending: false })
          .order("sort_order"),
      ]);
      const rows = (statsRes.data as { province: string | null; workplace: string; member_count: number }[]) ?? [];
      setStats({
        members: rows.reduce((a, r) => a + Number(r.member_count), 0),
        facilities: rows.length,
        provinces: new Set(rows.map((r) => r.province).filter(Boolean)).size,
      });
      setLeaders(leadersRes.data ?? []);
    })();
  }, []);

  const president = leaders.filter((l) => l.is_president);
  const board = leaders.filter((l) => !l.is_president);

  return (
    <div>
      <PageHeader
        eyebrow={t("Танилцуулга", "About")}
        title={t(
          "Монголын Даатгалын Эмч Нарын Холбоо",
          "Mongolian Health Insurance Doctors Association"
        )}
        subtitle={t(
          "МДЭНХ — даатгалын эмч нарыг дэмжих зорилготой, сайн дурын үндсэн дээр байгуулагдсан олон нийтийн байгууллага.",
          "MHIDA — a voluntary public organization founded to support and unite Mongolia's health insurance doctors."
        )}
      />

      <div className="container-page grid gap-12 py-12 md:grid-cols-3">
        <div className="space-y-12 md:col-span-2">
          {/* Intro */}
          <section>
            <p className="leading-relaxed text-slate-700">
              {t(
                "«Монголын даатгалын эмч нарын холбоо» (товчилбол «МДЭНХ») нь Монгол Улсын Үндсэн хуульд заасан чиг үүргийг хэрэгжүүлэх, даатгалын эмч нарын холбооны гишүүнчлэл, гишүүдийн эрх, үүрэг, үйл ажиллагаа, бүтэц, зохион байгуулалт, удирдлага, санхүүжилт, даатгалын үйл ажиллагаа эрхлэхтэй холбоотойгоор даатгалын эмч болон даатгалын эмч нарын холбооны хооронд үүсэх харилцааг зохицуулахад, тэдгээрийг дэмжих хүмүүсийн сайн дурын үндсэн дээр байгуулагдсан олон нийтийн байгууллага мөн.",
                "The Mongolian Health Insurance Doctors Association (MHIDA) is a voluntary public organization established to fulfil the functions set out in the Constitution of Mongolia and to regulate the relations between insurance doctors and their association — covering membership, members' rights and duties, activities, structure and organization, governance, financing, and the conduct of insurance-related work — founded on the goodwill of those who support insurance doctors."
              )}
            </p>
          </section>

          {/* Mission */}
          <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 sm:p-8">
            <h2 className="mb-3 text-xl font-bold text-[var(--brand-blue)]">
              {t("Холбооны зорилго", "Our Mission")}
            </h2>
            <p className="leading-relaxed text-slate-700">
              {t(
                "МДЭНХ-ны зорилго нь Монгол Улсад эрүүл мэндийн даатгалын салбарыг бүхий л чиглэлээр хөгжүүлэх, үр ашгийг олонд таниулах, даатгалын эмч нарын мэргэжлийн чадавхыг дээшлүүлэх, хамгаалах, дэмжиж ажиллах, иргэн бүрт эрүүл мэндийн бүхий л үйл ажиллагааг хүртээмжтэй байлгах, эрүүл мэндийн өндөр зардлаас урьдчилан сэргийлэхэд оршино.",
                "Our mission is to develop Mongolia's health insurance sector in all its dimensions, raise public awareness of its benefits, strengthen, protect, and support the professional capacity of insurance doctors, make healthcare accessible to every citizen, and help prevent catastrophic health expenditures."
              )}
            </p>
          </section>

          {/* Activities */}
          <section>
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {t("Үйл ажиллагаа", "What We Do")}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {activities.map((a, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700"
                >
                  <span
                    aria-hidden
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-red)]"
                  />
                  {t(a.mn, a.en)}
                </li>
              ))}
            </ul>
          </section>

          {/* Member duties */}
          <section>
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {t("Холбооны гишүүний үүрэг", "Member Responsibilities")}
            </h2>
            <ol className="space-y-3">
              {duties.map((d, i) => (
                <li key={i} className="flex gap-4 text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{t(d.mn, d.en)}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Leadership */}
          <section>
            <h2 className="mb-5 text-xl font-bold text-slate-900">
              {t("Удирдлага", "Leadership")}
            </h2>
            {leaders.length === 0 ? (
              <DraftNotice
                note={t(
                  "Удирдлагын мэдээллийг админ самбараас нэмнэ.",
                  "Leadership is added from the admin panel."
                )}
              />
            ) : (
              <div className="space-y-8">
                {president.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-8">
                    {president.map((l) => (
                      <div key={l.id} className="text-center">
                        {l.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.photo_url} alt={l.name} className="mx-auto h-36 w-36 rounded-full border-4 border-blue-100 object-cover" />
                        ) : (
                          <span className="mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-slate-100 text-4xl">👤</span>
                        )}
                        <p className="mt-3 text-lg font-bold text-slate-900">{l.name}</p>
                        <p className="text-sm font-semibold text-[var(--brand-red)]">{l.title}</p>
                      </div>
                    ))}
                  </div>
                )}
                {board.length > 0 && (
                  <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                    {board.map((l) => (
                      <div key={l.id} className="text-center">
                        {l.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.photo_url} alt={l.name} className="mx-auto h-24 w-24 rounded-full object-cover" />
                        ) : (
                          <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-slate-100 text-2xl">👤</span>
                        )}
                        <p className="mt-2 text-sm font-bold text-slate-900">{l.name}</p>
                        <p className="text-xs text-slate-500">{l.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Partnership content lives on the homepage ("Түншлэл ба мэдээ"),
              managed from the News admin with the "Түншлэл" type. */}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {t("Одоогийн байдал", "At a glance")}
            </h3>
            {stats === null ? (
              <p className="text-sm text-slate-400">{t("Ачааллаж байна...", "Loading...")}</p>
            ) : (
              <dl className="space-y-4">
                <div>
                  <dd className="text-3xl font-extrabold text-[var(--brand-blue)]">{stats.members}</dd>
                  <dt className="text-sm text-slate-600">{t("Гишүүн", "Members")}</dt>
                </div>
                <div>
                  <dd className="text-3xl font-extrabold text-[var(--brand-blue)]">{stats.facilities}</dd>
                  <dt className="text-sm text-slate-600">{t("Эмнэлэг, байгууллага", "Facilities")}</dt>
                </div>
                <div>
                  <dd className="text-3xl font-extrabold text-[var(--brand-blue)]">{stats.provinces}</dd>
                  <dt className="text-sm text-slate-600">{t("Аймаг, хот", "Provinces")}</dt>
                </div>
              </dl>
            )}
            <p className="mt-4 text-xs text-slate-400">
              {t("Бүртгэлийн сангаас автоматаар шинэчлэгдэнэ.", "Updates automatically from the live registry.")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
