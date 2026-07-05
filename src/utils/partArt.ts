// Blueprint-style part tiles as inline SVG data URIs — replaces random
// stock photos with consistent, part-related artwork matching the brand.

const GRID = `<path d='M0 30H240M0 60H240M0 90H240M0 120H240M0 150H240M30 0V180M60 0V180M90 0V180M120 0V180M150 0V180M180 0V180M210 0V180' stroke='%236e82a0' stroke-opacity='0.10' stroke-width='1'/>`;

// line icons drawn in a 100x100 box, centered later
const ICONS: Record<string, string> = {
  // body panel / bumper
  body: `<path d='M10 62 C24 44 40 36 62 34 L88 40 L90 52 L74 56 C52 50 34 54 22 66 Z' /><path d='M30 70 a8 8 0 1 0 0.1 0 M70 66 a8 8 0 1 0 0.1 0' />`,
  // seat
  interior: `<path d='M38 18 C32 18 30 24 32 32 L38 62 L66 62 C70 62 72 58 70 54 L46 50 L42 24 C41 20 40 18 38 18 Z M34 66 L70 66 C76 66 78 74 72 76 L36 76 C30 76 28 68 34 66 Z' />`,
  // brake disc + caliper
  brakes: `<circle cx='50' cy='52' r='30' /><circle cx='50' cy='52' r='12' /><circle cx='50' cy='52' r='3' /><path d='M50 26 L50 34 M50 70 L50 78 M24 52 L32 52 M68 52 L76 52' /><path d='M70 26 C80 32 84 40 84 50 L74 50 C74 43 71 37 64 32 Z' />`,
  // wheel
  wheels: `<circle cx='50' cy='50' r='34' /><circle cx='50' cy='50' r='20' /><circle cx='50' cy='50' r='4' /><path d='M50 30 V46 M50 54 V70 M30 50 H46 M54 50 H70 M36 36 L47 47 M53 53 L64 64 M64 36 L53 47 M47 53 L36 64' />`,
  // charging plug
  charging: `<rect x='34' y='20' width='32' height='26' rx='8' /><path d='M42 20 V12 M58 20 V12 M50 46 V60 C50 70 42 72 36 72 L28 72' /><path d='M52 28 L44 38 L50 38 L46 46' />`,
  // cargo box
  cargo: `<path d='M24 40 L50 28 L76 40 L76 66 L50 78 L24 66 Z M24 40 L50 52 L76 40 M50 52 L50 78' />`,
  // camera
  camera: `<rect x='22' y='34' width='44' height='34' rx='8' /><circle cx='44' cy='51' r='11' /><circle cx='44' cy='51' r='4' /><path d='M66 44 L80 36 L80 66 L66 58' />`,
  // suspension coil
  susp: `<path d='M50 14 L50 22 M38 24 L62 30 M62 34 L38 40 M38 44 L62 50 M62 54 L38 60 M38 64 L62 70 M50 72 L50 84' /><path d='M34 14 H66 M34 84 H66' />`,
  // filter
  filter: `<rect x='28' y='24' width='44' height='52' rx='6' /><path d='M36 32 V68 M44 32 V68 M52 32 V68 M60 32 V68' /><path d='M28 40 H72' />`,
  // floor mat
  mats: `<path d='M26 26 L74 26 C78 40 78 60 74 78 L26 78 C22 60 22 40 26 26 Z' /><path d='M34 36 C50 42 56 52 58 68 M40 30 C56 38 62 50 64 70' />`,
  // battery
  battery: `<rect x='18' y='34' width='58' height='34' rx='6' /><path d='M76 44 H84 V58 H76' /><path d='M30 34 V68 M44 34 V68 M58 34 V68' /><path d='M46 42 L52 50 L48 50 L54 60' />`,
  // generic part (gear)
  part: `<circle cx='50' cy='50' r='16' /><circle cx='50' cy='50' r='5' /><path d='M50 26 V34 M50 66 V74 M26 50 H34 M66 50 H74 M33 33 L39 39 M61 61 L67 67 M67 33 L61 39 M39 61 L33 67' />`,
  // door
  door: `<path d='M30 22 C50 22 66 30 74 46 L74 76 L26 76 L26 26 C26 23 27 22 30 22 Z' /><path d='M34 50 H54' /><path d='M74 46 L26 46' stroke-dasharray='4 5'/>`,
  // lamp
  lamp: `<path d='M26 50 C34 36 46 30 60 32 L76 40 L72 52 L56 50 C44 50 36 54 30 62 Z' /><path d='M62 36 L70 44' />`,
};

export type PartArtKind = keyof typeof ICONS;

export function partArt(kind: string): string {
  const icon = ICONS[kind] ?? ICONS.part;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 180'>` +
    `<rect width='240' height='180' fill='%230f1015'/>` +
    GRID +
    `<g transform='translate(70,40)' fill='none' stroke='%237d8aa0' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'>${icon}</g>` +
    `<circle cx='214' cy='26' r='3.5' fill='%23e31937'/>` +
    `</svg>`;
  return `data:image/svg+xml,${svg}`;
}

// section id → icon kind, for catalogue tiles and placeholders
export const SECTION_ART: Record<string, string> = {
  'body': 'body', 'closure': 'door', 'ext-fit': 'body', 'seats': 'interior',
  'inst-panel': 'camera', 'int-trim': 'mats', 'hv-battery': 'battery',
  'electrical': 'lamp', 'thermal': 'filter', 'labels': 'part', 'safety': 'interior',
  'infotainment': 'camera', 'roof': 'door', 'chassis': 'part', 'suspension': 'susp',
  'steering': 'wheels', 'brakes-sys': 'brakes', 'wheels-tires': 'wheels',
  'front-drive': 'part', 'rear-drive': 'part', 'hv-system': 'charging',
  'ext-charging': 'charging', 'owner-info': 'part',
};

export function sectionArt(sectionId: string): string {
  return partArt(SECTION_ART[sectionId] ?? 'part');
}
