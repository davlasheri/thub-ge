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
    <svg className="tesla-exploded" viewBox="0 0 900 400" fill="none" aria-label="Tesla parts diagram">

      {/* ground */}
      <line className="tx-ground" x1="40" y1="342" x2="860" y2="342" />

      {/* ── rear bumper ── */}
      <g {...zoneProps('rearBumper', -170, -30, 0.15)}>
        <rect className="tz-hit" x="50" y="225" width="75" height="95" />
        <path d="M 118 232 C 84 238 62 252 58 274 C 55 292 58 304 64 312 L 118 312 L 118 232 Z" />
        <path d="M 66 288 L 96 288" strokeLinecap="round" />
        {/* tail light */}
        <path d="M 64 246 L 108 240 L 108 252 L 66 258 Z" className="tx-lamp" />
      </g>

      {/* ── trunk / rear deck ── */}
      <g {...zoneProps('trunk', -130, -130, 0.3)}>
        <rect className="tz-hit" x="115" y="180" width="175" height="55" />
        <path d="M 118 232 L 150 226 C 200 216 240 204 286 190 L 286 232 L 118 232 Z" />
        <path d="M 152 226 C 196 217 236 206 280 193" strokeDasharray="5 6" />
      </g>

      {/* ── glass roof ── */}
      <g {...zoneProps('roof', 0, -180, 0.55)}>
        <rect className="tz-hit" x="285" y="118" width="315" height="60" />
        <path d="M 286 190 C 340 148 400 126 468 126 C 520 126 560 140 596 164 L 560 170 C 520 148 480 140 452 140 C 400 140 350 158 310 190 Z" className="tx-glass" />
      </g>

      {/* ── doors + windows ── */}
      <g {...zoneProps('doors', -60, 150, 0.45)}>
        <path d="M 286 190 L 286 312 L 596 312 L 596 232 L 560 170 L 310 190 Z" opacity="0.001" fill="#fff" stroke="none" />
        <path d="M 306 196 L 306 306" />
        <path d="M 448 148 L 448 306" />
        <path d="M 560 172 L 572 306" />
        {/* window outlines */}
        <path d="M 316 192 C 352 162 400 148 440 146 L 440 188 Z M 456 147 C 496 148 528 158 552 172 L 456 188 Z" className="tx-glass" />
        {/* handles */}
        <rect x="352" y="212" width="34" height="6" rx="3" />
        <rect x="472" y="212" width="34" height="6" rx="3" />
      </g>

      {/* ── seats (visible through glass) ── */}
      <g {...zoneProps('seats', 0, -100, 0.7)}>
        <rect className="tz-hit" x="345" y="155" width="160" height="62" />
        <path d="M 356 200 C 350 176 352 166 358 160 C 364 166 366 178 364 198 L 380 200 C 384 206 380 212 372 212 L 360 212 Z" />
        <path d="M 470 200 C 464 178 466 168 472 162 C 478 168 480 180 478 198 L 494 200 C 498 206 494 212 486 212 L 474 212 Z" />
      </g>

      {/* ── hood / frunk ── */}
      <g {...zoneProps('hood', 140, -140, 0.4)}>
        <rect className="tz-hit" x="595" y="158" width="180" height="76" />
        <path d="M 596 164 L 640 196 C 690 204 740 216 776 228 L 596 232 Z" />
        <path d="M 620 200 C 668 206 720 218 762 228" strokeDasharray="5 6" />
      </g>

      {/* ── mirror ── */}
      <g {...zoneProps('mirror', 70, -80, 0.85)}>
        <rect className="tz-hit" x="583" y="168" width="38" height="28" />
        <path d="M 590 180 L 606 176 C 614 176 616 184 610 188 L 596 190 Z" />
      </g>

      {/* ── front bumper + nose ── */}
      <g {...zoneProps('frontBumper', 200, -20, 0.2)}>
        <rect className="tz-hit" x="772" y="225" width="80" height="92" />
        <path d="M 776 228 C 812 236 836 248 842 266 C 846 282 842 300 834 312 L 776 312 L 776 228 Z" />
        <path d="M 800 292 L 834 292" strokeLinecap="round" />
      </g>

      {/* ── headlight ── */}
      <g {...zoneProps('lights', 120, -60, 0.95)}>
        <rect className="tz-hit" x="778" y="228" width="64" height="40" />
        <path d="M 788 234 L 836 252 L 828 262 L 782 246 Z" className="tx-lamp" />
      </g>

      {/* ── battery (underfloor) ── */}
      <g {...zoneProps('battery', 0, 160, 0.8)}>
        <rect className="tz-hit" x="295" y="310" width="300" height="30" />
        <rect x="300" y="316" width="290" height="20" rx="6" className="tx-batt" />
        <path d="M 336 316 V 336 M 372 316 V 336 M 408 316 V 336 M 444 316 V 336 M 480 316 V 336 M 516 316 V 336 M 552 316 V 336" opacity="0.6" />
        <path d="M 435 320 L 447 326 L 441 326 L 451 332" className="tx-bolt" strokeLinecap="round" />
      </g>

      {/* ── sill connecting wheels ── */}
      <g className="tz tz-static" style={{ '--dx': '0px', '--dy': '40px', '--d': '0.6s' } as React.CSSProperties}>
        <path d="M 286 312 L 596 312" />
        <path d="M 118 312 L 172 312 M 710 312 L 776 312" />
      </g>

      {/* ── wheels ── */}
      <g {...zoneProps('wheels', -80, 200, 1.0)}>
        <rect className="tz-hit" x="183" y="242" width="116" height="116" />
        <circle cx="241" cy="300" r="56" className="tx-tyre" />
        <circle cx="241" cy="300" r="34" />
        <circle cx="241" cy="300" r="6" />
        <path d="M 241 268 L 241 292 M 241 308 L 241 332 M 209 300 L 233 300 M 249 300 L 273 300 M 219 278 L 236 295 M 246 305 L 263 322 M 263 278 L 246 295 M 236 305 L 219 322" opacity="0.7" />
      </g>
      <g {...zoneProps('wheels', 80, 200, 1.1)}>
        <rect className="tz-hit" x="595" y="242" width="116" height="116" />
        <circle cx="653" cy="300" r="56" className="tx-tyre" />
        <circle cx="653" cy="300" r="34" />
        <circle cx="653" cy="300" r="6" />
        <path d="M 653 268 L 653 292 M 653 308 L 653 332 M 621 300 L 645 300 M 661 300 L 685 300 M 631 278 L 648 295 M 658 305 L 675 322 M 675 278 L 658 295 M 648 305 L 631 322" opacity="0.7" />
      </g>

    </svg>
  );
}
