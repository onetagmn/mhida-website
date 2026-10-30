import { asset } from "@/lib/asset";

export type NewsPost = {
  id: string;
  title: string;
  body: string;
  image_urls: string[];
  pdf_urls: string[];
  category: "news" | "partner";
  published: boolean;
  created_at: string;
};

/** Resolve a stored PDF reference: full URLs pass through, site-relative
 *  paths (e.g. "docs/file.pdf") get the deployment base path. */
export function pdfHref(url: string): string {
  return /^https?:\/\//.test(url) ? url : asset("/" + url.replace(/^\//, ""));
}

// Supabase Storage keys only accept a narrow ASCII set (roughly
// [\w!\-.*'()&$@=;:+,? /]) — raw Cyrillic/Mongolian file names AND
// encodeURIComponent's "%" sequences both get rejected with
// "Invalid key". Base64url output only uses letters, digits, "-" and
// "_", which Storage always accepts, so we slug the name through that
// instead and decode it back for display.
function toSlug(name: string): string {
  const bytes = new TextEncoder().encode(name);
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromSlug(slug: string): string | null {
  try {
    const b64 = slug.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Builds a unique, Storage-safe upload path for any file name/language:
 *  "<folder>/<timestamp>-<base64url-slug-of-original-name>". */
export function storagePath(folder: string, fileName: string): string {
  return `${folder}/${Date.now()}-${toSlug(fileName)}`;
}

export function pdfName(url: string): string {
  const raw = url.split("/").pop() ?? "PDF";
  const dash = raw.indexOf("-");
  if (dash > -1 && /^\d+$/.test(raw.slice(0, dash))) {
    const decoded = fromSlug(raw.slice(dash + 1));
    if (decoded) return decoded.replace(/\.pdf$/i, "").trim() || "PDF";
  }
  // Fallback for PDFs uploaded before this scheme (plain sanitized or
  // percent-encoded names already sitting in Storage).
  try {
    return decodeURIComponent(raw).replace(/[_-]+/g, " ").replace(/\.pdf$/i, "").trim() || "PDF";
  } catch {
    return raw.replace(/[_-]+/g, " ").replace(/\.pdf$/i, "").trim() || "PDF";
  }
}

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
