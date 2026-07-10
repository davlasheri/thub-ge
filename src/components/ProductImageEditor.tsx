import { useEffect, useRef, useState } from 'react';
import { loadImageFile, renderProductImage, exportCanvas } from '../utils/imageProcess';

/*
 * Zoom/crop editor for product photos. Shows a live preview of the final
 * 800×600 (4:3) image (dark background + THub badge); the photo can be zoomed with
 * the slider / mouse wheel and repositioned by dragging.
 * Source is either a freshly picked File or the product's current image
 * (data URL / https URL), so existing photos can be re-cropped too.
 */

interface Props {
  source: File | string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

function loadImageUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // remote images need CORS approval or the canvas becomes tainted
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = src;
  });
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 3;

export default function ProductImageEditor({ source, onSave, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ dx: 0, dy: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (source instanceof File ? loadImageFile(source) : loadImageUrl(source))
      .then(img => { if (alive) { imgRef.current = img; setReady(true); } })
      .catch(() => { if (alive) setErr('სურათი ვერ ჩაიტვირთა'); });
    return () => { alive = false; };
  }, [source]);

  useEffect(() => {
    if (!ready || !canvasRef.current || !imgRef.current) return;
    renderProductImage(canvasRef.current, imgRef.current, { zoom, dx: offset.dx, dy: offset.dy });
  }, [ready, zoom, offset]);

  // drag to reposition — pointer events cover both mouse and touch
  const toCanvasScale = () => {
    const c = canvasRef.current!;
    return c.width / c.getBoundingClientRect().width;
  };
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drag.current) return;
    const k = toCanvasScale();
    const { x, y } = drag.current;
    drag.current = { x: e.clientX, y: e.clientY };
    setOffset(o => ({ dx: o.dx + (e.clientX - x) * k, dy: o.dy + (e.clientY - y) * k }));
  };
  const onPointerUp = () => { drag.current = null; };

  const onWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    setZoom(z => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (e.deltaY < 0 ? 1.08 : 1 / 1.08))));
  };

  const reset = () => { setZoom(1); setOffset({ dx: 0, dy: 0 }); };

  const save = async () => {
    if (!canvasRef.current || saving) return;
    setSaving(true);
    try {
      const res = await exportCanvas(canvasRef.current, source instanceof File ? source.name : 'photo.jpg');
      onSave(res.dataUrl);
    } catch {
      // most likely a CORS-tainted canvas from a foreign image URL
      setErr('ამ სურათის შენახვა ვერ ხერხდება — ატვირთეთ ფოტო ფაილიდან');
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal img-editor" onClick={e => e.stopPropagation()}>
        <h3>სურათის მორგება</h3>
        <p className="img-editor-hint">გადაათრიეთ სურათი პოზიციისთვის · მასშტაბი — სლაიდერით ან მაუსის ბორბლით</p>

        {err && <p className="admin-error">{err}</p>}

        <div className="img-editor-stage">
          {!ready && !err && <div className="admin-img-processing"><div className="admin-img-spinner" /><span>იტვირთება…</span></div>}
          <canvas
            ref={canvasRef}
            className="img-editor-canvas"
            style={{ display: ready ? 'block' : 'none' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
          />
        </div>

        <div className="img-editor-zoom">
          <span>−</span>
          <input
            type="range" min={MIN_ZOOM * 100} max={MAX_ZOOM * 100} value={zoom * 100}
            onChange={e => setZoom(Number(e.target.value) / 100)}
            aria-label="მასშტაბი"
          />
          <span>+</span>
          <strong className="img-editor-zoom-val">{Math.round(zoom * 100)}%</strong>
        </div>

        <div className="admin-modal-actions">
          <button className="admin-btn-primary" disabled={!ready || saving} onClick={save}>
            {saving ? 'ინახება…' : '✓ გამოყენება'}
          </button>
          <button className="admin-btn-ghost" onClick={reset}>საწყისზე</button>
          <button className="admin-btn-ghost" onClick={onCancel}>გაუქმება</button>
        </div>
      </div>
    </div>
  );
}
