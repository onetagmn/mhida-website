import type { Metadata } from "next";

// A page's title and description for search results and for the preview
// Facebook/Messenger show when the link is shared. A page's openGraph
// replaces the site-wide one, so the picture is repeated here.
export function pageMeta(title: string, description: string, path: string, image = "/og-image.png"): Metadata {
  const full = `${title} — МДЭНХ`;
  return {
    title: full,
    description,
    openGraph: {
      type: "website",
      siteName: "МДЭНХ · MHIDA",
      locale: "mn_MN",
      url: path,
      title: full,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}
