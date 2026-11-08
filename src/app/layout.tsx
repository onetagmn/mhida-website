import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource/noto-sans/400.css";
import "@fontsource/noto-sans/500.css";
import "@fontsource/noto-sans/600.css";
import "@fontsource/noto-sans/700.css";
import "@fontsource/noto-sans/800.css";
import "@fontsource/noto-sans/cyrillic-400.css";
import "@fontsource/noto-sans/cyrillic-500.css";
import "@fontsource/noto-sans/cyrillic-600.css";
import "@fontsource/noto-sans/cyrillic-700.css";
import "@fontsource/noto-sans/cyrillic-800.css";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// What Facebook, Messenger and other apps show when a mhida.org link is
// shared (Open Graph). Pages override the title/description in their
// own layout.tsx; news stories get theirs from /news/p/<id>/.
export const metadata: Metadata = {
  metadataBase: new URL("https://mhida.org"),
  title: "MHIDA — Монголын Даатгалын Эмч Нарын Холбоо",
  description:
    "Монголын Даатгалын Эмч Нарын Холбоо — сургалт, эрх зүйн мэдээлэл, гишүүдийн сүлжээ. Mongolian Health Insurance Doctors Association.",
  openGraph: {
    type: "website",
    siteName: "МДЭНХ · MHIDA",
    locale: "mn_MN",
    url: "https://mhida.org/",
    title: "Монголын Даатгалын Эмч Нарын Холбоо",
    description: "Даатгалын эмч нарын мэргэжлийн холбоо — сургалт, эрх зүйн мэдээлэл, туршлага солилцоо нэг дороос.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "МДЭНХ — Монголын Даатгалын Эмч Нарын Холбоо" }],
  },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: [
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo-32.png`, sizes: "32x32", type: "image/png" },
      { url: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo-48.png`, sizes: "48x48", type: "image/png" },
    ],
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/logo-180.png`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* GoatCounter — privacy-friendly visit counter, no cookies/consent banner needed. */}
        <Script
          data-goatcounter="https://hida.goatcounter.com/count"
          src="https://gc.zgo.at/count.js"
          strategy="afterInteractive"
        />
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
