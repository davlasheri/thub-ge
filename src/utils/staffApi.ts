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
  refSaleId?: number | null;
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
  byEmployee: { employee: string; revenue: number; sales: number; avgTicket: number }[];
}

export type StockMoveType = 'purchase' | 'disassembly' | 'sale' | 'return' | 'adjustment';

export interface StockMovement {
  id: number;
  productId: string;
  name: string;
  partNumber: string;
  type: StockMoveType;
  qty: number;             // signed: + in, − out
  note: string;
  createdAt: string;
  employee: string;
}

export interface CashMovement {
  id: number;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  createdAt: string;
  employee: string;
}

export interface CashReport {
  movements: CashMovement[];
  summary: { cashSales: number; cashSalesCount: number; manualIn: number; manualOut: number; net: number };
}

export interface Employee { id: number; username: string; displayName: string; role: 'admin' | 'staff' }

export interface Session { token: string; employee: Employee; local: boolean }

export interface EmployeeRecord {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'staff';
  active: boolean;
  createdAt?: string;
}

const API = 'api';
const LOCAL_SALES_KEY = 'thub_sales';
const LOCAL_PW_KEY = 'thub_staff_pw';
const LOCAL_EMP_KEY = 'thub_staff_employees';
const LOCAL_INV_KEY = 'thub_inventory';
const LOCAL_CASH_KEY = 'thub_cash';
const LOCAL_STOCK_KEY = 'thub_stock_moves';
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
export const SESSION_EXPIRED = 'სესია ამოიწურა — გთხოვთ, ხელახლა შეხვიდეთ სისტემაში';

async function post(path: string, body: unknown, token?: string) {
  const res = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  // A 401 on a request that carried a token means the token expired mid-shift —
  // surface a clear message (login uses no token, so its 401 is untouched).
  if (token && res.status === 401) throw new Error(SESSION_EXPIRED);
  return res;
}

function readLocalSales(): Sale[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_SALES_KEY) ?? '[]'); }
  catch { return []; }
}
function writeLocalSales(sales: Sale[]) {
  localStorage.setItem(LOCAL_SALES_KEY, JSON.stringify(sales));
}

// Local-mode employees carry a plain password field (browser-only demo data).
type LocalEmployee = EmployeeRecord & { password: string };

function readLocalEmployees(): LocalEmployee[] {
  let list: LocalEmployee[] = [];
  try { list = JSON.parse(localStorage.getItem(LOCAL_EMP_KEY) ?? '[]'); }
  catch { list = []; }
  if (!list.some(e => e.username === 'admin')) {
    list.unshift({
      id: 1, username: 'admin', displayName: 'Administrator', role: 'admin',
      active: true, password: localStorage.getItem(LOCAL_PW_KEY) || 'thub2026',
    });
  }
  if (!list.some(e => e.username === 'user1')) {
    list.push({
      id: Math.max(...list.map(e => e.id)) + 1,
      username: 'user1', displayName: 'გამყიდველი', role: 'staff',
      active: true, password: '1234',
    });
  }
  return list;
}
function writeLocalEmployees(list: LocalEmployee[]) {
  localStorage.setItem(LOCAL_EMP_KEY, JSON.stringify(list));
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
  // local mode: check against browser-stored employee list
  const emp = readLocalEmployees().find(
    e => e.username === username.toLowerCase() && e.active && e.password === password,
  );
  if (emp) {
    return {
      token: 'local',
      employee: { id: emp.id, username: emp.username, displayName: emp.displayName, role: emp.role },
      local: true,
    };
  }
  throw new Error('არასწორი მომხმარებელი ან პაროლი');
}

// ── employees (admin only) ─────────────────────────────────────────────────
export async function listEmployees(session: Session): Promise<EmployeeRecord[]> {
  if (session.local) {
    return readLocalEmployees().map(({ password: _pw, ...e }) => e);
  }
  const res = await fetch(`${API}/employees.php`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ ჩაიტვირთა');
  return data.employees;
}

export async function createEmployee(
  session: Session,
  payload: { username: string; password: string; displayName: string; role: 'admin' | 'staff' },
): Promise<void> {
  const username = payload.username.trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('მომხმარებელი: 3-32 სიმბოლო (a-z, 0-9, . _ -)');
  if (payload.password.length < 4) throw new Error('პაროლი მინიმუმ 4 სიმბოლო');
  if (session.local) {
    const list = readLocalEmployees();
    if (list.some(e => e.username === username)) throw new Error('ასეთი მომხმარებელი უკვე არსებობს');
    list.push({
      id: Math.max(...list.map(e => e.id)) + 1,
      username,
      displayName: payload.displayName.trim() || username,
      role: payload.role,
      active: true,
      password: payload.password,
    });
    writeLocalEmployees(list);
    return;
  }
  const res = await post('employees.php', { action: 'create', ...payload, username }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ შეიქმნა');
}

export async function updateEmployee(
  session: Session,
  payload: { id: number; displayName?: string; role?: 'admin' | 'staff'; active?: boolean; newPassword?: string },
): Promise<void> {
  if (session.local) {
    const list = readLocalEmployees();
    const emp = list.find(e => e.id === payload.id);
    if (!emp) throw new Error('თანამშრომელი ვერ მოიძებნა');
    const isSelf = session.employee.id === payload.id || emp.username === session.employee.username;
    if (payload.role !== undefined && isSelf && payload.role !== 'admin') throw new Error('საკუთარი როლის დაქვეითება არ შეიძლება');
    if (payload.active !== undefined && isSelf && !payload.active) throw new Error('საკუთარი ანგარიშის გათიშვა არ შეიძლება');
    if (payload.newPassword !== undefined && payload.newPassword.length < 4) throw new Error('პაროლი მინიმუმ 4 სიმბოლო');
    if (payload.displayName !== undefined) emp.displayName = payload.displayName.trim() || emp.username;
    if (payload.role !== undefined) emp.role = payload.role;
    if (payload.active !== undefined) emp.active = payload.active;
    if (payload.newPassword) {
      emp.password = payload.newPassword;
      if (emp.username === 'admin') localStorage.setItem(LOCAL_PW_KEY, payload.newPassword);
    }
    writeLocalEmployees(list);
    return;
  }
  const res = await post('employees.php', { action: 'update', ...payload }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ შეინახა');
}

// ── record sale / return ───────────────────────────────────────────────────
function logLocalStockMoves(
  session: Session,
  items: { productId: string; name: string; partNumber?: string; qty: number }[],
  type: StockMoveType,
  note: string,
) {
  let list: StockMovement[] = [];
  try { list = JSON.parse(localStorage.getItem(LOCAL_STOCK_KEY) ?? '[]'); } catch { list = []; }
  let nextId = (list[0]?.id ?? 0) + 1;
  const now = new Date().toISOString();
  for (const it of items) {
    if (!it.productId || it.productId === 'custom') continue;
    list.unshift({
      id: nextId++, productId: it.productId, name: it.name, partNumber: it.partNumber ?? '',
      type, qty: it.qty, note, createdAt: now, employee: session.employee.displayName,
    });
  }
  localStorage.setItem(LOCAL_STOCK_KEY, JSON.stringify(list));
}

const itemKey = (it: { productId?: string; name: string; unitPrice: number }) =>
  `${it.productId ?? ''}|${it.name}|${Number(it.unitPrice).toFixed(2)}`;

// how many of each item from a sale can still be returned
export function returnableItems(sale: Sale, allSales: Sale[]): Map<string, number> {
  const remaining = new Map<string, number>();
  for (const it of sale.items) {
    remaining.set(itemKey(it), (remaining.get(itemKey(it)) ?? 0) + Number(it.qty));
  }
  for (const s of allSales) {
    if (Number(s.total) >= 0) continue;
    const ref = s.refSaleId ?? (s.note?.match(/#(\d+)/)?.[1] ? Number(s.note.match(/#(\d+)/)![1]) : null);
    if (ref !== sale.id) continue;
    for (const it of s.items) {
      remaining.set(itemKey(it), (remaining.get(itemKey(it)) ?? 0) - Number(it.qty));
    }
  }
  return remaining;
}

async function saveSaleLike(
  session: Session,
  payload: { items: SaleItemInput[]; payment: Payment; customerPhone?: string; note?: string; refSaleId?: number },
  isReturn: boolean,
): Promise<{ saleId: number; total: number }> {
  let total = payload.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
  if (isReturn) total = -total;
  if (session.local) {
    const sales = readLocalSales();
    if (isReturn) {
      const orig = sales.find(s => s.id === payload.refSaleId);
      if (!orig) throw new Error('საწყისი გაყიდვა ვერ მოიძებნა');
      const remaining = returnableItems(orig, sales);
      for (const it of payload.items) {
        if ((remaining.get(itemKey(it)) ?? 0) < it.qty) {
          throw new Error('ეს რაოდენობა უკვე დაბრუნებულია');
        }
      }
    }
    const sale: Sale = {
      id: (sales[0]?.id ?? 0) + 1,
      refSaleId: isReturn ? payload.refSaleId : null,
      total: Math.round(total * 100) / 100,
      payment: payload.payment,
      customerPhone: payload.customerPhone,
      note: payload.note,
      createdAt: new Date().toISOString(),
      employee: session.employee.displayName,
      items: payload.items,
    };
    writeLocalSales([sale, ...sales]);
    const inv = readLocalInventory();
    for (const it of payload.items) {
      if (!it.productId || it.productId === 'custom') continue;
      if (isReturn) inv[it.productId] = (inv[it.productId] ?? 0) + it.qty;
      else inv[it.productId] = (inv[it.productId] ?? 0) - it.qty;
    }
    writeLocalInventory(inv);
    logLocalStockMoves(
      session,
      payload.items.map(it => ({ ...it, qty: isReturn ? it.qty : -it.qty })),
      isReturn ? 'return' : 'sale',
      isReturn ? (payload.note ?? '') : `sale #${sale.id}`,
    );
    return { saleId: sale.id, total: sale.total };
  }
  const res = await post('sales.php', isReturn ? { ...payload, kind: 'return' } : payload, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'შენახვა ვერ მოხერხდა');
  return { saleId: data.saleId, total: data.total };
}

export async function recordSale(
  session: Session,
  payload: { items: SaleItemInput[]; payment: Payment; customerPhone?: string; note?: string },
): Promise<{ saleId: number; total: number }> {
  return saveSaleLike(session, payload, false);
}

export async function recordReturn(
  session: Session,
  payload: { items: SaleItemInput[]; payment: Payment; note?: string; refSaleId: number },
): Promise<{ saleId: number; total: number }> {
  return saveSaleLike(session, payload, true);
}

// ── edit / delete history (admin) ──────────────────────────────────────────
export async function updateSale(
  session: Session,
  payload: { id: number; payment?: Payment; customerPhone?: string; note?: string },
): Promise<void> {
  if (session.local) {
    const sales = readLocalSales();
    const s = sales.find(x => x.id === payload.id);
    if (!s) throw new Error('გაყიდვა ვერ მოიძებნა');
    if (payload.payment) s.payment = payload.payment;
    if (payload.customerPhone !== undefined) s.customerPhone = payload.customerPhone;
    if (payload.note !== undefined) s.note = payload.note;
    writeLocalSales(sales);
    return;
  }
  const res = await post('sales.php', { action: 'update', ...payload }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ შეინახა');
}

export async function deleteSale(session: Session, id: number): Promise<void> {
  if (session.local) {
    const sales = readLocalSales();
    const s = sales.find(x => x.id === id);
    if (!s) throw new Error('გაყიდვა ვერ მოიძებნა');
    const hasReturns = sales.some(x => Number(x.total) < 0 && (x.refSaleId ?? -1) === id);
    if (hasReturns) throw new Error('ამ გაყიდვას აქვს დაბრუნებები — ჯერ ისინი წაშალეთ');
    const isReturn = Number(s.total) < 0;
    const inv = readLocalInventory();
    for (const it of s.items) {
      if (!it.productId || it.productId === 'custom') continue;
      const delta = isReturn ? -Number(it.qty) : Number(it.qty);
      inv[it.productId] = (inv[it.productId] ?? 0) + delta;
    }
    writeLocalInventory(inv);
    logLocalStockMoves(
      session,
      s.items.map(it => ({ ...it, qty: isReturn ? -Number(it.qty) : Number(it.qty) })),
      'adjustment',
      isReturn ? `return #${id} deleted` : `sale #${id} deleted`,
    );
    writeLocalSales(sales.filter(x => x.id !== id));
    return;
  }
  const res = await post('sales.php', { action: 'delete', id }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ წაიშალა');
}

// ── stock adjustments & movement report ────────────────────────────────────
// Purchase/disassembly intake was removed from the POS — products and their
// quantities are managed in the admin panel; only manual corrections remain.
export async function addStock(
  session: Session,
  payload: {
    type: 'adjustment';
    items: { productId: string; name: string; partNumber?: string; qty: number }[];
    note?: string;
  },
): Promise<void> {
  if (session.local) {
    const inv = readLocalInventory();
    for (const it of payload.items) {
      if (!it.productId || it.qty === 0) continue;
      inv[it.productId] = (inv[it.productId] ?? 0) + it.qty;
    }
    writeLocalInventory(inv);
    logLocalStockMoves(session, payload.items, payload.type, payload.note ?? '');
    return;
  }
  const res = await post('stock.php', payload, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ შეინახა');
}

export async function getStockMovements(session: Session, days = 30): Promise<StockMovement[]> {
  if (session.local) {
    let list: StockMovement[] = [];
    try { list = JSON.parse(localStorage.getItem(LOCAL_STOCK_KEY) ?? '[]'); } catch { list = []; }
    const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (days - 1));
    return list.filter(m => new Date(m.createdAt) >= from);
  }
  const res = await fetch(`${API}/stock.php?days=${days}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ ჩაიტვირთა');
  return data.movements;
}

// ── edit / delete stock movements (admin) ──────────────────────────────────
function readLocalStockMoves(): StockMovement[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_STOCK_KEY) ?? '[]'); }
  catch { return []; }
}

export async function updateStockMovement(
  session: Session,
  payload: { id: number; qty?: number; type?: StockMoveType; note?: string },
): Promise<void> {
  if (payload.qty !== undefined && (!Number.isFinite(payload.qty) || payload.qty === 0)) {
    throw new Error('რაოდენობა არ შეიძლება იყოს 0');
  }
  if (session.local) {
    const list = readLocalStockMoves();
    const m = list.find(x => x.id === payload.id);
    if (!m) throw new Error('ჩანაწერი ვერ მოიძებნა');
    if (payload.qty !== undefined && payload.qty !== m.qty) {
      const inv = readLocalInventory();
      inv[m.productId] = (inv[m.productId] ?? 0) + payload.qty - m.qty;
      writeLocalInventory(inv);
      m.qty = payload.qty;
    }
    if (payload.type) m.type = payload.type;
    if (payload.note !== undefined) m.note = payload.note;
    localStorage.setItem(LOCAL_STOCK_KEY, JSON.stringify(list));
    return;
  }
  const res = await post('stock.php', { action: 'update', ...payload }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ შეინახა');
}

export async function deleteStockMovement(session: Session, id: number): Promise<void> {
  if (session.local) {
    const list = readLocalStockMoves();
    const m = list.find(x => x.id === id);
    if (!m) throw new Error('ჩანაწერი ვერ მოიძებნა');
    const inv = readLocalInventory();
    inv[m.productId] = (inv[m.productId] ?? 0) - m.qty;
    writeLocalInventory(inv);
    localStorage.setItem(LOCAL_STOCK_KEY, JSON.stringify(list.filter(x => x.id !== id)));
    return;
  }
  const res = await post('stock.php', { action: 'delete', id }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ წაიშალა');
}

// Clears the whole movement history (log purge — current stock is untouched).
export async function clearStockMovements(session: Session): Promise<void> {
  if (session.local) {
    localStorage.setItem(LOCAL_STOCK_KEY, '[]');
    return;
  }
  const res = await post('stock.php', { action: 'clearAll' }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ წაიშალა');
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

// ── inventory ──────────────────────────────────────────────────────────────
function readLocalInventory(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(LOCAL_INV_KEY) ?? '{}'); }
  catch { return {}; }
}
function writeLocalInventory(inv: Record<string, number>) {
  localStorage.setItem(LOCAL_INV_KEY, JSON.stringify(inv));
}

export async function getInventory(session: Session): Promise<Record<string, number>> {
  if (session.local) return readLocalInventory();
  const res = await fetch(`${API}/inventory.php`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'მარაგი ვერ ჩაიტვირთა');
  return data.inventory;
}

export async function setInventoryQty(session: Session, productId: string, qty: number): Promise<void> {
  if (session.local) {
    const inv = readLocalInventory();
    inv[productId] = Math.max(0, Math.round(qty));
    writeLocalInventory(inv);
    return;
  }
  const res = await post('inventory.php', { action: 'set', productId, qty }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ შეინახა');
}

// Zeroes every stock balance (admin) — also drops rows of products removed from the catalog.
export async function resetInventory(session: Session): Promise<void> {
  if (session.local) {
    writeLocalInventory({});
    return;
  }
  const res = await post('inventory.php', { action: 'resetAll' }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ განულდა');
}

// ── cash movements ─────────────────────────────────────────────────────────
function readLocalCash(): CashMovement[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_CASH_KEY) ?? '[]'); }
  catch { return []; }
}

export async function getCash(session: Session, days = 30): Promise<CashReport> {
  if (session.local) {
    const from = new Date(); from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - (days - 1));
    const movements = readLocalCash().filter(m => new Date(m.createdAt) >= from);
    let cashSales = 0, cashSalesCount = 0;
    for (const s of readLocalSales()) {
      if (s.payment === 'cash' && new Date(s.createdAt) >= from) { cashSales += s.total; cashSalesCount++; }
    }
    let manualIn = 0, manualOut = 0;
    for (const m of movements) { if (m.type === 'in') manualIn += m.amount; else manualOut += m.amount; }
    return {
      movements,
      summary: { cashSales, cashSalesCount, manualIn, manualOut, net: cashSales + manualIn - manualOut },
    };
  }
  const res = await fetch(`${API}/cash.php?days=${days}`, {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ ჩაიტვირთა');
  return data as CashReport;
}

export async function addCashMovement(
  session: Session,
  payload: { type: 'in' | 'out'; amount: number; reason: string },
): Promise<void> {
  if (!(payload.amount > 0)) throw new Error('თანხა უნდა იყოს 0-ზე მეტი');
  if (session.local) {
    const list = readLocalCash();
    list.unshift({
      id: (list[0]?.id ?? 0) + 1,
      type: payload.type,
      amount: Math.round(payload.amount * 100) / 100,
      reason: payload.reason,
      createdAt: new Date().toISOString(),
      employee: session.employee.displayName,
    });
    localStorage.setItem(LOCAL_CASH_KEY, JSON.stringify(list));
    return;
  }
  const res = await post('cash.php', payload, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ შეინახა');
}

// ── edit / delete cash operations (admin) ──────────────────────────────────
export async function updateCashMovement(
  session: Session,
  payload: { id: number; type?: 'in' | 'out'; amount?: number; reason?: string },
): Promise<void> {
  if (payload.amount !== undefined && !(payload.amount > 0)) {
    throw new Error('თანხა უნდა იყოს 0-ზე მეტი');
  }
  if (session.local) {
    const list = readLocalCash();
    const m = list.find(x => x.id === payload.id);
    if (!m) throw new Error('ოპერაცია ვერ მოიძებნა');
    if (payload.type) m.type = payload.type;
    if (payload.amount !== undefined) m.amount = Math.round(payload.amount * 100) / 100;
    if (payload.reason !== undefined) m.reason = payload.reason;
    localStorage.setItem(LOCAL_CASH_KEY, JSON.stringify(list));
    return;
  }
  const res = await post('cash.php', { action: 'update', ...payload }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ შეინახა');
}

export async function deleteCashMovement(session: Session, id: number): Promise<void> {
  if (session.local) {
    const list = readLocalCash();
    if (!list.some(x => x.id === id)) throw new Error('ოპერაცია ვერ მოიძებნა');
    localStorage.setItem(LOCAL_CASH_KEY, JSON.stringify(list.filter(x => x.id !== id)));
    return;
  }
  const res = await post('cash.php', { action: 'delete', id }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ წაიშალა');
}

export async function clearCashMovements(session: Session): Promise<void> {
  if (session.local) {
    localStorage.setItem(LOCAL_CASH_KEY, '[]');
    return;
  }
  const res = await post('cash.php', { action: 'clearAll' }, session.token);
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error || 'ვერ წაიშალა');
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
  const windowFrom = startOf(days - 1);
  const top = new Map<string, { name: string; partNumber: string; qty: number; revenue: number }>();
  const pay = new Map<Payment, { revenue: number; sales: number }>();
  const emp = new Map<string, { revenue: number; sales: number }>();
  for (const s of sales) {
    const t = new Date(s.createdAt);
    if (t >= windowFrom) {
      const ee = emp.get(s.employee) ?? { revenue: 0, sales: 0 };
      ee.revenue += s.total; ee.sales++;
      emp.set(s.employee, ee);
    }
    if (t < monthFrom) continue;
    const p = pay.get(s.payment) ?? { revenue: 0, sales: 0 };
    p.revenue += s.total; p.sales++;
    pay.set(s.payment, p);
    // top products count sales only — a return (negative total) must not inflate
    // sold quantity/revenue, matching the server's `WHERE total >= 0`
    if (Number(s.total) < 0) continue;
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
    byEmployee: [...emp.entries()]
      .map(([employee, v]) => ({ employee, ...v, avgTicket: v.sales ? v.revenue / v.sales : 0 }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}
