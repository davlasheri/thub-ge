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
  zones: Zone[];
}

// Zone rectangles are fractions of the photo box so each model's zones track
// its own image placement.
const SEDAN_ZONES: Zone[] = [
  { sec: 'body',       label: 'წინა ბამპერი',     frac: [0.00, 0.42, 0.085, 0.53] },
  { sec: 'electrical', label: 'ფარები',           frac: [0.015, 0.38, 0.115, 0.20] },
  { sec: 'closure',    label: 'კაპოტი / ფრანქი',  frac: [0.10, 0.24, 0.215, 0.26] },
  { sec: 'roof',       label: 'მინა და სახურავი',  frac: [0.30, 0.00, 0.46, 0.28] },
  { sec: 'ext-fit',    label: 'სარკე და გარე',    frac: [0.315, 0.28, 0.07, 0.14] },
  { sec: 'closure',    label: 'კარები',           frac: [0.315, 0.42, 0.40, 0.44] },
  { sec: 'closure',    label: 'საბარგული',        frac: [0.72, 0.10, 0.20, 0.30] },
  { sec: 'electrical', label: 'უკანა ფარები',     frac: [0.885, 0.28, 0.105, 0.18] },
  { sec: 'body',       label: 'უკანა ბამპერი',    frac: [0.905, 0.46, 0.095, 0.48] },
  { sec: 'hv-battery', label: 'HV ბატარეა',       frac: [0.16, 0.86, 0.68, 0.14] },
];

const SUV_ZONES: Zone[] = [
  { sec: 'body',       label: 'წინა ბამპერი',     frac: [0.00, 0.48, 0.085, 0.48] },
  { sec: 'electrical', label: 'ფარები',           frac: [0.015, 0.40, 0.12, 0.18] },
  { sec: 'closure',    label: 'კაპოტი / ფრანქი',  frac: [0.09, 0.26, 0.20, 0.24] },
  { sec: 'roof',       label: 'მინა და სახურავი',  frac: [0.27, 0.00, 0.52, 0.32] },
  { sec: 'ext-fit',    label: 'სარკე და გარე',    frac: [0.29, 0.32, 0.07, 0.14] },
  { sec: 'closure',    label: 'კარები',           frac: [0.29, 0.46, 0.42, 0.42] },
  { sec: 'closure',    label: 'საბარგული',        frac: [0.79, 0.10, 0.16, 0.36] },
  { sec: 'electrical', label: 'უკანა ფარები',     frac: [0.88, 0.34, 0.11, 0.16] },
  { sec: 'body',       label: 'უკანა ბამპერი',    frac: [0.90, 0.50, 0.10, 0.46] },
  { sec: 'hv-battery', label: 'HV ბატარეა',       frac: [0.16, 0.88, 0.66, 0.12] },
];

const withLabel = (zones: Zone[], sec: string, label: string): Zone[] =>
  zones.map(z => (z.sec === sec && z.label === 'კარები' ? { ...z, label } : z));

const MODELS: Record<string, ModelPhoto> = {
  // image aspect ratios: ms 3.289, m3 3.117, mx 2.836, my 2.707
  MS: { img: 'ms', box: [50, 49, 800, 243], zones: SEDAN_ZONES },
  M3: { img: 'm3', box: [70, 48, 760, 244], zones: SEDAN_ZONES },
  MX: { img: 'mx', box: [60, 17, 780, 275], zones: withLabel(SUV_ZONES, 'closure', 'ფალკონ-კარები') },
  MY: { img: 'my', box: [80, 19, 740, 273], zones: SUV_ZONES },
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

  return (
    <svg className="tml" viewBox="0 0 900 300" fill="none" aria-label={`Tesla ${modelId} side view`}>
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
