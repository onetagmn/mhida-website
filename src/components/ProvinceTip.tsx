"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { MAP_KEY_TO_MN } from "@/lib/map-provinces";
import { findProvince } from "@/lib/provinces";

type Tip = { x: number; y: number; mn: string; count: number };

// Hover label for the Mongolia maps: the SVG paths carry ids like
// "<map key>-<n>", so the pointer resolves to a province and the label
// shows its name in the page's language with its member count.
export function useProvinceTip(counts: Map<string, number>) {
  const [tip, setTip] = useState<Tip | null>(null);
  function onMouseMove(e: React.MouseEvent) {
    const path = (e.target as Element).closest?.("path");
    const key = path?.id && Object.keys(MAP_KEY_TO_MN).find((k) => path.id.startsWith(k + "-"));
    if (!key) { setTip(null); return; }
    const mn = MAP_KEY_TO_MN[key];
    setTip({ x: e.clientX, y: e.clientY, mn, count: counts.get(mn) ?? 0 });
  }
  return { tip, onMouseMove, onMouseLeave: () => setTip(null) };
}

export function ProvinceTip({ tip }: { tip: Tip | null }) {
  const { t, lang } = useLanguage();
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 rounded-md bg-[#0f2f4f] px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
      style={{ left: tip.x + 14, top: tip.y + 14 }}
    >
      {lang === "mn" ? tip.mn : findProvince(tip.mn)?.en ?? tip.mn}
      <span className="ml-1.5 font-normal opacity-75">
        · {tip.count} {t("гишүүн", "members")}
      </span>
    </div>
  );
}
