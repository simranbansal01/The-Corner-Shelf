// Fixed templates from 04_content_spec.md. Selecting a prompt is a plain lookup:
// no API call, no cost, no latency. This is the buddy's entire "intelligence" in v1.

const PROMPTS = {
  very_sure_correct: [
    "Nice, you called it and you were right. What was the giveaway?",
    "You were sure, and you nailed it. Would you have caught this a week ago?",
  ],
  very_sure_wrong: [
    "You were very sure, and it turned out wrong. What made it feel trustworthy? That's usually where the risk hides.",
    "That one slipped past you with full confidence. What would you check differently next time?",
  ],
  not_sure_correct: [
    "You weren't sure, but you got it right. What tipped you toward flagging it, even without full confidence?",
    "Good instinct, even uncertain. What would it take to make you more sure next time?",
  ],
  not_sure_wrong: [
    "You weren't sure, and it turned out you were also wrong. That's useful information, not a failure. What made this one hard to judge?",
    "Uncertain and incorrect. That's exactly what practice is for. What's one thing you'd look at differently?",
  ],
  idle: [
    "Nothing active right now. Want me to ask you something about your last task instead?",
    "I'm here when you're reviewing something. Click me again once you're mid-task.",
  ],
  // Shown when the user opens Buddy mid-task, before submitting a judgment,
  // deliberately generic and never says correct/flawed, since no verdict
  // exists yet to react to. See pickGuidePrompt.
  guide: [
    "No answer locked in yet, so I won't spoil it. What's the first thing that catches your eye here?",
    "Still your call to make. What would you want to double-check before deciding?",
    "I'll hold off on hints that give it away, but ask yourself: does anything here sound oddly specific or confident?",
  ],
}

// confidence: 'not_sure' | 'somewhat_sure' | 'very_sure', somewhat_sure is treated as "sure" for prompt selection
// isCorrect: boolean | null (null = idle, no active task)
export function pickBuddyPrompt(confidence, isCorrect) {
  let stateKey = 'idle'
  if (isCorrect !== null && isCorrect !== undefined) {
    const sure = confidence === 'very_sure' || confidence === 'somewhat_sure'
    if (sure && isCorrect) stateKey = 'very_sure_correct'
    else if (sure && !isCorrect) stateKey = 'very_sure_wrong'
    else if (!sure && isCorrect) stateKey = 'not_sure_correct'
    else stateKey = 'not_sure_wrong'
  }
  const options = PROMPTS[stateKey]
  const prompt = options[Math.floor(Math.random() * options.length)]
  return { stateKey, prompt }
}

export function pickGuidePrompt() {
  const options = PROMPTS.guide
  const prompt = options[Math.floor(Math.random() * options.length)]
  return { stateKey: 'guide', prompt }
}
