import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Мэргэжлийн сургалтууд", "Johns Hopkins, Yale, Imperial College London, ДЭМБ зэрэг сургуулиудын үнэгүй видео курсууд.", "/trainings/professional-courses/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
