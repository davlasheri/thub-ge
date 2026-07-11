import type { SyntheticEvent } from 'react';

// Neutral "no photo" placeholder used when a product image fails to load
// (broken URL or corrupt stored data) so cards don't render an empty frame.
export const IMG_FALLBACK =
  'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">' +
    '<rect width="800" height="600" fill="#2B2B2C"/>' +
    '<g fill="none" stroke="#555" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="285" y="215" width="230" height="170" rx="18"/>' +
    '<circle cx="352" cy="275" r="20"/>' +
    '<path d="M302 362l68-62 50 44 44-38 50 56"/>' +
    '</g></svg>'
  );

export function onImgError(e: SyntheticEvent<HTMLImageElement>) {
  const img = e.currentTarget;
  if (img.src !== IMG_FALLBACK) img.src = IMG_FALLBACK;
}
