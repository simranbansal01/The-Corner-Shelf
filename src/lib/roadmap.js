// The core learning journey: 3 tiers x 5 stages, from the "15 Steps to Learn
// AI" roadmap. Static content, same convention as tasks.js/curriculum.js:
// only per-user progress lives in the DB (derived here from task_attempts,
// the same way Bookshelf.jsx already derived category progress).
import { TASKS, TIER_TASKS } from './tasks'

const ALL_TASKS = [...TASKS, ...TIER_TASKS]

export const TIERS = [
  {
    id: 'ai_chatbots',
    order: 1,
    title: 'AI Chatbots',
    subtitle: 'ChatGPT, Claude, Gemini',
    stages: [
      { id: 'foundations', title: 'Foundations', description: 'Start with LLM basics, prompt logic, and key limitations.', taskIds: ['writing_01', 'writing_02', 'writing_03'] },
      { id: 'prompt_engineering', title: 'Prompt Engineering', description: 'Build structured prompts using roles and context.', taskIds: ['tools_01', 'tools_02'] },
      { id: 'use_cases', title: 'Use Cases', description: 'Apply skills to writing, research, Q&A, and summaries.', taskIds: ['data_01', 'data_02', 'data_03'] },
      { id: 'advanced_features', title: 'Advanced Features', description: 'Expand to plugins, APIs, multi-modal inputs, GPTs.', taskIds: ['research_01', 'research_02', 'research_03'] },
      { id: 'business_applications', title: 'Business Applications', description: 'Adapt for support, workflows, and ideation.', taskIds: ['policy_01', 'policy_02', 'policy_03'] },
    ],
  },
  {
    id: 'ai_agents',
    order: 2,
    title: 'AI Agents',
    subtitle: 'Make.com, Zapier, n8n',
    stages: [
      { id: 'platform_basics', title: 'Platform Basics', description: 'Start with triggers, actions, and no-code setup.', taskIds: ['agents_platform_01', 'agents_platform_02', 'agents_platform_03'] },
      { id: 'app_integrations', title: 'App Integrations', description: 'Connect tools like Gmail, Sheets, Slack, and CRMs.', taskIds: ['agents_integrations_01', 'agents_integrations_02', 'agents_integrations_03'] },
      { id: 'multi_step_workflows', title: 'Multi-Step Workflows', description: 'Automate routine business tasks.', taskIds: ['agents_workflows_01', 'agents_workflows_02', 'agents_workflows_03'] },
      { id: 'error_handling', title: 'Error Handling & Optimization', description: 'Add debugging, logging, and fail-safes.', taskIds: ['agents_errorhandling_01', 'agents_errorhandling_02', 'agents_errorhandling_03'] },
      { id: 'ai_enhancements', title: 'AI Enhancements', description: 'Integrate LLMs for intelligent workflow automation.', taskIds: ['agents_aienhancements_01', 'agents_aienhancements_02', 'agents_aienhancements_03'] },
    ],
  },
  {
    id: 'agentic_ai',
    order: 3,
    title: 'Agentic AI',
    subtitle: 'LangChain, AutoGen, CrewAI',
    stages: [
      { id: 'framework_basics', title: 'Framework Basics', description: 'Learn agent orchestration and tool use.', taskIds: ['agentic_frameworkbasics_01', 'agentic_frameworkbasics_02', 'agentic_frameworkbasics_03'] },
      { id: 'memory_retrieval', title: 'Memory & Retrieval', description: 'Store and retrieve data with vector databases.', taskIds: ['agentic_memory_01', 'agentic_memory_02', 'agentic_memory_03'] },
      { id: 'multistep_reasoning', title: 'Multi-Step Reasoning', description: 'Apply chain-of-thought and task planning.', taskIds: ['agentic_reasoning_01', 'agentic_reasoning_02', 'agentic_reasoning_03'] },
      { id: 'multiagent_collaboration', title: 'Multi-Agent Collaboration', description: 'Agents delegating, interacting, solving problems.', taskIds: ['agentic_multiagent_01', 'agentic_multiagent_02', 'agentic_multiagent_03'] },
      { id: 'advanced_orchestration', title: 'Advanced Orchestration', description: 'Run pipelines with decisions and deployments.', taskIds: ['agentic_orchestration_01', 'agentic_orchestration_02', 'agentic_orchestration_03'] },
    ],
  },
]

export function getStageById(stageId) {
  for (const tier of TIERS) {
    const stage = tier.stages.find((s) => s.id === stageId)
    if (stage) return { tier, stage }
  }
  return null
}

export function getTasksForStage(stageId) {
  const found = getStageById(stageId)
  if (!found) return []
  return found.stage.taskIds.map((id) => ALL_TASKS.find((t) => t.id === id)).filter(Boolean)
}

// Next unattempted task in a stage, preferring one matching preferredDifficulty
// (the user's placement tier) when the stage has more than one option left.
export function getNextTaskForStage(stageId, attemptedIds, preferredDifficulty) {
  const unattempted = getTasksForStage(stageId).filter((t) => !attemptedIds.includes(t.id))
  if (unattempted.length === 0) return null
  if (preferredDifficulty) {
    const match = unattempted.find((t) => t.difficulty === preferredDifficulty)
    if (match) return match
  }
  return unattempted[0]
}

export function computeStageProgress(stageId, attemptedIds) {
  const tasks = getTasksForStage(stageId)
  const done = tasks.filter((t) => attemptedIds.includes(t.id)).length
  return { done, total: tasks.length, complete: tasks.length > 0 && done === tasks.length }
}

export function computeTierProgress(tierId, attemptedIds) {
  const tier = TIERS.find((t) => t.id === tierId)
  if (!tier) return { done: 0, total: 0, complete: false }
  let done = 0
  let total = 0
  for (const stage of tier.stages) {
    const p = computeStageProgress(stage.id, attemptedIds)
    done += p.done
    total += p.total
  }
  return { done, total, complete: total > 0 && done === total }
}

// Tier 1 is always unlocked; tier N unlocks once tier N-1 is 100% complete.
export function isTierUnlocked(tierOrder, attemptedIds) {
  if (tierOrder === 1) return true
  const prevTier = TIERS.find((t) => t.order === tierOrder - 1)
  if (!prevTier) return false
  return computeTierProgress(prevTier.id, attemptedIds).complete
}
