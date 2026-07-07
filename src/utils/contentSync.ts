// Syncs the admin-editable catalog content (products, models, generations,
// categories, cars, site settings) with the server, so edits made in the admin
// are visible to every visitor on every device — not just the browser that made
// them. Falls back to localStorage-only when the API is unavailable (e.g. the
// GitHub Pages mirror, or before api/config.php is configured).

import { loadSession } from './staffApi';

// Base-absolute so it resolves correctly from any route (e.g. /products/:id),
// not relative to the current page. Matches the app's Vite base:
//   hosting build (base=/)      → /api
//   pages mirror (base=/thub-ge/) → /thub-ge/api
const API = `${import.meta.env.BASE_URL}api`;

// Every localStorage key that holds admin-editable site content.
export const CONTENT_KEYS = [
  'thub_admin_products', 'thub_deleted_products',
  'thub_admin_models', 'thub_deleted_models',
  'thub_admin_generations',
  'thub_admin_catalog', 'thub_deleted_sections',
  'thub_cars',
  'thub_site_settings',
] as const;

// Keys the server already had at boot — used so we only "publish" a browser's
// pre-existing local edits when the server doesn't yet know about them.
const serverKeys = new Set<string>();

function adminToken(): string | null {
  const s = loadSession();
  return s && !s.local && s.token ? s.token : null;
}

// Fetch server content and seed localStorage before the app renders, so the
// existing contexts pick it up through their normal localStorage initializers.
export async function hydrateContent(): Promise<void> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${API}/content.php`, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return;
    const data = await res.json();
    const content: Record<string, unknown> = data?.content ?? {};
    for (const key of CONTENT_KEYS) {
      const val = content[key];
      if (typeof val === 'string') {
        serverKeys.add(key);
        try { localStorage.setItem(key, val); } catch { /* quota — ignore */ }
      }
    }
  } catch {
    /* API not reachable — keep whatever is in localStorage / defaults */
  }
}

// Write-through: persist locally (immediate) and push to the server when an
// admin is logged in. Fire-and-forget so the UI stays responsive.
export function syncContent(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
  const token = adminToken();
  if (!token) return;
  fetch(`${API}/content.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ key, value }),
  })
    .then(res => { if (res.ok) serverKeys.add(key); else console.warn('content sync failed', key, res.status); })
    .catch(err => console.warn('content sync error', key, err));
}

// After an admin logs in, publish this browser's existing local edits for any
// key the server doesn't already have. Lets edits made before server-sync
// existed become global without the admin having to re-save each one.
export async function publishLocalContent(): Promise<void> {
  const token = adminToken();
  if (!token) return;
  for (const key of CONTENT_KEYS) {
    if (serverKeys.has(key)) continue;
    const value = localStorage.getItem(key);
    if (value == null) continue;
    try {
      const res = await fetch(`${API}/content.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) serverKeys.add(key);
    } catch { /* ignore — will retry on next login */ }
  }
}
