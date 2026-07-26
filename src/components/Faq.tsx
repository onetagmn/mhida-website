"use client";

import { useLanguage } from "@/lib/language-context";

type QA = { q: [string, string]; a: [string, string] };

const ITEMS: QA[] = [
  {
    q: ["Гишүүн болох үнэ төлбөртэй юу?", "Is membership free?"],
    a: [
      "Энгийн гишүүнчлэл бүрэн үнэ төлбөргүй. Мэргэжлийн гишүүнчлэл нэмэлт боломжуудтай бөгөөд жилд 240,000₮.",
      "Regular membership is completely free. Professional membership adds extra benefits and costs 240,000₮/year.",
    ],
  },
  {
    q: ["Миний имэйл, утасны дугаар бусад гишүүдэд харагдах уу?", "Will other members see my email or phone number?"],
    a: [
      "Зөвхөн админ таны бүртгэлийг баталгаажуулсны дараа бусад идэвхтэй гишүүд харах боломжтой. Газрын зураг дээрх аймаг/эмнэлгийн тоо бүгдэд нээлттэй, гэхдээ энэ нь ямар ч хувийн мэдээлэл агуулаагүй.",
      "Only after an admin approves your account can other active members see your contact details. The public map shows aggregate counts per region/facility only — no personal info.",
    ],
  },
  {
    q: ["Бүртгүүлсний дараа шууд нэвтэрч болох уу?", "Can I log in right after registering?"],
    a: [
      "Тийм, бүртгүүлмэгц шууд нэвтэрч, өөрийн хэсэг болон сургалтуудаа ашиглаж эхэлнэ. Зөвхөн гишүүдийн каталогт (бусдын мэдээлэл) харагдахын тулд админ баталгаажуулах хугацаа шаардлагатай.",
      "Yes — you can log in immediately and start using your dashboard and courses. Only visibility in the member directory (other people's info) waits on admin approval.",
    ],
  },
  {
    q: ["Англи хэлний курс хэрхэн эхлэх вэ?", "How do I start the English course?"],
    a: [
      "Нэвтэрсний дараа \"Сургалтууд\" цэснээс сонгоно уу — 30 өдрийн видео хичээл, шалгалт, төгсөхөд гэрчилгээ олгоно.",
      "After logging in, go to Trainings — a 30-day video course with quizzes, and a certificate when you finish.",
    ],
  },
  {
    q: ["Мэргэжлийн гишүүнчлэл рүү хожим шилжиж болох уу?", "Can I upgrade to professional membership later?"],
    a: [
      "Тийм, өөрийн хэсгээс хүссэн үедээ хүсэлт гаргаж, төлбөр хийсний дараа админ баталгаажуулна.",
      "Yes — request an upgrade from your dashboard any time; an admin confirms it once payment is received.",
    ],
  },
  {
    q: ["Нууц үгээ мартвал яах вэ?", "What if I forget my password?"],
    a: [
      "Нэвтрэх хуудсан дээрх \"нууц үг сэргээх\" холбоосыг ашиглан имэйлээрээ шинэ нууц үг тохируулна уу.",
      "Use the \"reset password\" link on the login page — a reset link is sent to your email.",
    ],
  },
];

export default function Faq() {
  const { t, lang } = useLanguage();
  return (
    <div className="space-y-2">
      <h2 className="mb-3 text-lg font-bold text-slate-900">{t("Түгээмэл асуулт", "Frequently asked questions")}</h2>
      {ITEMS.map((item, i) => (
        <details
          key={i}
          className="group rounded-lg border border-slate-200 px-4 py-3 open:bg-slate-50"
        >
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800 marker:content-none">
            <span className="flex items-center justify-between gap-3">
              {lang === "mn" ? item.q[0] : item.q[1]}
              <span className="shrink-0 text-slate-400 transition-transform group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {lang === "mn" ? item.a[0] : item.a[1]}
          </p>
        </details>
      ))}
    </div>
  );
}
