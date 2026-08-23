import { getChaptersForStage, getCaseStudy } from './learnContent'
import { getStageById, getTasksForStage } from './roadmap'

// Sequences a stage's existing content into the book reader's pages.
//
// Tier 1's books follow the artifact's own structure: a table-of-contents
// page, then per chapter: intro -> video (placeholder for now) -> quick
// notes -> one page per quiz question -> a scorecard (with a retake-quiz
// option), then a closing case-study page once every chapter's done, for
// stages that have one (see learnContent.js's getCaseStudy). Tiers 2/3
// have no chapter content, they keep their practice-task pages as before.
// The app's pre-existing generic judgment tasks aren't from the artifact,
// so Tier 1's books don't get them.
//
// The toc page's entries and the scorecard's retake button both need to
// jump to a specific page, so every chapter's starting page index (and
// each chapter's first quiz page index) is recorded while building the
// list, then patched into the toc entry up front.
export function buildBookPages(stageId) {
  const pages = []
  const chapters = getChaptersForStage(stageId)

  if (chapters.length > 0) {
    const tocEntries = []
    pages.push(null) // toc placeholder, filled in once entries are known

    chapters.forEach((chapter, chapterIdx) => {
      const chapterNumber = chapterIdx + 1
      tocEntries.push({ kicker: `CHAPTER ${chapterNumber}`, title: chapter.title, icon: '📘', pageIndex: pages.length })

      pages.push({ type: 'chapter-intro', chapter, chapterNumber })
      pages.push({ type: 'chapter-video', chapter, chapterNumber })
      pages.push({ type: 'chapter-notes', chapter, chapterNumber })

      const firstQuizPageIndex = pages.length
      chapter.quiz.forEach((question, questionIndex) => {
        pages.push({
          type: 'chapter-quiz',
          chapter,
          chapterNumber,
          question,
          questionNumber: questionIndex + 1,
          totalQuestions: chapter.quiz.length,
        })
      })
      pages.push({ type: 'chapter-score', chapter, chapterNumber, firstQuizPageIndex })
    })

    const caseStudy = getCaseStudy(stageId)
    if (caseStudy) {
      tocEntries.push({ kicker: 'FINAL TASK', title: 'Put It Into Practice', icon: '🎯', pageIndex: pages.length })
      pages.push({ type: 'case-study', caseStudy })
    }

    pages[0] = { type: 'toc', tocEntries }
  }

  const found = getStageById(stageId)
  if (found && found.tier.order !== 1) {
    getTasksForStage(stageId).forEach((task) => pages.push({ type: 'task', task }))
  }

  return pages
}
