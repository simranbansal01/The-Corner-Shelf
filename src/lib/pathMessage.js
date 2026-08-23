// Builds a short, specific "here's your path" message from onboarding answers.
// This is deliberately a lookup/template system, not a live model call. Same
// philosophy as buddyPrompts.js: fast, free, and predictable for a demo, while
// still reading as personalized because it combines two real signals (goal x level).

const GOAL_FRAME = {
  current_role: 'sharper at judging AI output in the work you\u2019re already doing',
  switch_fields: 'ready to show real judgment on AI-assisted work, not just familiarity with tools',
  general: 'comfortable telling good AI output from bad, in any tool you pick up',
  other: 'building real judgment, on your own terms',
}

const LEVEL_OPENER = {
  beginner: 'You\u2019re starting from scratch, so we\u2019ll skip straight to the placement step and get you building instincts on real examples from day one.',
  comfortable: 'You already use AI sometimes, so we\u2019ll start with a placement test to see exactly where your instincts are solid and where they\u2019re guessing.',
  confident: 'You use AI daily already, so the placement test will push into the harder judgment calls right away, not the basics.',
}

export function buildPathMessage({ goal, level }) {
  const frame = GOAL_FRAME[goal] || GOAL_FRAME.other
  const opener = LEVEL_OPENER[level] || LEVEL_OPENER.comfortable
  return `Got it, you're here to get ${frame}. ${opener}`
}
