import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Хууль, эрх зүйн акт", "Даатгалын эмч нарын ажилд хамаатай хууль, тогтоол, тушаал — төрлөөр нь ангилсан, PDF-ээр.", "/legal/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
