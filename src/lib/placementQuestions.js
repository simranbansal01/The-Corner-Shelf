// 9-question placement test (expanded from the original 6-question
// "Saturday scope" set — see README.md's "Adding more content later").
// Each question targets a distinct AI-judgment sub-skill rather than
// rephrasing the same "confidence isn't accuracy" idea repeatedly; add more
// objects here in the same shape and adjust scorePlacement()'s thresholds
// if the total count changes.

export const PLACEMENT_QUESTIONS = [
  {
    id: 'q1',
    difficulty: 'basic',
    text: 'What is a "hallucination" in the context of AI tools?',
    options: [
      { id: 'a', text: 'The AI refuses to answer' },
      { id: 'b', text: 'The AI generates false information, stated confidently as fact' },
      { id: 'c', text: 'The AI is offline' },
      { id: 'd', text: 'The AI runs slowly' },
    ],
    correct: 'b',
  },
  {
    id: 'q2',
    difficulty: 'basic',
    text: 'Which is the safest practice when using AI for real work?',
    options: [
      { id: 'a', text: 'Trust the first answer' },
      { id: 'b', text: 'Ask the AI to double-check itself and accept that as proof' },
      { id: 'c', text: 'Verify important facts/numbers against a source you trust' },
      { id: 'd', text: 'Only use AI for things you already know the answer to' },
    ],
    correct: 'c',
  },
  {
    id: 'q3',
    difficulty: 'basic',
    text: 'You ask an AI chatbot "who won last night\'s game?" and it gives a confident, detailed answer. What should you keep in mind?',
    options: [
      { id: 'a', text: 'Most AI models have a training cutoff and no live internet access by default, so "last night" may be outside what they actually know' },
      { id: 'b', text: 'AI always has real-time access to sports scores' },
      { id: 'c', text: 'The answer is reliable because it includes specific details' },
      { id: 'd', text: 'Sports results are never something AI gets wrong' },
    ],
    correct: 'a',
  },
  {
    id: 'q4',
    difficulty: 'intermediate',
    text: 'Which prompt is likely to get a more useful, specific answer?',
    options: [
      { id: 'a', text: '"Write something about marketing"' },
      { id: 'b', text: '"Write a 100-word LinkedIn post announcing our new product, aimed at small business owners, in a friendly tone"' },
      { id: 'c', text: '"Marketing help"' },
      { id: 'd', text: '"Do marketing"' },
    ],
    correct: 'b',
  },
  {
    id: 'q5',
    difficulty: 'intermediate',
    text: "An AI-generated email draft that sounds professional and confident tells you:",
    options: [
      { id: 'a', text: "It's definitely accurate" },
      { id: 'b', text: "Nothing about accuracy — tone and correctness are unrelated, a wrong answer can sound just as confident as a right one" },
      { id: 'c', text: 'It was written by a human' },
      { id: 'd', text: "It's been auto-fact-checked" },
    ],
    correct: 'b',
  },
  {
    id: 'q6',
    difficulty: 'intermediate',
    text: 'You ask an AI to summarize both sides of a controversial topic and notice it consistently favors one side. What\'s the most likely explanation?',
    options: [
      { id: 'a', text: 'The AI has genuine political opinions' },
      { id: 'b', text: "It's a bug that will be patched within hours" },
      { id: 'c', text: 'Its training data and design choices can bake in skew, the same as any source produced by people' },
      { id: 'd', text: 'This never happens with modern AI tools' },
    ],
    correct: 'c',
  },
  {
    id: 'q7',
    difficulty: 'advanced',
    text: 'Which task is safest to hand entirely to an AI with little to no human review?',
    options: [
      { id: 'a', text: 'Drafting a first pass at a routine internal status update, where a light glance-over still happens before sending' },
      { id: 'b', text: 'Approving a legal contract for signature' },
      { id: 'c', text: 'Diagnosing a medical symptom you\'re personally experiencing' },
      { id: 'd', text: 'Finalizing numbers for a public financial report' },
    ],
    correct: 'a',
  },
  {
    id: 'q8',
    difficulty: 'advanced',
    text: "If you're unsure whether an AI's answer is correct and can't verify it externally:",
    options: [
      { id: 'a', text: "Assume it's correct, it's usually right" },
      { id: 'b', text: 'Flag it as uncertain rather than presenting it as fact' },
      { id: 'c', text: "Ask the AI to swear it's correct" },
      { id: 'd', text: 'Discard the whole task' },
    ],
    correct: 'b',
  },
  {
    id: 'q9',
    difficulty: 'advanced',
    text: 'For a high-stakes claim an AI gives you (a statistic you plan to publish, say), which is the strongest verification approach?',
    options: [
      { id: 'a', text: 'Ask the same AI to check its own work again' },
      { id: 'b', text: 'Trust it if it cites a source name, even if you don\'t open the source' },
      { id: 'c', text: 'Trace the claim to a primary source you can actually open and read, independent of the AI' },
      { id: 'd', text: 'Ask a second AI model the same question and go with whichever sounds more confident' },
    ],
    correct: 'c',
  },
]

// Scoring: >=7/9 Advanced, 4-6/9 Intermediate, <=3/9 Basic — same
// proportions as the original 6-question thresholds (≈78%/44%/33%).
export function scorePlacement(score) {
  if (score >= 7) return 'advanced'
  if (score >= 4) return 'intermediate'
  return 'basic'
}
