// Maps the current local hour to one of 4 time-of-day bands. Pure function
// of a Date so it's trivially testable, and the exact same logic is
// duplicated (deliberately, in plain JS) in index.html's pre-paint script
// to avoid a flash of the wrong theme before React mounts.
export function getTimeBand(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'evening'
  return 'night'
}

export const BAND_META = {
  morning: { label: 'Morning' },
  day: { label: 'Day' },
  evening: { label: 'Evening' },
  night: { label: 'Night' },
}

export const BAND_ORDER = ['morning', 'day', 'evening', 'night']
