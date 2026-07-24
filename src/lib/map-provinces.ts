// Mapping between @react-map/mongolia region keys and the Mongolian
// province names stored in the members database.
export const MAP_KEY_TO_MN: Record<string, string> = {
  "Ulaanbaatar": "Улаанбаатар",
  "Orhon": "Орхон",
  "Darhan uul": "Дархан-Уул",
  "Hentiy": "Хэнтий",
  "Hövsgöl": "Хөвсгөл",
  "Hovd": "Ховд",
  "Uvs": "Увс",
  "Töv": "Төв",
  "Selenge": "Сэлэнгэ",
  "Sühbaatar": "Сүхбаатар",
  "Omnögovĭ": "Өмнөговь",
  "Ovörhangay": "Өвөрхангай",
  "Dzavhan": "Завхан",
  "Dundgovĭ": "Дундговь",
  "Dornod": "Дорнод",
  "Dornogovĭ": "Дорноговь",
  "Govĭ-Sümber": "Говьсүмбэр",
  "Govĭ-Altay": "Говь-Алтай",
  "Bulgan": "Булган",
  "Bayanhongor": "Баянхонгор",
  "Bayan-Ölgiy": "Баян-Өлгий",
  "Arhangay": "Архангай",
};

export const MN_TO_MAP_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(MAP_KEY_TO_MN).map(([k, v]) => [v, k])
);

// Sequential brand-blue scale by member count.
export function countColor(n: number): string {
  if (n <= 0) return "#EDF1F6";
  if (n <= 2) return "#BBD2E8";
  if (n <= 5) return "#7AA6CE";
  if (n <= 10) return "#3E7BB0";
  return "#015196";
}
