// Small line icons for the home page's stat cards, drawn in the two
// brand colours (shape blue, key detail red), in place of emoji.
const B = "var(--brand-blue)";
const R = "var(--brand-red)";

export type StatIconName = "map" | "cap" | "people" | "trend" | "trophy" | "news" | "person";

const ICONS: Record<StatIconName, React.ReactNode> = {
  // Folded map with a red pin
  map: (
    <>
      <path d="M3 6.5l5.5-2.5 7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20z" stroke={B} />
      <path d="M8.5 4v13.5M15.5 6.5V20" stroke={B} />
      <circle cx="12" cy="10.5" r="1.8" fill={R} stroke="none" />
    </>
  ),
  // Graduation cap with a red tassel
  cap: (
    <>
      <path d="M2.5 9L12 4.5 21.5 9 12 13.5z" stroke={B} />
      <path d="M6.5 11v4.5c1.5 1.5 3.5 2.2 5.5 2.2s4-.7 5.5-2.2V11" stroke={B} />
      <path d="M21.5 9v5.5" stroke={R} />
      <circle cx="21.5" cy="16" r="1.2" fill={R} stroke="none" />
    </>
  ),
  // Two people, the front one red
  people: (
    <>
      <circle cx="15.5" cy="8" r="3" stroke={B} />
      <path d="M11 20v-1a4.5 4.5 0 0 1 9 0v1" stroke={B} />
      <circle cx="8.5" cy="9" r="3" stroke={R} />
      <path d="M3.5 20v-1a5 5 0 0 1 10 0v1" stroke={R} />
    </>
  ),
  // Rising line on axes
  trend: (
    <>
      <path d="M3.5 3.5v17h17" stroke={B} />
      <path d="M7 15l4-4.5 3 3L20 7" stroke={R} />
      <path d="M16 7h4v4" stroke={R} />
    </>
  ),
  // Trophy with a red star
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" stroke={B} />
      <path d="M7 6H4.5a2.5 2.5 0 0 0 2.5 4M17 6h2.5a2.5 2.5 0 0 1-2.5 4M12 14v3.5M8.5 20.5h7M9.5 17.5h5" stroke={B} />
      <path d="M12 6.2l.8 1.6 1.7.2-1.3 1.2.3 1.7-1.5-.8-1.5.8.3-1.7-1.3-1.2 1.7-.2z" fill={R} stroke="none" />
    </>
  ),
  // One member (filled red), for the new-member pictogram
  person: (
    <>
      <circle cx="12" cy="7.5" r="3.6" fill={R} stroke="none" />
      <path d="M5 21v-1.5a7 7 0 0 1 14 0V21z" fill={R} stroke="none" />
    </>
  ),
  // Newspaper with red headline lines
  news: (
    <>
      <path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" stroke={B} />
      <path d="M17 9h3v10a2 2 0 0 1-2 2" stroke={B} />
      <path d="M7 9h7M7 12.5h7" stroke={R} />
      <path d="M7 16h4" stroke={B} />
    </>
  ),
};

export default function StatIcon({ name, className = "h-3.5 w-3.5" }: { name: StatIconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`inline-block shrink-0 ${className}`}>
      {ICONS[name]}
    </svg>
  );
}
