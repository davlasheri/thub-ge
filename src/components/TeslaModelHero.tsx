import { useState } from 'react';
import './TeslaModelHero.css';

/*
 * Accurate side-profile blueprints of the four Tesla models.
 * Front faces LEFT. Each part is a clickable zone that opens the catalogue
 * for the selected model. In dark mode head/tail lights glow.
 */

interface Zone {
  sec: string;
  label: string;
  rect: [number, number, number, number]; // x, y, w, h
}

interface ModelGeo {
  top: string;        // upper silhouette: nose → hood → windshield → roof → backlight → deck → tail
  glass: string;      // greenhouse / windows
  doors: string;      // door split lines + handle
  rocker: string;     // lower body line + front/rear fascia
  fWheel: number;     // front wheel centre x
  rWheel: number;     // rear wheel centre x
  wheelR: number;
  cy: number;         // wheel centre y
  mirror: [number, number];
  head: string;       // headlight shape (glows white)
  tail: string;       // taillight shape (glows red)
  battery: [number, number, number]; // x1, x2, y
  zones: Zone[];
}

const spokes = (cx: number, cy: number, r: number) => {
  const rr = r * 0.62;
  const lines: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    lines.push(`M ${cx} ${cy} L ${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return lines.join(' ');
};

const MODELS: Record<string, ModelGeo> = {
  // ── Model S — long, low fastback liftback ─────────────────────────────────
  MS: {
    top: 'M 58 240 C 62 222 140 212 322 205 C 360 189 388 166 434 160 C 524 155 612 161 672 176 C 744 193 806 207 850 214 L 856 226',
    glass: 'M 340 203 C 372 184 404 168 440 164 C 512 161 586 165 640 178 C 690 190 726 200 748 208 L 340 208 Z',
    doors: 'M 452 165 L 452 250 M 606 178 L 620 250 M 470 224 L 512 224',
    rocker: 'M 58 240 C 54 252 60 262 74 262 L 190 262 M 300 262 L 604 262 M 758 262 L 838 262 C 852 262 858 252 856 240',
    fWheel: 210, rWheel: 690, wheelR: 46, cy: 246,
    mirror: [452, 168],
    head: 'M 60 222 L 96 214 L 100 226 L 64 232 Z',
    tail: 'M 828 210 L 856 216 L 854 228 L 826 224 Z',
    battery: [250, 650, 258],
    zones: [
      { sec: 'body',         label: 'წინა ბამპერი',   rect: [46, 210, 62, 52] },
      { sec: 'electrical',   label: 'ფარები',         rect: [52, 208, 56, 30] },
      { sec: 'closure',      label: 'კაპოტი / ფრანქი', rect: [110, 200, 210, 42] },
      { sec: 'roof',         label: 'მინა და სახურავი', rect: [330, 155, 300, 55] },
      { sec: 'ext-fit',      label: 'სარკე და გარე',  rect: [438, 160, 30, 26] },
      { sec: 'closure',      label: 'კარები',         rect: [452, 210, 160, 52] },
      { sec: 'closure',      label: 'საბარგული',      rect: [640, 176, 170, 44] },
      { sec: 'electrical',   label: 'უკანა ფარები',   rect: [816, 206, 48, 30] },
      { sec: 'body',         label: 'უკანა ბამპერი',  rect: [812, 210, 60, 52] },
      { sec: 'hv-battery',   label: 'HV ბატარეა',     rect: [250, 252, 400, 20] },
    ],
  },

  // ── Model 3 — compact smooth sedan ────────────────────────────────────────
  M3: {
    top: 'M 72 236 C 76 220 150 212 300 206 C 332 194 354 170 394 164 C 472 157 542 160 584 168 C 640 179 694 197 744 206 L 812 206 C 838 208 848 216 850 226',
    glass: 'M 320 205 C 350 187 372 172 400 167 C 468 162 532 165 574 172 C 622 182 668 196 700 205 L 320 205 Z',
    doors: 'M 428 167 L 428 250 M 566 170 L 578 250 M 448 224 L 490 224',
    rocker: 'M 72 236 C 68 250 74 262 88 262 L 190 262 M 290 262 L 588 262 M 730 262 L 828 262 C 842 262 846 250 848 238',
    fWheel: 214, rWheel: 668, wheelR: 45, cy: 246,
    mirror: [428, 170],
    head: 'M 74 218 L 108 210 L 112 222 L 78 228 Z',
    tail: 'M 786 202 L 814 208 L 812 220 L 784 216 Z',
    battery: [252, 632, 258],
    zones: [
      { sec: 'body',         label: 'წინა ბამპერი',   rect: [58, 206, 62, 56] },
      { sec: 'electrical',   label: 'ფარები',         rect: [66, 204, 54, 30] },
      { sec: 'closure',      label: 'კაპოტი / ფრანქი', rect: [122, 198, 190, 42] },
      { sec: 'roof',         label: 'მინა და სახურავი', rect: [316, 158, 260, 52] },
      { sec: 'ext-fit',      label: 'სარკე და გარე',  rect: [414, 166, 30, 26] },
      { sec: 'closure',      label: 'კარები',         rect: [428, 210, 150, 52] },
      { sec: 'closure',      label: 'საბარგული',      rect: [600, 176, 160, 42] },
      { sec: 'electrical',   label: 'უკანა ფარები',   rect: [774, 198, 48, 30] },
      { sec: 'body',         label: 'უკანა ბამპერი',  rect: [800, 206, 58, 56] },
      { sec: 'hv-battery',   label: 'HV ბატარეა',     rect: [252, 252, 380, 20] },
    ],
  },

  // ── Model Y — tall crossover, high hatchback rear ─────────────────────────
  MY: {
    top: 'M 74 230 C 78 210 150 200 296 192 C 324 168 346 130 394 122 C 480 116 568 119 634 132 C 676 143 698 170 706 198 L 790 200 C 814 202 824 212 824 226',
    glass: 'M 314 191 C 348 164 372 138 406 130 C 482 124 560 127 618 140 C 656 150 680 172 692 198 L 314 198 Z',
    doors: 'M 432 130 L 432 250 M 606 140 L 620 250 M 452 220 L 498 220',
    rocker: 'M 74 230 C 70 246 76 262 90 262 L 192 262 M 294 262 L 596 262 M 730 262 L 814 262 C 828 262 830 250 824 238',
    fWheel: 218, rWheel: 662, wheelR: 50, cy: 244,
    mirror: [432, 130],
    head: 'M 76 214 L 110 206 L 114 218 L 80 224 Z',
    tail: 'M 772 198 L 802 204 L 800 216 L 770 212 Z',
    battery: [254, 626, 256],
    zones: [
      { sec: 'body',         label: 'წინა ბამპერი',   rect: [60, 202, 62, 60] },
      { sec: 'electrical',   label: 'ფარები',         rect: [68, 200, 54, 30] },
      { sec: 'closure',      label: 'კაპოტი / ფრანქი', rect: [124, 194, 180, 42] },
      { sec: 'roof',         label: 'მინა და სახურავი', rect: [312, 122, 310, 76] },
      { sec: 'ext-fit',      label: 'სარკე და გარე',  rect: [418, 130, 30, 26] },
      { sec: 'closure',      label: 'კარები',         rect: [432, 200, 176, 62] },
      { sec: 'closure',      label: 'საბარგული',      rect: [620, 134, 120, 66] },
      { sec: 'electrical',   label: 'უკანა ფარები',   rect: [762, 196, 48, 30] },
      { sec: 'body',         label: 'უკანა ბამპერი',  rect: [786, 202, 54, 60] },
      { sec: 'hv-battery',   label: 'HV ბატარეა',     rect: [254, 250, 372, 20] },
    ],
  },

  // ── Model X — large SUV, forward windshield, panoramic roof, falcon doors ─
  MX: {
    top: 'M 66 228 C 70 206 116 196 206 189 C 244 160 302 118 368 108 C 490 102 600 106 670 124 C 718 138 752 166 766 196 L 806 198 C 828 200 838 212 836 226',
    glass: 'M 222 190 C 264 154 318 122 376 112 C 490 107 582 111 644 128 C 690 142 722 168 736 196 L 222 196 Z',
    doors: 'M 386 112 L 386 250 M 472 118 L 472 250 M 640 128 L 652 250 M 406 220 L 458 220',
    rocker: 'M 66 228 C 62 246 68 262 82 262 L 196 262 M 300 262 L 606 262 M 742 262 L 826 262 C 840 262 842 250 836 238',
    fWheel: 214, rWheel: 690, wheelR: 51, cy: 242,
    mirror: [386, 116],
    head: 'M 68 212 L 104 204 L 108 216 L 72 222 Z',
    tail: 'M 786 196 L 816 202 L 814 214 L 784 210 Z',
    battery: [252, 656, 256],
    zones: [
      { sec: 'body',         label: 'წინა ბამპერი',   rect: [52, 200, 60, 62] },
      { sec: 'electrical',   label: 'ფარები',         rect: [60, 198, 54, 30] },
      { sec: 'closure',      label: 'კაპოტი / ფრანქი', rect: [116, 192, 118, 42] },
      { sec: 'roof',         label: 'ვინდშილდი და სახურავი', rect: [222, 104, 300, 92] },
      { sec: 'ext-fit',      label: 'სარკე და გარე',  rect: [372, 112, 30, 26] },
      { sec: 'closure',      label: 'ფალკონ-კარები',  rect: [386, 150, 254, 112] },
      { sec: 'closure',      label: 'საბარგული',      rect: [652, 126, 104, 74] },
      { sec: 'electrical',   label: 'უკანა ფარები',   rect: [776, 194, 48, 30] },
      { sec: 'body',         label: 'უკანა ბამპერი',  rect: [800, 200, 52, 62] },
      { sec: 'hv-battery',   label: 'HV ბატარეა',     rect: [252, 250, 404, 20] },
    ],
  },
};

interface Props {
  modelId: string;
  onZoneClick: (sectionId: string) => void;
  onZoneHover?: (label: string | null) => void;
}

export default function TeslaModelHero({ modelId, onZoneClick, onZoneHover }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const geo = MODELS[modelId] ?? MODELS.M3;

  return (
    <svg className="tml" viewBox="0 0 900 300" fill="none" aria-label={`Tesla ${modelId} blueprint`}>
      {/* ground */}
      <line className="tml-ground" x1="30" y1="286" x2="870" y2="286" />

      {/* car — keyed by model so it re-draws on switch */}
      <g key={modelId} className="tml-draw">
        <path className="tml-line" d={geo.rocker} />
        <path className="tml-line" d={geo.top} />
        <path className="tml-glass" d={geo.glass} />
        <path className="tml-line tml-thin" d={geo.doors} />

        {/* battery underfloor */}
        <line className="tml-batt" x1={geo.battery[0]} y1={geo.battery[2]} x2={geo.battery[1]} y2={geo.battery[2]} />

        {/* mirror */}
        <path className="tml-line" d={`M ${geo.mirror[0]} ${geo.mirror[1]} l 16 -5 c 8 -1 10 7 4 11 l -14 2 z`} />

        {/* lamps (glow in dark mode) */}
        <path className="tml-head" d={geo.head} />
        <path className="tml-tail" d={geo.tail} />

        {/* wheels */}
        {[geo.fWheel, geo.rWheel].map((cx, i) => (
          <g key={i} className="tml-wheel">
            <path className="tml-line" d={`M ${cx - geo.wheelR - 4} ${geo.cy} a ${geo.wheelR + 4} ${geo.wheelR + 4} 0 0 1 ${(geo.wheelR + 4) * 2} 0`} />
            <circle cx={cx} cy={geo.cy} r={geo.wheelR} className="tml-tyre" />
            <circle cx={cx} cy={geo.cy} r={geo.wheelR * 0.66} className="tml-line" />
            <circle cx={cx} cy={geo.cy} r="5" className="tml-line" />
            <path className="tml-line tml-thin" d={spokes(cx, geo.cy, geo.wheelR)} />
          </g>
        ))}

        {/* clickable zones */}
        {geo.zones.map((z, i) => (
          <rect
            key={i}
            className={`tml-hit ${active === i ? 'tml-hit-on' : ''}`}
            x={z.rect[0]} y={z.rect[1]} width={z.rect[2]} height={z.rect[3]} rx="6"
            role="button" tabIndex={0} aria-label={z.label}
            onMouseEnter={() => { setActive(i); onZoneHover?.(z.label); }}
            onMouseLeave={() => { setActive(null); onZoneHover?.(null); }}
            onClick={() => onZoneClick(z.sec)}
            onKeyDown={e => { if (e.key === 'Enter') onZoneClick(z.sec); }}
          />
        ))}
      </g>
    </svg>
  );
}
