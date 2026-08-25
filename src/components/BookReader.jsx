import { useEffect, useMemo, useRef, useState } from 'react'
import { getStageById } from '../lib/roadmap'
import { buildBookPages } from '../lib/bookPages'
import { getSavedPageIndex, saveBookPageIndex } from '../lib/bookProgress'
import { getModuleParts, flattenChapterNotes, getModuleLabel } from '../lib/learnContent'
import { usePetBuddy } from '../context/PetBuddyContext'
import OpenBookShell from './OpenBookShell'
import {
  TocPage,
  ChapterIntroPage,
  ChapterVideoPage,
  ChapterNotesPage,
  ChapterQuizPage,
  ChapterScorePage,
} from './book-pages/ChapterPages'
import TaskPage from './book-pages/TaskPage'
import CaseStudyPage from './book-pages/CaseStudyPage'

// The open-book overlay a clicked shelf book turns into: for Tier 1's
// chapter-based books, a table of contents then intro/video/notes/quiz per
// chapter and a closing case study; for Tiers 2/3, one page per practice
// task. Paged through with the same prev/next controls the Corner Shelf
// artifact's own reader used. Sits on top of the still-mounted 3D scene,
// no route change, closing just clears state and hands the shop back.
// Chrome (the page-turn animation, two-page spread, nav) lives in
// OpenBookShell, shared with DashboardBook; this component only owns the
// stage-book-specific page sequencing and content.
export default function BookReader({ stageId, coverImage, onClose, onBuddyContextChange }) {
  const { triggerGuide } = usePetBuddy()
  const stageInfo = getStageById(stageId)
  const moduleParts = getModuleParts(stageId) // null for Tier 2/3 stages, which have no chapter content
  const pages = useMemo(() => buildBookPages(stageId), [stageId])
  // Resume where the reader last left this book instead of always
  // restarting at page 1, see lib/bookProgress.js.
  const [pageIndex, setPageIndex] = useState(() => Math.min(getSavedPageIndex(stageId), pages.length - 1))
  // questionId -> was it answered correctly, populated as ChapterQuizPage
  // reports answers, read by that chapter's ChapterScorePage.
  const [quizAnswers, setQuizAnswers] = useState({})
  const page = pages[pageIndex]
  // Guards the "here's this module" guide tip below so it fires once per
  // book per session, not every time the TOC page is revisited.
  const introducedStageId = useRef(null)

  useEffect(() => {
    saveBookPageIndex(stageId, pageIndex)
  }, [stageId, pageIndex])

  useEffect(() => {
    if (page?.type === 'toc') {
      onBuddyContextChange({ screen: 'toc', stageId })
      if (introducedStageId.current !== stageId) {
        introducedStageId.current = stageId
        triggerGuide(`Welcome to ${getModuleLabel(stageId)}! Pick a chapter below whenever you're ready.`)
      }
      return
    }
    // Grounds the ask box in whatever's actually on screen, not just the
    // chapter's notes in general: the video page hands over its caption
    // (there's no real transcript to quote), the quiz page hands over the
    // exact question/options/explanation being looked at, so "why is B
    // wrong" gets answered about the question in front of the reader, not
    // a generic one from earlier in the chapter.
    if (page?.type === 'chapter-video') {
      onBuddyContextChange({
        screen: 'chapter',
        stageId,
        chapterTitle: page.chapter.title,
        notes: `What this chapter's video covers: ${page.chapter.videoCaption || page.chapter.title}\n\n${flattenChapterNotes(page.chapter)}`,
      })
      return
    }
    if (page?.type === 'chapter-quiz') {
      const q = page.question
      const questionContext = [
        `Quiz question currently on screen: ${q.text}`,
        `Options: ${q.options.map((o) => o.text).join(' | ')}`,
        q.explanation ? `Explanation (already shown to the user once they answer): ${q.explanation}` : '',
      ].filter(Boolean).join('\n')
      onBuddyContextChange({
        screen: 'chapter',
        stageId,
        chapterTitle: page.chapter.title,
        notes: `${questionContext}\n\n${flattenChapterNotes(page.chapter)}`,
      })
      return
    }
    if (page?.type?.startsWith('chapter-')) {
      onBuddyContextChange({
        screen: 'chapter',
        stageId,
        chapterTitle: page.chapter.title,
        notes: flattenChapterNotes(page.chapter),
      })
    }
    // task/case-study pages report their own richer context via their own onContextChange
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, stageId, onBuddyContextChange])

  function goNext() {
    setPageIndex((i) => Math.min(i + 1, pages.length - 1))
  }
  function goPrev() {
    setPageIndex((i) => Math.max(i - 1, 0))
  }
  function jumpTo(index) {
    setPageIndex(Math.max(0, Math.min(index, pages.length - 1)))
  }

  function handleAnswered(questionId, isCorrect) {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: isCorrect }))
  }

  function handleRetake(chapter, firstQuizPageIndex) {
    setQuizAnswers((prev) => {
      const next = { ...prev }
      chapter.quiz.forEach((q) => delete next[q.id])
      return next
    })
    jumpTo(firstQuizPageIndex)
  }

  if (!page || !stageInfo) return null

  const eyebrow =
    page.type === 'toc' ? 'CONTENTS'
    : page.type === 'case-study' ? 'FINAL TASK'
    : page.chapterNumber ? `CHAPTER ${page.chapterNumber}`
    : stageInfo.tier.title
  const title =
    page.type === 'toc' ? (moduleParts?.name || stageInfo.stage.title)
    : page.type === 'case-study' ? 'Put It Into Practice'
    : page.chapter ? page.chapter.title
    : stageInfo.stage.title
  const subtitle = moduleParts ? `${moduleParts.number} · ${moduleParts.name}` : stageInfo.tier.title

  return (
    <OpenBookShell
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      pageLabel={`Page ${pageIndex + 1} of ${pages.length}`}
      coverImage={coverImage}
      canGoPrev={pageIndex > 0}
      canGoNext={pageIndex < pages.length - 1}
      onPrev={goPrev}
      onNext={goNext}
      onClose={onClose}
      showContentsLink={pages[0]?.type === 'toc'}
      onContents={() => jumpTo(0)}
      contentKey={pageIndex}
    >
      {page.type === 'toc' && <TocPage tocEntries={page.tocEntries} onJump={jumpTo} />}
      {page.type === 'chapter-intro' && <ChapterIntroPage chapter={page.chapter} />}
      {page.type === 'chapter-video' && <ChapterVideoPage chapter={page.chapter} />}
      {page.type === 'chapter-notes' && <ChapterNotesPage chapter={page.chapter} />}
      {page.type === 'chapter-quiz' && (
        <ChapterQuizPage key={page.question.id} question={page.question} onAnswered={handleAnswered} />
      )}
      {page.type === 'chapter-score' && (
        <ChapterScorePage
          chapter={page.chapter}
          quizAnswers={quizAnswers}
          onRetake={() => handleRetake(page.chapter, page.firstQuizPageIndex)}
        />
      )}
      {page.type === 'task' && (
        <TaskPage task={page.task} onAdvance={goNext} onContextChange={onBuddyContextChange} />
      )}
      {page.type === 'case-study' && (
        <CaseStudyPage caseStudy={page.caseStudy} onContextChange={onBuddyContextChange} />
      )}
    </OpenBookShell>
  )
}
