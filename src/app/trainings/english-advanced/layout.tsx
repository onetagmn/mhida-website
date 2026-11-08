import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Англи хэлний курс — 2-р шат", "Даатгалын эмч нарт зориулсан мэргэжлийн англи хэлний 30 өдрийн курс (CEFR B1–B2), видео хичээл, гэрчилгээтэй.", "/trainings/english-advanced/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
