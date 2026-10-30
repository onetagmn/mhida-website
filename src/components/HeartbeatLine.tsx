// A red heartbeat pulse running across the hero along an invisible ECG
// line — the home page's "alive" touch, fitting for a doctors'
// association. The pulse is three dashes of the same path (a long faint
// trail, a shorter brighter one and a glowing head) moving together
// (globals.css, .ecg-*). The line stretches to the hero's width; its
// stroke stays 2px thanks to non-scaling-stroke. Hidden for reduced
// motion. Purely decorative.

// Flat baseline at y=60 with four beats (P wave, QRS spike, T wave).
const BEATS = [80, 380, 680, 980];
const PATH =
  "M0 60 " +
  BEATS.map(
    (x) =>
      `L${x} 60 Q${x + 12} 48 ${x + 24} 60 L${x + 40} 60 L${x + 46} 68 L${x + 54} 16 L${x + 62} 82 L${x + 70} 60 L${x + 92} 60 Q${x + 110} 44 ${x + 128} 60`
  ).join(" ") +
  " L1200 60";

export default function HeartbeatLine({ className = "" }: { className?: string }) {
  const line = { d: PATH, pathLength: 1, fill: "none", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", vectorEffect: "non-scaling-stroke" } as const;
  return (
    <svg aria-hidden="true" viewBox="0 0 1200 100" preserveAspectRatio="none" className={`pointer-events-none ${className}`}>
      <path {...line} stroke="var(--brand-red)" strokeOpacity={0.2} className="ecg-trail" />
      <path {...line} stroke="var(--brand-red)" strokeOpacity={0.45} className="ecg-mid" />
      <path {...line} stroke="var(--brand-red)" strokeWidth={3} className="ecg-head" />
    </svg>
  );
}
