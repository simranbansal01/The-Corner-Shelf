// 6-question shortened placement test (Saturday scope, from 04_content_spec.md).
// Expand to the full 15 from doc 04 when there's time before the 26th,
// just add more objects to this array in the same shape, nothing else changes.

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
    id: 'q4',
    difficulty: 'intermediate',
    text: 'An AI-generated email draft that sounds professional and confident means:',
    options: [
      { id: 'a', text: "It's definitely accurate" },
      { id: 'b', text: "Tone and accuracy are unrelated: a wrong answer can sound just as confident as a right one" },
      { id: 'c', text: 'It was written by a human' },
      { id: 'd', text: "It's been auto-fact-checked" },
    ],
    correct: 'b',
  },
  {
    id: 'q5',
    difficulty: 'advanced',
    text: 'The meaningful difference between an AI\'s confidence and its accuracy:',
    options: [
      { id: 'a', text: "They're always the same" },
      { id: 'b', text: "Confidence is how certain it sounds; accuracy is whether it's actually right, the two aren't reliably linked" },
      { id: 'c', text: 'Confidence only applies to voice assistants' },
      { id: 'd', text: "Accuracy can't be measured" },
    ],
    correct: 'b',
  },
  {
    id: 'q6',
    difficulty: 'advanced',
    text: "If you're unsure whether an AI's answer is correct and can't verify it externally:",
    options: [
      { id: 'a', text: "Assume it's correct, it's usually right" },
      { id: 'b', text: 'Flag it as uncertain rather than presenting it as fact' },
      { id: 'c', text: 'Ask the AI to swear it\'s correct' },
      { id: 'd', text: 'Discard the whole task' },
    ],
    correct: 'b',
  },
]

// Scoring: >=5/6 Advanced, 3-4/6 Intermediate, <=2/6 Basic.
export function scorePlacement(score) {
  if (score >= 5) return 'advanced'
  if (score >= 3) return 'intermediate'
  return 'basic'
}
