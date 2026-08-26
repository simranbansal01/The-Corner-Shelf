// The 3 selectable corner-buddy characters (profile.buddy_character), with
// the flavor copy shown on their pick cards — both in Settings
// (BuddyCharacterControl.jsx) and in the onboarding "pick your buddy" step
// (CornerShelfScene.jsx). One shared list so the two pickers can't drift.
export const BUDDY_CHARACTERS = [
  {
    id: 'niblet',
    name: 'Niblet',
    epithet: 'The anxious hamster',
    quote: 'Safety first!',
    blurb: 'A steady, hard-hat-wearing hamster. Highly alert (a little jumpy), double-checks everything, and guides you carefully.',
  },
  {
    id: 'sir-claws-a-lot',
    name: 'Sir Claws-a-Lot',
    epithet: 'The pompous lobster',
    quote: 'Indeed, an excellent choice.',
    blurb: "A pompous, monocled lobster. Dignified and a bit much, he'll offer grand advice and speak very highly of himself.",
  },
  {
    id: 'glitchy',
    name: 'Glitchy',
    epithet: 'The derpy slime',
    quote: 'Oops! Yay! Clicks!',
    blurb: 'A derpy, endlessly wobbly slime. Eager and chaotic, morphs around and loves clicking on absolutely everything.',
  },
]
