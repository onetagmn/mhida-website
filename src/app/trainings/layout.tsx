import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Сургалтууд", "AXIS, e-Health, англи хэлний 2 шатны курс болон дэлхийн шилдэг сургуулиудын үнэгүй мэргэжлийн сургалтууд.", "/trainings/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
