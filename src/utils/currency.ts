// USD-priced products: the price is kept in dollars, but the public site
// never shows USD — visitors always see the GEL equivalent at the admin-set
// exchange rate. Dollars appear only inside the POS.

export const DEFAULT_USD_RATE = 2.7;

// Reads the rate straight from the persisted site settings so non-React code
// (PDF generator, cart math) can use it too. SiteSettingsContext writes the
// same key, so the value is always in sync.
export function getUsdRate(): number {
  try {
    const stored = JSON.parse(localStorage.getItem('thub_site_settings') ?? '{}');
    const rate = Number(stored?.pos?.usdRate);
    return isFinite(rate) && rate > 0 ? rate : DEFAULT_USD_RATE;
  } catch {
    return DEFAULT_USD_RATE;
  }
}

/** Price of a product in GEL for public display (whole lari for USD items). */
export function productGel(p: { price: number; currency?: string }, rate = getUsdRate()): number {
  return p.currency === 'USD' ? Math.round(p.price * rate) : p.price;
}

export const fmtUsd = (n: number | string) => `$${(Number(n) || 0).toFixed(2)}`;
