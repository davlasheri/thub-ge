// Uploads a processed product photo to the server (api/upload.php) so the
// catalog JSON stays small and images get real, SEO-friendly file names.
// Returns the hosted URL, or null when the upload isn't possible — local
// mode, the GitHub Pages mirror, or a server error — in which case the
// caller keeps the embedded data URL and everything works like before.

import { loadSession } from './staffApi';

const API = `${import.meta.env.BASE_URL}api`;

export const isDataImage = (src: string) => src.startsWith('data:image/');
export const isUploadedImage = (src: string) => src.includes('api/uploads/');

export async function uploadProductImage(
  dataUrl: string,
  meta: { partNumber: string; productId: string; replaces?: string },
): Promise<string | null> {
  const s = loadSession();
  if (!s || s.local) return null;
  try {
    const res = await fetch(`${API}/upload.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` },
      body: JSON.stringify({ dataUrl, ...meta }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok || typeof data.url !== 'string') return null;
    return `${import.meta.env.BASE_URL}${data.url}`;
  } catch {
    return null;
  }
}

/** File name of a previously uploaded image, for upload.php's `replaces`. */
export function uploadedFileName(src: string): string | undefined {
  return isUploadedImage(src) ? src.split('/').pop() : undefined;
}
