// Per-model blueprint side profiles (line style matches the home page hero).
// Used in the catalogue's model cards and the year-selection modal.

function Wheels({ rx, fx, cy = 96, r = 17 }: { rx: number; fx: number; cy?: number; r?: number }) {
  return (
    <>
      <circle cx={rx} cy={cy} r={r} />
      <circle cx={rx} cy={cy} r={r * 0.55} opacity="0.8" />
      <circle cx={fx} cy={cy} r={r} />
      <circle cx={fx} cy={cy} r={r * 0.55} opacity="0.8" />
    </>
  );
}

/* Model S — long sleek liftback */
function BpModelS() {
  return (
    <g>
      <path d="M 18 96 C 18 84 24 78 36 74 L 62 68 C 90 52 122 44 152 44 C 182 44 208 52 228 66 L 262 74 C 276 78 282 84 282 92 C 282 98 278 102 272 102 L 252 102" />
      <path d="M 208 102 L 92 102 M 52 102 L 28 102 C 22 102 18 100 18 96" />
      <path d="M 70 68 C 94 54 124 48 150 48 L 150 68 Z M 158 48 C 182 50 202 57 218 66 L 158 68 Z" opacity="0.7" />
      <path d="M 150 48 L 150 100" opacity="0.5" />
      <Wheels rx={72} fx={230} />
      <path d="M 24 80 L 40 76 M 262 78 L 276 84" opacity="0.8" />
    </g>
  );
}

/* Model 3 — compact sedan */
function BpModel3() {
  return (
    <g>
      <path d="M 24 96 C 24 86 30 80 40 77 L 66 71 C 90 54 118 46 146 46 C 172 46 194 54 210 68 L 248 76 C 262 80 268 86 268 92 C 268 98 264 102 258 102 L 244 102" />
      <path d="M 200 102 L 96 102 M 56 102 L 34 102 C 28 102 24 100 24 96" />
      <path d="M 74 70 C 94 56 118 50 142 50 L 142 70 Z M 150 50 C 172 52 188 59 200 68 L 150 70 Z" opacity="0.7" />
      <path d="M 142 50 L 142 100" opacity="0.5" />
      <Wheels rx={76} fx={222} />
    </g>
  );
}

/* Model X — large SUV */
function BpModelX() {
  return (
    <g>
      <path d="M 22 96 C 22 82 28 74 40 70 L 58 64 C 82 42 116 32 150 32 C 184 32 214 44 234 62 L 258 70 C 270 74 276 82 276 90 C 276 97 272 102 264 102 L 248 102" />
      <path d="M 204 102 L 94 102 M 54 102 L 32 102 C 26 102 22 100 22 96" />
      <path d="M 66 64 C 88 46 118 37 146 37 L 146 64 Z M 154 37 C 182 40 206 50 222 62 L 154 64 Z" opacity="0.7" />
      {/* falcon door hint */}
      <path d="M 150 36 L 168 20 M 150 36 L 150 100" opacity="0.5" />
      <Wheels rx={74} fx={228} r={18} />
    </g>
  );
}

/* Model Y — crossover */
function BpModelY() {
  return (
    <g>
      <path d="M 24 96 C 24 84 30 77 42 73 L 62 67 C 86 48 116 39 146 39 C 176 39 202 49 220 65 L 250 73 C 263 77 269 84 269 91 C 269 98 265 102 258 102 L 244 102" />
      <path d="M 200 102 L 96 102 M 56 102 L 34 102 C 28 102 24 100 24 96" />
      <path d="M 70 66 C 92 50 118 43 142 43 L 142 66 Z M 150 43 C 176 45 196 55 210 64 L 150 66 Z" opacity="0.7" />
      <path d="M 142 43 L 142 100" opacity="0.5" />
      <Wheels rx={76} fx={222} r={18} />
    </g>
  );
}

/* generic (admin-added models) */
function BpGeneric() {
  return (
    <g>
      <path d="M 24 96 C 24 86 30 80 40 77 L 68 70 C 92 54 120 47 148 47 C 174 47 196 55 212 68 L 248 76 C 262 80 268 86 268 92 C 268 98 264 102 258 102 L 244 102" />
      <path d="M 200 102 L 96 102 M 56 102 L 34 102 C 28 102 24 100 24 96" />
      <Wheels rx={76} fx={222} />
    </g>
  );
}

export default function ModelBlueprint({ modelId }: { modelId: string }) {
  return (
    <svg viewBox="0 0 300 128" fill="none" stroke="currentColor" strokeWidth="2.4"
      strokeLinecap="round" strokeLinejoin="round" className="model-blueprint" aria-hidden="true">
      <line x1="10" y1="115" x2="290" y2="115" strokeDasharray="2 8" opacity="0.4" />
      {modelId === 'MS' && <BpModelS />}
      {modelId === 'M3' && <BpModel3 />}
      {modelId === 'MX' && <BpModelX />}
      {modelId === 'MY' && <BpModelY />}
      {!['MS', 'M3', 'MX', 'MY'].includes(modelId) && <BpGeneric />}
    </svg>
  );
}
