const W = 800;
const H = 800;
const BG = '#2B2B2C';
const PAD = 80;
const LOGO = 'THub.ge';
const LOGO_RED = '#E3193A';

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

export interface ProcessedImage {
  dataUrl: string;
  blobUrl: string;
  fileName: string;
}

export function processImageFile(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const srcUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const maxW = W - PAD * 2;
      const maxH = H - PAD * 2;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

      ctx.font = 'bold 15px Arial, Helvetica, sans-serif';
      const tw = ctx.measureText(LOGO).width;
      const px = 11, py = 7;
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
            dataUrl: canvas.toDataURL('image/jpeg', 0.93),
            blobUrl: URL.createObjectURL(blob),
            fileName: file.name.replace(/\.[^.]+$/, '') + '-thub.jpg',
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
