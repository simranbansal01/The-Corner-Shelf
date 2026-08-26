import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { TIERS, isTierUnlocked, getNextDirection } from '../lib/roadmap'
import { getModuleLabel } from '../lib/learnContent'
import { GOAL_OPTIONS, LEVEL_OPTIONS } from '../lib/onboardingQuestions'
import { PLACEMENT_QUESTIONS, scorePlacement } from '../lib/placementQuestions'
import { buildPathMessage } from '../lib/pathMessage'
import { logEvent, logError } from '../lib/events'
import { usePetBuddy } from '../context/PetBuddyContext'
import Layout from '../components/Layout'
import BookReader from '../components/BookReader'
import DashboardBook from '../components/DashboardBook'
import ShopPanel from '../components/ShopPanel'
import PetsPanel from '../components/shop-panels/PetsPanel'
import SettingsPanel from '../components/shop-panels/SettingsPanel'

// Maps a clicked shop prop's panelType (set in cornerShelfScene.js) to the
// ShopPanel title + content component to render for it. 'settings' is also
// reachable from the top-right HUD icon cluster (see CornerShelfScene.jsx).
// 'trust'/'history'/'profile' used to be their own entries here too; they
// now route to the dashboard book instead (see DASHBOARD_PANEL_PAGES below).
const PANEL_CONFIG = {
  pets: { title: 'Companion corner', Content: PetsPanel },
  settings: { title: 'Settings', Content: SettingsPanel },
}

// panelType -> which dashboard book page it should open straight to. The
// shopkeeper-desk 3D prop calls onOpenPanel('directions') instead (see
// openPanel below) — Profile is still reachable from the dashboard book's
// table of contents via Menu -> My Dashboard.
const DASHBOARD_PANEL_PAGES = {
  trust: 'scorecard',
  history: 'scorecard',
  dashboard: 'toc',
}

// Human-readable wall references for the directions dialogue, matching
// WALL_BY_TIER_ORDER below (fixed regardless of which way the player is
// currently facing, since the walls themselves don't move).
const WALL_DIRECTION_COPY = {
  back: 'the wall right behind me',
  left: 'the wall on your left',
  right: 'the wall on your right',
}

// The Three.js scene pulls in the `three` package (~600KB), so it's only
// fetched when someone actually lands on /bookshelf, not on every route.
const CornerShelfScene = lazy(() => import('../components/CornerShelfScene'))

// Tier 1's 5 stages sit on the back wall (always visible/unlocked), tier 2
// on the left wall, tier 3 on the right, mirroring the shop's 3 shelf walls.
const WALL_BY_TIER_ORDER = { 1: 'back', 2: 'left', 3: 'right' }

// Module 1 is one single book (its own 3 chapters, see learnContent.js's
// `foundations` entry): every physical book on the back wall opens this
// same stageId, whichever one the player picks off the shelf.
const MODULE_1_BOOK_STAGE_ID = 'foundations'

const TIER_COPY = {
  basic: "Starting from the fundamentals. You'll build up from the basics of judging AI output.",
  intermediate: "A solid working knowledge. You'll start on real judgment tasks right away.",
  advanced: "You clearly know your way around AI already. You'll get the harder judgment calls from day one.",
}

const SHOP_ORIENTATION_BLURB = "One more thing: Module 1 lives on the shelf right behind me, Module 2 is to your left, and Module 3 is to your right once you unlock it. Whenever you want a pointer to your next lesson, just come talk to me."

// Same conversation the old Onboarding/Placement/PlacementResult screens
// held, now delivered by the shopkeeper standing in the shop itself instead
// of on separate pages. Every Supabase write below is byte-for-byte what
// those screens used to do, only where it happens changed.
export default function Bookshelf() {
  const { user, profile, refreshProfile } = useAuth()
  const { triggerSuccess } = usePetBuddy()
  const [attemptedIds, setAttemptedIds] = useState([])
  const [loading, setLoading] = useState(true)

  // The open book, if any: everything (video/notes/quiz/tasks) happens
  // inside this overlay, there's no separate /learn or /task route to
  // navigate to anymore.
  const [openStageId, setOpenStageId] = useState(null)
  const [openCoverImage, setOpenCoverImage] = useState(null)
  const [buddyContext, setBuddyContext] = useState({ screen: 'bookshelf' })

  // The open shop panel (Pets/Settings), if any. Mutually exclusive with the
  // open book/dashboard in practice (all three pause the 3D scene the same
  // way), but kept as separate state since they're opened by different
  // clickable props.
  const [openPanelType, setOpenPanelType] = useState(null)

  // The open dashboard book (Menu), if any: a page key like 'toc'/'profile'/
  // 'scorecard'/etc, or null when closed. See DashboardBook.jsx.
  const [dashboardPage, setDashboardPage] = useState(null)

  // Shown briefly on the sign/plaques the moment a module unlocks (compared
  // against progress from the last fetch, see refreshProgress below).
  const [unlockMessage, setUnlockMessage] = useState(null)

  // The shopkeeper's post-onboarding "ask for directions" dialogue: null
  // when closed, otherwise 'menu' | 'nextLesson' | 'tour'. nextDirection
  // holds the getNextDirection() result computed when 'nextLesson' is
  // picked; tourStepIndex tracks position within
  // TOUR_STEPS while directionsStep === 'tour'. The 3D beacon's target
  // (pointTarget below) is derived from these rather than tracked
  // separately.
  const [directionsStep, setDirectionsStep] = useState(null)
  const [nextDirection, setNextDirection] = useState(null)
  const [tourStepIndex, setTourStepIndex] = useState(0)

  // Onboarding phase state. Starts at 'pet' for anyone without a tier yet;
  // 'done' (no shopkeeper UI at all) for everyone else. Once a tier is set
  // (level='beginner', or the placement test finishes), profile.tier stops
  // being empty, but we still hold at 'reveal' until the player confirms,
  // so the tier/path-message beat has a moment on screen before exploring.
  const [phase, setPhase] = useState(() => (profile?.tier ? 'done' : 'pet'))
  const [buddyCharacter, setBuddyCharacter] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [jobRoleLabel, setJobRoleLabel] = useState('')
  const [why, setWhy] = useState('')
  const [goal, setGoal] = useState(null)
  const [goalOther, setGoalOther] = useState('')
  const [placementIndex, setPlacementIndex] = useState(0)
  const [revealTier, setRevealTier] = useState(null)

  useEffect(() => {
    load()
    logEvent('bookshelf_viewed')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    setLoading(true)
    await refreshProgress()
    setLoading(false)
  }

  // Re-fetches attempted tasks and compares against the tier-unlock state
  // computed from the *previous* attemptedIds, so closing a book right
  // after finishing a module's last task both updates which books are
  // locked and surfaces the unlock beat, without needing a page reload.
  async function refreshProgress() {
    const previouslyUnlocked = new Set(TIERS.filter((t) => isTierUnlocked(t.order, attemptedIds)).map((t) => t.id))
    const { data: attempts } = await supabase.from('task_attempts').select('task_id').eq('user_id', user.id)
    const newAttemptedIds = (attempts || []).map((a) => a.task_id)
    const newlyUnlocked = TIERS.find((t) => !previouslyUnlocked.has(t.id) && isTierUnlocked(t.order, newAttemptedIds))
    setAttemptedIds(newAttemptedIds)
    if (newlyUnlocked) {
      logEvent('tier_unlocked', { tier_id: newlyUnlocked.id })
      setUnlockMessage(`Module ${newlyUnlocked.order} unlocked: ${newlyUnlocked.title}!`)
      setTimeout(() => setUnlockMessage(null), 6000)
      // Niblet celebrates real bookshop moments too, not just task verdicts.
      triggerSuccess(`You unlocked ${newlyUnlocked.title}! Great work.`)
    }
  }

  // Opens the book reader overlay in place, no navigation, the 3D scene
  // stays mounted underneath. coverDataURL (from the clicked book mesh's
  // own texture) becomes the reader's cover-flap image.
  function openBook(stageId, coverDataURL) {
    logEvent('bookshelf_stage_clicked', { stage_id: stageId })
    setOpenCoverImage(coverDataURL || null)
    setOpenStageId(stageId)
  }

  async function closeBook() {
    logEvent('book_closed', { stage_id: openStageId })
    setOpenStageId(null)
    setOpenCoverImage(null)
    setBuddyContext({ screen: 'bookshelf' })
    await refreshProgress()
  }

  function openPanel(panelType) {
    if (panelType === 'directions') {
      openDirections()
      return
    }
    if (DASHBOARD_PANEL_PAGES[panelType]) {
      openDashboardBook(DASHBOARD_PANEL_PAGES[panelType])
      return
    }
    if (!PANEL_CONFIG[panelType]) return
    logEvent('shop_panel_opened', { panel_type: panelType })
    setOpenPanelType(panelType)
  }

  function closePanel() {
    logEvent('shop_panel_closed', { panel_type: openPanelType })
    setOpenPanelType(null)
  }

  function openDirections() {
    logEvent('directions_opened')
    setDirectionsStep('menu')
  }

  function closeDirections() {
    logEvent('directions_closed')
    setDirectionsStep(null)
    setNextDirection(null)
    setTourStepIndex(0)
  }

  function handleDirectionsPick(value) {
    if (value === 'close') {
      closeDirections()
    } else if (value === 'menu') {
      setDirectionsStep('menu')
      setNextDirection(null)
      setTourStepIndex(0)
    } else if (value === 'next') {
      logEvent('directions_next_lesson_requested')
      setDirectionsStep('nextLesson')
      setNextDirection(getNextDirection(attemptedIds))
    } else if (value === 'tour') {
      logEvent('directions_tour_requested')
      setDirectionsStep('tour')
      setNextDirection(null)
      setTourStepIndex(0)
    } else if (value === 'tourNext') {
      setTourStepIndex((i) => i + 1)
    } else if (value === 'tourBack') {
      setTourStepIndex((i) => Math.max(0, i - 1))
    }
  }

  function openDashboardBook(pageKey) {
    logEvent('dashboard_opened', { page: pageKey })
    setDashboardPage(pageKey)
  }

  function closeDashboardBook() {
    logEvent('dashboard_closed')
    setDashboardPage(null)
  }

  // Same fields/table as the old Onboarding.jsx finish(), plus display_name/
  // job_role_label (collected by the new 'name'/'jobRole' phases below) —
  // same two columns ProfilePanel.jsx's Settings form reads/writes, so
  // whatever's entered here shows up there too, editable later. pet_choice
  // is deliberately not written here anymore: this step now picks the real
  // corner buddy (buddy_character), not the older companion-corner figurine.
  // pet_choice keeps its own DB default ('sprout') until changed in Settings.
  async function saveOnboardingAnswers(levelValue) {
    try {
      const pathMessage = buildPathMessage({ goal, level: levelValue })
      const { error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          job_role_label: jobRoleLabel,
          onboarding_why: why,
          onboarding_goal: goal,
          onboarding_goal_other: goal === 'other' ? goalOther : null,
          self_rated_level: levelValue,
          buddy_character: buddyCharacter,
          path_message: pathMessage,
        })
        .eq('id', user.id)
      if (error) throw error

      logEvent('onboarding_completed', { self_rated_level: levelValue, goal, buddy_character: buddyCharacter })
      await refreshProfile()

      if (levelValue === 'beginner') {
        await supabase.from('users').update({ tier: 'basic' }).eq('id', user.id)
        await refreshProfile()
        setRevealTier('basic')
        setPhase('reveal')
      } else {
        setPlacementIndex(0)
        setPhase('placement')
      }
    } catch (err) {
      logError('onboarding_submit_failed', err.message, 'saveOnboardingAnswers')
      alert('Something went wrong saving your answers. Please try again.')
    }
  }

  // Same table/scoring as the old Placement.jsx handleNext()/finishTest().
  async function savePlacementAnswer(optionId) {
    const question = PLACEMENT_QUESTIONS[placementIndex]
    const isCorrect = optionId === question.correct
    try {
      await supabase.from('placement_answers').insert({
        user_id: user.id,
        question_id: question.id,
        selected_option: optionId,
        is_correct: isCorrect,
      })
      logEvent('placement_question_answered', { question_id: question.id, selected_option: optionId, is_correct: isCorrect })
    } catch (err) {
      logError('placement_answer_save_failed', err.message, 'savePlacementAnswer')
    }

    if (placementIndex + 1 < PLACEMENT_QUESTIONS.length) {
      setPlacementIndex(placementIndex + 1)
    } else {
      await finishPlacement()
    }
  }

  async function finishPlacement() {
    try {
      const { data: answers, error } = await supabase
        .from('placement_answers')
        .select('is_correct')
        .eq('user_id', user.id)
      if (error) throw error

      const score = (answers || []).filter((a) => a.is_correct).length
      const tier = scorePlacement(score)

      const { error: updateError } = await supabase
        .from('users')
        .update({ placement_score: score, tier })
        .eq('id', user.id)
      if (updateError) throw updateError

      logEvent('placement_completed', { score, tier })
      await refreshProfile()
      setRevealTier(tier)
      setPhase('reveal')
    } catch (err) {
      logError('placement_finish_failed', err.message, 'finishPlacement')
      alert('Something went wrong scoring your test. Please try again.')
    }
  }

  // 3D-prop answers (buddy preview / option tile clicks) route here.
  function handleOnboardingPick(value) {
    if (phase === 'pet') {
      logEvent('onboarding_question_answered', { question_id: 'buddy_character', answer_value: value })
      setBuddyCharacter(value)
      setPhase('name')
    } else if (phase === 'goal') {
      logEvent('onboarding_question_answered', { question_id: 'goal', answer_value: value })
      setGoal(value)
      if (value !== 'other') setPhase('level')
    } else if (phase === 'level') {
      logEvent('onboarding_question_answered', { question_id: 'level', answer_value: value })
      saveOnboardingAnswers(value)
    } else if (phase === 'placement') {
      savePlacementAnswer(value)
    }
  }

  // Every free-text step (name / jobRole / why / goal="other") shares the
  // same DOM textarea in CornerShelfScene.jsx — one value in flight at a
  // time, routed here by phase.
  function handleOnboardingTextSubmit(text) {
    if (phase === 'name') {
      logEvent('onboarding_question_answered', { question_id: 'display_name', answer_value: text })
      setDisplayName(text)
      setPhase('jobRole')
    } else if (phase === 'jobRole') {
      logEvent('onboarding_question_answered', { question_id: 'job_role_label', answer_value: text })
      setJobRoleLabel(text)
      setPhase('why')
    } else if (phase === 'why') {
      logEvent('onboarding_question_answered', { question_id: 'why', answer_value: text })
      setWhy(text)
      setPhase('goal')
    } else if (phase === 'goal') {
      setGoalOther(text)
      setPhase('level')
    }
  }

  // "Start exploring" ends onboarding and immediately walks a brand-new
  // user through the same "Show me around" tour reachable later from the
  // shopkeeper's directions menu — first-timers shouldn't have to know to
  // go ask for it.
  function handleOnboardingConfirm() {
    logEvent('onboarding_flow_completed')
    setPhase('done')
    logEvent('directions_tour_requested', { source: 'onboarding_auto' })
    setDirectionsStep('tour')
    setNextDirection(null)
    setTourStepIndex(0)
  }

  const onboarding = useMemo(() => {
    if (phase === 'pet') {
      return {
        active: true,
        phase: 'pet',
        dialogue: "Welcome to The Corner Shelf! Before we start, pick your buddy — they'll follow you around and react as you go. (You can always switch later in Settings.)",
      }
    }
    if (phase === 'name') {
      return {
        active: true,
        phase: 'name',
        dialogue: "Good pick. What should I call you?",
        showTextInput: true,
        textInputPlaceholder: 'Your name',
      }
    }
    if (phase === 'jobRole') {
      return {
        active: true,
        phase: 'jobRole',
        dialogue: `Nice to meet you, ${displayName}! What do you do?`,
        showTextInput: true,
        textInputPlaceholder: 'e.g. Product Manager, Student, Designer',
      }
    }
    if (phase === 'why') {
      return {
        active: true,
        phase: 'why',
        dialogue: 'Good to know. So, why are you here?',
        showTextInput: true,
        textInputPlaceholder: 'A sentence or two is plenty',
      }
    }
    if (phase === 'goal') {
      return {
        active: true,
        phase: 'goal',
        dialogue: "What's your end goal here?",
        options: GOAL_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
        showTextInput: goal === 'other',
        textInputPlaceholder: 'Tell us more',
      }
    }
    if (phase === 'level') {
      return {
        active: true,
        phase: 'level',
        dialogue: 'Last one, how would you rate your AI knowledge?',
        options: LEVEL_OPTIONS.map((o) => ({ id: o.id, label: o.label })),
      }
    }
    if (phase === 'placement') {
      const q = PLACEMENT_QUESTIONS[placementIndex]
      return {
        active: true,
        phase: 'placement',
        questionNumber: placementIndex + 1,
        questionTotal: PLACEMENT_QUESTIONS.length,
        questionText: q.text,
        options: q.options.map((o) => ({ id: o.id, label: o.text })),
      }
    }
    if (phase === 'reveal') {
      const tier = revealTier || 'basic'
      const dialogue = [TIER_COPY[tier], profile?.path_message, SHOP_ORIENTATION_BLURB].filter(Boolean).join(' ')
      return { active: true, phase: 'reveal', dialogue }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, goal, placementIndex, revealTier, profile?.path_message, displayName])

  // Step-by-step "Show me around" walk, written for someone who's never
  // played a walking-around game before: first *how to move at all* and
  // *how to pick up a book*, then where things are. Each located step's
  // on-screen arrow (see pointTarget below) points the way instead of
  // dumping everything into one paragraph of text. Module 3's wording
  // depends on whether it's unlocked yet, same distinction the shopkeeper's
  // onboarding reveal already makes elsewhere.
  const tier3Unlocked = isTierUnlocked(3, attemptedIds)
  const TOUR_STEPS = [
    { dialogue: "First things first: press W, A, S, or D on your keyboard to walk. You can also just click anywhere on the floor and you'll walk right there.", point: null },
    { dialogue: "See a book glowing on a shelf? Walk up to it and click it — it'll pop right out and open up for you to read.", point: null },
    { dialogue: 'Module 1 lives right behind me, on the back wall — always open. Follow the arrow!', point: { kind: 'wall', id: 'back' } },
    { dialogue: 'Module 2 is on the wall to your left. Follow the arrow!', point: { kind: 'wall', id: 'left' } },
    {
      dialogue: tier3Unlocked
        ? 'Module 3 is on the wall to your right. Follow the arrow!'
        : 'Module 3 is on the wall to your right, once you unlock it. Follow the arrow!',
      point: { kind: 'wall', id: 'right' },
    },
    { dialogue: 'That cozy corner behind you is just for reading — no pressure, come sit whenever you like. Follow the arrow!', point: { kind: 'nook' } },
    { dialogue: 'And up top, the Menu button has your Dashboard and Settings — that’s where you pick your buddy, resize them, and switch themes.', point: null },
  ]

  const directions = useMemo(() => {
    if (directionsStep === 'menu') {
      return {
        active: true,
        dialogue: 'Need a hand finding something?',
        options: [
          { id: 'next', label: "Where's my next lesson?" },
          { id: 'tour', label: 'Show me around' },
        ],
      }
    }
    if (directionsStep === 'nextLesson') {
      let dialogue
      if (!nextDirection || nextDirection.type === 'complete') {
        dialogue = "You've completed every module — there's nothing left for me to point you to!"
      } else if (nextDirection.type === 'tier1_gap') {
        dialogue = "You've finished the shop's Module 1 book — keep working through your Dashboard tasks and Module 2 will unlock."
      } else if (nextDirection.type === 'locked') {
        dialogue = 'Finish your current module first and the next one will unlock.'
      } else {
        dialogue = `Your next lesson is "${nextDirection.title}" — on ${WALL_DIRECTION_COPY[nextDirection.wall]}. Look for the glowing marker!`
      }
      return {
        active: true,
        dialogue,
        options: [
          { id: 'menu', label: 'Back' },
          { id: 'close', label: 'Thanks!' },
        ],
      }
    }
    if (directionsStep === 'tour') {
      const step = TOUR_STEPS[tourStepIndex]
      const isFirst = tourStepIndex === 0
      const isLast = tourStepIndex === TOUR_STEPS.length - 1
      return {
        active: true,
        dialogue: step.dialogue,
        options: [
          { id: isFirst ? 'menu' : 'tourBack', label: 'Back' },
          isLast ? { id: 'close', label: 'Got it, thanks!' } : { id: 'tourNext', label: 'Next' },
        ],
      }
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directionsStep, nextDirection, tourStepIndex, tier3Unlocked])

  // The scene's pointer target (glowing beacon for a specific stage, or
  // on-screen arrow for a wall/nook), derived from whichever directions
  // step is active — kept as one memo (rather than plumbed through as
  // separate state) so CornerShelfScene's effect only refires when the
  // logical target actually changes, not on every unrelated re-render.
  const pointTarget = useMemo(() => {
    if (directionsStep === 'nextLesson' && nextDirection?.type === 'stage') {
      return { kind: 'stage', id: nextDirection.stageId }
    }
    if (directionsStep === 'tour') {
      return TOUR_STEPS[tourStepIndex]?.point ?? null
    }
    return null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directionsStep, nextDirection, tourStepIndex, tier3Unlocked])

  const books = TIERS.flatMap((tier) => {
    const unlocked = isTierUnlocked(tier.order, attemptedIds)
    if (tier.order === 1) {
      const title = getModuleLabel(MODULE_1_BOOK_STAGE_ID)
      return tier.stages.map(() => ({
        stageId: MODULE_1_BOOK_STAGE_ID,
        title,
        wall: WALL_BY_TIER_ORDER[tier.order] || 'back',
        unlocked,
      }))
    }
    return tier.stages.map((stage) => ({
      stageId: stage.id,
      title: stage.title,
      wall: WALL_BY_TIER_ORDER[tier.order] || 'back',
      unlocked,
    }))
  })

  return (
    <Layout buddyContext={buddyContext} floatingNav>
      {loading ? (
        <div className="page-center">Loading…</div>
      ) : (
        <Suspense fallback={<div className="page-center">Loading the shop…</div>}>
          <CornerShelfScene
            books={books}
            signSubtitle={getModuleLabel(MODULE_1_BOOK_STAGE_ID)}
            plaqueLabels={[
              `Module 2 · ${TIERS[1].title}`,
              `Module 3 · ${TIERS[2].title}`,
            ]}
            onOpenStage={openBook}
            onboarding={onboarding}
            onOnboardingPick={handleOnboardingPick}
            onOnboardingTextSubmit={handleOnboardingTextSubmit}
            onOnboardingConfirm={handleOnboardingConfirm}
            bookOpen={!!openStageId}
            panelOpen={!!openPanelType || !!dashboardPage || !!directionsStep}
            onOpenPanel={openPanel}
            unlockMessage={unlockMessage}
            directions={directions}
            onDirectionsPick={handleDirectionsPick}
            pointTarget={pointTarget}
          />
          {openStageId && (
            <BookReader
              key={openStageId}
              stageId={openStageId}
              coverImage={openCoverImage}
              onClose={closeBook}
              onBuddyContextChange={setBuddyContext}
            />
          )}
          {openPanelType && (() => {
            const { title, Content } = PANEL_CONFIG[openPanelType]
            return (
              <ShopPanel title={title} onClose={closePanel}>
                <Content />
              </ShopPanel>
            )
          })()}
          {dashboardPage && (
            <DashboardBook
              initialPage={dashboardPage}
              onClose={closeDashboardBook}
              attemptedIds={attemptedIds}
            />
          )}
        </Suspense>
      )}
    </Layout>
  )
}
