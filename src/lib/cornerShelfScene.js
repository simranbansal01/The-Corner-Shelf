import * as THREE from 'three'

// Ported from the "Corner Shelf" Claude artifact (a hand-built Three.js
// walkable bookshop). The artifact's own in-scene book reader, case-study,
// and ~20 chapters of bundled content are NOT ported, picking up a book
// here calls onOpenStage(stageId) instead, which the host screen uses to
// navigate into the app's real Learn/Task flow for that stage.
//
// books: [{ stageId, title, wall: 'back'|'left'|'right', unlocked }]
// signSubtitle: text under the shop sign
// plaqueLabels: [leftWallLabel, rightWallLabel]
// onboarding: null once the player has already onboarded, otherwise
//   { active, phase: 'pet'|'why'|'goal'|'level'|'placement'|'reveal', options: [{id,label}]|null }
//   'why' and free-text answers are handled entirely outside this module (a
//   DOM textarea rendered by CornerShelfScene.jsx), so no 3D props are built
//   for that phase here, onOnboardingPick only fires for clicked 3D props.
// Movement/click-to-walk stay disabled until onboarding is null or its
// phase reaches 'reveal' and the caller confirms (see setOnboarding below).
export function createCornerShelfScene({ books, signSubtitle, plaqueLabels, onOpenStage, onboarding, onOnboardingPick, onOpenPanel }) {
const controller = new AbortController();
let rafId = null;
let explorationUnlocked = !(onboarding && onboarding.active);
let sceneActive = true; // false while a book reader or shop panel overlay is open
let onboardingGroup = null;
let onboardingClickables = [];
// Always-present clickable shop fixtures (companion corner/the shopkeeper
// himself), unlike onboardingClickables these are never cleared. Most open
// a ShopPanel via onOpenPanel(panelType); the shopkeeper's panelType
// ('directions') instead opens the ask-for-directions dialogue (see
// Bookshelf.jsx's openPanel).
let shopProps = [];

const PALETTE = {
  wallGreen: 0x3a5f4d,
  wood: 0x8a5f39,
  woodDark: 0x5c3d24,
  floor: 0x9c6b3e,
  ceiling: 0xf3e3c0,
  brass: 0xd6ab5f,
  ivy: 0x4d7a45,
  ivyDark: 0x365c34,
  rug: 0xb5573f,
  rugTrim: 0xecd190
};

const SPINE_COLORS = [
  0xb5574f, 0xd08a4a, 0xd9b458, 0x5f9166, 0x4c7a9c,
  0x8a6bab, 0xb08a3f, 0x4a8a63, 0xc06d8c, 0x5a83b8,
  0xe8d19a, 0x9c6b4a, 0x74a394, 0xc76a55, 0x5f87a3,
  0xefe4c8
];

const ROOM = { width: 6.2, depth: 5.6, height: 3.0 };
const EYE_HEIGHT = 1.5;
const MOVE_SPEED = 2.35;
const MARGIN = 0.4;
const PITCH_MIN = -0.4;
const PITCH_MAX = -0.15;
const DOOR_HALF_WIDTH = 0.62;
const OUTSIDE_WIDTH = 8.4;
const OUTSIDE_DEPTH = 4.6;
const BOOK_NEAR_DIST = 1.7;
const BOOK_POP_DIST = 0.42;

let scene, camera, renderer, clock;
let walkableMeshes = [];
let velocity = new THREE.Vector3();
let move = { forward: false, back: false, left: false, right: false };
let yaw = 0, pitch = -0.18;
let locked = false;
let hasMovedOnce = false;
let TOON_GRADIENT;
let GLOW_SPRITE_TEX;
let QUILT_TEX;
let audioCtx, footstepNoiseBuffer;
let stepTimer = 0;
let soundEnabled = true;
let currentBuildWall = null;
let allShelfBooks = [];
let lessonBooks = [];
// The single book currently popped out of the shelf (only one can be open
// at a time), so putBookBack() knows which mesh to animate home when the
// reader closes.
let poppedBookMesh = null;
let anyBookNearby = false;
let catAnimRefs = [];
let bookWorldPos = new THREE.Vector3();
// Single reusable "ask for directions" beacon (see pointToStage/clearPointer
// below), repositioned per-target rather than rebuilt each time.
let beaconSprite = null;
let beaconBaseScale = 1.1;
let beaconBaseY = 0;
let beaconTimeLeft = 0;
const BEACON_DURATION = 14;

function toonMat(color, extra) {
  return new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: TOON_GRADIENT }, extra || {}));
}

function addOutline(mesh, color, opacity) {
  const edges = new THREE.EdgesGeometry(mesh.geometry, 20);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: color || 0x241a12, transparent: true, opacity: opacity || 0.45, toneMapped: false })
  );
  mesh.add(line);
  return mesh;
}

function makeGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,232,180,0.95)');
  grad.addColorStop(0.35, 'rgba(255,205,130,0.4)');
  grad.addColorStop(1, 'rgba(255,205,130,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Distinct from makeGlowTexture's warm yellow (used for the "you're near a
// book" glow) so the shopkeeper's directions beacon reads as its own thing
// rather than looking like a book you're already standing next to.
function makeBeaconTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.3, 'rgba(140,210,255,0.55)');
  grad.addColorStop(1, 'rgba(90,170,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGlowBulb(radius) {
  const group = new THREE.Group();

  const glass = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 14, 12),
    new THREE.MeshBasicMaterial({ color: 0xffd68f, transparent: true, opacity: 0.72, toneMapped: false })
  );
  group.add(glass);

  const filament = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.4, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff8e0, toneMapped: false })
  );
  group.add(filament);

  if (!GLOW_SPRITE_TEX) GLOW_SPRITE_TEX = makeGlowTexture();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: GLOW_SPRITE_TEX, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
  }));
  glow.scale.set(radius * 9, radius * 9, 1);
  group.add(glow);

  return group;
}

function makeToonGradient() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 1;
  const ctx = c.getContext('2d');
  [92, 150, 205, 255].forEach((v, i) => {
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(i, 0, 1, 1);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return tex;
}

// A real equirectangular sky (mapping set below), not a flat backdrop: the
// old version was a plain canvas texture assigned straight to
// scene.background, which Three.js just renders as a static 2D image
// stretched behind the viewport, so tilting the camera up or panning
// around only ever showed more of the same narrow strip of gradient
// (exactly the "empty sky everywhere" the player kept running into).
// EquirectangularReflectionMapping makes the same single texture wrap
// around the camera in 3D instead, no extra geometry/draw calls needed, so
// this costs nothing perf-wise over the flat version it replaces.
function makeSkyTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#6fa8dd');
  grad.addColorStop(0.35, '#a7cdea');
  grad.addColorStop(0.55, '#c9e2f0');
  grad.addColorStop(0.72, '#eef0e2');
  grad.addColorStop(1, '#f3ecd8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Soft sun glow, upper sky, off-center so it isn't dead-center overhead.
  const sunX = 360, sunY = 55;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 70);
  sunGlow.addColorStop(0, 'rgba(255,248,214,0.95)');
  sunGlow.addColorStop(0.3, 'rgba(255,241,190,0.5)');
  sunGlow.addColorStop(1, 'rgba(255,241,190,0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(sunX - 70, sunY - 70, 140, 140);

  // Clouds spread across the FULL wrap (not just one strip), several
  // latitude bands so looking up or to the side always finds some.
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 26; i++) {
    const cx = Math.random() * 512;
    const cy = 30 + Math.random() * 130;
    const w = 20 + Math.random() * 34;
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.ellipse(cx + (Math.random() - 0.5) * w, cy + (Math.random() - 0.5) * 8, w * 0.35, w * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // A couple of tiny distant birds, cheap whimsy, drawn once into the
  // texture rather than as animated meshes.
  ctx.strokeStyle = 'rgba(60,55,50,0.4)';
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i++) {
    const bx = Math.random() * 512, by = 40 + Math.random() * 60, bw = 5 + Math.random() * 3;
    ctx.beginPath();
    ctx.moveTo(bx - bw, by);
    ctx.quadraticCurveTo(bx - bw * 0.3, by - bw * 0.7, bx, by);
    ctx.quadraticCurveTo(bx + bw * 0.3, by - bw * 0.7, bx + bw, by);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  return tex;
}

function makeWallTexture(baseColor) {
  const base = baseColor || '#3a5f4d';
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 32) {
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.fillRect(x + 2, 0, 3, 128);
    ctx.fillStyle = 'rgba(20,32,25,0.32)';
    ctx.fillRect(x, 0, 2, 128);
  }
  ctx.fillStyle = 'rgba(20,32,25,0.18)';
  ctx.fillRect(0, 0, 128, 3);
  ctx.fillRect(0, 125, 128, 3);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCobbleTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9c9184';
  ctx.fillRect(0, 0, 128, 128);
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    const y = r * (128 / rows);
    const offset = r % 2 === 0 ? 0 : 8;
    for (let cx = -8; cx < 136; cx += 16) {
      const stoneShade = 130 + Math.floor(Math.random() * 40 - 20);
      ctx.fillStyle = `rgb(${stoneShade},${stoneShade - 8},${stoneShade - 16})`;
      ctx.beginPath();
      ctx.roundRect(cx + offset, y, 14, 128 / rows - 2, 3);
      ctx.fill();
      ctx.strokeStyle = 'rgba(40,35,28,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRoadTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5a5852';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 300; i++) {
    const v = 70 + Math.random() * 40 | 0;
    ctx.fillStyle = `rgba(${v},${v - 2},${v - 4},0.5)`;
    ctx.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeSignTexture(text, subtitle) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = subtitle ? 168 : 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#28402f';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = '#d9b458';
  ctx.lineWidth = 7;
  ctx.strokeRect(12, 12, c.width - 24, c.height - 24);
  ctx.fillStyle = '#e9d59a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = 52;
  const maxWidth = 460;
  do {
    ctx.font = `bold ${fontSize}px Georgia, "Iowan Old Style", serif`;
    fontSize -= 2;
  } while (ctx.measureText(text).width > maxWidth && fontSize > 16);
  ctx.fillText(text, 256, subtitle ? 58 : 66);

  if (subtitle) {
    ctx.strokeStyle = 'rgba(233,213,154,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(90, 100);
    ctx.lineTo(422, 100);
    ctx.stroke();

    ctx.fillStyle = '#c9b98a';
    let subSize = 30;
    do {
      ctx.font = `italic 600 ${subSize}px Georgia, serif`;
      subSize -= 2;
    } while (ctx.measureText(subtitle).width > maxWidth && subSize > 12);
    ctx.fillText(subtitle, 256, 134);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeModuleTexture(text) {
  const c = document.createElement('canvas');
  c.width = 480; c.height = 108;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ecd8ae';
  ctx.fillRect(0, 0, 480, 108);
  ctx.strokeStyle = '#8a5f39';
  ctx.lineWidth = 5;
  ctx.strokeRect(9, 9, 462, 90);
  ctx.fillStyle = '#5c3d24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = 34;
  const maxWidth = 420;
  do {
    ctx.font = `bold ${fontSize}px Georgia, "Iowan Old Style", serif`;
    fontSize -= 2;
  } while (ctx.measureText(text).width > maxWidth && fontSize > 14);
  ctx.fillText(text, 240, 56);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildModulePlaque(x, y, z, rotY, text) {
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.26),
    new THREE.MeshBasicMaterial({ map: makeModuleTexture(text), toneMapped: false })
  );
  plaque.position.set(x, y, z);
  plaque.rotation.y = rotY || 0;
  addOutline(plaque, 0x5c3d24, 0.4);
  scene.add(plaque);
}

function makeBookLabelTexture(colorHex) {
  const c = document.createElement('canvas');
  c.width = 24; c.height = 48;
  const ctx = c.getContext('2d');
  const hex = '#' + colorHex.toString(16).padStart(6, '0');
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 24, 48);

  const bandY = 7 + Math.random() * 5;
  const bandH = 9 + Math.random() * 4;
  ctx.fillStyle = 'rgba(240,230,200,0.94)';
  ctx.fillRect(3, bandY, 18, bandH);
  ctx.strokeStyle = 'rgba(40,30,20,0.5)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(3, bandY, 18, bandH);

  ctx.strokeStyle = 'rgba(60,45,30,0.7)';
  ctx.lineWidth = 1;
  const lineCount = Math.random() < 0.5 ? 2 : 1;
  for (let j = 0; j < lineCount; j++) {
    const ly = bandY + bandH * (0.32 + j * 0.4);
    const lw = 8 + Math.random() * 6;
    ctx.beginPath();
    ctx.moveTo(12 - lw / 2, ly);
    ctx.lineTo(12 + lw / 2, ly);
    ctx.stroke();
  }

  if (Math.random() < 0.5) {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(4, 40);
    ctx.lineTo(20, 40);
    ctx.stroke();
  }

  if (Math.random() < 0.45) {
    ctx.strokeStyle = 'rgba(214,171,95,0.85)';
    ctx.lineWidth = 0.8;
    [3, 5, 43, 45].forEach(gy => {
      ctx.beginPath();
      ctx.moveTo(2, gy);
      ctx.lineTo(22, gy);
      ctx.stroke();
    });
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}


function makeLessonCoverTexture(title, colorHex) {
  const c = document.createElement('canvas');
  c.width = 96; c.height = 192;
  const ctx = c.getContext('2d');
  const hex = '#' + colorHex.toString(16).padStart(6, '0');
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, 96, 192);

  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(7, 7, 82, 178);

  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.arc(48, 42, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('✦', 48, 43);

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const words = title.split(' ');
  let lines = [];
  let line = '';
  const maxWidth = 74;
  let fontSize = 17;
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  words.forEach(w => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  const lineHeight = fontSize + 4;
  const startY = 96 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, 48, startY + i * lineHeight));

  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(20, 150);
  ctx.lineTo(76, 150);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '10px Georgia, serif';
  ctx.fillText('LESSON', 48, 164);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Shared word-wrap for canvas text, same greedy-line-break approach as
// makeLessonCoverTexture above, factored out since the onboarding board/tile
// textures below both need multi-line wrapping too.
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  words.forEach(w => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);
  return lines;
}

// The four companion figurines shown on the floor in front of the counter
// during the 'pet' onboarding phase. Ids/colors match PET_OPTIONS in
// PetIllustration.jsx (that component can't be reused here, this scene has
// no React/JSX dependency), so whichever id comes back through
// onOnboardingPick lines up with the same pet records the rest of the app uses.
const PET_FIGURINE_DEFS = [
  { id: 'sprout', color: 0x7fbb6c, topper: 'leaf' },
  { id: 'fox', color: 0xc96a3c, topper: 'ear' },
  { id: 'owl', color: 0x7d6448, topper: 'ear' },
  { id: 'cat', color: 0xc9b48c, topper: 'ear' },
];

function buildPetFigurine(def) {
  const group = new THREE.Group();
  const bodyMat = toonMat(def.color);
  const darkMat = toonMat(0x2a231c);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), bodyMat);
  body.scale.set(1, 0.95, 0.9);
  body.castShadow = true;
  addOutline(body, 0x1c1712, 0.4);
  group.add(body);

  if (def.topper === 'leaf') {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.07, 6), toonMat(0x4f7a42));
    leaf.position.set(0, 0.1, 0);
    group.add(leaf);
  } else {
    [-0.045, 0.045].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 8), bodyMat);
      ear.position.set(ex, 0.085, 0);
      ear.rotation.z = ex < 0 ? 0.2 : -0.2;
      group.add(ear);
    });
  }

  [-0.028, 0.028].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 8), darkMat);
    eye.position.set(ex, 0.02, 0.068);
    group.add(eye);
  });

  group.userData.onboardingValue = def.id;
  return group;
}

function makeTileTexture(text) {
  const c = document.createElement('canvas');
  c.width = 320; c.height = 120;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f9f3e3';
  ctx.fillRect(0, 0, 320, 120);
  ctx.strokeStyle = '#a9714f';
  ctx.lineWidth = 5;
  ctx.strokeRect(6, 6, 308, 108);
  ctx.fillStyle = '#3a2f22';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = 22;
  ctx.font = `bold ${fontSize}px Georgia, serif`;
  let lines = wrapLines(ctx, text, 270);
  while (lines.length > 3 && fontSize > 13) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Georgia, serif`;
    lines = wrapLines(ctx, text, 270);
  }
  const lineHeight = fontSize + 6;
  const startY = 60 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, 160, startY + i * lineHeight));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// A single clickable answer tile, used for the goal/level/placement
// onboarding phases. Faces +z (toward the fixed onboarding camera), same
// convention as the wall sign/plaques.
function buildOptionTile(text, x) {
  const tile = new THREE.Mesh(
    new THREE.PlaneGeometry(0.4, 0.15),
    new THREE.MeshBasicMaterial({ map: makeTileTexture(text), toneMapped: false, side: THREE.DoubleSide })
  );
  // Same vantage-point tuning as the pet figurines: high and just past the
  // desk, clear of both the question board above and the dialogue panel below.
  tile.position.set(x, 0.95, -0.15);
  addOutline(tile, 0x3a2f22, 0.35);
  return tile;
}

function makeBoardTexture(text) {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 220;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#28402f';
  ctx.fillRect(0, 0, 640, 220);
  ctx.strokeStyle = '#d9b458';
  ctx.lineWidth = 7;
  ctx.strokeRect(12, 12, 616, 196);
  ctx.fillStyle = '#e9d59a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = 30;
  ctx.font = `bold ${fontSize}px Georgia, "Iowan Old Style", serif`;
  let lines = wrapLines(ctx, text, 560);
  while (lines.length > 4 && fontSize > 16) {
    fontSize -= 2;
    ctx.font = `bold ${fontSize}px Georgia, "Iowan Old Style", serif`;
    lines = wrapLines(ctx, text, 560);
  }
  const lineHeight = fontSize + 8;
  const startY = 110 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((l, i) => ctx.fillText(l, 320, startY + i * lineHeight));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildQuestionBoard(text) {
  const board = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.28),
    new THREE.MeshBasicMaterial({ map: makeBoardTexture(text), toneMapped: false })
  );
  // Clear of the option tiles below it (tiles: y=0.95, height 0.15, so
  // top edge is ~1.025), otherwise the board's own plane intercepts the
  // raycast for clicks near the top of a tile before it reaches the tile.
  board.position.set(0, 1.35, 0.05);
  addOutline(board, 0x1c2c22, 0.4);
  return board;
}

// Removes whatever the previous onboarding phase built (figurines, tiles,
// question board) before the next phase adds its own, so nothing piles up
// across a single scene instance's onboarding lifetime.
function clearOnboardingProps() {
  if (onboardingGroup) {
    scene.remove(onboardingGroup);
    onboardingGroup.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(mat => { if (mat.map) mat.map.dispose(); mat.dispose(); });
      }
    });
  }
  onboardingGroup = new THREE.Group();
  scene.add(onboardingGroup);
  onboardingClickables = [];
}

// Builds whatever 3D props the given onboarding phase needs. 'why' has none,
// that phase is a DOM textarea rendered outside this module.
function applyOnboardingPhase(ob) {
  clearOnboardingProps();
  if (!ob || !ob.active) return;

  if (ob.phase === 'pet') {
    // Chest-height and just past the desk (not on the floor, close to the
    // camera), so they land clearly inside the frame instead of down near
    // the player's feet, off-screen below the dialogue panel.
    const xs = [-0.6, -0.2, 0.2, 0.6];
    PET_FIGURINE_DEFS.forEach((def, i) => {
      const fig = buildPetFigurine(def);
      fig.position.set(xs[i], 1.0, -0.15);
      onboardingGroup.add(fig);
      onboardingClickables.push(fig);
    });
  } else if (ob.options && ob.options.length) {
    const n = ob.options.length;
    const spacing = Math.min(0.5, 1.8 / n);
    const startX = -((n - 1) * spacing) / 2;
    ob.options.forEach((opt, i) => {
      const tile = buildOptionTile(opt.label, startX + i * spacing);
      tile.userData.onboardingValue = opt.id;
      onboardingGroup.add(tile);
      onboardingClickables.push(tile);
    });
    if (ob.phase === 'placement' && ob.questionText) {
      onboardingGroup.add(buildQuestionBoard(ob.questionText));
    }
  }
}

// Called by the host screen whenever onboarding phase/content changes, and
// once on creation. Flips exploration open the moment onboarding is no
// longer active, same effect click-to-walk/WASD already read every frame.
function setOnboarding(ob) {
  if (!ob || !ob.active) {
    explorationUnlocked = true;
    clearOnboardingProps();
    return;
  }
  explorationUnlocked = false;
  applyOnboardingPhase(ob);
}

function findOnboardingValue(object) {
  let o = object;
  while (o) {
    if (o.userData && o.userData.onboardingValue !== undefined) return o.userData.onboardingValue;
    o = o.parent;
  }
  return null;
}

function findPanelType(object) {
  let o = object;
  while (o) {
    if (o.userData && o.userData.panelType !== undefined) return o.userData.panelType;
    o = o.parent;
  }
  return null;
}

// A standing plaque like buildOptionTile, but for the always-present shop
// fixtures (ledger/noticeboard/companion corner) rather than a transient
// The always-present clickable shop fixtures: a companion corner (change
// your pet). Ledger/Noticeboard used to be plaque props here too, they're
// reachable from the top-right menu now instead (see CornerShelfScene.jsx),
// so the in-scene floating signs were removed rather than left as a
// redundant second way to open the same two panels. Built once in init(),
// the shopkeeper himself (built in buildOwnerDesk) is tagged separately for
// the ask-for-directions dialogue.
function buildShopProps() {
  const companion = buildPetFigurine({ id: 'sprout', color: 0x7fbb6c, topper: 'leaf' });
  companion.scale.setScalar(1.6);
  companion.position.set(-1.1, 0.2, 0.35);
  companion.userData.panelType = 'pets';
  scene.add(companion);
  shopProps.push(companion);
}

// Places each stage's book on its wall's shelves (picked from the books
// already procedurally scattered there by fillShelfSegment/makeBook),
// swaps in a title-cover texture, and wires up the glow + click state that
// updateLessonBooks/tryClickBook read every frame.
function assignLessonBooks() {
  const byWall = { back: [], left: [], right: [] };
  allShelfBooks.forEach(entry => {
    if (byWall[entry.wall]) byWall[entry.wall].push(entry);
  });

  const countByWall = {};
  books.forEach(b => { countByWall[b.wall] = (countByWall[b.wall] || 0) + 1; });
  const seenByWall = {};

  books.forEach((book, bookIndex) => {
    const pool = byWall[book.wall];
    if (!pool || !pool.length) return;
    const total = countByWall[book.wall] || 1;
    const i = seenByWall[book.wall] || 0;
    seenByWall[book.wall] = i + 1;
    const pickIndex = Math.min(pool.length - 1, Math.max(0, Math.floor(((i + 0.5) / total) * pool.length)));
    const entry = pool[pickIndex];
    if (!entry) return;

    const mesh = entry.mesh;
    const colorHex = SPINE_COLORS[bookIndex % SPINE_COLORS.length];
    const coverTex = makeLessonCoverTexture(book.title, colorHex);
    const coverMat = toonMat(0xffffff, { map: coverTex });
    mesh.material[0] = coverMat;
    mesh.material[1] = coverMat;
    mesh.material[4] = coverMat;

    mesh.userData.isLessonBook = true;
    mesh.userData.stageId = book.stageId;
    mesh.userData.bookIndex = bookIndex;
    mesh.userData.poppedOut = false;
    mesh.userData.animating = false;
    mesh.userData.homePos = mesh.position.clone();
    mesh.userData.homeRot = mesh.rotation.clone();
    mesh.userData.locked = !book.unlocked;
    // Handed up through onOpenStage so the DOM book-reader's cover-flap can
    // match the exact book that was clicked, same idea as the artifact's
    // own mesh.userData.coverDataURL.
    mesh.userData.coverDataURL = coverTex.image.toDataURL();

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeGlowTexture(), color: 0xffe6a0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0
    }));
    const glowScale = Math.max(mesh.geometry.parameters.width, mesh.geometry.parameters.height) * 3.2;
    glow.scale.set(glowScale, glowScale, 1);
    glow.position.set(0, 0, mesh.geometry.parameters.depth / 2 + 0.02);
    mesh.add(glow);
    mesh.userData.glow = glow;
    mesh.userData.glowBaseScale = glowScale;

    lessonBooks.push(mesh);
  });
}

// Built once, hidden until the shopkeeper's directions dialogue points it at
// a shelf (pointToStage) or a wall doesn't map to a specific book, in which
// case it's just left hidden. Kept as one reusable sprite rather than
// created/disposed per use, since only one target is ever shown at a time.
function buildDirectionsBeacon() {
  beaconSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeBeaconTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0
  }));
  beaconSprite.scale.set(beaconBaseScale, beaconBaseScale, 1);
  beaconSprite.visible = false;
  scene.add(beaconSprite);
}

// Points the beacon at the world position of the first shelf book matching
// stageId (module 1's books all share one stageId, so "first match" is fine
// there). No-ops if the stage isn't on a shelf right now (e.g. locked tier).
// Floats above head height rather than right above the target book: books
// can sit on a low shelf directly behind the desk/shopkeeper, and a beacon
// only 0.4 above one of those would be hidden behind them from the doorway.
// Kept below ~2.0 rather than up near the 3.0 ceiling because camera pitch
// is clamped (PITCH_MIN/PITCH_MAX above) to a fairly level, slightly-downward
// range — anything much higher than this falls outside what the player can
// actually tilt the camera up far enough to see.
const BEACON_HEIGHT = 1.9;

function pointToStage(stageId) {
  const mesh = lessonBooks.find((m) => m.userData.stageId === stageId);
  if (!mesh) return;
  mesh.getWorldPosition(bookWorldPos);
  // Books sit flush against their shelf wall, so the beacon's x/z (taken
  // straight from the book) would otherwise be coplanar with (or behind)
  // that wall's opaque backing panel and get depth-tested out. Pull it
  // inward, toward room center, by half a meter so it floats clearly in
  // open space in front of the wall instead.
  const dx = -bookWorldPos.x;
  const dz = -bookWorldPos.z;
  const len = Math.hypot(dx, dz) || 1;
  const x = bookWorldPos.x + (dx / len) * 0.5;
  const z = bookWorldPos.z + (dz / len) * 0.5;
  showBeacon(x, BEACON_HEIGHT, z);
}

// Center point of each shelf wall, for the tour's per-wall beacon steps
// (unlike pointToStage, these don't depend on any specific book existing —
// tier 2/3 walls should still be pointable even while locked/empty).
const WALL_POINTS = {
  back: [0, -ROOM.depth / 2],
  left: [-ROOM.width / 2, 0],
  right: [ROOM.width / 2, 0],
};

function pointToWall(wall) {
  const p = WALL_POINTS[wall];
  if (!p) return;
  const [wx, wz] = p;
  const dx = -wx;
  const dz = -wz;
  const len = Math.hypot(dx, dz) || 1;
  const x = wx + (dx / len) * 0.6;
  const z = wz + (dz / len) * 0.6;
  showBeacon(x, BEACON_HEIGHT, z);
}

// Roughly the cozy nook's rug/beanbag cluster center (see buildCozyNook),
// not tied to any single prop since the tour is pointing at the area as a
// whole, not one specific beanbag.
function pointToNook() {
  showBeacon(0.5, BEACON_HEIGHT, 0.9);
}

function showBeacon(x, y, z) {
  if (!beaconSprite) return;
  beaconSprite.position.set(x, y, z);
  beaconBaseY = y;
  beaconSprite.visible = true;
  beaconTimeLeft = BEACON_DURATION;
}

function clearPointer() {
  beaconTimeLeft = 0;
  if (beaconSprite) {
    beaconSprite.visible = false;
    beaconSprite.material.opacity = 0;
  }
}

function updateDirectionsBeacon(dt) {
  if (!beaconSprite || beaconTimeLeft <= 0) return;
  beaconTimeLeft -= dt;
  if (beaconTimeLeft <= 0) {
    beaconSprite.visible = false;
    beaconSprite.material.opacity = 0;
    return;
  }
  const fadingOut = beaconTimeLeft < 1.2;
  const targetOpacity = fadingOut ? beaconTimeLeft / 1.2 : 1;
  beaconSprite.material.opacity += (targetOpacity - beaconSprite.material.opacity) * Math.min(1, dt * 8);
  beaconSprite.position.y = beaconBaseY + Math.sin(clock.elapsedTime * 2.2) * 0.06;
  const pulse = 1 + Math.sin(clock.elapsedTime * 4) * 0.14;
  beaconSprite.scale.set(beaconBaseScale * pulse, beaconBaseScale * pulse, 1);
}

function init() {
  TOON_GRADIENT = makeToonGradient();

  scene = new THREE.Scene();
  scene.background = makeSkyTexture();
  scene.fog = new THREE.Fog(0xdce6da, 9, 20);

  camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 40);
  camera.rotation.order = 'YXZ';
  // Onboarding starts just inside the door, close enough that the
  // shopkeeper at his desk (buildOwnerDesk/buildShopkeeper, ~z=-0.96) is in
  // view on the default yaw/pitch, instead of the usual street spawn.
  camera.position.set(0, EYE_HEIGHT, onboarding && onboarding.active ? 1.6 : ROOM.depth / 2 + 1.3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  document.getElementById('canvas-wrap').appendChild(renderer.domElement);

  buildRoom();
  buildExterior();
  buildLighting();
  buildShelfWall('back');
  buildShelfWall('left');
  buildShelfWall('right');
  assignLessonBooks();
  addStringLights();
  buildCozyNook();
  buildOwnerDesk();
  buildShopProps();
  buildDirectionsBeacon();
  scene.add(buildChair(-2.15, 1.85, 0));
  buildPottedPlant(-ROOM.width / 2 + 0.45, ROOM.depth / 2 - 0.35, 0.9);
  buildPottedPlant(ROOM.width / 2 - 0.45, ROOM.depth / 2 - 0.35, 0.9);
  addShelfSconce(0, 2.55, -ROOM.depth / 2 + 0.55);
  addShelfSconce(-ROOM.width / 2 + 0.55, 2.55, 0.2);
  addShelfSconce(ROOM.width / 2 - 0.55, 2.55, 0.2);

  clock = new THREE.Clock();

  window.addEventListener('resize', onResize, { signal: controller.signal });
  setupControls();

  if (onboarding && onboarding.active) applyOnboardingPhase(onboarding);
}

function buildRoom() {
  const woodTex = makeWoodTexture();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), toonMat(0xffffff, { map: woodTex }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  walkableMeshes.push(floor);

  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.depth), toonMat(PALETTE.ceiling));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM.height;
  scene.add(ceiling);

  const skyGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), new THREE.MeshBasicMaterial({ color: 0xffe6ae, toneMapped: false }));
  skyGlow.rotation.x = Math.PI / 2;
  skyGlow.position.set(0, ROOM.height - 0.025, -0.4);
  scene.add(skyGlow);

  const skyFrameMat = toonMat(PALETTE.woodDark);
  const skyCenterZ = -0.4;
  [
    { w: 1.5, d: 0.09, x: 0, z: skyCenterZ - 0.48 },
    { w: 1.5, d: 0.09, x: 0, z: skyCenterZ + 0.48 },
    { w: 0.09, d: 1.06, x: -0.7, z: skyCenterZ },
    { w: 0.09, d: 1.06, x: 0.7, z: skyCenterZ }
  ].forEach(({ w, d, x, z }) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), skyFrameMat);
    beam.position.set(x, ROOM.height - 0.04, z);
    scene.add(beam);
  });

  const wallTex = makeWallTexture();
  const baseMat = toonMat(PALETTE.woodDark);

  const backTex = wallTex.clone();
  backTex.needsUpdate = true;
  backTex.repeat.set(ROOM.width / 0.9, ROOM.height / 0.9);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.width, ROOM.height), toonMat(0xffffff, { map: backTex }));
  back.position.set(0, ROOM.height / 2, -ROOM.depth / 2);
  back.receiveShadow = true;
  addOutline(back, 0x1c2c22, 0.35);
  scene.add(back);

  const leftTex = wallTex.clone();
  leftTex.needsUpdate = true;
  leftTex.repeat.set(ROOM.depth / 0.9, ROOM.height / 0.9);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.depth, ROOM.height), toonMat(0xffffff, { map: leftTex }));
  left.rotation.y = Math.PI / 2;
  left.position.set(-ROOM.width / 2, ROOM.height / 2, 0);
  left.receiveShadow = true;
  addOutline(left, 0x1c2c22, 0.35);
  scene.add(left);

  const rightTex = wallTex.clone();
  rightTex.needsUpdate = true;
  rightTex.repeat.set(ROOM.depth / 0.9, ROOM.height / 0.9);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.depth, ROOM.height), toonMat(0xffffff, { map: rightTex }));
  right.rotation.y = -Math.PI / 2;
  right.position.set(ROOM.width / 2, ROOM.height / 2, 0);
  right.receiveShadow = true;
  addOutline(right, 0x1c2c22, 0.35);
  scene.add(right);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.4), new THREE.MeshBasicMaterial({ map: makeSignTexture('THE CORNER SHELF', signSubtitle), toneMapped: false }));
  sign.position.set(0, ROOM.height - 0.24, -ROOM.depth / 2 + 0.02);
  addOutline(sign, 0x1c2c22, 0.4);
  scene.add(sign);

  buildModulePlaque(-ROOM.width / 2 + 0.02, 2.62, 0, Math.PI / 2, plaqueLabels[0]);
  buildModulePlaque(ROOM.width / 2 - 0.02, 2.62, 0, -Math.PI / 2, plaqueLabels[1]);

  [
    [ROOM.width, 0, -ROOM.depth / 2, 0],
    [ROOM.depth, -ROOM.width / 2, 0, Math.PI / 2],
    [ROOM.depth, ROOM.width / 2, 0, -Math.PI / 2]
  ].forEach(([len, x, z, ry]) => {
    const base = new THREE.Mesh(new THREE.BoxGeometry(len, 0.22, 0.06), baseMat);
    base.position.set(x, 0.11, z);
    base.rotation.y = ry;
    base.castShadow = true;
    scene.add(base);
  });

}

function makeWindowGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 48;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8a24a';
  ctx.fillRect(0, 0, 32, 48);
  const cols = [0xb5574f, 0xd08a4a, 0x5f9166, 0x4c7a9c, 0x8a6bab, 0xd9b458];
  let x = 1;
  while (x < 31) {
    const w = 2 + Math.random() * 3;
    ctx.fillStyle = '#' + cols[(Math.random() * cols.length) | 0].toString(16).padStart(6, '0');
    const h = 14 + Math.random() * 14;
    ctx.fillRect(x, 48 - h, w, h);
    x += w + 0.6;
  }
  ctx.fillStyle = 'rgba(255,220,160,0.18)';
  ctx.fillRect(0, 0, 32, 48);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeAwningTexture(text) {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 140;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f2e9d6';
  ctx.fillRect(0, 0, 640, 140);
  ctx.strokeStyle = '#243447';
  ctx.lineWidth = 6;
  ctx.strokeRect(8, 8, 624, 124);
  ctx.fillStyle = '#5c3d24';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let fontSize = 68;
  const maxWidth = 560;
  do {
    ctx.font = `italic 600 ${fontSize}px Georgia, "Iowan Old Style", serif`;
    fontSize -= 2;
  } while (ctx.measureText(text).width > maxWidth && fontSize > 20);
  ctx.fillText(text, 320, 74);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildExterior() {
  buildFacade();
  buildStreetSurface();
  buildTownBackdrop();
  buildAwningAndLights();
  addEntranceVines();
  buildStreetFurniture();
}

function buildVine(x, z, topY, bottomY) {
  const ivyMat = toonMat(PALETTE.ivy);
  const ivyDarkMat = toonMat(PALETTE.ivyDark);

  const points = [];
  const segs = 8;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    points.push(new THREE.Vector3(x + Math.sin(t * Math.PI * 3) * 0.05, topY - t * (topY - bottomY), z));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const stemGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(24));
  scene.add(new THREE.Line(stemGeo, new THREE.LineBasicMaterial({ color: 0x3a4a2a, toneMapped: false })));

  const leafCount = Math.max(4, Math.round((topY - bottomY) / 0.09));
  for (let i = 0; i < leafCount; i++) {
    const t = i / leafCount;
    const p = curve.getPoint(t);
    const mat = i % 2 === 0 ? ivyMat : ivyDarkMat;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.072, 5), mat);
    leaf.position.set(p.x + (Math.random() - 0.5) * 0.03, p.y, p.z + (Math.random() - 0.5) * 0.03);
    leaf.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
    leaf.rotation.x = (Math.random() - 0.5) * 0.4;
    leaf.castShadow = true;
    scene.add(leaf);
  }
}

function addEntranceVines() {
  const doorZ = ROOM.depth / 2 - 0.08;
  const roofTopY = ROOM.height + 0.3;
  const winX = 0.9, winOuterX = 2.35;

  buildVine(-DOOR_HALF_WIDTH - 0.06, doorZ, roofTopY - 0.05, 0.35);
  buildVine(DOOR_HALF_WIDTH + 0.06, doorZ, roofTopY - 0.05, 0.35);
  buildVine(-winX - 0.04, doorZ, roofTopY - 0.05, 2.05);
  buildVine(winX + 0.04, doorZ, roofTopY - 0.05, 2.05);
  buildVine(-winOuterX + 0.05, doorZ, roofTopY - 0.05, 1.5);
  buildVine(winOuterX - 0.05, doorZ, roofTopY - 0.05, 1.5);
}

function buildFacade() {
  const redTex = makeWallTexture('#dd8b78');
  const trimColor = 0xf2e8d8;
  const trimMat = toonMat(trimColor);
  const doorZ = ROOM.depth / 2;
  const wallThick = 0.12;
  const roofTopY = ROOM.height + 0.3;
  const winX = 0.9, winOuterX = 2.35, winSillY = 0.32, winTopY = 2.25;
  const doorH = 2.15;

  function panel(xStart, xEnd, yStart, yEnd) {
    const w = xEnd - xStart, h = yEnd - yStart;
    const tex = redTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(w / 0.9, h / 0.9);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, wallThick), toonMat(0xffffff, { map: tex }));
    mesh.position.set((xStart + xEnd) / 2, (yStart + yEnd) / 2, doorZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    addOutline(mesh, 0x5c3226, 0.3);
    scene.add(mesh);
    return mesh;
  }

  panel(-ROOM.width / 2, -winOuterX, 0, roofTopY);
  panel(winOuterX, ROOM.width / 2, 0, roofTopY);
  panel(-winOuterX, -winX, 0, winSillY);
  panel(winX, winOuterX, 0, winSillY);
  panel(-winOuterX, -winX, winTopY, roofTopY);
  panel(winX, winOuterX, winTopY, roofTopY);
  panel(-DOOR_HALF_WIDTH, DOOR_HALF_WIDTH, doorH, roofTopY);
  panel(-winX, -DOOR_HALF_WIDTH, 0, roofTopY);
  panel(DOOR_HALF_WIDTH, winX, 0, roofTopY);

  [-1, 1].forEach(side => {
    const cx = side * (winX + winOuterX) / 2;
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winOuterX - winX, winTopY - winSillY),
      new THREE.MeshPhysicalMaterial({ color: 0xeaf5f7, transparent: true, opacity: 0.22, roughness: 0.08, metalness: 0, side: THREE.DoubleSide })
    );
    glass.position.set(cx, (winSillY + winTopY) / 2, doorZ - wallThick / 2 - 0.01);
    scene.add(glass);

    const mullionV = new THREE.Mesh(new THREE.BoxGeometry(0.025, winTopY - winSillY, 0.02), trimMat);
    mullionV.position.set(cx, (winSillY + winTopY) / 2, doorZ - wallThick / 2 - 0.005);
    scene.add(mullionV);
    const mullionH = new THREE.Mesh(new THREE.BoxGeometry(winOuterX - winX, 0.025, 0.02), trimMat);
    mullionH.position.set(cx, (winSillY + winTopY) / 2, doorZ - wallThick / 2 - 0.005);
    scene.add(mullionH);

    const arch = new THREE.Mesh(new THREE.TorusGeometry((winOuterX - winX) / 2, 0.045, 8, 16, Math.PI), trimMat);
    arch.position.set(cx, winTopY, doorZ);
    scene.add(arch);
  });

  const doorArch = new THREE.Mesh(new THREE.TorusGeometry(DOOR_HALF_WIDTH, 0.05, 8, 16, Math.PI), trimMat);
  doorArch.position.set(0, doorH, doorZ);
  scene.add(doorArch);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width, 0.14, wallThick + 0.06), trimMat);
  trim.position.set(0, roofTopY, doorZ);
  trim.castShadow = true;
  addOutline(trim, 0xc7bba5, 0.3);
  scene.add(trim);
}

function buildStreetSurface() {
  const doorZ = ROOM.depth / 2;
  const sidewalkDepth = 1.8;

  const cobbleTex = makeCobbleTexture();
  cobbleTex.repeat.set(OUTSIDE_WIDTH / 0.55, sidewalkDepth / 0.55);
  const sidewalk = new THREE.Mesh(new THREE.PlaneGeometry(OUTSIDE_WIDTH, sidewalkDepth), toonMat(0xffffff, { map: cobbleTex }));
  sidewalk.rotation.x = -Math.PI / 2;
  sidewalk.position.set(0, 0, doorZ + sidewalkDepth / 2);
  sidewalk.receiveShadow = true;
  scene.add(sidewalk);
  walkableMeshes.push(sidewalk);

  const curb = new THREE.Mesh(new THREE.BoxGeometry(OUTSIDE_WIDTH, 0.08, 0.1), toonMat(0xd8d0c0));
  curb.position.set(0, 0.04, doorZ + sidewalkDepth);
  curb.castShadow = true;
  scene.add(curb);

  const roadDepth = OUTSIDE_DEPTH - sidewalkDepth;
  const roadTex = makeRoadTexture();
  roadTex.repeat.set(OUTSIDE_WIDTH / 1.2, roadDepth / 1.2);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(OUTSIDE_WIDTH, roadDepth), toonMat(0xffffff, { map: roadTex }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, -0.006, doorZ + sidewalkDepth + roadDepth / 2);
  road.receiveShadow = true;
  scene.add(road);
  walkableMeshes.push(road);

  const lineMat = toonMat(0xf0e6c8);
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.4), lineMat);
    seg.rotation.x = -Math.PI / 2;
    seg.position.set(0, -0.002, doorZ + sidewalkDepth + 0.45 + i * 0.7);
    scene.add(seg);
  }
}

// A painted 2D backdrop of a small town's storefronts + road, standing
// just past the real cobblestone/road the player can actually walk on
// (updateMovement's OUTSIDE_WIDTH/OUTSIDE_DEPTH clamp already stops
// walking that far, this is purely a visual illusion of the street
// continuing, not new walkable space). Flat, unlit MeshBasicMaterial
// planes, no shadows cast or received, so it's effectively free next to
// the shop's real geometry.
function makeTownRowTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const ctx = c.getContext('2d');

  // Sky-to-ground gradient tuned to blend into makeSkyTexture's own
  // horizon tones above and the real makeCobbleTexture/makeRoadTexture
  // colors below, so the seam between painted backdrop and real geometry
  // isn't obvious.
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 512);
  skyGrad.addColorStop(0, '#a7cdea');
  skyGrad.addColorStop(0.55, '#dfeaf0');
  skyGrad.addColorStop(1, '#eef0e2');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 512, 512);

  const groundY = 460;
  const buildColors = ['#c98a72', '#8fae86', '#7a9ec2', '#d0ab5c', '#a888b8'];
  const roofColors = ['#8a5238', '#4f6b46', '#4a648a', '#8a6a2c', '#6a4a78'];

  function building(x, w, h, colorIdx) {
    const top = groundY - h;
    ctx.fillStyle = buildColors[colorIdx % buildColors.length];
    ctx.fillRect(x, top, w, h);

    ctx.fillStyle = roofColors[colorIdx % roofColors.length];
    ctx.beginPath();
    ctx.moveTo(x - 6, top);
    ctx.lineTo(x + w / 2, top - 26);
    ctx.lineTo(x + w + 6, top);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,248,224,0.75)';
    const winCols = Math.max(1, Math.floor(w / 26));
    for (let wc = 0; wc < winCols; wc++) {
      for (let row = 0; row < 2; row++) {
        const wx = x + 10 + wc * 26;
        const wy = top + 16 + row * 40;
        if (wx + 14 < x + w - 4 && wy + 26 < groundY - 6) ctx.fillRect(wx, wy, 14, 26);
      }
    }

    ctx.fillStyle = 'rgba(70,45,30,0.85)';
    ctx.fillRect(x + w / 2 - 10, groundY - 34, 20, 34);
  }

  building(20, 90, 150, 0);
  building(130, 100, 190, 1);
  building(250, 85, 130, 2);
  building(355, 95, 170, 3);
  building(465, 80, 145, 4);

  ctx.fillStyle = '#9c9184';
  ctx.fillRect(0, groundY, 512, 20);
  ctx.fillStyle = '#5a5852';
  ctx.fillRect(0, groundY + 20, 512, 512 - groundY - 20);
  ctx.strokeStyle = 'rgba(230,220,200,0.5)';
  ctx.setLineDash([14, 12]);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 20 + (512 - groundY - 20) / 2);
  ctx.lineTo(512, groundY + 20 + (512 - groundY - 20) / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function buildTownBackdrop() {
  const baseTex = makeTownRowTexture();
  const unitWidth = 4; // world units represented by one un-repeated texture tile
  const planeHeight = 4.5;

  const doorZ = ROOM.depth / 2;
  const farZ = doorZ + OUTSIDE_DEPTH + 0.15;
  const sideX = OUTSIDE_WIDTH / 2 + 0.15;
  const backWidth = 24;
  const sideLength = 16;

  function panel(width, x, z, rotY) {
    const tex = baseTex.clone();
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(width / unitWidth, 1);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, planeHeight),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, toneMapped: false })
    );
    mesh.position.set(x, planeHeight / 2 - 0.05, z);
    mesh.rotation.y = rotY;
    scene.add(mesh);
  }

  panel(backWidth, 0, farZ, 0);
  panel(sideLength, -sideX, doorZ + OUTSIDE_DEPTH / 2, Math.PI / 2);
  panel(sideLength, sideX, doorZ + OUTSIDE_DEPTH / 2, -Math.PI / 2);
}

function buildAwningAndLights() {
  const doorZ = ROOM.depth / 2;
  const awningY = ROOM.height + 0.55;

  const awning = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.5),
    new THREE.MeshBasicMaterial({ map: makeAwningTexture('THE CORNER SHELF'), toneMapped: false })
  );
  awning.position.set(0, awningY, doorZ + 0.02);
  addOutline(awning, 0x1a2536, 0.4);
  scene.add(awning);

  const startX = -1.5, endX = 1.5;
  const points = [];
  const segCount = 5;
  for (let i = 0; i <= segCount; i++) {
    const t = i / segCount;
    const sag = Math.sin(t * Math.PI) * 0.14;
    points.push(new THREE.Vector3(startX + (endX - startX) * t, awningY + 0.35 - sag, doorZ + 0.1));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const wireGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(30));
  scene.add(new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: 0x2a2018, toneMapped: false })));
  for (let i = 0; i <= 14; i++) {
    const p = curve.getPoint(i / 14);
    const bulb = makeGlowBulb(0.014);
    bulb.position.set(p.x, p.y - 0.01, p.z);
    scene.add(bulb);
  }

  const lanternGroup = new THREE.Group();
  const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.28, 6), toonMat(0x1a2536));
  bracket.rotation.z = Math.PI / 2;
  bracket.position.set(-DOOR_HALF_WIDTH - 0.16, ROOM.height - 0.15, doorZ + 0.1);
  lanternGroup.add(bracket);

  const lanternPos = new THREE.Vector3(-DOOR_HALF_WIDTH - 0.32, ROOM.height - 0.35, doorZ + 0.1);
  const lanternBulb = makeGlowBulb(0.045);
  lanternBulb.position.copy(lanternPos);
  lanternGroup.add(lanternBulb);

  const cage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.06, 0.16, 8, 1, true),
    new THREE.MeshBasicMaterial({ color: 0x1a2536, transparent: true, opacity: 0.6, side: THREE.DoubleSide })
  );
  cage.position.copy(lanternPos);
  lanternGroup.add(cage);

  const lanternLight = new THREE.PointLight(0xffbf80, 0.5, 2.2, 2);
  lanternLight.position.copy(lanternPos);
  lanternGroup.add(lanternLight);
  scene.add(lanternGroup);

  const roofY = ROOM.height + 0.3;
  const leafMat = toonMat(PALETTE.ivy);
  const leafDarkMat = toonMat(PALETTE.ivyDark);
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const x = -ROOM.width / 2 + t * ROOM.width;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.09 + Math.random() * 0.05, 8, 6), i % 2 === 0 ? leafMat : leafDarkMat);
    leaf.position.set(x + (Math.random() - 0.5) * 0.1, roofY + 0.05 + Math.random() * 0.08, doorZ - 0.05 + (Math.random() - 0.5) * 0.1);
    leaf.castShadow = true;
    scene.add(leaf);
  }

  const railMat = toonMat(0x1a1a1a);
  const railTop = new THREE.Mesh(new THREE.BoxGeometry(ROOM.width - 0.4, 0.02, 0.02), railMat);
  railTop.position.set(0, roofY + 0.32, doorZ - 0.1);
  scene.add(railTop);
  for (let i = 0; i < 14; i++) {
    const x = -ROOM.width / 2 + 0.3 + i * ((ROOM.width - 0.6) / 13);
    const baluster = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), railMat);
    baluster.position.set(x, roofY + 0.17, doorZ - 0.1);
    scene.add(baluster);
  }
}

function buildStreetFurniture() {
  const doorZ = ROOM.depth / 2;
  buildPottedPlant(-2.35, doorZ + 0.4, 1.1);
  buildPottedPlant(2.35, doorZ + 0.4, 1.1);

  const tableX = 1.6, tableZ = doorZ + 1.3;
  const tableMat = toonMat(PALETTE.wood);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.035, 20), tableMat);
  tableTop.position.set(tableX, 0.62, tableZ);
  tableTop.castShadow = true; tableTop.receiveShadow = true;
  addOutline(tableTop, 0x2a1c12, 0.3);
  scene.add(tableTop);

  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.58, 10), tableMat);
  tableLeg.position.set(tableX, 0.33, tableZ);
  scene.add(tableLeg);

  const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.03, 16), tableMat);
  tableBase.position.set(tableX, 0.045, tableZ);
  scene.add(tableBase);

  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.05, 10), toonMat(0xf0e6c8));
  cup.position.set(tableX - 0.08, 0.665, tableZ + 0.05);
  scene.add(cup);

  scene.add(buildChair(tableX - 0.42, tableZ, Math.PI / 2));
  scene.add(buildChair(tableX + 0.42, tableZ, -Math.PI / 2));
}

function makeWoodTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9c6b3e';
  ctx.fillRect(0, 0, 256, 256);

  const plankH = 64;
  for (let py = 0; py < 256; py += plankH) {
    const shade = (Math.random() * 16 - 8) | 0;
    ctx.fillStyle = `rgb(${156 + shade},${107 + shade},${62 + shade})`;
    ctx.fillRect(0, py, 256, plankH);
    for (let i = 0; i < 8; i++) {
      const y = py + Math.random() * plankH;
      ctx.strokeStyle = `rgba(${70 + Math.random() * 30 | 0},${45 + Math.random() * 20 | 0},${20 + Math.random() * 10 | 0},${0.12 + Math.random() * 0.18})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(80, y + (Math.random() * 6 - 3), 170, y + (Math.random() * 6 - 3), 256, y);
      ctx.stroke();
    }
    const endSeamX = 40 + Math.random() * 176;
    ctx.strokeStyle = 'rgba(35,22,12,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(endSeamX, py);
    ctx.lineTo(endSeamX, py + plankH);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(30,18,10,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, py);
    ctx.lineTo(256, py);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(ROOM.width / 1.1, ROOM.depth / 1.1);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildLighting() {
  // Flat base fill so no corner of the shop ever falls to black, plus a
  // brighter sky/ground hemisphere for an airy daytime feel (the artifact's
  // dim lamp-only lighting left everything but the immediate lamp pools
  // near-black under MeshToonMaterial's stepped shading).
  const ambient = new THREE.AmbientLight(0xfff3e0, 0.65);
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0xcfe0f5, 0x6b543c, 0.75);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0d8, 0.55);
  sun.position.set(2.5, ROOM.height + 1, ROOM.depth / 2 + 2);
  scene.add(sun);

  const lampSpecs = [
    { x: -0.9, z: -1.55, len: 0.5 },
    { x: 0.55, z: -0.55, len: 0.3 },
    { x: -0.25, z: 0.55, len: 0.42 },
    { x: 1.15, z: 1.05, len: 0.26 }
  ];
  lampSpecs.forEach(({ x, z, len }, i) => {
    const group = new THREE.Group();
    group.position.set(x, ROOM.height - 0.04, z);
    scene.add(group);

    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, len, 6), toonMat(0x1a1410));
    cord.position.y = -len / 2;
    group.add(cord);

    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.03, 8), toonMat(0x2a1c12));
    socket.position.y = -len - 0.012;
    group.add(socket);

    const bulb = makeGlowBulb(0.052);
    bulb.position.y = -len - 0.06;
    group.add(bulb);

    const point = new THREE.PointLight(0xffc98a, 0.9, 5.5, 2);
    point.position.y = -len - 0.06;
    point.castShadow = i === 0;
    if (point.castShadow) {
      point.shadow.mapSize.set(1024, 1024);
      point.shadow.bias = -0.002;
    }
    group.add(point);
  });

  const fill = new THREE.PointLight(0xffdca8, 0.7, 10, 2);
  fill.position.set(0, 2.1, ROOM.depth / 2 - 0.9);
  scene.add(fill);
}

function addShelfSconce(x, y, z) {
  const light = new THREE.PointLight(0xffcf9c, 0.85, 4, 2);
  light.position.set(x, y, z);
  scene.add(light);
}

function addStringLights() {
  const startX = -ROOM.width / 2 + 0.35;
  const endX = ROOM.width / 2 - 0.35;
  const startZ = -ROOM.depth / 2 + 0.9;
  const endZ = ROOM.depth / 2 - 1.1;
  const segCount = 5;
  const points = [];
  for (let i = 0; i <= segCount; i++) {
    const t = i / segCount;
    const sag = Math.sin(t * Math.PI) * 0.2;
    points.push(new THREE.Vector3(
      startX + (endX - startX) * t,
      ROOM.height - 0.08 - sag,
      startZ + (endZ - startZ) * t
    ));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const wirePts = curve.getPoints(40);
  const wireGeo = new THREE.BufferGeometry().setFromPoints(wirePts);
  const wire = new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: 0x2a2018, toneMapped: false }));
  scene.add(wire);

  const bulbCount = 16;
  for (let i = 0; i <= bulbCount; i++) {
    const p = curve.getPoint(i / bulbCount);
    const bulb = makeGlowBulb(0.015);
    bulb.position.set(p.x, p.y - 0.014, p.z);
    scene.add(bulb);
  }

  const glow = new THREE.PointLight(0xffdca8, 0.55, 3.5, 2);
  glow.position.copy(curve.getPoint(0.5));
  glow.position.y -= 0.05;
  scene.add(glow);
}

function makeBook(width, height, depth, colorHex) {
  const sideMat = toonMat(colorHex);
  let frontMat = sideMat;
  if (Math.random() < 0.65) {
    frontMat = toonMat(0xffffff, { map: makeBookLabelTexture(colorHex) });
  }
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat]
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  addOutline(mesh, 0x2a1c12, 0.4);
  if (currentBuildWall) {
    allShelfBooks.push({ mesh, wall: currentBuildWall, colorHex });
  }
  return mesh;
}

function fillShelfSegment(group, rowWidth, y, shelfDepth, xStart, segWidth, gap) {
  let used = 0;
  const bookDepth = shelfDepth * 0.82;
  const gapHalf = gap ? gap.width / 2 : 0;
  while (used < segWidth - 0.02) {
    const w = 0.055 + Math.random() * 0.075;
    if (used + w > segWidth) break;
    const centerX = xStart + used + w / 2;
    if (gap && Math.abs(centerX - gap.center) < gapHalf + w / 2) {
      used += w + 0.004;
      continue;
    }
    const h = 0.24 + Math.random() * 0.15;
    const color = SPINE_COLORS[(Math.random() * SPINE_COLORS.length) | 0];
    const book = makeBook(w, h, bookDepth, color);
    const lean = Math.random() < 0.12 ? (Math.random() * 0.22 - 0.11) : 0;
    book.position.set(centerX, y + h / 2, 0);
    book.rotation.z = lean;
    group.add(book);
    used += w + 0.004;
  }
}

function fillShelfRow(group, rowWidth, y, shelfDepth, opts) {
  opts = opts || {};
  const segments = opts.segments || 1;
  const dividerW = 0.035;
  const segWidth = (rowWidth - dividerW * (segments - 1)) / segments;
  for (let s = 0; s < segments; s++) {
    const xStart = -rowWidth / 2 + s * (segWidth + dividerW);
    fillShelfSegment(group, rowWidth, y, shelfDepth, xStart, segWidth, opts.gap);
  }
}

function addShelfCat(group, shelfY, shelfDepth) {
  const cat = new THREE.Group();
  const furMat = toonMat(0x8f8f98);
  const furDarkMat = toonMat(0x5c5c66);
  const bellyMat = toonMat(0xf3ede0);
  const darkMat = toonMat(0x33333c);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 12), furMat);
  body.scale.set(1.22, 0.7, 1.1);
  body.position.set(0, shelfY + 0.045, shelfDepth / 2 - 0.08);
  body.castShadow = true;
  addOutline(body, 0x2a1c12, 0.4);
  cat.add(body);

  [-0.025, 0.005, 0.035].forEach(x => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.008, 0.05), furDarkMat);
    stripe.position.set(x, shelfY + 0.075, shelfDepth / 2 - 0.08);
    stripe.rotation.y = 0.2;
    cat.add(stripe);
  });

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), bellyMat);
  belly.scale.set(1, 0.65, 0.85);
  belly.position.set(0, shelfY + 0.072, shelfDepth / 2 + 0.005);
  cat.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), furMat);
  head.position.set(0, shelfY + 0.09, shelfDepth / 2 - 0.03);
  head.rotation.z = 0.15;
  head.castShadow = true;
  addOutline(head, 0x2a1c12, 0.4);
  cat.add(head);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 8), bellyMat);
  muzzle.position.set(0, shelfY + 0.081, shelfDepth / 2 + 0.008);
  cat.add(muzzle);

  [-0.02, 0.02].forEach(x => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.013, 0.02, 6), furMat);
    ear.position.set(x, shelfY + 0.12, shelfDepth / 2 - 0.04);
    ear.rotation.x = -0.15;
    cat.add(ear);
  });

  [-0.013, 0.013].forEach(x => {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.0035, 0.002), darkMat);
    eye.position.set(x, shelfY + 0.093, shelfDepth / 2 + 0.008);
    eye.rotation.z = x < 0 ? 0.15 : -0.15;
    cat.add(eye);
  });

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 6), toonMat(0xc06d8c));
  nose.position.set(0, shelfY + 0.081, shelfDepth / 2 + 0.017);
  cat.add(nose);

  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.011, 6, 16, Math.PI * 1.6), furMat);
  tail.position.set(0.05, shelfY + 0.048, shelfDepth / 2 - 0.1);
  tail.rotation.set(Math.PI / 2, 0, 0.5);
  cat.add(tail);

  group.add(cat);
  catAnimRefs.push({ body, tail, baseScaleY: 0.7, basePhase: Math.random() * Math.PI * 2 });
}

function addShelfLantern(group, x, shelfY, shelfDepth) {
  const lantern = new THREE.Group();
  const metalMat = toonMat(0x2a2420);
  const z = shelfDepth / 2 - 0.075;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.038, 0.012, 10), metalMat);
  base.position.set(x, shelfY + 0.006, z);
  lantern.add(base);

  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.055, 10),
    new THREE.MeshBasicMaterial({ color: 0xffcf7a, transparent: true, opacity: 0.5, toneMapped: false })
  );
  glass.position.set(x, shelfY + 0.04, z);
  lantern.add(glass);

  [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(a => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.055, 0.006), metalMat);
    post.position.set(x + Math.cos(a) * 0.025, shelfY + 0.04, z + Math.sin(a) * 0.025);
    lantern.add(post);
  });

  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.02, 0.013, 10), metalMat);
  top.position.set(x, shelfY + 0.073, z);
  lantern.add(top);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.0035, 6, 12, Math.PI), metalMat);
  handle.rotation.z = Math.PI;
  handle.position.set(x, shelfY + 0.092, z);
  lantern.add(handle);

  const bulb = makeGlowBulb(0.018);
  bulb.position.set(x, shelfY + 0.04, z);
  lantern.add(bulb);

  const light = new THREE.PointLight(0xffbf80, 0.6, 2.2, 2);
  light.position.set(x, shelfY + 0.04, z);
  lantern.add(light);

  group.add(lantern);
}

function makeFernFrond() {
  return new THREE.ConeGeometry(0.005, 0.1, 3, 1);
}

function addShelfFern(group, x, baseY, z, scale) {
  const potMat = toonMat(0x6b6b6b);
  const leafMat = toonMat(PALETTE.ivy);
  const leafDarkMat = toonMat(PALETTE.ivyDark);

  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * scale, 0.038 * scale, 0.05 * scale, 12), potMat);
  pot.position.set(x, baseY + 0.025 * scale, z);
  pot.castShadow = true;
  addOutline(pot, 0x1c1c1c, 0.3);
  group.add(pot);

  const frondCount = 16;
  for (let i = 0; i < frondCount; i++) {
    const t = i / (frondCount - 1);
    const angle = -1.25 + t * 2.5;
    const mat = i % 2 === 0 ? leafMat : leafDarkMat;
    const frond = new THREE.Mesh(makeFernFrond(), mat);
    const len = (0.7 + Math.random() * 0.5) * scale;
    frond.scale.set(scale * 0.8, len / 0.1, scale * 0.8);
    frond.position.set(
      x + Math.sin(angle) * 0.015 * scale,
      baseY + 0.05 * scale,
      z + Math.cos(angle) * 0.008 * scale
    );
    frond.rotation.z = -angle * 0.72;
    frond.rotation.x = Math.PI * 0.1 + (Math.random() - 0.5) * 0.15;
    frond.castShadow = true;
    group.add(frond);
  }
}

function addShelfTopDecor(group, wallWidth, topY, shelfDepth) {
  addShelfFern(group, -wallWidth / 2 + 0.35, topY, 0, 0.8);

  const stackColors = [SPINE_COLORS[1], SPINE_COLORS[7], SPINE_COLORS[13]];
  let stackY = topY;
  stackColors.forEach((c, i) => {
    const h = 0.035;
    const b = makeBook(0.16, h, 0.11, c);
    b.position.set(wallWidth / 2 - 0.35, stackY + h / 2, (Math.random() - 0.5) * 0.02);
    b.rotation.y = (Math.random() - 0.5) * 0.4;
    group.add(b);
    stackY += h;
  });
}

function buildBookshelf(wallWidth, wallHeight, catRow, lanternRow) {
  const group = new THREE.Group();
  const frameMat = toonMat(PALETTE.wood);
  const shelfDepth = 0.26;
  const shelfCount = 4;
  const usableHeight = wallHeight - 0.4;
  const shelfGap = usableHeight / shelfCount;
  const innerWidth = wallWidth - 0.26;

  const backPanel = new THREE.Mesh(new THREE.BoxGeometry(wallWidth, wallHeight, 0.04), toonMat(PALETTE.woodDark));
  backPanel.position.set(0, wallHeight / 2, -shelfDepth / 2 + 0.02);
  backPanel.castShadow = true;
  backPanel.receiveShadow = true;
  group.add(backPanel);

  [-wallWidth / 2 + 0.08, wallWidth / 2 - 0.08].forEach(x => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.1, wallHeight, shelfDepth), frameMat);
    side.position.set(x, wallHeight / 2, 0);
    side.castShadow = true;
    side.receiveShadow = true;
    addOutline(side, 0x2a1c12, 0.35);
    group.add(side);
  });

  const segments = 3;
  const dividerW = 0.035;
  const segWidth = (innerWidth - dividerW * (segments - 1)) / segments;

  for (let i = 0; i <= shelfCount; i++) {
    const y = 0.12 + i * shelfGap;
    const board = new THREE.Mesh(new THREE.BoxGeometry(wallWidth - 0.16, 0.05, shelfDepth), frameMat);
    board.position.set(0, y, 0);
    board.castShadow = true;
    board.receiveShadow = true;
    addOutline(board, 0x2a1c12, 0.35);
    group.add(board);
    if (i < shelfCount) {
      const gapCenter = -innerWidth / 2 + segWidth / 2;
      if (catRow === i) {
        fillShelfRow(group, innerWidth, y + 0.05, shelfDepth, { segments, gap: { center: 0, width: 0.26 } });
      } else if (lanternRow === i) {
        fillShelfRow(group, innerWidth, y + 0.05, shelfDepth, { segments, gap: { center: gapCenter, width: 0.11 } });
      } else {
        fillShelfRow(group, innerWidth, y + 0.05, shelfDepth, { segments });
      }

      const rowH = shelfGap - 0.05;
      for (let s = 1; s < segments; s++) {
        const x = -innerWidth / 2 + s * (segWidth + dividerW) - dividerW / 2;
        const post = new THREE.Mesh(new THREE.BoxGeometry(dividerW, rowH, shelfDepth - 0.02), frameMat);
        post.position.set(x, y + 0.05 + rowH / 2, 0);
        post.castShadow = true;
        post.receiveShadow = true;
        addOutline(post, 0x2a1c12, 0.3);
        group.add(post);
      }

      if (catRow === i) {
        addShelfCat(group, y + 0.05, shelfDepth);
      }
      if (lanternRow === i) {
        addShelfLantern(group, gapCenter, y + 0.05, shelfDepth);
      }
    }
  }

  addIvyStrands(group, wallWidth, wallHeight, shelfDepth);
  addFramedPrints(group, wallWidth, wallHeight, shelfDepth);
  addShelfTopDecor(group, wallWidth, 0.12 + shelfCount * shelfGap + 0.025, shelfDepth);

  return group;
}

function addIvyStrands(group, wallWidth, wallHeight, shelfDepth) {
  const ivyMat = toonMat(PALETTE.ivy);
  const ivyDarkMat = toonMat(PALETTE.ivyDark);
  const count = Math.max(3, Math.floor(wallWidth / 1.3));
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const x = -wallWidth / 2 + 0.3 + t * (wallWidth - 0.6);
    const strandLen = 0.2 + Math.random() * 0.28;
    for (let j = 0; j < 3; j++) {
      const mat = Math.random() < 0.5 ? ivyMat : ivyDarkMat;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.075, 5), mat);
      leaf.position.set(
        x + (Math.random() - 0.5) * 0.08,
        wallHeight - 0.04 - j * (strandLen / 3) - Math.random() * 0.04,
        shelfDepth / 2 - 0.05 + Math.random() * 0.08
      );
      leaf.rotation.x = Math.PI + (Math.random() - 0.5) * 0.6;
      leaf.rotation.z = (Math.random() - 0.5) * 0.6;
      leaf.castShadow = true;
      group.add(leaf);
    }
  }
}

function addFramedPrints(group, wallWidth, wallHeight, shelfDepth) {
  const frameColors = [SPINE_COLORS[3], SPINE_COLORS[9], SPINE_COLORS[6], SPINE_COLORS[10]];
  const frameMat = toonMat(PALETTE.woodDark);
  const xs = [-wallWidth / 2 + 0.08, wallWidth / 2 - 0.08];
  xs.forEach((x, xi) => {
    for (let i = 0; i < 2; i++) {
      const y = wallHeight - 0.5 - i * 0.4;
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.025), frameMat);
      frame.position.set(x, y, shelfDepth / 2 + 0.015);
      frame.castShadow = true;
      group.add(frame);
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(0.13, 0.18),
        toonMat(frameColors[(xi * 2 + i) % frameColors.length])
      );
      art.position.set(x, y, shelfDepth / 2 + 0.029);
      group.add(art);
    }
  });
}

function buildShelfWall(which) {
  const wallHeight = ROOM.height - 0.45;
  currentBuildWall = which;
  if (which === 'back') {
    const shelf = buildBookshelf(ROOM.width - 0.9, wallHeight, null, 0);
    shelf.position.set(0, 0, -ROOM.depth / 2 + 0.15);
    scene.add(shelf);
  } else if (which === 'left') {
    const shelf = buildBookshelf(ROOM.depth - 0.9, wallHeight, 2);
    shelf.rotation.y = Math.PI / 2;
    shelf.position.set(-ROOM.width / 2 + 0.15, 0, 0);
    scene.add(shelf);
  } else if (which === 'right') {
    const shelf = buildBookshelf(ROOM.depth - 0.9, wallHeight, null, 1);
    shelf.rotation.y = -Math.PI / 2;
    shelf.position.set(ROOM.width / 2 - 0.15, 0, 0);
    scene.add(shelf);
  }
  currentBuildWall = null;
}

function makeQuiltTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  ctx.fillStyle = 'rgb(235,235,235)';
  ctx.fillRect(0, 0, 64, 64);
  for (let x = 5; x < 64; x += 10) {
    ctx.strokeStyle = 'rgba(70,60,45,0.32)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x - 3, 21, x + 3, 42, x, 64);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 2, 0);
    ctx.bezierCurveTo(x - 5, 21, x + 1, 42, x - 2, 64);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildBeanBag(x, z, scale, color) {
  if (!QUILT_TEX) QUILT_TEX = makeQuiltTexture();
  const tex = QUILT_TEX.clone();
  tex.needsUpdate = true;
  tex.repeat.set(4.5 * scale, 3 * scale);
  const bean = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 16), toonMat(color, { map: tex }));
  bean.scale.set(1.1 * scale, 0.85 * scale, 1.05 * scale);
  bean.position.set(x, 0.3 * scale, z);
  bean.castShadow = true; bean.receiveShadow = true;
  addOutline(bean, 0x1c2c22, 0.3);
  scene.add(bean);

  const seam = new THREE.Mesh(new THREE.TorusGeometry(0.235 * scale, 0.012 * scale, 6, 20), toonMat(0x2a2418));
  seam.rotation.x = Math.PI / 2;
  seam.position.set(x, 0.045 * scale, z);
  scene.add(seam);
}

function buildCozyNook() {
  buildRug(0.85, 0.95, 1.3);

  buildBeanBag(0.35, 1.25, 1, 0x4a7a52);
  buildBeanBag(-1.3, 0.55, 0.9, 0xc06d4a);
  buildBeanBag(-1.85, 0.95, 0.75, 0x4c7a9c);

  const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), toonMat(0xf0e6c8));
  pillow.scale.set(1.2, 0.7, 0.5);
  pillow.position.set(0.35, 0.42, 1.0);
  pillow.rotation.x = -0.3;
  pillow.castShadow = true;
  addOutline(pillow, 0x2a1c12, 0.3);
  scene.add(pillow);

  const ottoman = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.29, 0.22, 16), toonMat(0x8a5f39));
  ottoman.position.set(1.3, 0.11, 1.3);
  ottoman.castShadow = true; ottoman.receiveShadow = true;
  addOutline(ottoman, 0x2a1c12, 0.3);
  scene.add(ottoman);

  const cushionColors = [0xd08a4a, 0x4c7a9c];
  cushionColors.forEach((c, i) => {
    const cushion = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), toonMat(c));
    cushion.scale.set(1, 0.55, 1);
    cushion.position.set(1.3 + (i === 0 ? -0.1 : 0.1), 0.29, 1.3 + (i === 0 ? 0.06 : -0.08));
    cushion.rotation.y = Math.random() * 2;
    cushion.castShadow = true;
    addOutline(cushion, 0x2a1c12, 0.3);
    scene.add(cushion);
  });

  const stackColors = [SPINE_COLORS[2], SPINE_COLORS[5], SPINE_COLORS[8]];
  stackColors.forEach((c, i) => {
    const b = makeBook(0.16, 0.035, 0.12, c);
    b.position.set(1.3 - 0.012 * i, 0.238 + i * 0.036, 1.15 + 0.008 * i);
    b.rotation.y = (Math.random() - 0.5) * 0.5;
    scene.add(b);
  });

  const pouf = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.16, 14), toonMat(0x9c6b4a, { map: makeWeaveTexture() }));
  pouf.position.set(-0.55, 0.08, 1.9);
  pouf.castShadow = true; pouf.receiveShadow = true;
  addOutline(pouf, 0x2a1c12, 0.3);
  scene.add(pouf);

  buildPottedPlant(-1.9, 1.55, 0.85);
}

function buildOwnerDesk() {
  const deskX = 0, deskZ = -0.15;
  const deskLong = 1.35, deskShort = 0.62, topThick = 0.05, legH = 0.6;
  const woodMat = toonMat(PALETTE.woodDark);

  const top = new THREE.Mesh(new THREE.BoxGeometry(deskLong, topThick, deskShort), toonMat(PALETTE.wood));
  top.position.set(deskX, legH + topThick / 2, deskZ);
  top.castShadow = true; top.receiveShadow = true;
  addOutline(top, 0x2a1c12, 0.3);
  scene.add(top);

  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, legH, 0.05), woodMat);
    leg.position.set(deskX + sx * (deskLong / 2 - 0.06), legH / 2, deskZ + sz * (deskShort / 2 - 0.04));
    leg.castShadow = true;
    scene.add(leg);
  });

  const topY = legH + topThick;

  const regBody = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.16), toonMat(0x352a22));
  regBody.position.set(deskX - 0.32, topY + 0.045, deskZ - 0.08);
  regBody.castShadow = true;
  addOutline(regBody, 0x1a120c, 0.35);
  scene.add(regBody);

  const regScreen = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.05, 0.08), toonMat(0x9cc4d8, { emissive: 0x4a7a8a, emissiveIntensity: 0.5 }));
  regScreen.position.set(deskX - 0.27, topY + 0.1, deskZ - 0.08);
  regScreen.rotation.z = 0.4;
  scene.add(regScreen);

  const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 8), toonMat(0x2a2a2a));
  lampPost.position.set(deskX + 0.32, topY + 0.11, deskZ + 0.14);
  scene.add(lampPost);

  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.06, 12, 1, true), toonMat(PALETTE.brass, { side: THREE.DoubleSide }));
  lampShade.position.set(deskX + 0.32, topY + 0.22, deskZ + 0.12);
  lampShade.rotation.z = 0.5;
  scene.add(lampShade);

  const lampBulb = makeGlowBulb(0.022);
  lampBulb.position.set(deskX + 0.305, topY + 0.2, deskZ + 0.105);
  scene.add(lampBulb);

  const lampLight = new THREE.PointLight(0xffcf9c, 0.55, 2, 2);
  lampLight.position.copy(lampBulb.position);
  scene.add(lampLight);

  const papers = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.14), toonMat(0xf0e6c8));
  papers.position.set(deskX, topY + 0.01, deskZ + 0.02);
  scene.add(papers);

  [SPINE_COLORS[4], SPINE_COLORS[11]].forEach((c, i) => {
    const b = makeBook(0.1, 0.03, 0.13, c);
    b.position.set(deskX + 0.06 - i * 0.01, topY + 0.015 + i * 0.032, deskZ + 0.1);
    b.rotation.y = 0.2;
    scene.add(b);
  });

  const seatX = deskX;
  const seatZ = deskZ - (deskShort / 2 + 0.5);
  const seatFacing = 0;

  const chair = buildChair(seatX, seatZ, seatFacing);
  scene.add(chair);

  const keeper = buildShopkeeper();
  keeper.position.set(seatX, 0.85, seatZ);
  keeper.rotation.y = seatFacing;
  keeper.userData.panelType = 'directions';
  scene.add(keeper);
  shopProps.push(keeper);
}

function buildShopkeeper() {
  const group = new THREE.Group();
  const bodyMat = toonMat(0x6b6258);
  const bellyMat = toonMat(0xe8ddc0);
  const darkMat = toonMat(0x2a231c);

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 20, 16), bodyMat);
  body.scale.set(1, 1.02, 0.9);
  body.position.set(0, 0, 0);
  body.castShadow = true; body.receiveShadow = true;
  addOutline(body, 0x1c1712, 0.35);
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.27, 16, 12), bellyMat);
  belly.scale.set(0.82, 0.95, 0.45);
  belly.position.set(0, -0.08, 0.3);
  group.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), bodyMat);
  head.position.set(0, 0.42, 0.05);
  head.castShadow = true;
  addOutline(head, 0x1c1712, 0.35);
  group.add(head);

  [-0.13, 0.13].forEach(ex => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), bodyMat);
    ear.scale.set(0.7, 1, 0.5);
    ear.position.set(ex, 0.6, -0.02);
    ear.rotation.z = ex < 0 ? 0.15 : -0.15;
    ear.castShadow = true;
    addOutline(ear, 0x1c1712, 0.35);
    group.add(ear);
  });

  [-0.085, 0.085].forEach(ex => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), toonMat(0xf5f0e0));
    eyeWhite.position.set(ex, 0.45, 0.22);
    group.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), darkMat);
    pupil.position.set(ex, 0.45, 0.25);
    group.add(pupil);
  });

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), darkMat);
  nose.position.set(0, 0.4, 0.27);
  group.add(nose);

  [-0.3, 0.3].forEach(ex => {
    const arm = new THREE.Mesh(new THREE.SphereGeometry(0.095, 10, 8), bodyMat);
    arm.scale.set(1, 1, 1.25);
    arm.position.set(ex, 0.08, 0.26);
    arm.castShadow = true;
    addOutline(arm, 0x1c1712, 0.3);
    group.add(arm);
  });

  [-0.17, 0.17].forEach(ex => {
    const paw = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), bellyMat);
    paw.scale.set(1, 0.6, 1.3);
    paw.position.set(ex, -0.4, 0.24);
    paw.castShadow = true;
    addOutline(paw, 0x1c1712, 0.3);
    group.add(paw);

    const toes = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 6), toonMat(0xd8cbb0));
    toes.position.set(ex, -0.395, 0.32);
    group.add(toes);
  });

  return group;
}

function makeWeaveTexture() {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 32;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9c6b4a';
  ctx.fillRect(0, 0, 64, 32);
  ctx.strokeStyle = 'rgba(60,38,22,0.35)';
  ctx.lineWidth = 1;
  for (let y = 2; y < 32; y += 5) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(64, y); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildPottedPlant(x, z, scale) {
  const potMat = toonMat(PALETTE.woodDark);
  const leafMat = toonMat(PALETTE.ivy);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * scale, 0.1 * scale, 0.17 * scale, 12), potMat);
  pot.position.set(x, 0.085 * scale, z);
  pot.castShadow = true;
  scene.add(pot);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.04 * scale, (0.32 + Math.random() * 0.22) * scale, 6), leafMat);
    leaf.position.set(
      x + (Math.random() - 0.5) * 0.12 * scale,
      (0.27 + Math.random() * 0.08) * scale,
      z + (Math.random() - 0.5) * 0.12 * scale
    );
    leaf.rotation.z = (Math.random() - 0.5) * 0.6;
    leaf.rotation.x = (Math.random() - 0.5) * 0.3;
    leaf.castShadow = true;
    scene.add(leaf);
  }
}

function makeRugTexture() {
  const c = document.createElement('canvas');
  c.width = 320; c.height = 320;
  const ctx = c.getContext('2d');
  const cx = 160, cy = 160;

  ctx.fillStyle = '#9c4a35';
  ctx.fillRect(0, 0, 320, 320);

  ctx.strokeStyle = '#7a3025';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= 320; gx += 20) {
    for (let gy = (gx / 20 % 2 === 0) ? 0 : 10; gy <= 320; gy += 20) {
      ctx.beginPath();
      ctx.moveTo(gx - 10, gy); ctx.lineTo(gx, gy - 10);
      ctx.lineTo(gx + 10, gy); ctx.lineTo(gx, gy + 10);
      ctx.closePath();
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(236,209,144,0.5)';
  for (let gx = 0; gx <= 320; gx += 20) {
    for (let gy = 0; gy <= 320; gy += 20) {
      ctx.beginPath();
      ctx.arc(gx, gy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.strokeStyle = '#ecd190';
  ctx.lineWidth = 8;
  ctx.strokeRect(16, 16, 288, 288);
  ctx.strokeStyle = '#5c2018';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 260, 260);

  ctx.fillStyle = '#5c2018';
  const key = 18;
  for (let x = 30; x < 290; x += key * 2) {
    ctx.fillRect(x, 30 - 3, key, 6);
    ctx.fillRect(x, 290 - 3, key, 6);
  }
  for (let y = 30; y < 290; y += key * 2) {
    ctx.fillRect(30 - 3, y, 6, key);
    ctx.fillRect(290 - 3, y, 6, key);
  }

  function medallion(mx, my, s) {
    ctx.fillStyle = '#ecd190';
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const r = i % 2 === 0 ? s : s * 0.45;
      const a = (i / 16) * Math.PI * 2;
      const px = mx + Math.cos(a) * r, py = my + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5c2018';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#7a3025';
    ctx.beginPath();
    ctx.arc(mx, my, s * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c2018';
    ctx.beginPath();
    ctx.arc(mx, my, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
  medallion(cx, cy, 78);
  [[70, 70], [250, 70], [70, 250], [250, 250]].forEach(([x, y]) => medallion(x, y, 26));

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildRug(x, z, radius) {
  const r = radius || 0.75;
  const rug = new THREE.Mesh(new THREE.CircleGeometry(r, 40), toonMat(0xffffff, { map: makeRugTexture() }));
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(x, 0.008, z);
  rug.receiveShadow = true;
  scene.add(rug);
}

function buildChair(x, z, rotY) {
  const group = new THREE.Group();
  const mat = toonMat(PALETTE.wood);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.04, 0.34), mat);
  seat.position.set(0, 0.42, 0);
  seat.castShadow = true; seat.receiveShadow = true;
  addOutline(seat, 0x2a1c12, 0.3);
  group.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.36, 0.035), mat);
  back.position.set(0, 0.62, -0.155);
  back.castShadow = true;
  addOutline(back, 0x2a1c12, 0.3);
  group.add(back);

  [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]].forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.4, 0.03), mat);
    leg.position.set(lx, 0.2, lz);
    leg.castShadow = true;
    group.add(leg);
  });

  const cushion = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), toonMat(0xc06d4a));
  cushion.position.set(0, 0.455, 0);
  cushion.castShadow = true;
  addOutline(cushion, 0x2a1c12, 0.25);
  group.add(cushion);

  group.position.set(x, 0, z);
  group.rotation.y = rotY || 0;
  return group;
}

function setupControls() {
  const startOverlay = document.getElementById('start-overlay');
  const pauseOverlay = document.getElementById('pause-overlay');
  const hud = document.getElementById('hud');
  const canvas = renderer.domElement;
  const signal = controller.signal;
  let dragging = false;
  let lastX = 0, lastY = 0;
  let downX = 0, downY = 0, downTime = 0;
  const raycaster = new THREE.Raycaster();
  // Default Line.threshold (1 world unit) is huge next to the small
  // onboarding props (~0.1-0.4 units) clustered right in front of the
  // camera, addOutline()'s wireframe edges on nearby figurines/tiles were
  // registering as closer "hits" than the actual solid mesh clicked,
  // scrambling which pick got reported. Tightened so only a near-exact
  // line hit counts, solid mesh faces are unaffected either way.
  raycaster.params.Line.threshold = 0.01;

  function enter() {
    locked = true;
    dragging = false;
    startOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    initAudio();
  }
  function pause() {
    locked = false;
    dragging = false;
    canvas.classList.remove('grabbing');
    pauseOverlay.classList.remove('hidden');
  }

  startOverlay.addEventListener('click', enter, { signal });
  pauseOverlay.addEventListener('click', enter, { signal });

  const soundToggle = document.getElementById('sound-toggle');
  soundToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    soundEnabled = !soundEnabled;
    soundToggle.textContent = soundEnabled ? '🔊 Sound on' : '🔇 Sound off';
    initAudio();
    if (soundEnabled) playFootstep();
  }, { signal });

  canvas.addEventListener('mousedown', (e) => {
    if (!locked) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    downX = e.clientX;
    downY = e.clientY;
    downTime = performance.now();
    canvas.classList.add('grabbing');
  }, { signal });
  window.addEventListener('mousemove', (e) => {
    if (!locked || !dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    yaw -= dx * 0.0032;
    pitch -= dy * 0.0032;
    pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
  }, { signal });
  window.addEventListener('mouseup', (e) => {
    if (locked && sceneActive) {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      const elapsed = performance.now() - downTime;
      if (moved < 6 && elapsed < 350) {
        if (!explorationUnlocked) {
          tryClickOnboarding(e.clientX, e.clientY);
        } else if (!tryClickBook(e.clientX, e.clientY) && !tryClickShopProp(e.clientX, e.clientY)) {
          tryWalkTo(e.clientX, e.clientY);
        }
      }
    }
    dragging = false;
    canvas.classList.remove('grabbing');
  }, { signal });

  function tryClickOnboarding(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(onboardingClickables, true);
    if (!hits.length) return false;
    const value = findOnboardingValue(hits[0].object);
    if (value !== null && onOnboardingPick) onOnboardingPick(value);
    return true;
  }

  function tryClickShopProp(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(shopProps, true);
    if (!hits.length) return false;
    const panelType = findPanelType(hits[0].object);
    if (panelType !== null && onOpenPanel) onOpenPanel(panelType);
    return true;
  }

  function tryClickBook(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(lessonBooks, false);
    if (!hits.length) return false;
    const mesh = hits[0].object;
    const ud = mesh.userData;
    if (!ud.poppedOut) {
      if (!ud.isNear) return false;
      popOutBook(mesh);
      return true;
    }
    if (!ud.animating) {
      onOpenStage(ud.stageId, ud.coverDataURL);
    }
    return true;
  }

  function tryWalkTo(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(walkableMeshes, false);
    if (hits.length) {
      camera.position.x = hits[0].point.x;
      camera.position.z = hits[0].point.z;
    }
  }

  const keyMap = {
    KeyW: 'forward', ArrowUp: 'forward',
    KeyS: 'back', ArrowDown: 'back',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right'
  };

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && locked) { pause(); return; }
    const k = keyMap[e.code];
    if (k) { move[k] = true; }
    if (k && !hasMovedOnce) {
      hasMovedOnce = true;
      setTimeout(() => hud.classList.add('faded'), 3200);
    }
  }, { signal });
  window.addEventListener('keyup', (e) => {
    const k = keyMap[e.code];
    if (k) move[k] = false;
  }, { signal });
}

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const len = Math.floor(audioCtx.sampleRate * 0.2);
  footstepNoiseBuffer = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
  const data = footstepNoiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
}

function playFootstep() {
  if (!soundEnabled) return;
  if (!audioCtx || audioCtx.state !== 'running') return;

  const now = audioCtx.currentTime;

  const src = audioCtx.createBufferSource();
  src.buffer = footstepNoiseBuffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 650 + Math.random() * 260;
  filter.Q.value = 0.7;

  const noiseGain = audioCtx.createGain();
  const peak = 0.14 + Math.random() * 0.04;
  noiseGain.gain.setValueAtTime(0.0001, now);
  noiseGain.gain.linearRampToValueAtTime(peak, now + 0.006);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

  src.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(audioCtx.destination);
  src.start(now);
  src.stop(now + 0.15);

  const thump = audioCtx.createOscillator();
  thump.type = 'sine';
  thump.frequency.setValueAtTime(115 + Math.random() * 20, now);
  thump.frequency.exponentialRampToValueAtTime(65, now + 0.08);

  const thumpGain = audioCtx.createGain();
  thumpGain.gain.setValueAtTime(0.0001, now);
  thumpGain.gain.linearRampToValueAtTime(0.11, now + 0.004);
  thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  thump.connect(thumpGain);
  thumpGain.connect(audioCtx.destination);
  thump.start(now);
  thump.stop(now + 0.1);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateMovement(dt) {
  // Rotation (drag-to-look) stays live during onboarding, only WASD/bounds
  // translation below is gated on explorationUnlocked, so the player can
  // still look around at the shopkeeper and props while movement is off.
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  camera.position.y = EYE_HEIGHT;

  if (!explorationUnlocked || !sceneActive) return;

  const forwardVec = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const rightVec = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  velocity.set(0, 0, 0);
  if (move.forward) velocity.add(forwardVec);
  if (move.back) velocity.sub(forwardVec);
  if (move.right) velocity.add(rightVec);
  if (move.left) velocity.sub(rightVec);

  if (velocity.lengthSq() > 0) {
    velocity.normalize().multiplyScalar(MOVE_SPEED * dt);
    camera.position.add(velocity);

    stepTimer -= dt;
    if (stepTimer <= 0) {
      playFootstep();
      stepTimer = 0.34 + Math.random() * 0.07;
    }
  } else {
    stepTimer = 0;
  }

  const doorZ = ROOM.depth / 2;
  const inside = camera.position.z <= doorZ;
  const xLim = inside ? ROOM.width / 2 - MARGIN : OUTSIDE_WIDTH / 2 - MARGIN;
  const zMin = -ROOM.depth / 2 + MARGIN;
  const zMax = doorZ + OUTSIDE_DEPTH - MARGIN;

  camera.position.x = Math.max(-xLim, Math.min(xLim, camera.position.x));
  camera.position.z = Math.max(zMin, Math.min(zMax, camera.position.z));
  camera.position.y = EYE_HEIGHT;
}

function updateLessonBooks(dt) {
  let nearAny = false;
  let nearLockedAny = false;
  lessonBooks.forEach(mesh => {
    const ud = mesh.userData;

    mesh.getWorldPosition(bookWorldPos);
    const dist = bookWorldPos.distanceTo(camera.position);
    const isNear = dist < BOOK_NEAR_DIST && !ud.poppedOut && !ud.locked;
    ud.isNear = isNear;
    if (isNear) nearAny = true;
    if (dist < BOOK_NEAR_DIST && ud.locked) nearLockedAny = true;

    if (ud.glow) {
      const targetOpacity = isNear ? 0.85 : 0;
      ud.glow.material.opacity += (targetOpacity - ud.glow.material.opacity) * Math.min(1, dt * 8);
      const pulse = 1 + Math.sin(clock.elapsedTime * 3 + ud.bookIndex) * 0.12;
      ud.glow.scale.set(ud.glowBaseScale * pulse, ud.glowBaseScale * pulse, 1);
    }

    if (ud.animating) {
      mesh.position.lerp(ud.targetPos, Math.min(1, dt * 6));
      mesh.quaternion.slerp(ud.targetQuat, Math.min(1, dt * 6));
      if (mesh.position.distanceTo(ud.targetPos) < 0.003) {
        mesh.position.copy(ud.targetPos);
        mesh.quaternion.copy(ud.targetQuat);
        ud.animating = false;
      }
    }
  });

  anyBookNearby = nearAny;
  const hint = document.getElementById('book-hint');
  if (hint && !explorationUnlocked) {
    hint.classList.remove('show');
  } else if (hint) {
    if (nearAny) {
      hint.textContent = '✨ Click a glowing book to pick it up';
      hint.classList.add('show');
    } else if (nearLockedAny) {
      hint.textContent = '🔒 Finish the previous tier to unlock these books';
      hint.classList.add('show');
    } else {
      hint.classList.remove('show');
    }
  }
}

function popOutBook(mesh) {
  const ud = mesh.userData;
  ud.poppedOut = true;
  ud.animating = true;
  const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
  ud.targetPos = ud.homePos.clone().addScaledVector(dir, BOOK_POP_DIST);
  ud.targetPos.y += 0.03;
  const euler = new THREE.Euler(0, ud.homeRot.y + Math.PI / 2, 0.05);
  ud.targetQuat = new THREE.Quaternion().setFromEuler(euler);
  if (ud.glow) ud.glow.material.opacity = 0;
  poppedBookMesh = mesh;
}

// Animates the currently popped-out book back onto its shelf spot, called
// once the book reader closes so picking up a different book (or the same
// one again later) always starts from a book actually on the shelf instead
// of one left floating in the room from last time.
function putBookBack() {
  if (!poppedBookMesh) return;
  const mesh = poppedBookMesh;
  const ud = mesh.userData;
  ud.poppedOut = false;
  ud.animating = true;
  ud.targetPos = ud.homePos.clone();
  ud.targetQuat = new THREE.Quaternion().setFromEuler(ud.homeRot);
  poppedBookMesh = null;
}


function animate() {
  rafId = requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  if (locked) updateMovement(dt);
  updateLessonBooks(dt);
  updateDirectionsBeacon(dt);
  catAnimRefs.forEach(c => {
    const breathe = 1 + Math.sin(t * 1.6 + c.basePhase) * 0.05;
    c.body.scale.y = c.baseScaleY * breathe;
    c.tail.rotation.z = 0.5 + Math.sin(t * 0.6 + c.basePhase) * 0.08;
  });
  renderer.render(scene, camera);
}

init();
animate();

function dispose() {
  if (rafId !== null) cancelAnimationFrame(rafId);
  controller.abort();
  if (audioCtx) audioCtx.close().catch(() => {});
  scene.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((mat) => {
        if (mat.map) mat.map.dispose();
        mat.dispose();
      });
    }
  });
  renderer.dispose();
  renderer.domElement.remove();
}

function setSceneActive(active) {
  sceneActive = active;
}

return { dispose, setOnboarding, setSceneActive, putBookBack, pointToStage, pointToWall, pointToNook, clearPointer };
}
