// What each category of task is actually teaching, shown on the Bookshelf
// screen so a new user can see the shape of the whole thing before diving in,
// instead of landing on an empty dashboard with zero context.
export const CATEGORY_META = {
  writing: {
    label: 'Writing & messages',
    description: 'Emails, recaps, and posts: catching invented commitments and confident-sounding fabrications before they go out.',
  },
  data: {
    label: 'Numbers & data',
    description: 'Spreadsheets and figures: catching arithmetic errors and misread tables that look right at a glance.',
  },
  research: {
    label: 'Research & summaries',
    description: 'Articles and reports: catching fabricated statistics and citations that don’t actually say what they’re credited with saying.',
  },
  policy: {
    label: 'Policy & compliance',
    description: 'Internal docs and rules: catching wrong figures and misattributed sections, where an error has real consequences.',
  },
  tools: {
    label: 'Tools & workflows',
    description: 'Picking the right tool for the job: catching cases where the tool itself, not the answer, was the mistake.',
  },
}

export const CATEGORY_ORDER = ['writing', 'data', 'research', 'policy', 'tools']
