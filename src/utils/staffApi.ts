// Client for the staff API (PHP + MySQL on the hosting).
// Falls back to localStorage ("local mode") when the API is not deployed or
// not yet configured — e.g. on GitHub Pages or before config.php exists.

export type Payment = 'cash' | 'card' | 'transfer';

export interface SaleItemInput {
  productId: string;
  name: string;
  partNumber?: string;
  qty: number;
  unitPrice: number;
}

export interface Sale {
  id: number;
  total: number;
  payment: Payment;
  customerPhone?: string;
  note?: string;
  createdAt: string;
  employee: string;
  items: SaleItemInput[];
}

export interface Agg { revenue: number; sales: number }

export interface Stats {
  daily: { day: string; revenue: number; sales: number }[];
  today: Agg; week: Agg; month: Agg; all: Agg;
  topProducts: { name: string; partNumber: string; qty: number; revenue: number }[];
  payments: { payment: Payment; revenue: number; sales: number }[];
}

export interface Employee { id: number; username: string; displayName: string; role: 'admin' | 'staff' }

export interface Session { token: string; employee: Employee; local: boolean }

const API = 'api';
const LOCAL_SALES_KEY = 'thub_sales';
const LOCAL_PW_KEY = 'thub_staff_pw';
const SESSION_KEY = 'thub_staff_session';

// ── session persistence ────────────────────────────────────────────────────
export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
export function saveSession(s: Session | null) {
  if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else sessionStorage.removeItem(SESSION_KEY);
}

// ── helpers ────────────────────────────────────────────────────────────────
async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return res;
}

function readLocalSales(): Sale[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_SALES_KEY) ?? '[]'); }
  catch { return []; }
}
function writeLocalSales(sales: Sale[]) {
  localStorage.setItem(LOCAL_SALES_KEY, JSON.stringify(sales));
}

// ── login ──────────────────────────────────────────────────────────────────
// Remote first; if the API is absent/unconfigured (404/503/network), local mode.
export async function login(username: string, password: string): Promise<Session> {
  let apiMissing = false;
  try {
    const res = await post('auth.php', { username, password });
    if (res.status === 404 || res.status === 503) {
      apiMissing = true;
    } else {
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'შესვლა ვერ მოხერხდა');
      return { token: data.token, employee: data.employee, local: false };
    }
  } catch (e) {
    if (!apiMissing && e instanceof Error && e.message !== 'Failed to fetch') throw e;
    apiMissing = true;
  }
  // local mode
  const storedPw = localStorage.getItem(LOCAL_PW_KEY) || 'thub2026';
  if (username === 'admin' && password === storedPw) {
    return {
      token: 'local',
      employee: { id: 0, username: 'admin', displayName: 'Administrator', role: 'admin' },
      local: true,
    };
  }
  throw new Error('არასწორი მომხმარებელი ან პაროლი');
}

// ── record sale ────────────────────────────────────────────────────────────
export async function recordSale(
  session: Session,
  payload: { items: SaleItemInput[]; payment: Payment; customerPhone?: string; note?: string },
): Promise<{ saleId: number; total: number }> {
  const total = payload.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  if (session.local) {
    const sales = readLocalSales();
    const sale: Sale = {
      id: (sales[0]?.id ?? 0) + 1,
      total: Math.round(total * 100) / 100,
      payment: payload.payment,
      customerPhone: payload.customerPhone,
      note: payload.note,
      createdAt: new Date().toISOString(),
      employee: session.employee.displayName,
      items: payload.items,
    };
    writeLocalSales([sale, ...sales]);
    return { saleId: sale.id, total: sale.total };
  }
  const res = await post('sales.php', payload, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'გაყიდვის შენახვა ვერ მოხერხდა');
  return { saleId: data.saleId, total: data.total };
}

// ── list sales ─────────────────────────────────────────────────────────────
export async function getSales(session: Session, limit = 50): Promise<Sale[]> {
  if (session.local) return readLocalSales().slice(0, limit);
  const res = await fetch(`${API}/sales.php?limit=${limit}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ ჩაიტვირთა');
  return data.sales;
}

// ── stats ──────────────────────────────────────────────────────────────────
export async function getStats(session: Session, days = 14): Promise<Stats> {
  if (session.local) return computeLocalStats(readLocalSales(), days);
  const res = await fetch(`${API}/stats.php?days=${days}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ ჩაიტვირთა');
  return data as Stats;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function computeLocalStats(sales: Sale[], days: number): Stats {
  const now = new Date();
  const startOf = (daysAgo: number) => {
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - daysAgo); return d;
  };
  const agg = (from: Date): Agg => {
    let revenue = 0, count = 0;
    for (const s of sales) {
      const t = new Date(s.createdAt);
      if (t >= from) { revenue += s.total; count++; }
    }
    return { revenue, sales: count };
  };

  const daily: Stats['daily'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOf(i);
    const key = dayKey(d);
    let revenue = 0, count = 0;
    for (const s of sales) {
      if (dayKey(new Date(s.createdAt)) === key) { revenue += s.total; count++; }
    }
    daily.push({ day: key, revenue, sales: count });
  }

  const monthFrom = startOf(29);
  const top = new Map<string, { name: string; partNumber: string; qty: number; revenue: number }>();
  const pay = new Map<Payment, { revenue: number; sales: number }>();
  for (const s of sales) {
    const t = new Date(s.createdAt);
    if (t < monthFrom) continue;
    const p = pay.get(s.payment) ?? { revenue: 0, sales: 0 };
    p.revenue += s.total; p.sales++;
    pay.set(s.payment, p);
    for (const it of s.items) {
      const k = `${it.name}|${it.partNumber ?? ''}`;
      const e = top.get(k) ?? { name: it.name, partNumber: it.partNumber ?? '', qty: 0, revenue: 0 };
      e.qty += it.qty; e.revenue += it.qty * it.unitPrice;
      top.set(k, e);
    }
  }

  return {
    daily,
    today: agg(startOf(0)),
    week: agg(startOf(6)),
    month: agg(monthFrom),
    all: { revenue: sales.reduce((s, x) => s + x.total, 0), sales: sales.length },
    topProducts: [...top.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    payments: [...pay.entries()].map(([payment, v]) => ({ payment, ...v })),
  };
}
