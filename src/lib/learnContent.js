// Learn-module content: Module 1 (3 chapters) and Module 2 (6 lessons, 17
// chapters) from the "Corner Shelf" reference artifact's own curriculum,
// ported chapter-for-chapter, not summarized or redistributed. Every
// stage's book opens on a table-of-contents page, then walks through each
// chapter in order: intro -> video (placeholder, real videos to follow) ->
// quick notes -> a quiz page per question -> a per-chapter scorecard.
// Static content, same convention as roadmap.js/tasks.js. Covers all 5
// Tier 1 (AI Chatbots) stages; Tiers 2/3 have no Learn content, only Tier 1
// was ever the target here.
//
// foundations = Module 1 (all 3 chapters). The other 4 stages split up
// Module 2's 6 lessons: prompt_engineering = Lessons 1-2, use_cases =
// Lessons 3 + 5, advanced_features = Lesson 6, business_applications =
// Lesson 4 (this grouping mirrors the app's existing stage boundaries,
// since Module 2's own lessons don't map 1:1 onto them).
export const LEARN_CONTENT = {
  "foundations": {
    "moduleLabel": "Module 1: Enter the AI Realm",
    "chapters": [
      {
        "title": "The Portal Opens — What AI Actually Is",
        "intro": "Artificial intelligence is software that finds patterns in data and uses them to make predictions, generate content, or take actions — without being explicitly programmed for every scenario. Modern AI systems, especially large language models, learn these patterns from huge amounts of text and other data during training, then apply them to new situations.",
        "videoId": "xRjCmw6VIkY",
        "videoCaption": "A short explainer on how AI differs from traditional rule-based software, and why \"intelligence\" here really means pattern recognition at scale.",
        "notesSections": [
          {
            "items": [
              "AI is not a single product, but a broad category of computer systems performing tasks that traditionally require human judgment, pattern recognition, language, or decision-making.",
              {
                "text": "The AI Toolbox:",
                "subs": [
                  "Automation: follows fixed, human-defined rules (e.g. sending an email after a form submission) and is not necessarily true AI.",
                  "Machine Learning: learns patterns from thousands of labeled examples to estimate outcomes (e.g. identifying if a photo contains a cat or dog).",
                  "Generative AI: creates entirely new outputs such as text, images, video, code, or summaries."
                ]
              },
              "How LLMs work: large language models learn linguistic relationships during training on massive text volumes. They generate answers step-by-step based on probability rather than retrieving files like databases or search engines.",
              "AI can accelerate first drafts, organize data, and explore options, but it cannot verify accuracy or take responsibility. Humans remain entirely accountable for final decisions."
            ]
          },
          {
            "heading": "The 5 Key Vocabulary Words",
            "items": [
              "Data: information used by the system.",
              "Model: the pattern-learning engine.",
              "Input: what you provide.",
              "Output: what the system returns.",
              "Prompt: the instruction or request you write."
            ]
          }
        ],
        "quiz": [
          {
            "id": "foundations_c1_q1",
            "text": "What best describes how modern AI models learn?",
            "options": [
              {
                "id": "a",
                "text": "They're programmed with explicit rules for every situation"
              },
              {
                "id": "b",
                "text": "They find patterns in large amounts of data during training"
              },
              {
                "id": "c",
                "text": "They copy answers from a fixed database"
              },
              {
                "id": "d",
                "text": "They ask a human for every decision"
              }
            ],
            "correct": "b",
            "explanation": "Modern AI models, especially machine learning and LLMs, learn by identifying patterns across large amounts of data during training — they aren't hand-coded with a rule for every possible situation, and they don't just copy from a fixed database."
          },
          {
            "id": "foundations_c1_q2",
            "text": "What does it mean when an AI model \"hallucinates\"?",
            "options": [
              {
                "id": "a",
                "text": "It generates confident but incorrect or made-up information"
              },
              {
                "id": "b",
                "text": "It crashes and stops responding"
              },
              {
                "id": "c",
                "text": "It refuses to answer any question"
              },
              {
                "id": "d",
                "text": "It only works with images"
              }
            ],
            "correct": "a",
            "explanation": "Hallucination means the model generates a confident-sounding but false or invented answer — usually because it's filling a gap in its knowledge with the most statistically plausible text, not because it's malfunctioning or refusing to respond."
          },
          {
            "id": "foundations_c1_q3",
            "text": "Which statement is NOT true of all AI systems?",
            "options": [
              {
                "id": "a",
                "text": "They rely on data"
              },
              {
                "id": "b",
                "text": "They can make predictions"
              },
              {
                "id": "c",
                "text": "They all generate brand-new content"
              },
              {
                "id": "d",
                "text": "They find patterns"
              }
            ],
            "correct": "c",
            "explanation": "Not all AI generates new content — automation and traditional machine learning (like classifiers) don't create anything new, they follow rules or make predictions and labels. Only generative AI specifically creates new outputs."
          }
        ]
      },
      {
        "title": "Inside the Language Engine — How an LLM Creates an Answer",
        "intro": "A large language model generates text one token at a time, predicting the most likely next word based on everything written so far. It doesn't look up answers in a database — it calculates probabilities across its vocabulary and samples from them, guided by patterns learned from enormous amounts of training text.",
        "videoId": "TfYttdXmBIg",
        "videoCaption": "Follow a prompt step by step as an LLM turns it into tokens, predicts probabilities, and assembles a response one piece at a time.",
        "notesSections": [
          {
            "items": [
              "The Tokenization Process: LLMs break natural language prompts down into \"tokens\" (words, word parts, or punctuation) to analyze relationships and predict the next most likely token sequentially.",
              "Prompt Specificity: generic instructions (e.g. \"Make this better\") provide too little direction. Clear instructions specifying audience, length limits, tone, and format restrictions generate vastly superior outputs.",
              "The Context Window: context represents all information the model can actively see when formulating its response (prompts, history, uploaded files, or external tools).",
              "Why Hallucinations Happen: when vital facts are missing from the active context window, the model often attempts to fill the gap with a plausible-sounding but false or invented answer.",
              {
                "text": "Strengths vs. Weaknesses:",
                "subs": [
                  "Strong at: drafting, summarizing, rewriting, brainstorming, classifying, and structuring messy information.",
                  "Weak at: providing guaranteed facts, handling high-stakes decisions, or interpreting unclear data."
                ]
              },
              {
                "text": "The Temperature Setting influences output variation:",
                "subs": [
                  "Lower Temperature: makes responses consistent, predictable, and focused (best for structured tasks like data extraction).",
                  "Higher Temperature: makes responses more creative and varied (best for brainstorming and creative work)."
                ]
              }
            ]
          }
        ],
        "quiz": [
          {
            "id": "foundations_c2_q1",
            "text": "How does an LLM generate a response?",
            "options": [
              {
                "id": "a",
                "text": "It searches the internet in real time"
              },
              {
                "id": "b",
                "text": "It predicts the next token repeatedly based on learned patterns"
              },
              {
                "id": "c",
                "text": "It retrieves a pre-written answer from memory"
              },
              {
                "id": "d",
                "text": "It asks another AI to write the answer"
              }
            ],
            "correct": "b",
            "explanation": "An LLM predicts the next token over and over, each time using everything generated so far as context — it isn't pulling a ready-made answer from storage or browsing the live internet unless a separate tool gives it that ability."
          },
          {
            "id": "foundations_c2_q2",
            "text": "What is a \"token\" in the context of an LLM?",
            "options": [
              {
                "id": "a",
                "text": "A security password"
              },
              {
                "id": "b",
                "text": "A unit of text, like a word or part of a word"
              },
              {
                "id": "c",
                "text": "A type of quiz question"
              },
              {
                "id": "d",
                "text": "A payment method"
              }
            ],
            "correct": "b",
            "explanation": "A token is the basic unit of text an LLM processes — often a word or part of a word. The model doesn't think in full sentences at once; it works token by token."
          },
          {
            "id": "foundations_c2_q3",
            "text": "Why can an LLM sound confident even when it's incorrect?",
            "options": [
              {
                "id": "a",
                "text": "It's designed to mislead users"
              },
              {
                "id": "b",
                "text": "It predicts plausible-sounding text rather than verifying facts"
              },
              {
                "id": "c",
                "text": "It always double-checks its answers first"
              },
              {
                "id": "d",
                "text": "It refuses to answer if unsure"
              }
            ],
            "correct": "b",
            "explanation": "LLMs are trained to produce fluent, plausible-sounding text based on patterns, not to verify facts against a source. That's why a wrong answer can still read as confident and well-written."
          }
        ]
      },
      {
        "title": "Choose Your Path — Automation, Generative AI, and Agents",
        "intro": "Not every AI tool works the same way. Automation follows fixed rules to handle repetitive tasks. Generative AI creates new text, images, or other content from a prompt. AI agents go further — they can plan multi-step tasks, use tools, and take actions toward a goal with less step-by-step guidance.",
        "videoId": "E-0kB5FKMlU",
        "videoCaption": "A quick comparison of rule-based automation, generative AI, and autonomous agents — and when to reach for each one.",
        "notesSections": [
          {
            "items": [
              {
                "text": "Four Ways to Complete Work:",
                "subs": [
                  "Manual Process: run by a human using judgment and ethics; essential for sensitive, high-stakes, or relationship-driven tasks.",
                  "Automation: executes predictable, repeatable, and fixed rules-based steps.",
                  "Generative AI: handles messy, natural language inputs to draft, summarize, or restructure content (requires human review).",
                  "AI Agents: goal-oriented systems using an LLM, instructions, memory, and specialized tools to perform multi-step workflows."
                ]
              },
              "Agent Guardrails: agents need strict boundaries. While they can draft work (like an expense report or an email), they should not have autonomous permission to execute final actions (like approving payments or sending emails) without human sign-off. Think of them as \"junior digital teammates\".",
              {
                "text": "Three Evaluation Questions, to choose your technology path:",
                "subs": [
                  "Is it predictable and rule-based? If yes, use Automation.",
                  "Does it involve writing, organizing, or brainstorming? If yes, use Generative AI.",
                  "Does it require several steps across different tools? If yes, use an AI Agent (with human review points)."
                ]
              },
              "Strategic Approach: start small by optimizing a single repetitive task first. Refine the prompts, establish a repeatable workflow, and only expand once value is proven."
            ]
          }
        ],
        "quiz": [
          {
            "id": "foundations_c3_q1",
            "text": "Which approach is best suited to a highly repetitive, rule-based task?",
            "options": [
              {
                "id": "a",
                "text": "Automation"
              },
              {
                "id": "b",
                "text": "Generative AI"
              },
              {
                "id": "c",
                "text": "An autonomous agent"
              },
              {
                "id": "d",
                "text": "None of these"
              }
            ],
            "correct": "a",
            "explanation": "When a task is predictable and follows fixed steps every time, automation is the right fit — it's reliable and doesn't need the flexibility (or unpredictability) of generative AI or an agent."
          },
          {
            "id": "foundations_c3_q2",
            "text": "What distinguishes an AI agent from a simple generative AI tool?",
            "options": [
              {
                "id": "a",
                "text": "Agents can plan and take multi-step actions toward a goal"
              },
              {
                "id": "b",
                "text": "Agents cannot generate any text"
              },
              {
                "id": "c",
                "text": "Agents only work offline"
              },
              {
                "id": "d",
                "text": "There is no real difference"
              }
            ],
            "correct": "a",
            "explanation": "The defining trait of an agent is that it can plan and carry out multiple steps toward a goal, often using tools along the way — a plain generative AI tool just produces one output per prompt without that ongoing planning."
          },
          {
            "id": "foundations_c3_q3",
            "text": "Generative AI is best described as a tool that:",
            "options": [
              {
                "id": "a",
                "text": "Follows only fixed if-then rules"
              },
              {
                "id": "b",
                "text": "Creates new content from a prompt"
              },
              {
                "id": "c",
                "text": "Can only classify existing data"
              },
              {
                "id": "d",
                "text": "Requires no training data at all"
              }
            ],
            "correct": "b",
            "explanation": "Generative AI's core capability is creating new content — text, images, code — from a prompt, unlike automation (fixed rules) or classification-only AI (labels existing data without creating anything new)."
          }
        ]
      }
    ]
  },
  "prompt_engineering": {
    "moduleLabel": "Module 2: The Prompt Mage’s Toolkit",
    "lessons": [
      {
        "title": "The Prompt Blueprint",
        "chapters": [
          {
            "title": "The Context Vault",
            "intro": "Every prompt lives inside a context: who you are, what you're trying to accomplish, and what the AI already knows about the situation. The same question can need a completely different answer depending on that surrounding context — so building the habit of stating it up front is the foundation of good prompting.",
            "notesSections": [
              {
                "items": [
                  "Context = the background the AI needs to give a useful, relevant answer.",
                  "Without context, an AI has to guess what you actually need.",
                  "A good habit: state your goal and situation before asking your question."
                ]
              }
            ],
            "quiz": [
              {
                "id": "prompt_engineering_c1_q1",
                "text": "Why does context matter when prompting an AI?",
                "options": [
                  {
                    "id": "a",
                    "text": "It makes prompts longer, which is always better"
                  },
                  {
                    "id": "b",
                    "text": "It helps the AI give a relevant answer instead of guessing"
                  },
                  {
                    "id": "c",
                    "text": "It is required by law"
                  },
                  {
                    "id": "d",
                    "text": "It only matters for image generation"
                  }
                ],
                "correct": "b",
                "explanation": "Context tells the AI what you actually need, so it can give a targeted answer instead of a generic one built on guesses about your situation."
              },
              {
                "id": "prompt_engineering_c1_q2",
                "text": "Which of these best adds useful context to a prompt?",
                "options": [
                  {
                    "id": "a",
                    "text": "Repeating the question twice"
                  },
                  {
                    "id": "b",
                    "text": "Explaining who the answer is for and why you need it"
                  },
                  {
                    "id": "c",
                    "text": "Using more capital letters"
                  },
                  {
                    "id": "d",
                    "text": "Asking in a different language"
                  }
                ],
                "correct": "b",
                "explanation": "Explaining who the answer is for and why you need it gives the AI real signal to tailor its response — repeating the question or changing formatting doesn't add any new information."
              },
              {
                "id": "prompt_engineering_c1_q3",
                "text": "What happens when you give an AI too little context?",
                "options": [
                  {
                    "id": "a",
                    "text": "It refuses to answer"
                  },
                  {
                    "id": "b",
                    "text": "It automatically asks a clarifying question every time"
                  },
                  {
                    "id": "c",
                    "text": "It may guess at your intent and answer generically"
                  },
                  {
                    "id": "d",
                    "text": "It becomes slower"
                  }
                ],
                "correct": "c",
                "explanation": "Without enough context, the AI can't know your specific situation, so it defaults to a generic, best-guess answer rather than refusing or asking every time."
              }
            ]
          },
          {
            "title": "The Six Parts of a Strong Prompt",
            "intro": "A strong prompt usually combines six ingredients: a role, the task, context, constraints, examples, and the format you want back. You don't need all six every time, but knowing them gives you a checklist for turning a vague ask into a precise one.",
            "notesSections": [
              {
                "items": [
                  "Six parts: role, task, context, constraints, examples, output format.",
                  "Not every prompt needs all six — use what the task calls for.",
                  "Missing parts are the most common reason for a disappointing AI answer."
                ]
              }
            ],
            "quiz": [
              {
                "id": "prompt_engineering_c2_q1",
                "text": "Which of these is one of the six parts of a strong prompt?",
                "options": [
                  {
                    "id": "a",
                    "text": "Output format"
                  },
                  {
                    "id": "b",
                    "text": "File size"
                  },
                  {
                    "id": "c",
                    "text": "Password"
                  },
                  {
                    "id": "d",
                    "text": "Screen resolution"
                  }
                ],
                "correct": "a",
                "explanation": "Output format is one of the six core ingredients (role, task, context, constraints, examples, format) — the others listed aren't part of prompt structure at all."
              },
              {
                "id": "prompt_engineering_c2_q2",
                "text": "What is the main benefit of thinking in these six parts?",
                "options": [
                  {
                    "id": "a",
                    "text": "It guarantees a perfect answer every time"
                  },
                  {
                    "id": "b",
                    "text": "It turns a vague request into a precise, checkable one"
                  },
                  {
                    "id": "c",
                    "text": "It makes the AI respond faster"
                  },
                  {
                    "id": "d",
                    "text": "It is required for every single prompt"
                  }
                ],
                "correct": "b",
                "explanation": "Thinking in these six parts gives you a checklist to turn a fuzzy request into something specific and checkable — it doesn't guarantee perfection, but it removes the most common gaps."
              },
              {
                "id": "prompt_engineering_c2_q3",
                "text": "True or false: every prompt needs all six parts to work well.",
                "options": [
                  {
                    "id": "a",
                    "text": "True, always"
                  },
                  {
                    "id": "b",
                    "text": "False — use only what the task needs"
                  },
                  {
                    "id": "c",
                    "text": "True, but only for images"
                  },
                  {
                    "id": "d",
                    "text": "False, none of them matter"
                  }
                ],
                "correct": "b",
                "explanation": "Not every prompt needs all six parts — simple questions might only need context and a clear task. The six parts are a checklist to draw from, not a mandatory template."
              }
            ]
          }
        ]
      },
      {
        "title": "The Context Vault",
        "chapters": [
          {
            "title": "Why Context Changes the Answer",
            "intro": "Ask an AI \"is this a good idea?\" with no context, and it can only respond in generalities. Add who you are, what you're deciding, and what's at stake, and the same question gets a sharply more useful answer. Context narrows an open-ended question into one the AI can actually reason about.",
            "notesSections": [
              {
                "items": [
                  "Vague questions get vague answers — context is what narrows them down.",
                  "Useful context includes your role, your goal, and any relevant constraints.",
                  "More context isn't always better — relevant context is what matters."
                ]
              }
            ],
            "quiz": [
              {
                "id": "prompt_engineering_c3_q1",
                "text": "What is the main effect of adding relevant context to a prompt?",
                "options": [
                  {
                    "id": "a",
                    "text": "It narrows a vague question into one the AI can answer well"
                  },
                  {
                    "id": "b",
                    "text": "It makes the AI take longer to respond"
                  },
                  {
                    "id": "c",
                    "text": "It hides information from the AI"
                  },
                  {
                    "id": "d",
                    "text": "It has no real effect"
                  }
                ],
                "correct": "a",
                "explanation": "Relevant context turns an open-ended question into one the AI can reason about specifically — that's its main value, not speed or secrecy."
              },
              {
                "id": "prompt_engineering_c3_q2",
                "text": "Which is an example of useful context?",
                "options": [
                  {
                    "id": "a",
                    "text": "Your favorite color"
                  },
                  {
                    "id": "b",
                    "text": "Your role and what decision you're trying to make"
                  },
                  {
                    "id": "c",
                    "text": "The current time zone only"
                  },
                  {
                    "id": "d",
                    "text": "Nothing — context never matters"
                  }
                ],
                "correct": "b",
                "explanation": "Your role and the decision you're trying to make are directly relevant to getting a useful answer; unrelated personal details like favorite color don't help the AI respond better."
              },
              {
                "id": "prompt_engineering_c3_q3",
                "text": "Is more context always better?",
                "options": [
                  {
                    "id": "a",
                    "text": "Yes, always add as much as possible"
                  },
                  {
                    "id": "b",
                    "text": "No — relevance matters more than quantity"
                  },
                  {
                    "id": "c",
                    "text": "No, context should never be included"
                  },
                  {
                    "id": "d",
                    "text": "Yes, but only for quizzes"
                  }
                ],
                "correct": "b",
                "explanation": "Relevance matters more than sheer volume — piling on unrelated details can dilute the prompt rather than improve the answer."
              }
            ]
          },
          {
            "title": "Instructions, Requests, and Source Material",
            "intro": "Prompts often mix three different things: instructions (how to behave), the request (what you want done), and source material (the content to work on). Keeping these visually and logically separate helps the AI understand exactly what's an order, what's a task, and what's raw data to process.",
            "notesSections": [
              {
                "items": [
                  "Instructions tell the AI how to behave; the request says what to do.",
                  "Source material is the raw content the AI should work on, not follow as a command.",
                  "Labeling or separating these (e.g. with headers or quotes) reduces confusion."
                ]
              }
            ],
            "quiz": [
              {
                "id": "prompt_engineering_c4_q1",
                "text": "What is \"source material\" in a prompt?",
                "options": [
                  {
                    "id": "a",
                    "text": "Instructions about tone"
                  },
                  {
                    "id": "b",
                    "text": "The raw content the AI should work on"
                  },
                  {
                    "id": "c",
                    "text": "The AI's own past answers"
                  },
                  {
                    "id": "d",
                    "text": "A type of AI model"
                  }
                ],
                "correct": "b",
                "explanation": "Source material is the raw content you want the AI to work on — like a document to summarize — as opposed to instructions, which tell the AI how to behave."
              },
              {
                "id": "prompt_engineering_c4_q2",
                "text": "Why separate instructions from source material?",
                "options": [
                  {
                    "id": "a",
                    "text": "It's not necessary"
                  },
                  {
                    "id": "b",
                    "text": "So the AI doesn't mistake data for commands"
                  },
                  {
                    "id": "c",
                    "text": "It makes the prompt shorter"
                  },
                  {
                    "id": "d",
                    "text": "It only matters for code"
                  }
                ],
                "correct": "b",
                "explanation": "Mixing content and commands can cause the AI to misinterpret part of your data as an instruction. Keeping them separate avoids that confusion."
              },
              {
                "id": "prompt_engineering_c4_q3",
                "text": "Which is an example of an instruction, not a request or source material?",
                "options": [
                  {
                    "id": "a",
                    "text": "\"Summarize this article: ...\""
                  },
                  {
                    "id": "b",
                    "text": "\"Always respond in bullet points.\""
                  },
                  {
                    "id": "c",
                    "text": "\"Here is the email text: ...\""
                  },
                  {
                    "id": "d",
                    "text": "\"The meeting is at 3pm.\""
                  }
                ],
                "correct": "b",
                "explanation": "\"Always respond in bullet points\" is a standing instruction about how to behave, not a one-off request or a piece of content to analyze."
              }
            ]
          },
          {
            "title": "Constraints Are Guardrails, Not Decorations",
            "intro": "Constraints — length limits, tone, things to avoid, required structure — aren't optional flourishes. They're what keep an AI's naturally broad, generative tendencies pointed at exactly what you need. A prompt without constraints tends to drift toward the longest, most generic version of an answer.",
            "notesSections": [
              {
                "items": [
                  "Constraints (length, tone, format, exclusions) focus the AI's output.",
                  "Without constraints, answers tend to default to long and generic.",
                  "Good constraints are specific and checkable, like \"under 100 words.\""
                ]
              }
            ],
            "quiz": [
              {
                "id": "prompt_engineering_c5_q1",
                "text": "What is the main purpose of constraints in a prompt?",
                "options": [
                  {
                    "id": "a",
                    "text": "To make the prompt look more official"
                  },
                  {
                    "id": "b",
                    "text": "To keep the AI's output focused on what you actually need"
                  },
                  {
                    "id": "c",
                    "text": "To slow the AI down"
                  },
                  {
                    "id": "d",
                    "text": "They have no real purpose"
                  }
                ],
                "correct": "b",
                "explanation": "Constraints like length, tone, and exclusions keep the AI's naturally broad output focused on exactly what you need, rather than the longest generic version of an answer."
              },
              {
                "id": "prompt_engineering_c5_q2",
                "text": "What tends to happen without any constraints?",
                "options": [
                  {
                    "id": "a",
                    "text": "The AI refuses to answer"
                  },
                  {
                    "id": "b",
                    "text": "Answers drift toward long and generic"
                  },
                  {
                    "id": "c",
                    "text": "Answers become shorter automatically"
                  },
                  {
                    "id": "d",
                    "text": "Nothing changes"
                  }
                ],
                "correct": "b",
                "explanation": "Without limits, AI output tends to drift toward long, generic, catch-all answers rather than a tight, usable response."
              },
              {
                "id": "prompt_engineering_c5_q3",
                "text": "Which is the most useful kind of constraint?",
                "options": [
                  {
                    "id": "a",
                    "text": "Vague, like \"make it good\""
                  },
                  {
                    "id": "b",
                    "text": "Specific and checkable, like \"under 100 words\""
                  },
                  {
                    "id": "c",
                    "text": "As many as possible, regardless of relevance"
                  },
                  {
                    "id": "d",
                    "text": "None — constraints limit creativity"
                  }
                ],
                "correct": "b",
                "explanation": "Specific, checkable constraints (like a word limit) are far more effective than vague instructions like \"make it good,\" which give the model no concrete target."
              }
            ]
          }
        ]
      }
    ]
  },
  "use_cases": {
    "moduleLabel": "Module 2: The Prompt Mage’s Toolkit",
    "lessons": [
      {
        "title": "Roles, Examples, and Clear Boundaries",
        "chapters": [
          {
            "title": "What a Role Can—and Cannot—Do",
            "intro": "Telling an AI to \"act as a senior editor\" or \"act as a patient tutor\" nudges its tone, vocabulary, and priorities toward that persona. It's a genuinely useful shortcut — but a role can't substitute for missing facts, context, or constraints. It shapes style far more than it shapes substance.",
            "notesSections": [
              {
                "items": [
                  "A role mainly shapes tone, vocabulary, and priorities, not facts.",
                  "Roles are a fast way to steer style: \"act as a...\"",
                  "A role can't fix a prompt that's missing context or constraints."
                ]
              }
            ],
            "quiz": [
              {
                "id": "use_cases_c1_q1",
                "text": "What does assigning an AI a role mainly influence?",
                "options": [
                  {
                    "id": "a",
                    "text": "Tone, vocabulary, and priorities"
                  },
                  {
                    "id": "b",
                    "text": "The AI's factual accuracy"
                  },
                  {
                    "id": "c",
                    "text": "The length of its training data"
                  },
                  {
                    "id": "d",
                    "text": "Its response speed"
                  }
                ],
                "correct": "a",
                "explanation": "Assigning a role like 'act as a patient tutor' shapes tone, vocabulary, and priorities — it doesn't change the model's underlying factual knowledge or accuracy."
              },
              {
                "id": "use_cases_c1_q2",
                "text": "Can a role substitute for missing context in a prompt?",
                "options": [
                  {
                    "id": "a",
                    "text": "Yes, completely"
                  },
                  {
                    "id": "b",
                    "text": "No, a role mostly shapes style, not substance"
                  },
                  {
                    "id": "c",
                    "text": "Yes, but only for images"
                  },
                  {
                    "id": "d",
                    "text": "No, roles do nothing at all"
                  }
                ],
                "correct": "b",
                "explanation": "A role changes how something is said, not what facts or context the AI has to work with — it can't fill in for missing information."
              },
              {
                "id": "use_cases_c1_q3",
                "text": "Which is an example of assigning a role?",
                "options": [
                  {
                    "id": "a",
                    "text": "\"Keep it under 50 words.\""
                  },
                  {
                    "id": "b",
                    "text": "\"Act as a patient tutor explaining this to a beginner.\""
                  },
                  {
                    "id": "c",
                    "text": "\"Here is the document: ...\""
                  },
                  {
                    "id": "d",
                    "text": "\"Format as a table.\""
                  }
                ],
                "correct": "b",
                "explanation": "\"Act as a patient tutor...\" explicitly assigns the AI a persona; the other options are a constraint, source material, and a format instruction, not a role."
              }
            ]
          },
          {
            "title": "Teach by Showing Examples",
            "intro": "Describing what you want in the abstract is often harder than just showing it. A single well-chosen example — of the tone, structure, or level of detail you're after — can communicate more than several sentences of instruction, because the AI can pattern-match directly against it.",
            "notesSections": [
              {
                "items": [
                  "One good example often beats several sentences of description.",
                  "Examples work because the AI can pattern-match against them directly.",
                  "Use examples to show structure, tone, or level of detail you want."
                ]
              }
            ],
            "quiz": [
              {
                "id": "use_cases_c2_q1",
                "text": "Why are examples effective in a prompt?",
                "options": [
                  {
                    "id": "a",
                    "text": "The AI ignores them"
                  },
                  {
                    "id": "b",
                    "text": "They let the AI pattern-match directly against a concrete case"
                  },
                  {
                    "id": "c",
                    "text": "They make prompts shorter"
                  },
                  {
                    "id": "d",
                    "text": "They only work for code"
                  }
                ],
                "correct": "b",
                "explanation": "Examples give the AI something concrete to pattern-match against, which is often clearer and faster than trying to describe a style or structure in words."
              },
              {
                "id": "use_cases_c2_q2",
                "text": "What should a good example typically demonstrate?",
                "options": [
                  {
                    "id": "a",
                    "text": "An unrelated topic"
                  },
                  {
                    "id": "b",
                    "text": "The tone, structure, or detail level you want"
                  },
                  {
                    "id": "c",
                    "text": "How long the prompt is"
                  },
                  {
                    "id": "d",
                    "text": "Nothing in particular"
                  }
                ],
                "correct": "b",
                "explanation": "A good example shows the tone, structure, or level of detail you want — it's a template for the AI to follow, not filler."
              },
              {
                "id": "use_cases_c2_q3",
                "text": "Providing examples in a prompt is called:",
                "options": [
                  {
                    "id": "a",
                    "text": "Zero-shot prompting"
                  },
                  {
                    "id": "b",
                    "text": "Few-shot prompting"
                  },
                  {
                    "id": "c",
                    "text": "Blind prompting"
                  },
                  {
                    "id": "d",
                    "text": "Reverse prompting"
                  }
                ],
                "correct": "b",
                "explanation": "Including examples in a prompt is known as few-shot prompting — as opposed to zero-shot prompting, which gives no examples at all."
              }
            ]
          },
          {
            "title": "Separate Instructions from Information",
            "intro": "When instructions and information blur together, an AI can misread part of your data as a command — especially with pasted text, documents, or search results. Clearly marking what's an instruction versus what's content to analyze (quotes, headers, delimiters) keeps the two from bleeding into each other.",
            "notesSections": [
              {
                "items": [
                  "Blurring instructions and data can cause the AI to misread content as commands.",
                  "Delimiters (quotes, headers, triple dashes) clearly separate the two.",
                  "This matters most with pasted documents, emails, or search results."
                ]
              }
            ],
            "quiz": [
              {
                "id": "use_cases_c3_q1",
                "text": "What risk comes from mixing instructions and data together?",
                "options": [
                  {
                    "id": "a",
                    "text": "The AI may misread part of the data as a command"
                  },
                  {
                    "id": "b",
                    "text": "The prompt becomes automatically shorter"
                  },
                  {
                    "id": "c",
                    "text": "Nothing — it's always safe"
                  },
                  {
                    "id": "d",
                    "text": "The AI stops responding"
                  }
                ],
                "correct": "a",
                "explanation": "When instructions and data blur together, the AI can mistake a piece of pasted content for a command it should follow, which can produce unexpected results."
              },
              {
                "id": "use_cases_c3_q2",
                "text": "What's a simple way to separate instructions from source content?",
                "options": [
                  {
                    "id": "a",
                    "text": "Write everything in one long sentence"
                  },
                  {
                    "id": "b",
                    "text": "Use delimiters like quotes or headers"
                  },
                  {
                    "id": "c",
                    "text": "Remove all punctuation"
                  },
                  {
                    "id": "d",
                    "text": "Only use capital letters"
                  }
                ],
                "correct": "b",
                "explanation": "Using delimiters like quotes, headers, or dashes clearly marks where instructions end and content begins, reducing the chance of misreading."
              },
              {
                "id": "use_cases_c3_q3",
                "text": "This separation matters most when:",
                "options": [
                  {
                    "id": "a",
                    "text": "You're pasting in documents or search results"
                  },
                  {
                    "id": "b",
                    "text": "You never provide any content"
                  },
                  {
                    "id": "c",
                    "text": "You're only asking simple math questions"
                  },
                  {
                    "id": "d",
                    "text": "It never matters"
                  }
                ],
                "correct": "a",
                "explanation": "This separation matters most whenever you're pasting in external content — documents, emails, search results — since that's where instructions and data are most likely to blend together."
              }
            ]
          }
        ]
      },
      {
        "title": "The Research Compass",
        "chapters": [
          {
            "title": "Language Models and Search Are Different",
            "intro": "A language model predicts likely text from patterns it learned during training; a search engine retrieves and ranks existing documents. Confusing the two leads to trouble — an LLM without live retrieval can't guarantee it's citing a real, current source, even when it sounds certain.",
            "notesSections": [
              {
                "items": [
                  "LLMs predict plausible text; search engines retrieve real documents.",
                  "An LLM without retrieval tools can't guarantee a citation is real or current.",
                  "Knowing which one you're using changes how much you should verify."
                ]
              }
            ],
            "quiz": [
              {
                "id": "use_cases_c4_q1",
                "text": "What is the core difference between an LLM and a search engine?",
                "options": [
                  {
                    "id": "a",
                    "text": "There is no real difference"
                  },
                  {
                    "id": "b",
                    "text": "An LLM predicts text from learned patterns; search retrieves real documents"
                  },
                  {
                    "id": "c",
                    "text": "Search engines are a type of LLM"
                  },
                  {
                    "id": "d",
                    "text": "LLMs always cite real-time sources"
                  }
                ],
                "correct": "b",
                "explanation": "An LLM predicts likely text from patterns it learned during training, while a search engine retrieves and ranks actual existing documents — they work in fundamentally different ways."
              },
              {
                "id": "use_cases_c4_q2",
                "text": "Why can an LLM's citations be unreliable without retrieval tools?",
                "options": [
                  {
                    "id": "a",
                    "text": "It intentionally lies"
                  },
                  {
                    "id": "b",
                    "text": "It generates plausible-sounding text, not verified lookups"
                  },
                  {
                    "id": "c",
                    "text": "It never provides citations"
                  },
                  {
                    "id": "d",
                    "text": "It only cites peer-reviewed papers"
                  }
                ],
                "correct": "b",
                "explanation": "Without a retrieval tool, an LLM generates plausible-sounding text rather than performing a verified lookup, so a citation it produces might not correspond to a real source."
              },
              {
                "id": "use_cases_c4_q3",
                "text": "Knowing whether you're using an LLM or search should affect:",
                "options": [
                  {
                    "id": "a",
                    "text": "Nothing at all"
                  },
                  {
                    "id": "b",
                    "text": "How much you verify the answer"
                  },
                  {
                    "id": "c",
                    "text": "Only the font of the response"
                  },
                  {
                    "id": "d",
                    "text": "The AI's role"
                  }
                ],
                "correct": "b",
                "explanation": "Knowing whether you're getting a prediction or a real retrieved document should directly affect how much you verify the answer before relying on it."
              }
            ]
          },
          {
            "title": "Evaluate the Source, Not Just the Sentence",
            "intro": "A confident, well-written sentence isn't evidence of accuracy. Good research habits carry over to AI use: check who's behind a claim, how recent it is, and whether it can be corroborated elsewhere, rather than judging a statement by how fluent or certain it sounds.",
            "notesSections": [
              {
                "items": [
                  "Fluent, confident writing is not the same as accurate writing.",
                  "Check the source, its recency, and whether it's corroborated elsewhere.",
                  "Apply the same skepticism to AI answers that you would to any single source."
                ]
              }
            ],
            "quiz": [
              {
                "id": "use_cases_c5_q1",
                "text": "What should you evaluate instead of just how confident an answer sounds?",
                "options": [
                  {
                    "id": "a",
                    "text": "The source, recency, and corroboration of the claim"
                  },
                  {
                    "id": "b",
                    "text": "The length of the sentence"
                  },
                  {
                    "id": "c",
                    "text": "The AI's response speed"
                  },
                  {
                    "id": "d",
                    "text": "Nothing else matters"
                  }
                ],
                "correct": "a",
                "explanation": "The source behind a claim, how recent it is, and whether it's corroborated elsewhere are what actually indicate reliability — not how the sentence is written."
              },
              {
                "id": "use_cases_c5_q2",
                "text": "Why is fluency a poor signal of accuracy?",
                "options": [
                  {
                    "id": "a",
                    "text": "Fluent text is always accurate"
                  },
                  {
                    "id": "b",
                    "text": "An AI can write confidently about something incorrect"
                  },
                  {
                    "id": "c",
                    "text": "Fluency means it was fact-checked"
                  },
                  {
                    "id": "d",
                    "text": "It isn't a poor signal"
                  }
                ],
                "correct": "b",
                "explanation": "An AI (or anyone) can write a fluent, confident sentence about something that's simply untrue — fluency reflects writing quality, not fact-checking."
              },
              {
                "id": "use_cases_c5_q3",
                "text": "A good research habit when using AI is to:",
                "options": [
                  {
                    "id": "a",
                    "text": "Trust the first answer completely"
                  },
                  {
                    "id": "b",
                    "text": "Corroborate important claims elsewhere"
                  },
                  {
                    "id": "c",
                    "text": "Avoid using AI for research entirely"
                  },
                  {
                    "id": "d",
                    "text": "Only check the AI's tone"
                  }
                ],
                "correct": "b",
                "explanation": "Corroborating important claims against other sources is the core habit that catches errors, whether the original claim came from a person or an AI."
              }
            ]
          },
          {
            "title": "A Reliable AI Research Workflow",
            "intro": "A dependable workflow looks like: ask the AI to draft or summarize, verify key facts against primary or reputable sources, then iterate to fill gaps. AI is excellent at accelerating the early drafting and structuring stages of research — it shouldn't be the last stop for anything that matters.",
            "notesSections": [
              {
                "items": [
                  "Workflow: draft/summarize with AI, verify against real sources, then iterate.",
                  "AI is strong at speeding up early drafting and structuring.",
                  "Verification against primary or reputable sources should be the last step, not skipped."
                ]
              }
            ],
            "quiz": [
              {
                "id": "use_cases_c6_q1",
                "text": "What's a good first step in an AI-assisted research workflow?",
                "options": [
                  {
                    "id": "a",
                    "text": "Publish the AI's answer directly"
                  },
                  {
                    "id": "b",
                    "text": "Use AI to draft or summarize as a starting point"
                  },
                  {
                    "id": "c",
                    "text": "Skip research entirely"
                  },
                  {
                    "id": "d",
                    "text": "Ask ten different AIs the same question"
                  }
                ],
                "correct": "b",
                "explanation": "Using AI to produce an early draft or summary is a strong starting point — it accelerates the work without skipping the verification that should come after."
              },
              {
                "id": "use_cases_c6_q2",
                "text": "What should come after the AI drafts an answer?",
                "options": [
                  {
                    "id": "a",
                    "text": "Nothing further is needed"
                  },
                  {
                    "id": "b",
                    "text": "Verifying key facts against real sources"
                  },
                  {
                    "id": "c",
                    "text": "Deleting the draft"
                  },
                  {
                    "id": "d",
                    "text": "Repeating the same prompt"
                  }
                ],
                "correct": "b",
                "explanation": "Verifying key facts against real, reputable sources should follow any AI-assisted draft — that step is what makes the workflow reliable."
              },
              {
                "id": "use_cases_c6_q3",
                "text": "AI is especially strong at:",
                "options": [
                  {
                    "id": "a",
                    "text": "Guaranteeing factual accuracy"
                  },
                  {
                    "id": "b",
                    "text": "Speeding up early drafting and structuring"
                  },
                  {
                    "id": "c",
                    "text": "Replacing all verification"
                  },
                  {
                    "id": "d",
                    "text": "Something unrelated to research"
                  }
                ],
                "correct": "b",
                "explanation": "AI is particularly good at speeding up early drafting and structuring work, freeing up time for the verification and judgment that still require a human."
              }
            ]
          }
        ]
      }
    ]
  },
  "advanced_features": {
    "moduleLabel": "Module 2: The Prompt Mage’s Toolkit",
    "lessons": [
      {
        "title": "The Multimodal Atelier",
        "chapters": [
          {
            "title": "Working with Documents and Files",
            "intro": "When you hand an AI a document, tell it what role that document plays: is it the source to summarize, a style to match, or reference material to check against? Long documents also benefit from being pointed at — asking about a specific section beats hoping the AI weighs the whole file evenly.",
            "notesSections": [
              {
                "items": [
                  "State what role a document plays: source, style reference, or background.",
                  "For long documents, point to the relevant section instead of the whole file.",
                  "Ask specific questions about the document rather than open-ended ones."
                ]
              }
            ],
            "quiz": [
              {
                "id": "advanced_features_c1_q1",
                "text": "Why should you tell the AI what role a document plays?",
                "options": [
                  {
                    "id": "a",
                    "text": "It's required by the file format"
                  },
                  {
                    "id": "b",
                    "text": "It helps the AI use the document correctly (e.g. summarize vs. match style)"
                  },
                  {
                    "id": "c",
                    "text": "It has no effect"
                  },
                  {
                    "id": "d",
                    "text": "It only matters for images"
                  }
                ],
                "correct": "b",
                "explanation": "Stating whether a document is the source to summarize, a style to match, or background reference tells the AI how to actually use it, instead of guessing."
              },
              {
                "id": "advanced_features_c1_q2",
                "text": "What's a good strategy with a very long document?",
                "options": [
                  {
                    "id": "a",
                    "text": "Always paste the entire file with no guidance"
                  },
                  {
                    "id": "b",
                    "text": "Point the AI to the relevant section"
                  },
                  {
                    "id": "c",
                    "text": "Never use long documents"
                  },
                  {
                    "id": "d",
                    "text": "Ask no questions about it"
                  }
                ],
                "correct": "b",
                "explanation": "For long documents, pointing the AI to the relevant section focuses its attention, rather than hoping it weighs an entire long file evenly."
              },
              {
                "id": "advanced_features_c1_q3",
                "text": "Specific questions about a document tend to work:",
                "options": [
                  {
                    "id": "a",
                    "text": "Worse than vague ones"
                  },
                  {
                    "id": "b",
                    "text": "Better than open-ended ones"
                  },
                  {
                    "id": "c",
                    "text": "Exactly the same"
                  },
                  {
                    "id": "d",
                    "text": "Only with images"
                  }
                ],
                "correct": "b",
                "explanation": "Specific questions about a document consistently produce more useful answers than open-ended ones, just like with any other prompt."
              }
            ]
          },
          {
            "title": "Working with Tables and Data",
            "intro": "Structured data deserves structured prompts. State the columns that matter, the calculation or comparison you want, and the format for the result — a table back, a short summary, or specific numbers pulled out. AI can reason about data, but it reasons better when you tell it exactly what to look at.",
            "notesSections": [
              {
                "items": [
                  "Name the specific columns or fields that matter to your question.",
                  "State the calculation or comparison you actually want.",
                  "Ask for the result in a specific format: table, summary, or numbers."
                ]
              }
            ],
            "quiz": [
              {
                "id": "advanced_features_c2_q1",
                "text": "What helps most when prompting about tabular data?",
                "options": [
                  {
                    "id": "a",
                    "text": "Being vague about which columns matter"
                  },
                  {
                    "id": "b",
                    "text": "Naming the specific columns/fields and the comparison you want"
                  },
                  {
                    "id": "c",
                    "text": "Never specifying a format"
                  },
                  {
                    "id": "d",
                    "text": "Uploading unrelated data"
                  }
                ],
                "correct": "b",
                "explanation": "Naming the exact columns and the comparison or calculation you want gives the AI a precise target to work with, instead of leaving it to guess what matters."
              },
              {
                "id": "advanced_features_c2_q2",
                "text": "Why specify the output format for a data question?",
                "options": [
                  {
                    "id": "a",
                    "text": "It doesn't matter"
                  },
                  {
                    "id": "b",
                    "text": "So the answer comes back usable, like a table or clean numbers"
                  },
                  {
                    "id": "c",
                    "text": "It slows down the response"
                  },
                  {
                    "id": "d",
                    "text": "Format has no effect on usefulness"
                  }
                ],
                "correct": "b",
                "explanation": "Specifying the format — a table, a summary, clean numbers — ensures the answer comes back in a form you can actually use right away."
              },
              {
                "id": "advanced_features_c2_q3",
                "text": "Structured prompts for structured data help the AI:",
                "options": [
                  {
                    "id": "a",
                    "text": "Reason more precisely about what to look at"
                  },
                  {
                    "id": "b",
                    "text": "Ignore the data entirely"
                  },
                  {
                    "id": "c",
                    "text": "Always be 100% accurate"
                  },
                  {
                    "id": "d",
                    "text": "Work only with images"
                  }
                ],
                "correct": "a",
                "explanation": "Structured prompts help the AI reason more precisely about which parts of the data to focus on — they don't guarantee perfect accuracy or restrict it to images."
              }
            ]
          },
          {
            "title": "Images, Audio, and Voice",
            "intro": "Multimodal AI can describe, analyze, and generate images, and increasingly work with audio and voice. As with text, results improve with specifics: what to focus on in an image, the desired style for a generated one, or the tone and pacing for generated speech — vague requests get vague, generic outputs here too.",
            "notesSections": [
              {
                "items": [
                  "Multimodal AI can interpret and generate images, audio, and voice.",
                  "Specific prompts (focus, style, tone) beat vague ones, just like with text.",
                  "The same prompting habits — context, constraints, examples — carry over."
                ]
              }
            ],
            "quiz": [
              {
                "id": "advanced_features_c3_q1",
                "text": "What do image and voice prompts have in common with text prompts?",
                "options": [
                  {
                    "id": "a",
                    "text": "Nothing at all"
                  },
                  {
                    "id": "b",
                    "text": "Specific prompts produce better results than vague ones"
                  },
                  {
                    "id": "c",
                    "text": "They never need context"
                  },
                  {
                    "id": "d",
                    "text": "They can't use examples"
                  }
                ],
                "correct": "b",
                "explanation": "Just like with text, specific image, audio, and voice prompts consistently outperform vague ones — the same prompting principles carry over across modalities."
              },
              {
                "id": "advanced_features_c3_q2",
                "text": "Which is an example of a specific image prompt?",
                "options": [
                  {
                    "id": "a",
                    "text": "\"Make an image.\""
                  },
                  {
                    "id": "b",
                    "text": "\"A watercolor illustration of a red bookshop at dusk, warm lighting.\""
                  },
                  {
                    "id": "c",
                    "text": "\"Something nice.\""
                  },
                  {
                    "id": "d",
                    "text": "\"Image please.\""
                  }
                ],
                "correct": "b",
                "explanation": "\"A watercolor illustration of a red bookshop at dusk, warm lighting\" gives concrete direction on style, subject, and mood — vague requests like \"make an image\" leave everything to chance."
              },
              {
                "id": "advanced_features_c3_q3",
                "text": "Good prompting habits like context and constraints:",
                "options": [
                  {
                    "id": "a",
                    "text": "Only apply to text"
                  },
                  {
                    "id": "b",
                    "text": "Carry over to image, audio, and voice prompts too"
                  },
                  {
                    "id": "c",
                    "text": "Never apply to multimodal AI"
                  },
                  {
                    "id": "d",
                    "text": "Are unnecessary for voice"
                  }
                ],
                "correct": "b",
                "explanation": "Context, constraints, and examples are just as useful for image, audio, and voice generation as they are for text — the underlying prompting skills transfer directly."
              }
            ]
          }
        ]
      }
    ]
  },
  "business_applications": {
    "moduleLabel": "Module 2: The Prompt Mage’s Toolkit",
    "lessons": [
      {
        "title": "The Conversation Lab",
        "chapters": [
          {
            "title": "Good AI Work Is Iterative",
            "intro": "Few great outputs happen on the first try. Treating a prompt as a starting draft — then refining based on what came back — usually gets better results faster than trying to write one perfect instruction up front. Iteration is a feature of good prompting, not a sign you got it wrong.",
            "notesSections": [
              {
                "items": [
                  "Expect to refine — the first response is a draft, not a final answer.",
                  "Each round of feedback narrows the gap between what you asked and what you meant.",
                  "Iterating is normal, efficient practice, not a failure of the first prompt."
                ]
              }
            ],
            "quiz": [
              {
                "id": "business_applications_c1_q1",
                "text": "What does it mean that AI work is \"iterative\"?",
                "options": [
                  {
                    "id": "a",
                    "text": "You should only ever prompt once"
                  },
                  {
                    "id": "b",
                    "text": "You refine the prompt and output over multiple rounds"
                  },
                  {
                    "id": "c",
                    "text": "The AI repeats itself automatically"
                  },
                  {
                    "id": "d",
                    "text": "Iteration means starting over from scratch every time"
                  }
                ],
                "correct": "b",
                "explanation": "Iterative means refining the prompt and the output over multiple rounds, using each response to sharpen the next request — not a one-shot, unchangeable exchange."
              },
              {
                "id": "business_applications_c1_q2",
                "text": "What's the best way to think of a first AI response?",
                "options": [
                  {
                    "id": "a",
                    "text": "The final, unchangeable answer"
                  },
                  {
                    "id": "b",
                    "text": "A draft you can refine"
                  },
                  {
                    "id": "c",
                    "text": "Always wrong"
                  },
                  {
                    "id": "d",
                    "text": "Irrelevant"
                  }
                ],
                "correct": "b",
                "explanation": "Treating the first AI response as a draft, not a final answer, sets the right expectation and makes it easy to refine from there."
              },
              {
                "id": "business_applications_c1_q3",
                "text": "Why is iteration considered good practice, not a failure?",
                "options": [
                  {
                    "id": "a",
                    "text": "Because it wastes time"
                  },
                  {
                    "id": "b",
                    "text": "Because refining usually reaches a better result faster than one perfect prompt"
                  },
                  {
                    "id": "c",
                    "text": "Because AI never improves with feedback"
                  },
                  {
                    "id": "d",
                    "text": "Because it's required by the AI"
                  }
                ],
                "correct": "b",
                "explanation": "Refining over a few rounds usually reaches a better result faster than trying to perfectly specify everything in a single giant prompt up front."
              }
            ]
          },
          {
            "title": "Control the Shape of the Output",
            "intro": "Beyond content, you can direct exactly how an answer is packaged: a table instead of paragraphs, three bullet points instead of ten, a specific word count, or a fixed structure to fill in. Specifying the shape of the output is one of the highest-leverage, most underused prompting moves.",
            "notesSections": [
              {
                "items": [
                  "You can specify structure: table, list, headings, word count, and more.",
                  "Shaping the output is separate from shaping the content — ask for both.",
                  "This is one of the easiest ways to get a directly usable answer."
                ]
              }
            ],
            "quiz": [
              {
                "id": "business_applications_c2_q1",
                "text": "What does \"shaping the output\" refer to?",
                "options": [
                  {
                    "id": "a",
                    "text": "Choosing the AI's role"
                  },
                  {
                    "id": "b",
                    "text": "Controlling the format/structure of the answer, like a table or list"
                  },
                  {
                    "id": "c",
                    "text": "Deleting the response"
                  },
                  {
                    "id": "d",
                    "text": "Changing the AI's training data"
                  }
                ],
                "correct": "b",
                "explanation": "Shaping the output means controlling its format or structure — like asking for a table, a bullet list, or a specific word count — separate from shaping the content itself."
              },
              {
                "id": "business_applications_c2_q2",
                "text": "Which is an example of shaping output?",
                "options": [
                  {
                    "id": "a",
                    "text": "\"Be more accurate.\""
                  },
                  {
                    "id": "b",
                    "text": "\"Respond as a 3-column table.\""
                  },
                  {
                    "id": "c",
                    "text": "\"Act as a lawyer.\""
                  },
                  {
                    "id": "d",
                    "text": "\"Use more context.\""
                  }
                ],
                "correct": "b",
                "explanation": "\"Respond as a 3-column table\" is a direct instruction about output structure; the other options are about accuracy, role, or context, not format."
              },
              {
                "id": "business_applications_c2_q3",
                "text": "Why is specifying output shape considered high-leverage?",
                "options": [
                  {
                    "id": "a",
                    "text": "It's rarely useful"
                  },
                  {
                    "id": "b",
                    "text": "A small instruction can make the answer immediately usable"
                  },
                  {
                    "id": "c",
                    "text": "It only works for images"
                  },
                  {
                    "id": "d",
                    "text": "It slows down the AI"
                  }
                ],
                "correct": "b",
                "explanation": "A small formatting instruction can turn a wall of text into something immediately usable — a table, a short list — for very little extra effort in the prompt."
              }
            ]
          },
          {
            "title": "Ask for Clarification, Not Guesswork",
            "intro": "When a request is ambiguous, you can prompt the AI to ask clarifying questions before answering, instead of guessing at your intent. This trades one extra round-trip for a far better chance of getting exactly what you needed on the first real attempt.",
            "notesSections": [
              {
                "items": [
                  "You can explicitly instruct an AI to ask clarifying questions when unsure.",
                  "This trades a short delay for a much better final answer.",
                  "Useful for ambiguous, high-stakes, or open-ended requests."
                ]
              }
            ],
            "quiz": [
              {
                "id": "business_applications_c3_q1",
                "text": "What can you do when a request is ambiguous?",
                "options": [
                  {
                    "id": "a",
                    "text": "Nothing, just accept whatever comes back"
                  },
                  {
                    "id": "b",
                    "text": "Instruct the AI to ask clarifying questions first"
                  },
                  {
                    "id": "c",
                    "text": "Always avoid ambiguous requests entirely"
                  },
                  {
                    "id": "d",
                    "text": "Repeat the same prompt exactly"
                  }
                ],
                "correct": "b",
                "explanation": "You can explicitly instruct the AI to ask clarifying questions when a request is ambiguous, rather than letting it guess at what you meant."
              },
              {
                "id": "business_applications_c3_q2",
                "text": "What's the tradeoff of asking for clarification first?",
                "options": [
                  {
                    "id": "a",
                    "text": "No tradeoff, it's strictly worse"
                  },
                  {
                    "id": "b",
                    "text": "A short delay in exchange for a better-targeted answer"
                  },
                  {
                    "id": "c",
                    "text": "It makes the AI less accurate"
                  },
                  {
                    "id": "d",
                    "text": "It costs more every time"
                  }
                ],
                "correct": "b",
                "explanation": "Asking for clarification first costs a short delay, but usually pays off with a much more accurately targeted final answer."
              },
              {
                "id": "business_applications_c3_q3",
                "text": "Clarifying questions are most useful for:",
                "options": [
                  {
                    "id": "a",
                    "text": "Simple, unambiguous math problems"
                  },
                  {
                    "id": "b",
                    "text": "Ambiguous or high-stakes requests"
                  },
                  {
                    "id": "c",
                    "text": "Requests with no context needed"
                  },
                  {
                    "id": "d",
                    "text": "Never useful"
                  }
                ],
                "correct": "b",
                "explanation": "Clarifying questions are most valuable for ambiguous or high-stakes requests, where a wrong guess would be costly — simple, unambiguous questions don't need them."
              }
            ]
          }
        ]
      }
    ]
  }
}


// Flattens a stage's content into an ordered chapter list for book paging.
// Module 1-shaped stages have chapters directly; Module 2-shaped stages
// group them under lessons first, chapters here get tagged with their
// lessonTitle so the TOC/page-left label can still show it.
export function getChaptersForStage(stageId) {
  const content = LEARN_CONTENT[stageId]
  if (!content) return []
  if (content.chapters) return content.chapters.map((c) => ({ ...c, lessonTitle: null }))
  if (content.lessons) {
    return content.lessons.flatMap((lesson) =>
      lesson.chapters.map((c) => ({ ...c, lessonTitle: lesson.title })),
    )
  }
  return []
}

export function getModuleLabel(stageId) {
  return LEARN_CONTENT[stageId]?.moduleLabel || null
}

// Lesson groupings for the table-of-contents page, or null for a stage
// (Module 1) whose chapters aren't grouped under lessons.
export function getLessonsForStage(stageId) {
  return LEARN_CONTENT[stageId]?.lessons || null
}

// Splits "Module 1: Enter the AI Realm" into its number ("Module 1") and
// name ("Enter the AI Realm") for the book reader's title/subtitle split.
export function getModuleParts(stageId) {
  const label = getModuleLabel(stageId)
  if (!label) return null
  const [number, ...rest] = label.split(': ')
  return { number, name: rest.join(': ') || number }
}

// The book's closing case-study page (the artifact's own "casestudy" page
// type), ported near-verbatim: a real-work scenario the reader applies
// what they just read to. Only Module 1 has one defined so far.
const CASE_STUDIES = {
  foundations: {
    prompt:
      "A small shop owner spends about 5 hours a week answering the same handful of customer emails — order status, return policy, opening hours. She wants AI's help but isn't sure where to start.\n\nUsing what you've learned in this module, recommend an approach: automation, generative AI, or an AI agent — and explain your reasoning in a few sentences. What would you build first, and why start there?",
  },
}

export function getCaseStudy(stageId) {
  return CASE_STUDIES[stageId] || null
}

// Plain-text version of a chapter's notesSections, for handing to Buddy as
// reference material when a reader asks a question mid-chapter (see
// BookReader's buddyContext and BuddyPanel's 'explain' mode). Not used for
// rendering, ChapterNotesPage renders notesSections directly.
export function flattenChapterNotes(chapter) {
  if (!chapter?.notesSections) return ''
  return chapter.notesSections
    .flatMap((section) => {
      const lines = section.heading ? [section.heading] : []
      section.items.forEach((item) => {
        if (typeof item === 'string') lines.push(`- ${item}`)
        else {
          lines.push(`- ${item.text}`)
          item.subs.forEach((sub) => lines.push(`  - ${sub}`))
        }
      })
      return lines
    })
    .join('\n')
}
