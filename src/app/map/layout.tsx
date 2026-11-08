import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Гишүүдийн газрын зураг", "Аймаг, хот, эмнэлэг бүрээрх холбооны гишүүдийн тархалт.", "/map/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
