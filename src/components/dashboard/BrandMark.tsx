type BrandMarkProps = {
  size?: number
  className?: string
}

export default function BrandMark({ size = 40, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="40" height="40" rx="12" fill="var(--dash-forest)" />
      <path
        d="M13.8 16.5c0-3.2 2.7-5.8 6.2-5.8 2.1 0 3.9 1 5 2.5"
        stroke="var(--dash-signal)"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M10.7 16.8h18.6l-2.1 9.1a3.2 3.2 0 0 1-3.1 2.5h-8.2a3.2 3.2 0 0 1-3.1-2.5l-2.1-9.1Z"
        stroke="var(--dash-signal)"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M16.2 20.3v4.1M20 20.3v4.1M23.8 20.3v4.1"
        stroke="var(--dash-signal)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.72"
      />
      <circle cx="29.1" cy="10.9" r="2.1" fill="var(--dash-lime)" />
    </svg>
  )
}
