import { useState } from 'react';
import './TeslaExploded.css';

// Blueprint-style Tesla side profile that assembles itself from its parts.
// Each part is a clickable zone that opens the matching catalogue group.

export interface CarZone {
  id: string;          // zone key
  sectionId: string;   // catalogue section to open
  label: string;       // Georgian label shown on hover
}

export const CAR_ZONES: Record<string, CarZone> = {
  frontBumper: { id: 'frontBumper', sectionId: 'body',         label: 'ბამპერი და ძარა' },
  rearBumper:  { id: 'rearBumper',  sectionId: 'body',         label: 'ბამპერი და ძარა' },
  hood:        { id: 'hood',        sectionId: 'closure',      label: 'კაპოტი და ფრანქი' },
  trunk:       { id: 'trunk',       sectionId: 'closure',      label: 'საბარგული' },
  doors:       { id: 'doors',       sectionId: 'closure',      label: 'კარები' },
  roof:        { id: 'roof',        sectionId: 'roof',         label: 'მინის სახურავი' },
  seats:       { id: 'seats',       sectionId: 'seats',        label: 'სავარძლები' },
  battery:     { id: 'battery',     sectionId: 'hv-battery',   label: 'HV ბატარეა' },
  wheels:      { id: 'wheels',      sectionId: 'wheels-tires', label: 'დისკები და საბურავები' },
  mirror:      { id: 'mirror',      sectionId: 'ext-fit',      label: 'სარკეები და გარე ელემენტები' },
  lights:      { id: 'lights',      sectionId: 'electrical',   label: 'ფარები და ელექტრიკა' },
};

interface Props {
  onZoneClick: (sectionId: string) => void;
  onZoneHover?: (label: string | null) => void;
}

export default function TeslaExploded({ onZoneClick, onZoneHover }: Props) {
  const [active, setActive] = useState<string | null>(null);

  const zoneProps = (key: keyof typeof CAR_ZONES, dx: number, dy: number, delay: number) => {
    const z = CAR_ZONES[key];
    return {
      className: `tz ${active === key ? 'tz-active' : ''}`,
      style: { '--dx': `${dx}px`, '--dy': `${dy}px`, '--d': `${delay}s` } as React.CSSProperties,
      onClick: () => onZoneClick(z.sectionId),
      onMouseEnter: () => { setActive(key); onZoneHover?.(z.label); },
      onMouseLeave: () => { setActive(null); onZoneHover?.(null); },
      role: 'button' as const,
      tabIndex: 0,
      'aria-label': z.label,
      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') onZoneClick(z.sectionId); },
    };
  };

  return (
    <svg className="tesla-exploded" viewBox="0 0 900 400" fill="none" aria-label="Tesla Roadster parts diagram">

      {/* ground */}
      <line className="tx-ground" x1="40" y1="342" x2="860" y2="342" />

      {/* ── rear bumper + diffuser ── */}
      <g {...zoneProps('rearBumper', -170, -30, 0.15)}>
        <rect className="tz-hit" x="58" y="230" width="80" height="90" />
        <path d="M 132 240 C 104 244 84 252 74 264 C 66 274 64 292 70 306 L 96 316 L 132 316 L 132 240 Z" />
        <path d="M 78 296 L 112 300" strokeLinecap="round" />
        {/* tail light strip */}
        <path d="M 74 252 L 128 246 L 128 256 L 76 262 Z" className="tx-lamp" />
      </g>

      {/* ── rear deck / ducktail ── */}
      <g {...zoneProps('trunk', -130, -130, 0.3)}>
        <rect className="tz-hit" x="128" y="192" width="180" height="52" />
        <path d="M 132 240 L 148 236 C 160 220 190 206 236 200 L 306 196 L 306 240 L 132 240 Z" />
        <path d="M 134 236 L 152 230" strokeLinecap="round" />
        <path d="M 168 218 C 200 208 250 202 300 199" strokeDasharray="5 6" />
      </g>

      {/* ── glass roof (low arch) ── */}
      <g {...zoneProps('roof', 0, -180, 0.55)}>
        <rect className="tz-hit" x="300" y="150" width="240" height="52" />
        <path d="M 306 196 C 336 168 380 152 428 152 C 468 152 502 164 528 186 L 496 190 C 470 172 444 164 420 164 C 380 164 344 178 322 196 Z" className="tx-glass" />
      </g>

      {/* ── door + window (single long door) ── */}
      <g {...zoneProps('doors', -60, 150, 0.45)}>
        <path d="M 306 196 L 306 316 L 560 316 L 560 236 L 528 186 L 322 196 Z" opacity="0.001" fill="#fff" stroke="none" />
        <path d="M 330 200 L 330 312" />
        <path d="M 500 190 L 516 312" />
        {/* window */}
        <path d="M 340 196 C 362 176 392 166 420 166 L 424 190 Z M 438 166 C 462 168 482 176 496 188 L 440 190 Z" className="tx-glass" />
        {/* handle */}
        <rect x="396" y="216" width="32" height="6" rx="3" />
      </g>

      {/* ── seats ── */}
      <g {...zoneProps('seats', 0, -100, 0.7)}>
        <rect className="tz-hit" x="352" y="168" width="130" height="52" />
        <path d="M 386 208 C 380 188 382 178 388 172 C 394 178 396 190 394 206 L 410 208 C 414 214 410 220 402 220 L 390 220 Z" />
        <path d="M 452 208 C 446 188 448 178 454 172 C 460 178 462 190 460 206 L 476 208 C 480 214 476 220 468 220 L 456 220 Z" />
      </g>

      {/* ── clamshell hood (long low nose) ── */}
      <g {...zoneProps('hood', 140, -140, 0.4)}>
        <rect className="tz-hit" x="530" y="182" width="240" height="60" />
        <path d="M 528 186 L 588 216 C 654 224 716 234 764 244 L 560 240 Z" />
        <path d="M 600 220 C 656 226 712 236 754 244" strokeDasharray="5 6" />
      </g>

      {/* ── mirror ── */}
      <g {...zoneProps('mirror', 70, -80, 0.85)}>
        <rect className="tz-hit" x="516" y="176" width="38" height="28" />
        <path d="M 524 192 L 540 187 C 548 186 550 194 544 198 L 530 200 Z" />
      </g>

      {/* ── front bumper / splitter ── */}
      <g {...zoneProps('frontBumper', 200, -20, 0.2)}>
        <rect className="tz-hit" x="760" y="238" width="92" height="82" />
        <path d="M 764 244 C 800 250 828 258 842 270 C 852 280 852 296 844 308 L 800 316 L 764 316 L 764 244 Z" />
        <path d="M 806 300 L 844 296" strokeLinecap="round" />
      </g>

      {/* ── headlight slit ── */}
      <g {...zoneProps('lights', 120, -60, 0.95)}>
        <rect className="tz-hit" x="770" y="240" width="76" height="34" />
        <path d="M 778 250 L 838 266 L 832 274 L 774 260 Z" className="tx-lamp" />
      </g>

      {/* ── battery (underfloor) ── */}
      <g {...zoneProps('battery', 0, 160, 0.8)}>
        <rect className="tz-hit" x="315" y="312" width="270" height="30" />
        <rect x="320" y="318" width="260" height="18" rx="6" className="tx-batt" />
        <path d="M 354 318 V 336 M 388 318 V 336 M 422 318 V 336 M 456 318 V 336 M 490 318 V 336 M 524 318 V 336 M 552 318 V 336" opacity="0.6" />
        <path d="M 442 322 L 454 328 L 448 328 L 458 333" className="tx-bolt" strokeLinecap="round" />
      </g>

      {/* ── sill segments ── */}
      <g className="tz tz-static" style={{ '--dx': '0px', '--dy': '40px', '--d': '0.6s' } as React.CSSProperties}>
        <path d="M 306 316 L 560 316" />
        <path d="M 132 316 L 186 316 M 706 316 L 764 316" />
      </g>

      {/* ── wheels (large, low body) ── */}
      <g {...zoneProps('wheels', -80, 200, 1.0)}>
        <rect className="tz-hit" x="188" y="240" width="120" height="120" />
        <circle cx="248" cy="300" r="58" className="tx-tyre" />
        <circle cx="248" cy="300" r="36" />
        <circle cx="248" cy="300" r="6" />
        <path d="M 248 266 L 248 292 M 248 308 L 248 334 M 214 300 L 240 300 M 256 300 L 282 300 M 225 277 L 243 295 M 253 305 L 271 323 M 271 277 L 253 295 M 243 305 L 225 323" opacity="0.7" />
      </g>
      <g {...zoneProps('wheels', 80, 200, 1.1)}>
        <rect className="tz-hit" x="592" y="240" width="120" height="120" />
        <circle cx="652" cy="300" r="58" className="tx-tyre" />
        <circle cx="652" cy="300" r="36" />
        <circle cx="652" cy="300" r="6" />
        <path d="M 652 266 L 652 292 M 652 308 L 652 334 M 618 300 L 644 300 M 660 300 L 686 300 M 629 277 L 647 295 M 657 305 L 675 323 M 675 277 L 657 295 M 647 305 L 629 323" opacity="0.7" />
      </g>

    </svg>
  );
}
