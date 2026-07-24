export type NewsPost = {
  id: string;
  title: string;
  body: string;
  image_urls: string[];
  published: boolean;
  created_at: string;
};

export function firstYoutubeThumb(body: string): string | null {
  const m =
    body.match(/youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/) ||
    body.match(/youtu\.be\/([\w-]{6,})/) ||
    body.match(/youtube\.com\/shorts\/([\w-]{6,})/) ||
    body.match(/youtube\.com\/embed\/([\w-]{6,})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

export function formatDate(iso: string, lang: "mn" | "en"): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return lang === "mn" ? `${y}.${m}.${day}` : d.toLocaleDateString("en-GB", {
    year: "numeric", month: "short", day: "numeric",
  });
}
