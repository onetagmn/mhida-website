// Mongolia's 21 aimags + Ulaanbaatar, used by the registration form
// and (later) the interactive member/facility map.
export const PROVINCES: { code: string; mn: string; en: string }[] = [
  { code: "ulaanbaatar", mn: "Улаанбаатар", en: "Ulaanbaatar" },
  { code: "arkhangai", mn: "Архангай", en: "Arkhangai" },
  { code: "bayan-olgii", mn: "Баян-Өлгий", en: "Bayan-Ölgii" },
  { code: "bayankhongor", mn: "Баянхонгор", en: "Bayankhongor" },
  { code: "bulgan", mn: "Булган", en: "Bulgan" },
  { code: "govi-altai", mn: "Говь-Алтай", en: "Govi-Altai" },
  { code: "govisumber", mn: "Говьсүмбэр", en: "Govisümber" },
  { code: "darkhan-uul", mn: "Дархан-Уул", en: "Darkhan-Uul" },
  { code: "dornogovi", mn: "Дорноговь", en: "Dornogovi" },
  { code: "dornod", mn: "Дорнод", en: "Dornod" },
  { code: "dundgovi", mn: "Дундговь", en: "Dundgovi" },
  { code: "zavkhan", mn: "Завхан", en: "Zavkhan" },
  { code: "orkhon", mn: "Орхон", en: "Orkhon" },
  { code: "ovorkhangai", mn: "Өвөрхангай", en: "Övörkhangai" },
  { code: "omnogovi", mn: "Өмнөговь", en: "Ömnögovi" },
  { code: "sukhbaatar", mn: "Сүхбаатар", en: "Sükhbaatar" },
  { code: "selenge", mn: "Сэлэнгэ", en: "Selenge" },
  { code: "tov", mn: "Төв", en: "Töv" },
  { code: "uvs", mn: "Увс", en: "Uvs" },
  { code: "khovd", mn: "Ховд", en: "Khovd" },
  { code: "khovsgol", mn: "Хөвсгөл", en: "Khövsgöl" },
  { code: "khentii", mn: "Хэнтий", en: "Khentii" },
];

// A member's province is stored either as a code (from the register and
// profile forms) or as the Mongolian name (from older imports). Accept both.
export function findProvince(value: string | null | undefined) {
  return PROVINCES.find((p) => p.code === value || p.mn === value);
}

type FacilityStatRow = { province: string | null; workplace: string; member_count: number };

// facility_stats() groups by the stored province, so a facility whose
// members used both spellings comes back twice. Give every row the
// Mongolian province name (null if it isn't one of the 22) and merge
// those duplicates, so counts and the map see one province per place.
export function mergeFacilityStats<T extends FacilityStatRow>(rows: T[]): T[] {
  const merged = new Map<string, T>();
  for (const row of rows) {
    const province = findProvince(row.province)?.mn ?? null;
    const key = `${province}|${row.workplace}`;
    const prev = merged.get(key);
    if (prev) prev.member_count += Number(row.member_count);
    else merged.set(key, { ...row, province, member_count: Number(row.member_count) });
  }
  return [...merged.values()];
}
