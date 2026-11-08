import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Англи хэлний курс", "Гишүүдэд үнэгүй — 30 өдрийн ярианы англи хэлний курс (CEFR A1–B1), видео хичээл, гэрчилгээтэй.", "/trainings/english/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
