// A lightweight "level" layer on top of data that already exists (task
// attempts), no new content needed, just a game-ish framing of real progress.
const TASKS_PER_LEVEL = 3

export function computeLevel(totalDone) {
  const level = Math.floor(totalDone / TASKS_PER_LEVEL) + 1
  const doneInLevel = totalDone % TASKS_PER_LEVEL
  const tasksToNext = TASKS_PER_LEVEL - doneInLevel
  return { level, doneInLevel, tasksToNext, tasksPerLevel: TASKS_PER_LEVEL }
}
