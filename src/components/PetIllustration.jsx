// Original pixel-art companions: chunky blocky style, warm palette, big
// black pixel eyes, blush cheeks. Built as a small bitmap (12 cols wide)
// rendered as <rect> blocks with crisp edges, not smooth vector curves.
// Four variants share one body/head grid and swap only the "topper"
// (leaves vs ears) and the color palette, so they read as one family.

const PX = 4 // size of one pixel block, in SVG units
const COLS = 12

const LEAVES_TOPPER = [
  '....GGGG....',
  '...GGGGGG...',
  '....GGGG....',
  '.....HH.....',
]

const EARS_TOPPER = [
  '.A........A.',
  '.AA......AA.',
  '..AA....AA..',
  '............',
]

// eyeRow: '.' = no eye pixel here, 'e' = eye pixel (color substituted at render time)
function bodyRows(eyeRow2) {
  return [
    '..OOOOOOOO..',
    '.OLBBBBBBDO.',
    `.OLB${eyeRow2}BB${eyeRow2}BDO.`,
    '.OLBBBBBBDO.',
    '.OLBkBBkBDO.',
    '..OOOOOOOO..',
    '....OOOO....',
    '...SSSSSS...',
    '..SSSaaSSS..',
    '..LSSSSSSD..',
    '..FF....FF..',
  ]
}

const PETS = {
  sprout: {
    topper: LEAVES_TOPPER,
    palette: { O: '#4a3826', B: '#f0e6d2', L: '#fbf3e3', D: '#dccbab', S: '#c98a52', F: '#8a6a46', G: '#7fbb6c', H: '#4f7a42', a: '#6ea85c' },
  },
  fox: {
    topper: EARS_TOPPER,
    palette: { O: '#5a3a22', B: '#f5ddbf', L: '#fdecd6', D: '#e0bd94', S: '#d68a5c', F: '#8a5a34', A: '#c96a3c', a: '#b5673c' },
  },
  owl: {
    topper: EARS_TOPPER,
    palette: { O: '#4a3826', B: '#e9dcc0', L: '#f6ead0', D: '#cdbb98', S: '#a68a68', F: '#6b5238', A: '#7d6448', a: '#7d6448' },
  },
  cat: {
    topper: EARS_TOPPER,
    palette: { O: '#5a4a34', B: '#f3ead6', L: '#fcf3e2', D: '#d9c9a8', S: '#d8c7a3', F: '#9c8862', A: '#c9b48c', a: '#c9b48c' },
  },
}

const CONST_COLORS = { E: '#2b2418', K: '#e8a98f', k: '#e8a98f' }

function Pixels({ rows, palette, offsetY = 0 }) {
  const cells = []
  rows.forEach((row, y) => {
    for (let x = 0; x < COLS; x++) {
      const ch = row[x]
      if (ch === '.') continue
      const color = CONST_COLORS[ch] || palette[ch]
      if (!color) continue
      cells.push(
        <rect key={`${x}-${y + offsetY}`} x={x * PX} y={(y + offsetY) * PX} width={PX} height={PX} fill={color} />
      )
    }
  })
  return cells
}

export default function PetIllustration({ pet = 'sprout', state = 'idle', size = 46 }) {
  const def = PETS[pet] || PETS.sprout
  // idle: closed-eye line (blends into outline). active: normal open eyes.
  // waking: eyes open on two rows for a brief wide-eyed "just woke up" look.
  const eyeRow2 = state === 'idle' ? 'O' : 'e'
  const rows = bodyRows(eyeRow2).map((r) => r.replace(/e/g, 'E'))
  const width = COLS * PX
  const height = (def.topper.length + rows.length) * PX

  return (
    <svg
      className={`pet-illustration pet-illustration-${state}`}
      viewBox={`0 0 ${width} ${height}`}
      width={size}
      height={size * (height / width)}
      shapeRendering="crispEdges"
    >
      <Pixels rows={def.topper} palette={def.palette} offsetY={0} />
      <Pixels rows={rows} palette={def.palette} offsetY={def.topper.length} />
      {state === 'waking' && (
        <Pixels
          rows={['.OB' + 'E' + 'BBBB' + 'E' + 'BO.']}
          palette={def.palette}
          offsetY={def.topper.length + 1}
        />
      )}
    </svg>
  )
}

export const PET_OPTIONS = [
  { id: 'sprout', name: 'Sprout', blurb: 'Steady and quiet, notices the small stuff.' },
  { id: 'fox', name: 'Fen', blurb: 'Quick and a little sly, good at catching what looks off.' },
  { id: 'owl', name: 'Percy', blurb: 'Watches closely, doesn\u2019t say much until it matters.' },
  { id: 'cat', name: 'Biscuit', blurb: 'Curious and unbothered, nothing rattles it.' },
]
