/** Quantum Bracket mark: a bracket funnelling to a single collapsed point. */
export default function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#14171f" />
      <path
        d="M7 10 H13 V16 H17.5 M7 22 H13 V16"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="22" cy="16" r="2.7" fill="#16a34a" />
    </svg>
  );
}
