import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Мэдээ мэдээлэл", "Холбооны мэдээ, сургалт, түншлэл болон эрүүл мэндийн даатгалын салбарын мэдээ.", "/news/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
