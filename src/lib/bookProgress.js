// Remembers which page a reader last had open in a given book, so
// reopening it (including from a different physical book prop that maps
// to the same stageId) resumes there instead of restarting at page 1.
// Client-side only (localStorage), same idea as a browser remembering
// scroll position: nothing here is shared progress or graded, just where
// you left off reading.
const PREFIX = 'practiceLoop_bookPage_'

export function getSavedPageIndex(stageId) {
  try {
    const raw = localStorage.getItem(PREFIX + stageId)
    const n = raw === null ? 0 : parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function saveBookPageIndex(stageId, pageIndex) {
  try {
    localStorage.setItem(PREFIX + stageId, String(pageIndex))
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — resuming
    // just silently falls back to starting from page 1, not worth surfacing.
  }
}
