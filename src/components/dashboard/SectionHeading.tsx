import type { ReactNode } from 'react'

type SectionHeadingProps = {
  id: string
  title: string
  children: ReactNode
}

/** Title and one-sentence purpose of a page section. */
export default function SectionHeading({ id, title, children }: SectionHeadingProps) {
  return (
    <header className="mb-8 max-w-[62ch] lg:mb-10">
      <h2
        id={id}
        className="font-disp text-[clamp(1.65rem,2.8vw,2.3rem)] font-medium leading-[1.1] tracking-[-0.02em] text-dash-ink"
      >
        {title}
      </h2>
      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-dash-muted">{children}</p>
    </header>
  )
}
