import { useEffect, useRef, useState } from 'react'
import { getTimeBand, BAND_META, BAND_ORDER } from '../lib/timeOfDay'
import { logEvent } from '../lib/events'

// The app's palette follows the real local time automatically, no setting
// to save. This badge shows which band is currently active and, for demos
// or judges who show up outside the "interesting" hours, lets you click
// through to preview the others. The preview never persists: reload the
// page (or just wait) and it goes back to matching the real clock.
export default function ThemeToggle() {
  const [autoBand, setAutoBand] = useState(() => getTimeBand())
  const [previewBand, setPreviewBand] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setAutoBand(getTimeBand()), 60 * 1000)
    return () => clearInterval(intervalRef.current)
  }, [])

  const activeBand = previewBand || autoBand

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeBand)
  }, [activeBand])

  function cyclePreview() {
    const currentIndex = BAND_ORDER.indexOf(activeBand)
    const next = BAND_ORDER[(currentIndex + 1) % BAND_ORDER.length]
    setPreviewBand(next)
    logEvent('theme_preview_cycled', { band: next })
  }

  const icons = {
    morning: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="15" r="4.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="12" y1="6" x2="12" y2="8.5" />
          <line x1="5" y1="15" x2="7.5" y2="15" />
          <line x1="16.5" y1="15" x2="19" y2="15" />
          <line x1="6.5" y1="9.5" x2="8.2" y2="11.2" />
          <line x1="17.5" y1="9.5" x2="15.8" y2="11.2" />
        </g>
        <line x1="4" y1="19.5" x2="20" y2="19.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
    day: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <line x1="12" y1="1.5" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22.5" />
          <line x1="1.5" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22.5" y2="12" />
          <line x1="4.2" y1="4.2" x2="6" y2="6" />
          <line x1="18" y1="18" x2="19.8" y2="19.8" />
          <line x1="19.8" y1="4.2" x2="18" y2="6" />
          <line x1="6" y1="18" x2="4.2" y2="19.8" />
        </g>
      </svg>
    ),
    evening: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="14" r="4.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <line x1="5" y1="14" x2="7.5" y2="14" />
          <line x1="16.5" y1="14" x2="19" y2="14" />
          <line x1="6.5" y1="8" x2="8.2" y2="9.7" />
          <line x1="17.5" y1="8" x2="15.8" y2="9.7" />
        </g>
        <line x1="4" y1="19.5" x2="20" y2="19.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="18.5" cy="5.5" r="0.7" fill="currentColor" />
      </svg>
    ),
    night: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z" fill="currentColor" />
        <circle cx="17" cy="6" r="0.8" fill="currentColor" />
        <circle cx="20" cy="9.5" r="0.6" fill="currentColor" />
        <circle cx="14.5" cy="4" r="0.5" fill="currentColor" />
      </svg>
    ),
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cyclePreview}
      aria-label={`Time of day: ${BAND_META[activeBand].label}. Click to preview another.`}
      title={`${BAND_META[activeBand].label}${previewBand ? ' (preview)' : ''}`}
    >
      {icons[activeBand]}
    </button>
  )
}
