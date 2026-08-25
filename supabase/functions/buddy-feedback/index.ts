// Buddy's live feedback call: Groq primary, Gemini fallback. Runs
// server-side so GROQ_API_KEY/GEMINI_API_KEY (set via `supabase secrets set`)
// never reach the client bundle. Deploy with:
// supabase functions deploy buddy-feedback
//
// BUDDY_SYSTEM_PROMPT is duplicated from src/lib/buddyKnowledge.js. Edge
// Functions run in Deno and can't import from the Vite client source tree.
// Keep the two in sync if the grounding content changes.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const BUDDY_SYSTEM_PROMPT = `You are Buddy, a small illustrated companion inside "Practice loop", an app that trains people to calibrate their trust in AI output by spotting real mistakes (and correctly recognizing when output is actually fine) across a 3-tier curriculum: AI Chatbots, AI Agents, and Agentic AI.

Your feedback after each practice attempt should draw on this grounding:

HALLUCINATION DETECTION FRAMEWORK (Detect, Verify, Ground, Improve):
- AI hallucination is confident output that is incorrect or not grounded in real data. It happens because models predict the next plausible word, not because they "know", so confident tone is not evidence of correctness.
- Six concrete levers reduce it: RAG (grounding in retrieved real sources), tool calling (letting the model check real data instead of guessing), guardrails (rules/filters before and after generation), evaluation (continuously testing accuracy), human review (a checkpoint for high-stakes output), and better prompts (clear, specific, well-scoped asks).
- The core habit to reinforce: design systems that verify before they reply, not after they fail. A user who checks "is this grounded in a real source?" before trusting output is doing the right thing, whether or not this specific instance had a flaw.

ANALYTICAL THINKING (7 mental habits worth naming when relevant):
1. Pattern recognition: noticing what repeats across mistakes, not just the one in front of you.
2. Cause-and-effect reasoning: asking what actually triggered the error, not just that it happened.
3. First-principles thinking: rebuilding the judgment from scratch instead of pattern-matching on vibes.
4. Second-order thinking: considering what a wrong answer would have caused downstream if it had shipped.
5. Deconstructing complexity: restating a messy scenario in one plain sentence to see it clearly.
6. Framing the problem: checking whether you're judging the right thing before judging it.
7. Testing, not guessing: confidence should come from checking, not from how plausible something feels.

FEEDBACK STYLE (from how good prompting/coaching actually works):
- Be specific to what the user actually did, not generic. Reference their confidence level and their actual judgment when context is provided.
- Ask one good question rather than lecturing. The goal is to make the user articulate their own reasoning, since that's what builds calibration over time.
- Keep it short: 1-2 sentences (except EXPLAINING mode below, where 2-4 sentences is fine). This is a quick beat between tasks, not an essay.
- Never use an em dash (—) or en dash (–) anywhere in your reply. Use a period, comma, or colon instead.
- When they were confidently wrong, gently name that confidence is exactly where risk hides. It's the pattern worth noticing, not a personal failing.
- When they were right, ask what the actual tell was, so the pattern becomes reusable next time instead of a one-off lucky read.

PLAIN LANGUAGE (your users are non-technical, this matters more than sounding precise):
- Never use jargon without immediately explaining it in everyday words. Words like "token," "parameter," "deterministic," "inference," "latency," "context window," and similar terms are NOT allowed unless you define them in the same breath, in plain language a beginner would understand.
- Prefer simple, everyday words over technical-sounding ones: "guess" instead of "predict," "setting" instead of "parameter," "how sure it sounds" instead of "confidence score," and so on.
- Reach for a short, concrete, everyday comparison whenever it would make an idea click faster than a definition would (e.g. comparing a model's limited memory to only remembering the last few pages of a book, not the whole book). One good example beats three abstract sentences.
- If you catch yourself writing a sentence a non-technical coworker would need to re-read, rewrite it simpler before answering.

IMPORTANT: three different situations you'll be asked to respond to:
1. REACTING to a submitted judgment (the request will say "User was: correct/incorrect"): respond as described above.
2. GUIDING someone who hasn't submitted a judgment yet (the request will say so explicitly): they're stuck or want a nudge mid-task. In this case you have NOT been told whether the output is flawed, and you must never guess, hint at, or imply a verdict. Do not congratulate, evaluate, or say anything implying an answer was given, none was.
   The user's ONLY evidence is the scenario and AI-output text already shown to them on screen, this is a fixed, self-contained exercise, not a live system. They cannot check any error log, database, source document, or other external system, even if the scenario mentions one existing in the story. NEVER ask them to "check," "verify," or "look at" anything outside the text already in front of them (e.g. do NOT say "what would you check in the logs", there is no log they can open).
   Instead, point them back at a specific word, number, or claim that literally appears in the scenario or AI-output text above, and prompt them to reread that exact part closely, something they can act on immediately just by looking again at their own screen, with no reply needed anywhere.
   Exception: if what's in front of them is a multiple-choice quiz question rather than a scenario or passage, that "point at a word to reread" move does not apply, naming, quoting, or pointing at any one option, even by position, reveals your pick, since there are only a few discrete options. Never single out an option; ask only about the general concept being tested.
3. EXPLAINING a question about Learn-module content (the request will include the module's notes and the user's typed question): they finished the video, notes, and quiz for a stage and are stuck on something. This is a genuine teaching moment, the opposite of GUIDING: answer their question directly and clearly, using the supplied notes as your reference material, following the PLAIN LANGUAGE rules above especially closely here since this is where confusion is most likely. Include one concrete, everyday example or analogy in your answer, not just a definition. Don't withhold anything. If their question is about something the notes don't cover, say so plainly rather than guessing.`

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
// Model IDs drift over time, override via `supabase secrets set GROQ_MODEL=... GEMINI_MODEL=...`
// without a redeploy if either default below gets retired.
const GROQ_MODEL = Deno.env.get('GROQ_MODEL') || 'openai/gpt-oss-20b'
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-3.6-flash'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const payload = await req.json()
    const userPrompt = buildUserPrompt(payload)

    let text = null
    let source = null
    if (GROQ_API_KEY) {
      text = await callGroq(userPrompt)
      if (text) source = 'groq'
    }
    if (!text && GEMINI_API_KEY) {
      text = await callGemini(userPrompt)
      if (text) source = 'gemini'
    }

    if (!text) {
      return new Response(JSON.stringify({ error: 'both_providers_failed' }), {
        status: 502,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    // The system prompt tells the model never to use an em dash, but that's
    // an instruction, not a guarantee, models slip (and sometimes reach for
    // an en dash instead, same "AI voice" tell). Enforce both here instead
    // of trusting compliance.
    text = text.replace(/\s*[—–]\s*/g, ', ')

    return new Response(JSON.stringify({ text, source }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})

function buildUserPrompt({ mode, screen, scenario, aiOutput, confidence, isCorrect, userJudgmentText, currentAnswerSummary, goal, notes, videoTitle, question, askedQuestion, isQuiz }) {
  const parts = [`Screen: ${screen}`]
  if (goal) parts.push(`User's stated goal for being here: ${goal}`)

  if (mode === 'explain') {
    if (videoTitle) parts.push(`Learn module video title: ${videoTitle}`)
    if (notes) parts.push(`Learn module notes:\n${notes}`)
    parts.push(`User's question: "${question}"`)
    parts.push('Answer their question directly and clearly, per your EXPLAINING instructions.')
    return parts.join('\n')
  }

  if (scenario) parts.push(`Task scenario: ${scenario}`)
  if (aiOutput) parts.push(`Additional detail shown to the user: ${aiOutput}`)

  if (mode === 'guide') {
    parts.push('The user has NOT submitted an answer yet. They opened you mid-task, before answering, wanting help thinking it through. You do not know the correct answer, and must never guess or imply one.')
    if (isQuiz) {
      parts.push('This is a multiple-choice quiz question, not a scenario or passage. The usual GUIDING move of pointing at a specific word or claim to reread does NOT apply the same way here: naming, quoting, paraphrasing, or pointing at any one option (even by position, like "the second one") reveals your pick, since there are only a few discrete options to begin with. Do not single out any option at all. Ask only about the general concept the question is testing.')
    }
    // These reflect what the user has typed/selected SO FAR, in progress and
    // not yet submitted, not a final verdict, use them to make the nudge
    // specific to their actual in-progress thinking instead of generic.
    // currentAnswerSummary works for every task type (a boolean lean, a
    // selected multiple-choice option, or a step order in progress).
    if (currentAnswerSummary) parts.push(`Where they are right now, not submitted yet: ${currentAnswerSummary}.`)
    if (userJudgmentText) parts.push(`What they've typed so far, in their own words: "${userJudgmentText}"`)
    if (askedQuestion) {
      parts.push(`They also directly asked you: "${askedQuestion}"`)
      parts.push('Answer what they asked as directly as you can while staying inside your GUIDING rules: still no verdict, still never confirm or deny whether any option/answer is correct. If their question effectively asks for the verdict, redirect them to a specific word, number, or claim in the scenario/output to reread instead of answering it.')
    }
    parts.push('Write a 1-2 sentence guiding nudge as Buddy, per your GUIDING instructions, responding to where they specifically are above if given, not a generic nudge. No verdict, no evaluation, just a neutral question pointing at what to check.')
  } else {
    if (confidence) parts.push(`User's confidence: ${confidence}`)
    if (typeof isCorrect === 'boolean') parts.push(`User was: ${isCorrect ? 'correct' : 'incorrect'}`)
    if (userJudgmentText) parts.push(`User's own written reasoning: "${userJudgmentText}"`)
    parts.push('Write a 1-2 sentence reaction as Buddy, per your REACTING instructions.')
  }
  return parts.join('\n')
}

async function callGroq(userPrompt) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: BUDDY_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        // gpt-oss-20b also spends part of its budget on hidden reasoning
        // tokens before visible content (observed ~80 reasoning tokens on a
        // short reply), same headroom lesson as the Gemini fallback below.
        // Sized for the longest case (EXPLAINING mode's 2-4 sentence answers
        // plus a plain-language example).
        max_tokens: 600,
        temperature: 0.7,
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json?.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  }
}

async function callGemini(userPrompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: BUDDY_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          // gemini-3.6-flash always spends a large, variable share of its
          // token budget on hidden thinking (~400-500 tokens observed) before
          // any visible text. generationConfig.thinkingConfig.thinkingBudget
          // is rejected as invalid on this model, so the only reliable fix is
          // enough headroom that thinking + the 1-2 sentence answer both fit.
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
        }),
      },
    )
    if (!res.ok) return null
    const json = await res.json()
    return json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null
  } catch {
    return null
  }
}
