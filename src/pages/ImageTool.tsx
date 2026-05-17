import { useState, useCallback } from 'react';
import './ImageTool.css';

const W = 800;
const H = 800;
const BG = '#2B2B2C';
const PAD = 80;
const LOGO = 'THub.ge';
const LOGO_RED = '#E3193A';

interface ProcessedImg {
  id: string;
  name: string;
  blobUrl: string;
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function processFile(file: File): Promise<ProcessedImg> {
  return new Promise((resolve, reject) => {
    const srcUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      // Anthracite background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // Product image — centered with padding, maintain aspect ratio
      const maxW = W - PAD * 2;
      const maxH = H - PAD * 2;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

      // THub.ge badge — bottom-left
      ctx.font = 'bold 15px Arial, Helvetica, sans-serif';
      const tw = ctx.measureText(LOGO).width;
      const px = 11;
      const py = 7;
      const bh = 15 + py * 2;
      const bw = tw + px * 2;
      const bx = 16;
      const by = H - 16 - bh;

      ctx.fillStyle = LOGO_RED;
      drawRoundRect(ctx, bx, by, bw, bh, 5);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(LOGO, bx + px, by + bh / 2);

      URL.revokeObjectURL(srcUrl);
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('toBlob failed')); return; }
          resolve({
            id: Math.random().toString(36).slice(2),
            name: file.name.replace(/\.[^.]+$/, '') + '-thub.jpg',
            blobUrl: URL.createObjectURL(blob),
          });
        },
        'image/jpeg',
        0.93,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(srcUrl); reject(new Error('Image load failed')); };
    img.src = srcUrl;
  });
}

export default function ImageTool() {
  const [images, setImages] = useState<ProcessedImg[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setProcessing(true);
    try {
      const results = await Promise.all(arr.map(processFile));
      setImages(prev => [...results, ...prev]);
    } finally {
      setProcessing(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  }

  function handleDownload(img: ProcessedImg) {
    const a = document.createElement('a');
    a.href = img.blobUrl;
    a.download = img.name;
    a.click();
  }

  function handleDownloadAll() {
    images.forEach((img, i) => {
      setTimeout(() => handleDownload(img), i * 120);
    });
  }

  function handleRemove(id: string) {
    setImages(prev => {
      const removed = prev.find(x => x.id === id);
      if (removed) URL.revokeObjectURL(removed.blobUrl);
      return prev.filter(x => x.id !== id);
    });
  }

  return (
    <div className="imgtool-root">
      <div className="imgtool-page">

        <div className="imgtool-header">
          <a href="/" className="imgtool-back">← Back to site</a>
          <h1>Product Image Tool</h1>
          <p>Upload product photos — each is resized to 800×800, placed on an anthracite background, and stamped with the THub.ge badge.</p>
        </div>

        <label
          className={`imgtool-drop${isDragging ? ' imgtool-drop-active' : ''}${processing ? ' imgtool-drop-busy' : ''}`}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          {processing ? (
            <>
              <div className="imgtool-spinner" />
              <span>Processing…</span>
            </>
          ) : (
            <>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="imgtool-drop-main">Click to upload or drag &amp; drop</span>
              <span className="imgtool-drop-sub">JPG · PNG · WEBP · multiple files supported</span>
            </>
          )}
        </label>

        {images.length > 0 && (
          <>
            <div className="imgtool-toolbar">
              <span>{images.length} image{images.length !== 1 ? 's' : ''} ready</span>
              <button className="btn-secondary imgtool-dl-all" onClick={handleDownloadAll}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download All
              </button>
            </div>

            <div className="imgtool-grid">
              {images.map(img => (
                <div key={img.id} className="imgtool-card">
                  <div className="imgtool-thumb-wrap">
                    <img src={img.blobUrl} alt={img.name} className="imgtool-thumb" />
                  </div>
                  <div className="imgtool-card-footer">
                    <span className="imgtool-card-name" title={img.name}>{img.name}</span>
                    <div className="imgtool-card-btns">
                      <button className="btn-primary imgtool-btn" onClick={() => handleDownload(img)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Save
                      </button>
                      <button className="imgtool-remove" onClick={() => handleRemove(img.id)} title="Remove">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
