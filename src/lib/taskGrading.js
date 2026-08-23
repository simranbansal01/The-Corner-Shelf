// Grading and Buddy-summary logic for every practice task type, kept out of
// Task.jsx so the component only handles rendering/state, not per-type rules.
//
// response shapes per type:
//   flaw_spot:          { flaggedWrong: boolean }
//   scenario_decision:  { selected: string | null }   // option id
//   troubleshooting:    { selected: string | null }   // option id
//   step_ordering:      { order: string[] }           // step ids in the user's current order

export function gradeTask(task, response) {
  switch (task.type) {
    case 'flaw_spot':
      return response.flaggedWrong === task.hasFlaw
    case 'scenario_decision':
    case 'troubleshooting':
      return response.selected === task.correct
    case 'step_ordering': {
      const correctOrder = task.steps.map((s) => s.id)
      return response.order.length === correctOrder.length && response.order.every((id, i) => id === correctOrder[i])
    }
    default:
      return false
  }
}

// A short, human-readable summary of the user's answer so far, in neutral
// phrasing (no "leaning toward" / "not submitted" framing baked in, callers
// add that context themselves) so the same string works both in the verdict
// recap ("You said X") and mid-task Buddy context ("Where they are right
// now: X"). Works pre-submit too (in-progress selections/order).
export function summarizeAnswer(task, response) {
  switch (task.type) {
    case 'flaw_spot': {
      if (response.flaggedWrong === null || response.flaggedWrong === undefined) return null
      return response.flaggedWrong ? "something's wrong" : 'looks fine'
    }
    case 'scenario_decision':
    case 'troubleshooting': {
      if (!response.selected) return null
      const opt = task.options.find((o) => o.id === response.selected)
      return opt ? `"${opt.text}"` : null
    }
    case 'step_ordering': {
      if (!response.order || response.order.length === 0) return null
      const labels = response.order.map((id) => {
        const step = task.steps.find((s) => s.id === id)
        return step ? step.text : id
      })
      return labels.map((t, i) => `${i + 1}. ${t}`).join(' ')
    }
    default:
      return null
  }
}
