-- Seed data for the tasks table, generated from src/lib/tasks.js.
-- Run this once, after schema.sql, so task_attempts (which has a foreign key
-- to tasks.id) has real rows to reference. Safe to re-run (upserts on id).

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('tools_01', 'tools', 'intermediate', 'A teammate needed to pull key clauses out of a 200-page contract and used a general chat AI tool, pasting the whole thing into one message.', 'The AI replied with a confident two-paragraph summary claiming it had reviewed "the full contract."', true, 'Most general chat tools quietly truncate very long pastes rather than reading everything: the AI summarized whatever fit, not the whole document, and didn''t flag the cutoff. The real error here isn''t the summary''s wording, it''s the tool choice: a task like this needs a tool built for long documents, not a quick assumption that any AI tool handles any input size the same way.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('tools_02', 'tools', 'advanced', 'Someone set up a custom AI skill months ago to auto-format their team''s monthly report, and has been trusting its output ever since without re-checking it.', 'This month''s report looks polished and consistent with every previous month.', true, 'A custom skill or saved prompt is still just instructions: it doesn''t know when the underlying data format changes upstream. "It always looks right" is a formatting consistency check, not a correctness check, and those are easy to confuse. Skills and saved workflows need occasional re-verification against the source, not a one-time setup and permanent trust.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('writing_01', 'writing', 'basic', 'A colleague asked AI to draft a follow-up email to a client after a sales call.', '"Thanks for the call today, as discussed, I''ll get you set up with our 15% loyalty discount and have the paperwork over by Friday."', true, 'The 15% discount was never discussed or approved in the call: this is a fabricated commitment that reads naturally and would be easy to send without noticing.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('writing_02', 'writing', 'basic', 'AI was asked to draft a short recap email after an internal planning meeting.', 'A plain, accurate recap listing three agreed action items and owners, with no invented details.', false, 'This one''s accurate. Not every AI output has an error: part of calibration is recognizing when something is actually fine, not treating every output as suspect by default.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('writing_03', 'writing', 'intermediate', 'AI drafted a LinkedIn post announcing a product launch.', 'The post includes: "launching this Friday, March 14th": a specific date that was never provided as input.', true, 'The AI invented a specific date because the prompt implied urgency but didn''t specify one: a common pattern where AI fills gaps with plausible-sounding specifics.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('data_01', 'data', 'intermediate', 'AI was asked to summarize quarter-over-quarter revenue from a spreadsheet.', '"Revenue grew 22% quarter over quarter."', true, 'Recalculating from the actual figures gives roughly 14% growth: the AI''s arithmetic on aggregated data was wrong, despite stating the number with full confidence.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('data_02', 'data', 'basic', 'AI was asked to describe the trend in a small, simple dataset.', 'An accurate description of a steady upward trend, correctly caveated as approximate.', false, 'Correct. Simple, well-scoped numeric summaries are actually one of the lower-risk uses of AI: worth noticing that risk isn''t uniform across all tasks.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('data_03', 'data', 'advanced', 'AI was given a table and asked to identify the highest-value entry.', 'Names an entry that is close to, but not actually, the highest value in the table.', true, 'A subtle retrieval error: the AI picked a plausible-looking answer rather than the actual maximum, easy to miss without checking the table directly.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('research_01', 'research', 'intermediate', 'AI was asked to summarize a research article''s key finding.', 'The summary includes a specific statistic ("adoption increased by 40%") attributed to the article.', true, 'That statistic doesn''t appear anywhere in the source article: a fabricated number presented as if it were a direct citation.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('research_02', 'research', 'basic', 'AI was asked to summarize an article''s core argument.', 'An accurate, appropriately hedged summary matching the article''s actual claims.', false, 'Correct and fairly caveated.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('research_03', 'research', 'advanced', 'AI compared two vendors'' pricing based on provided data.', 'States one option is "significantly cheaper," when the actual prices are within 5% of each other.', true, 'The word "significantly" overstates a marginal difference: a framing error more than a factual one, but still misleading if repeated without checking.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('policy_01', 'policy', 'intermediate', 'AI was asked to summarize a company''s leave policy from an internal document.', 'States "employees are entitled to 18 days of annual leave," when the source document says 21.', true, 'A direct factual error in a place where it matters: leave-day counts have real consequences if repeated to an employee.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('policy_02', 'policy', 'basic', 'AI was asked to restate a process document in simpler language.', 'An accurate, simplified rewrite that preserves the original steps and order.', false, 'Correct: a good example of AI doing well at a rephrasing task rather than a fact-generation task.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('policy_03', 'policy', 'advanced', 'AI was asked to summarize a compliance requirement and cite the relevant section.', 'Cites "Section 4.2" for a requirement that actually appears in Section 5.1 of the source material.', true, 'The content summary is roughly right, but the citation is wrong: a dangerous combination, since a wrong citation is very hard to catch without going back to the source.')
on conflict (id) do update set
  category = excluded.category,
  difficulty = excluded.difficulty,
  prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown,
  has_flaw = excluded.has_flaw,
  flaw_explanation = excluded.flaw_explanation;

-- Tier 2 (AI Agents) and Tier 3 (Agentic AI) tasks, generated from
-- TIER_TASKS in src/lib/tasks.js. Requires extend_category_for_tiers.sql to
-- have been run first, or these inserts fail with a 23514 constraint error.

-- Multi-type pilot (Platform Basics stage): step_ordering, troubleshooting,
-- and scenario_decision replace this stage's original flaw_spot tasks. These
-- rows exist only for task_attempts' FK, content is served from
-- src/lib/tasks.js, so ai_output_shown/has_flaw are left null (now nullable,
-- see add_task_types.sql) and flaw_explanation carries the explanation text
-- for reference.
insert into tasks (id, category, difficulty, type, prompt_scenario, flaw_explanation)
values ('agents_platform_01', 'agents', 'basic', 'step_ordering', 'You want to set up a Zapier automation that sends a Slack message every time a new row is added to a Google Sheet.', 'Each step depends on the one before it. You can''t map the sheet''s data into the Slack message until Zapier has pulled a sample row and knows what fields exist, and you can''t pick which data to watch before choosing the trigger app and connecting the account. Skipping the test-trigger step is the most common real mistake: people jump straight to building the action with no sample data to map from.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, type = excluded.type,
  prompt_scenario = excluded.prompt_scenario, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, type, prompt_scenario, flaw_explanation)
values ('agents_platform_02', 'agents', 'intermediate', 'troubleshooting', 'A teammate built a Zapier automation that is supposed to fire every time a new row is added to a Google Sheet, sending a Slack alert. Symptom: the Zap fired correctly for the first few rows added one at a time, but stopped firing after someone pasted 15 new rows in at once.', 'Row-added triggers on Sheets typically check for changes on a schedule and are built around rows arriving one at a time, a bulk paste can look like one big change instead of many separate new rows, so only some, or none, of the pasted rows fire the trigger.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, type = excluded.type,
  prompt_scenario = excluded.prompt_scenario, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, type, prompt_scenario, flaw_explanation)
values ('agents_platform_03', 'agents', 'intermediate', 'scenario_decision', 'You are setting up a new Zap and see two ways to connect to Slack: the official Slack integration, or a generic Webhook action where you would build the message yourself from scratch.', 'Official app integrations exist specifically so you don''t have to hand-build login and message formatting yourself. Reaching for a raw webhook by default adds real complexity for no benefit, unless the official integration is missing a feature you specifically need.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, type = excluded.type,
  prompt_scenario = excluded.prompt_scenario, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_integrations_01', 'agents', 'intermediate', 'A workflow pulls new leads from a CRM and emails them via Gmail, mapping the CRM''s ''full_name'' field directly into the email''s greeting.', 'Every email sent during testing opened with a correctly formatted first name, so the integration was marked complete.', true, 'Testing with a handful of clean sample leads doesn''t prove the mapping is safe: a ''full_name'' field that''s blank, or just a company name (common in real CRM data), will produce a broken greeting. Field mappings need checking against messy real data, not just the tidy first few test records.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_integrations_02', 'agents', 'basic', 'Someone connected Slack and Sheets so reacting with a checkmark emoji logs that message into a spreadsheet, and tested it with several different emoji reactions to confirm only the checkmark triggers it.', 'Only the checkmark reaction added new rows; other emoji reactions were correctly ignored.', false, 'Correct: the integration was tested against the edge case that actually mattered (other reactions), not just the happy path.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_integrations_03', 'agents', 'advanced', 'A workflow connects a support-ticket tool to a CRM, updating the customer record whenever a ticket closes, matching customers by email address across the two systems.', 'The workflow has been running for months with no errors reported in the execution log.', true, 'An empty error log only means no step threw an exception: it says nothing about whether the email match found the right customer. A ticket using a different email than the CRM record (a common real mismatch) would silently update the wrong record instead of failing loudly. ''No errors'' and ''working correctly'' are different claims.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_workflows_01', 'agents', 'intermediate', 'An automation onboards new hires: create account, add to Slack, send welcome email: as one linear Zap with three sequential steps.', 'The Zap has a 100% success rate shown in Zapier''s dashboard over the last 20 runs.', true, 'Zapier''s success rate counts a run as successful if every step returns a response without erroring: it doesn''t check whether the response was correct. If step 2 silently succeeds against the wrong workspace or a mistyped email, that run still counts as ''100% success'' even though the new hire never got added correctly.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_workflows_02', 'agents', 'advanced', 'A workflow pulls orders, checks inventory, and creates a purchase order with a supplier when inventory is low: running automatically every hour.', 'The workflow has been generating purchase orders correctly, so the team stopped manually reviewing them since it''s been reliable.', true, 'The risky move isn''t the workflow''s logic: it''s stopping human review entirely. An automated workflow with real financial consequences needs ongoing spot-checks, because upstream data changes (a renamed field, a new product category) can break the logic silently, and by the time anyone notices, many wrong purchase orders may already be sent.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_workflows_03', 'agents', 'basic', 'Someone built a workflow that archives Slack messages older than 90 days, and tested it by temporarily setting the threshold to 1 day to confirm the boundary worked, then set it back to 90.', 'The threshold logic worked exactly as expected in the test, correctly separating what should and should not be archived.', false, 'Good testing practice: using an extreme threshold to make the boundary condition observable, then reverting. No error here.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_errorhandling_01', 'agents', 'intermediate', 'A workflow was set up to retry automatically up to 5 times if any step fails, to make the automation more resilient.', 'Adding automatic retries means the workflow is now much more reliable and rarely needs attention.', true, 'Blind retries can make things worse for non-idempotent actions: if the failing step is ''charge a customer'' or ''create a record,'' retrying 5 times on a transient error can produce 5 duplicates instead of 1. Retries need pairing with idempotency (a unique request ID) or limiting to genuinely safe-to-repeat steps.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_errorhandling_02', 'agents', 'basic', 'Someone added a fallback so that if the primary CRM API call fails, lead data gets logged to a backup spreadsheet instead of being dropped, with a Slack alert whenever the fallback fires.', 'During a real API outage, the fallback path caught every lead in the backup sheet, and the team was alerted immediately.', false, 'Solid error handling: no lead is lost, and failures are visible rather than silent. Correct as described.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_errorhandling_03', 'agents', 'advanced', 'A workflow logs every error to a dedicated spreadsheet so the team can review failures weekly.', 'Since every failure gets logged, the team can be confident nothing is falling through the cracks.', true, 'Logging only catches errors the platform recognizes as errors: a step that runs ''successfully'' but produces wrong output never reaches the error log at all. Weekly log review catches loud failures, not silent wrong answers, which is a different and often larger category of risk.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_aienhancements_01', 'agents', 'intermediate', 'A workflow was upgraded to use an LLM step that reads support emails and auto-categorizes them as ''billing'', ''technical'', or ''other'' before routing.', 'The categorization looked accurate for the sample emails tried, so it was set to auto-route without anyone double-checking the category first.', true, 'An LLM classification step is still a probabilistic guess, not a rule: testing on a handful of clean samples doesn''t establish an accuracy rate. Auto-routing on an unverified classifier means misrouted tickets go unnoticed until a customer escalates, since there''s no human checkpoint before routing takes effect.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_aienhancements_02', 'agents', 'advanced', 'An LLM step writes a one-sentence summary of each incoming customer email before it lands in a tracking spreadsheet, to save the team reading time.', 'The summaries read smoothly and consistently, so the team started relying on just the summary column instead of opening the original emails.', true, 'A smooth, consistent summary is not the same as an accurate one: summarization can drop or soften an urgent detail (a cancellation threat, a complaint) while still reading fluently. Relying on the summary alone, without spot-checking, is exactly the confident-but-wrong risk that fluent output makes easy to miss.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agents_aienhancements_03', 'agents', 'basic', 'A workflow uses an LLM step to draft a suggested reply to common customer questions, but routes every draft to a human agent''s inbox for approval before anything is sent.', 'The LLM-drafted replies save the team time as a starting point, but every message is still reviewed and can be edited or rejected before sending.', false, 'This is the right pattern: AI drafts, a human still approves before anything customer-facing goes out. No error here.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_frameworkbasics_01', 'agentic_ai', 'intermediate', 'A developer built a LangChain agent with a ''search the web'' tool and a ''calculator'' tool, and tested it with a few math questions it answered correctly using the calculator.', 'Since the agent used the calculator correctly for math questions, the developer concluded it reliably knows when to use which tool.', true, 'Testing only questions that clearly call for one tool skips the harder case: ambiguous questions where the agent has to decide whether to use a tool at all. It might reach for the calculator on obvious math but still just guess an answer from memory on something it could look up: tool selection needs testing on ambiguous cases, not just obvious ones.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_frameworkbasics_02', 'agentic_ai', 'basic', 'A team gave their agent a ''send email'' tool restricted so a human must click ''approve'' in a review UI before any email actually sends, even though the agent can draft and queue on its own.', 'The agent can draft and queue outgoing emails autonomously, but no email leaves the system without a human approving first.', false, 'Good tool design: autonomy to draft and queue, with a human checkpoint before the irreversible action. No flaw here.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_frameworkbasics_03', 'agentic_ai', 'advanced', 'An agent was given a ''run SQL query'' tool against a read replica of the production database, documented as ''safe to use for any query.''', 'Because the tool is a read replica and documented as safe, the team let the agent run any query it generated without review.', true, 'A read replica prevents data corruption, but not an expensive or malformed query from locking up the replica or causing an incident (stale data served, monitoring alerts firing). ''Safe'' in tool docs often means safe from one specific risk, not all risk: that distinction gets lost when an agent treats it as blanket permission.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_memory_01', 'agentic_ai', 'intermediate', 'A team built a RAG system that embeds company help docs into a vector database and retrieves the top 3 most similar chunks to answer user questions.', 'Since the vector search consistently returns chunks that are semantically similar to the question, the team trusts the answers are grounded and accurate.', true, 'Semantic similarity isn''t the same as correctness or recency: a retrieved chunk can be topically similar but from an outdated doc version, or similarly worded but answering a subtly different question. ''Topically related'' and ''actually answers this correctly'' are different claims RAG systems can quietly conflate.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_memory_02', 'agentic_ai', 'advanced', 'An agent was given long-term memory that stores summaries of past conversations with each user, so it can ''remember'' context across sessions.', 'The agent referenced details from a conversation weeks ago, which the team saw as proof the memory system was working well.', true, 'The agent retrieving something correctly is different from retrieving the right thing: memory that stores summaries, not full transcripts, can compress away nuance, and a false but plausible-sounding ''memory'' is just as easy to retrieve as an accurate one. Confirming it recalled something real doesn''t confirm the memory is accurate.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_memory_03', 'agentic_ai', 'basic', 'A team''s RAG system shows the source title and last-updated date alongside every retrieved chunk, and instructs the agent to note when a source is older than 6 months.', 'When answering from an older doc, the agent explicitly flagged ''this information may be outdated'' in its response.', false, 'A solid mitigation for the memory/retrieval risk in the earlier scenarios: surfacing source recency instead of hiding it. Correct as described.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_reasoning_01', 'agentic_ai', 'intermediate', 'An agent was asked to plan a 5-step task and wrote out a clear, well-reasoned chain of thought before producing its final plan.', 'Because the reasoning steps shown were logical and easy to follow, the team assumed the final plan was correct.', true, 'A chain-of-thought that reads logically doesn''t guarantee the facts or calculations inside it are correct: an agent can narrate a coherent-sounding argument resting on a wrong assumption at step 2, and every later step inherits the error while still sounding reasonable. Fluent reasoning and correct reasoning are different things to verify.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_reasoning_02', 'agentic_ai', 'advanced', 'An agent planning a multi-step data migration broke it into 8 sub-tasks, executing them one after another without re-checking earlier assumptions.', 'The agent completed all 8 sub-tasks and reported the migration as done.', true, 'Long, unsupervised task chains compound errors: if sub-task 2 assumed the wrong thing (e.g. which records to skip), sub-tasks 3 through 8 all build on that without the agent ever revisiting it, so the final ''done'' report reflects a consistent but wrong outcome throughout, not a validated one.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_reasoning_03', 'agentic_ai', 'basic', 'An agent planning a multi-step task was configured to pause and show its plan to a human before executing any step, and re-confirm after each major sub-task before continuing.', 'The agent paused for review before starting and again after finishing sub-task 3 of 5, catching a wrong assumption the human corrected before it affected the remaining steps.', false, 'Checkpointing mid-plan is exactly the right mitigation for the compounding-error risk in the previous scenarios. No flaw here.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_multiagent_01', 'agentic_ai', 'intermediate', 'A CrewAI setup has a ''researcher'' agent hand findings to a ''writer'' agent, which hands the draft to an ''editor'' agent, each passing along a condensed summary rather than the full research.', 'The final edited output reads polished and professional, so the team considered the handoff chain successful.', true, 'Each handoff that passes condensed summaries, not full context, is a chance to drop or distort a detail, and a polished final output can mask that: the writer and editor are only as good as the compressed summary they received, so a smooth result doesn''t confirm the original research made it through intact.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_multiagent_02', 'agentic_ai', 'advanced', 'Two agents were set up to negotiate a resource allocation between themselves: one representing ''team A'' priorities and one ''team B'': with the final agreement applied automatically.', 'The two agents converged on an agreement quickly, which the team took as a sign the negotiation logic was working well.', true, 'Fast convergence between two agents isn''t evidence of a good outcome: it''s just as consistent with both agents anchoring on an easy-to-reach but suboptimal compromise, with no human checking whether the allocation is actually fair before it''s automatically applied.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_multiagent_03', 'agentic_ai', 'basic', 'A multi-agent system has a dedicated ''critic'' agent whose only job is to review the other agents'' output and flag inconsistencies before anything is finalized, routing flagged items to a human.', 'The critic agent caught a contradiction between two other agents'' outputs and routed it to a human before the final result was published.', false, 'Building in a dedicated review agent plus a human escalation path is a good pattern for catching the silent handoff error described in the earlier scenarios. Correct as described.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_orchestration_01', 'agentic_ai', 'advanced', 'A production agent pipeline makes deployment decisions automatically: if test agents report ''all checks passed,'' a deploy agent pushes the change live with no human sign-off.', 'Removing the manual sign-off step sped up releases significantly, and the pipeline has deployed dozens of changes since.', true, 'Speed isn''t the same as safety here: an automated deploy pipeline is only as trustworthy as its test agent''s ability to catch every real failure mode, and agent-run test suites can pass on cases that don''t reflect production reality. Removing human sign-off from an irreversible action trades a speed win for a much higher blast radius if the test agent is ever wrong.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_orchestration_02', 'agentic_ai', 'intermediate', 'An orchestration pipeline runs several agents in parallel and merges their outputs into one report, resolving disagreements by taking the majority answer among the agents.', 'Since most disagreements were resolved by majority vote without incident, the team trusted the merge logic to handle conflicts correctly going forward.', true, 'Majority vote assumes each agent''s answer is an independent, uncorrelated guess: but agents built on the same underlying model, given the same misleading input, tend to make the same mistake together, so a majority can be confidently wrong in exactly the cases where the input itself was misleading.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;

insert into tasks (id, category, difficulty, prompt_scenario, ai_output_shown, has_flaw, flaw_explanation)
values ('agentic_orchestration_03', 'agentic_ai', 'basic', 'An orchestration pipeline that makes deployment decisions was set up so agent test results are advisory only: a human still reviews the summary and clicks deploy: with agents only automating the tedious parts.', 'The pipeline runs all checks and prepares a clear summary automatically, but every deploy still requires a human to review and approve.', false, 'This keeps the automation''s speed benefit for the tedious parts while keeping a human decision on the irreversible action: the right balance given the risk in the previous scenario. No flaw here.')
on conflict (id) do update set
  category = excluded.category, difficulty = excluded.difficulty, prompt_scenario = excluded.prompt_scenario,
  ai_output_shown = excluded.ai_output_shown, has_flaw = excluded.has_flaw, flaw_explanation = excluded.flaw_explanation;


