import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import './TeslaModelHero.css';

/*
 * Real side-view photos of the four Tesla models (original configurator
 * renders, front facing LEFT). Black car in dark theme, white car in light
 * theme. Each part is a clickable zone that opens the catalogue for the
 * selected model.
 */

interface Zone {
  sec: string;
  label: string;
  frac: [number, number, number, number]; // x, y, w, h as fractions of the car image
}

interface ModelPhoto {
  img: string;                        // /cars/hero-<img>-<color>.webp
  box: [number, number, number, number]; // image placement in the 900×300 viewBox
  head: [number, number];             // headlight centre as fractions of the image
  tail: [number, number];             // taillight centre as fractions of the image
  zones: Zone[];
}

// Zone rectangles are fractions of the photo box, calibrated per model
// against the actual image (grid overlay). Later zones win on overlap, so the
// wheels come last and stay clickable over the doors/battery areas.
const MODELS: Record<string, ModelPhoto> = {
  // refreshed Model S, image ratio 3.210
  MS: {
    img: 'ms', box: [50, 43, 800, 249],
    head: [0.050, 0.49], tail: [0.972, 0.42],
    zones: [
      { sec: 'body',         label: 'წინა ბამპერი',    frac: [0.000, 0.44, 0.075, 0.48] },
      { sec: 'electrical',   label: 'ფარები',          frac: [0.010, 0.40, 0.090, 0.17] },
      { sec: 'closure',      label: 'კაპოტი / ფრანქი', frac: [0.075, 0.25, 0.215, 0.24] },
      { sec: 'roof',         label: 'მინა და სახურავი', frac: [0.290, 0.00, 0.570, 0.30] },
      { sec: 'ext-fit',      label: 'სარკე და გარე',   frac: [0.290, 0.30, 0.055, 0.13] },
      { sec: 'closure',      label: 'კარები',          frac: [0.330, 0.32, 0.400, 0.56] },
      { sec: 'closure',      label: 'საბარგული',       frac: [0.860, 0.22, 0.120, 0.22] },
      { sec: 'electrical',   label: 'უკანა ფარები',    frac: [0.940, 0.36, 0.060, 0.13] },
      { sec: 'body',         label: 'უკანა ბამპერი',   frac: [0.920, 0.49, 0.080, 0.42] },
      { sec: 'hv-battery',   label: 'HV ბატარეა',      frac: [0.260, 0.86, 0.460, 0.12] },
      { sec: 'wheels-tires', label: 'დისკი და საბურავი', frac: [0.085, 0.50, 0.160, 0.47] },
      { sec: 'wheels-tires', label: 'დისკი და საბურავი', frac: [0.720, 0.50, 0.160, 0.47] },
    ],
  },
  // image ratio 3.117
  M3: {
    img: 'm3', box: [70, 48, 760, 244],
    head: [0.058, 0.51], tail: [0.965, 0.40],
    zones: [
      { sec: 'body',         label: 'წინა ბამპერი',    frac: [0.000, 0.47, 0.075, 0.44] },
      { sec: 'electrical',   label: 'ფარები',          frac: [0.015, 0.42, 0.100, 0.16] },
      { sec: 'closure',      label: 'კაპოტი / ფრანქი', frac: [0.080, 0.29, 0.220, 0.23] },
      { sec: 'roof',         label: 'მინა და სახურავი', frac: [0.300, 0.00, 0.530, 0.32] },
      { sec: 'ext-fit',      label: 'სარკე და გარე',   frac: [0.300, 0.33, 0.055, 0.13] },
      { sec: 'closure',      label: 'კარები',          frac: [0.340, 0.34, 0.370, 0.54] },
      { sec: 'closure',      label: 'საბარგული',       frac: [0.830, 0.21, 0.130, 0.22] },
      { sec: 'electrical',   label: 'უკანა ფარები',    frac: [0.940, 0.34, 0.060, 0.13] },
      { sec: 'body',         label: 'უკანა ბამპერი',   frac: [0.920, 0.47, 0.080, 0.43] },
      { sec: 'hv-battery',   label: 'HV ბატარეა',      frac: [0.270, 0.85, 0.440, 0.12] },
      { sec: 'wheels-tires', label: 'დისკი და საბურავი', frac: [0.090, 0.52, 0.170, 0.46] },
      { sec: 'wheels-tires', label: 'დისკი და საბურავი', frac: [0.700, 0.52, 0.170, 0.46] },
    ],
  },
  // image ratio 2.836
  MX: {
    img: 'mx', box: [60, 17, 780, 275],
    head: [0.050, 0.50], tail: [0.958, 0.41],
    zones: [
      { sec: 'body',         label: 'წინა ბამპერი',    frac: [0.000, 0.48, 0.070, 0.40] },
      { sec: 'electrical',   label: 'ფარები',          frac: [0.010, 0.43, 0.095, 0.15] },
      { sec: 'closure',      label: 'კაპოტი / ფრანქი', frac: [0.070, 0.29, 0.170, 0.22] },
      { sec: 'roof',         label: 'ვინდშილდი და სახურავი', frac: [0.230, 0.00, 0.620, 0.33] },
      { sec: 'ext-fit',      label: 'სარკე და გარე',   frac: [0.235, 0.34, 0.055, 0.13] },
      { sec: 'closure',      label: 'ფალკონ-კარები',   frac: [0.300, 0.33, 0.380, 0.53] },
      { sec: 'closure',      label: 'საბარგული',       frac: [0.850, 0.20, 0.120, 0.25] },
      { sec: 'electrical',   label: 'უკანა ფარები',    frac: [0.930, 0.35, 0.065, 0.13] },
      { sec: 'body',         label: 'უკანა ბამპერი',   frac: [0.910, 0.48, 0.090, 0.40] },
      { sec: 'hv-battery',   label: 'HV ბატარეა',      frac: [0.280, 0.85, 0.400, 0.12] },
      { sec: 'wheels-tires', label: 'დისკი და საბურავი', frac: [0.095, 0.50, 0.180, 0.46] },
      { sec: 'wheels-tires', label: 'დისკი და საბურავი', frac: [0.675, 0.50, 0.200, 0.46] },
    ],
  },
  // image ratio 2.707
  MY: {
    img: 'my', box: [80, 19, 740, 273],
    head: [0.055, 0.52], tail: [0.963, 0.36],
    zones: [
      { sec: 'body',         label: 'წინა ბამპერი',    frac: [0.000, 0.50, 0.070, 0.42] },
      { sec: 'electrical',   label: 'ფარები',          frac: [0.010, 0.44, 0.095, 0.16] },
      { sec: 'closure',      label: 'კაპოტი / ფრანქი', frac: [0.065, 0.28, 0.195, 0.24] },
      { sec: 'roof',         label: 'მინა და სახურავი', frac: [0.260, 0.00, 0.580, 0.34] },
      { sec: 'ext-fit',      label: 'სარკე და გარე',   frac: [0.250, 0.27, 0.055, 0.14] },
      { sec: 'closure',      label: 'კარები',          frac: [0.310, 0.34, 0.390, 0.54] },
      { sec: 'closure',      label: 'საბარგული',       frac: [0.840, 0.20, 0.130, 0.26] },
      { sec: 'electrical',   label: 'უკანა ფარები',    frac: [0.930, 0.29, 0.065, 0.15] },
      { sec: 'body',         label: 'უკანა ბამპერი',   frac: [0.910, 0.48, 0.090, 0.42] },
      { sec: 'hv-battery',   label: 'HV ბატარეა',      frac: [0.270, 0.86, 0.420, 0.12] },
      { sec: 'wheels-tires', label: 'დისკი და საბურავი', frac: [0.090, 0.54, 0.170, 0.44] },
      { sec: 'wheels-tires', label: 'დისკი და საბურავი', frac: [0.700, 0.54, 0.180, 0.44] },
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
  const { theme } = useTheme();
  const m = MODELS[modelId] ?? MODELS.M3;
  const [bx, by, bw, bh] = m.box;
  const color = theme === 'light' ? 'white' : 'black';
  const src = `${import.meta.env.BASE_URL}cars/hero-${m.img}-${color}.webp`;

  // lamp centres in viewBox coordinates (dark theme glow)
  const hx = bx + m.head[0] * bw, hy = by + m.head[1] * bh;
  const tx = bx + m.tail[0] * bw, ty = by + m.tail[1] * bh;

  return (
    <svg className="tml" viewBox="0 0 900 300" fill="none" aria-label={`Tesla ${modelId} side view`}>
      <defs>
        <linearGradient id="tmlBeam" gradientUnits="userSpaceOnUse" x1={hx} y1={hy} x2={hx - 170} y2={hy + 14}>
          <stop offset="0" stopColor="rgba(185, 218, 255, 0.4)" />
          <stop offset="1" stopColor="rgba(185, 218, 255, 0)" />
        </linearGradient>
      </defs>

      {/* ground */}
      <line className="tml-ground" x1="30" y1="286" x2="870" y2="286" />

      {/* car — keyed by model+theme so it fades in on switch */}
      <g key={`${modelId}_${color}`} className="tml-draw">
        <image
          className="tml-photo"
          href={src}
          x={bx} y={by} width={bw} height={bh}
          preserveAspectRatio="xMidYMid meet"
        />

        {/* lamps light up in dark theme */}
        <g className="tml-lamps" aria-hidden="true">
          <polygon
            className="tml-beam"
            points={`${hx},${hy - 5} ${hx},${hy + 7} ${hx - 165},${hy + 34} ${hx - 165},${hy - 6}`}
            fill="url(#tmlBeam)"
          />
          <ellipse className="tml-head-halo" cx={hx} cy={hy} rx={26} ry={11} />
          <ellipse className="tml-head-core" cx={hx} cy={hy} rx={10} ry={4.5} />
          <ellipse className="tml-tail-halo" cx={tx} cy={ty} rx={22} ry={9} />
          <ellipse className="tml-tail-core" cx={tx} cy={ty} rx={8} ry={4} />
        </g>

        {/* clickable zones */}
        {m.zones.map((z, i) => (
          <rect
            key={i}
            className={`tml-hit ${active === i ? 'tml-hit-on' : ''}`}
            x={bx + z.frac[0] * bw} y={by + z.frac[1] * bh}
            width={z.frac[2] * bw} height={z.frac[3] * bh} rx="6"
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
