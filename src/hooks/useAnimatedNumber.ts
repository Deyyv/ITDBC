import { useEffect, useRef, useState } from 'react'

type AnimatedNumberOptions = {
  duration?: number
}

export function useAnimatedNumber(
  target: number,
  { duration = 700 }: AnimatedNumberOptions = {},
) {
  const [value, setValue] = useState(0)
  const previousRef = useRef(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const from = previousRef.current

    if (reduced) {
      previousRef.current = target
      setValue(target)
      return
    }

    let frame = 0
    const start = performance.now()

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(from + (target - from) * eased)
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    previousRef.current = target

    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}
