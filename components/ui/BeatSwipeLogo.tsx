interface BeatSwipeLogoProps {
  className?: string
  size?: number
}

export function BeatSwipeLogo({ className, size = 28 }: BeatSwipeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-label="BeatSwipe"
    >
      {/* Waveform bars — 5 bars, bottom-anchored at y=16 */}
      <rect x="0.5"  y="9"  width="3" height="7"  rx="1.5" />
      <rect x="5.5"  y="3"  width="3" height="13" rx="1.5" />
      <rect x="10.5" y="7"  width="3" height="9"  rx="1.5" />
      <rect x="15.5" y="1"  width="3" height="15" rx="1.5" />
      <rect x="20.5" y="6"  width="3" height="10" rx="1.5" />

      {/* Swipe arrow — horizontal line + arrowhead pointing right */}
      <path
        d="M1 20.5 H21.5 M18 17.5 L21.5 20.5 L18 23.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
