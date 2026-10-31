import type { LegalCategory } from "@/lib/legal";

// Line icons for the Legal Acts shelves, drawn in the two brand colours:
// the shape in blue, its key detail in red. 24×24, round strokes.
const B = "var(--brand-blue)";
const R = "var(--brand-red)";

const ICONS: Record<LegalCategory | "all", React.ReactNode> = {
  // A stack of documents
  all: (
    <>
      <path d="M9 3h6.5L20 7.5V18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={B} />
      <path d="M15.5 3v4.5H20" stroke={B} />
      <path d="M5 7v13a1 1 0 0 0 1 1h10" stroke={B} />
      <path d="M11 11.5h6M11 15h6" stroke={R} />
    </>
  ),
  // Scales of justice
  law: (
    <>
      <path d="M12 4v15M8 20h8M5 7h14" stroke={B} />
      <circle cx="12" cy="4" r="1.2" fill={B} stroke="none" />
      <path d="M5 7l-2.5 6M5 7l2.5 6M19 7l-2.5 6M19 7l2.5 6" stroke={B} />
      <path d="M2 13h6a3 3 0 0 1-6 0zM16 13h6a3 3 0 0 1-6 0z" stroke={R} fill={R} fillOpacity={0.15} />
    </>
  ),
  // Domed parliament house with a flag
  parliament: (
    <>
      <path d="M3 20h18M5 20v-8h14v8M8 12v8M12 12v8M16 12v8" stroke={B} />
      <path d="M6 12a6 6 0 0 1 12 0" stroke={R} />
      <path d="M12 6V2.5h3.5l-1 1.2 1 1.3H12" stroke={R} />
    </>
  ),
  // Government portico with the state emblem
  government: (
    <>
      <path d="M3 9.5L12 4l9 5.5zM5 9.5v8.5M9.7 9.5v8.5M14.3 9.5v8.5M19 9.5v8.5M4 18h16" stroke={B} />
      <path d="M3 21h18" stroke={R} />
      <circle cx="12" cy="7.6" r="1.1" fill={R} stroke="none" />
    </>
  ),
  // An order with the medical cross
  minister: (
    <>
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke={B} />
      <path d="M14 3v4h4" stroke={B} />
      <path d="M12 10v6.5M8.75 13.25h6.5" stroke={R} strokeWidth={2.2} />
    </>
  ),
  // Insurance shield with a cross (the Health Insurance Council)
  emduz: (
    <>
      <path d="M12 3l7 2.8V11c0 4.6-3 8.1-7 10-4-1.9-7-5.4-7-10V5.8z" stroke={B} />
      <path d="M12 8.5v7.5M8.25 12.25h7.5" stroke={R} strokeWidth={2.2} />
    </>
  ),
  // Clipboard with a tick (the agency's orders)
  emdeg: (
    <>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2" stroke={B} />
      <path d="M9 3h6v3H9z" stroke={B} />
      <path d="M8.5 13.5l2.5 2.5 4.5-5" stroke={R} strokeWidth={2.2} />
    </>
  ),
  // Folder
  other: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={B} />
      <path d="M3 10.5h18" stroke={R} />
    </>
  ),
};

export default function LegalIcon({ name, className = "h-6 w-6" }: { name: LegalCategory | "all"; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ICONS[name]}
    </svg>
  );
}
