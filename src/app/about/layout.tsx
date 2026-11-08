import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("Танилцуулга", "Монголын Даатгалын Эмч Нарын Холбооны зорилго, үйл ажиллагаа, удирдлага.", "/about/");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
