import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Холбоо барих", "Монголын Даатгалын Эмч Нарын Холбоотой холбогдох.", "/contact/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
