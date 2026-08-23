import { useEffect, useState } from 'react'

// Dependency-free count-up for the admin dashboard's KPI tiles: a plain
// rAF loop from 0 to the target with an ease-out curve, no animation
// library needed for a one-shot number tween.
export function useCountUp(target, durationMs = 900) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (typeof target !== 'number' || Number.isNaN(target)) return
    let raf
    const start = performance.now()
    function tick(now) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
