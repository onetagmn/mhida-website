// The Legal Acts page's shelves: one per kind of document, matching the
// lists on emd.gov.mn. content_items.category holds the key
// (migration24_legal_shelves.sql); items without one go on "other".
export type LegalCategory = "law" | "parliament" | "government" | "minister" | "emduz" | "emdeg" | "other";

export const LEGAL_SHELVES: { key: LegalCategory; icon: string; mn: string; en: string; tag: string }[] = [
  { key: "law", icon: "⚖️", mn: "Хууль", en: "Laws", tag: "bg-blue-50 text-[var(--brand-blue)] ring-blue-200" },
  { key: "parliament", icon: "🏛️", mn: "УИХ-ын тогтоол", en: "Parliament resolutions", tag: "bg-indigo-50 text-indigo-700 ring-indigo-200" },
  { key: "government", icon: "🏢", mn: "Засгийн газрын тогтоол", en: "Government resolutions", tag: "bg-sky-50 text-sky-700 ring-sky-200" },
  { key: "minister", icon: "🩺", mn: "Эрүүл мэндийн сайдын тушаал", en: "Health Minister's orders", tag: "bg-teal-50 text-teal-700 ring-teal-200" },
  { key: "emduz", icon: "🛡️", mn: "ЭМДҮЗ-ийн тогтоол", en: "Health Insurance Council resolutions", tag: "bg-red-50 text-[var(--brand-red)] ring-red-200" },
  { key: "emdeg", icon: "📋", mn: "ЭМДЕГ-ын даргын тушаал", en: "Health Insurance Agency orders", tag: "bg-orange-50 text-orange-700 ring-orange-200" },
  { key: "other", icon: "📁", mn: "Бусад эрх зүйн акт", en: "Other legal acts", tag: "bg-slate-100 text-slate-600 ring-slate-200" },
];

export function shelfOf(category: string | null | undefined) {
  return LEGAL_SHELVES.find((s) => s.key === category) ?? LEGAL_SHELVES[LEGAL_SHELVES.length - 1];
}
