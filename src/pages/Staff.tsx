import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { useCatalog } from '../context/CatalogContext';
import { useModels } from '../context/ModelsContext';
import { useTheme } from '../context/ThemeContext';
import { getCatName } from '../utils/catalog';
import { Product } from '../types';
import {
  Session, Sale, Stats, SaleItemInput, Payment, CashReport, StockMovement, StockMoveType,
  login, loadSession, saveSession, recordSale, recordReturn, getSales, getStats,
  getInventory, resetInventory, addStock, getStockMovements, getCash, addCashMovement,
  returnableItems, updateSale, deleteSale,
  updateStockMovement, deleteStockMovement, updateCashMovement, deleteCashMovement,
  clearStockMovements, clearCashMovements,
} from '../utils/staffApi';
import { fmtUsd, getUsdRate } from '../utils/currency';
import { onImgError } from '../utils/imgFallback';
import './Staff.css';

const PAYMENT_LABELS: Record<Payment, string> = {
  cash: 'ნაღდი', card: 'ბარათი', transfer: 'გადარიცხვა',
};

// MySQL DECIMAL values can arrive as strings — always coerce before toFixed
const GEL = (n: number | string) => `${(Number(n) || 0).toFixed(2)} ₾`;
const round2 = (n: number) => Math.round(n * 100) / 100;

// price tag for POS product lists — USD items show their dollar price
const posPrice = (p: Product) => p.currency === 'USD' ? fmtUsd(p.price) : GEL(p.price);

export default function Staff() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [tab, setTab] = useState<'pos' | 'dashboard' | 'sales' | 'inventory' | 'cash'>('pos');
  const { theme, toggleTheme } = useTheme();

  // Admin staff login also unlocks the site admin panel (/admin)
  const handleLogin = (s: Session) => {
    saveSession(s);
    if (s.employee.role === 'admin') sessionStorage.setItem('thub_admin_auth', '1');
    setSession(s);
  };

  const logout = () => {
    saveSession(null);
    sessionStorage.removeItem('thub_admin_auth');
    setSession(null);
  };

  if (!session) {
    return <StaffLogin onLogin={handleLogin} />;
  }

  const isAdmin = session.employee.role === 'admin';

  return (
    <div className="staff-page">
      <header className="staff-header">
        <Link to="/" className="staff-logo"><span className="logo-t">T</span>Hub<span className="staff-logo-ge">.ge</span> <span className="staff-logo-suffix">POS</span></Link>
        <nav className="staff-tabs">
          <button className={tab === 'pos' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('pos')}>🧾 გაყიდვა</button>
          {isAdmin && <button className={tab === 'dashboard' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('dashboard')}>📊 სტატისტიკა</button>}
          <button className={tab === 'sales' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('sales')}>📋 ისტორია</button>
          {isAdmin && <button className={tab === 'inventory' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('inventory')}>📦 მარაგი</button>}
          {isAdmin && <button className={tab === 'cash' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('cash')}>💵 სალარო</button>}
          {isAdmin && <Link to="/admin" className="staff-tab staff-tab-link">⚙️ საიტის მართვა</Link>}
        </nav>
        <div className="staff-header-right">
          {session.local && <span className="staff-local-badge" title="მონაცემთა ბაზა არ არის მიერთებული — გაყიდვები ინახება მხოლოდ ამ ბრაუზერში">ლოკალური რეჟიმი</span>}
          <button
            className="staff-theme-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'ღია თემა' : 'მუქი თემა'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <span className="staff-user">{session.employee.displayName}</span>
          <button className="staff-logout" onClick={logout}>გასვლა</button>
        </div>
      </header>

      {tab === 'pos' && <PosView session={session} />}
      {tab === 'dashboard' && isAdmin && <DashboardView session={session} />}
      {tab === 'sales' && <SalesHistoryView session={session} />}
      {tab === 'inventory' && isAdmin && <InventoryView session={session} />}
      {tab === 'cash' && isAdmin && <CashView session={session} />}
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────
function StaffLogin({ onLogin }: { onLogin: (s: Session) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      onLogin(await login(username.trim(), password));
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="staff-login-page">
      <form className="staff-login-card" onSubmit={submit}>
        <div className="staff-login-logo"><span className="logo-t">T</span>Hub.ge</div>
        <h1>თანამშრომლის შესვლა</h1>
        <input className="staff-input" placeholder="მომხმარებელი" value={username}
          onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" />
        <input className="staff-input" type="password" placeholder="პაროლი" value={password}
          onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        {err && <div className="staff-login-err">{err}</div>}
        <button className="staff-btn-primary" disabled={busy}>{busy ? 'იტვირთება…' : 'შესვლა'}</button>
      </form>
    </div>
  );
}

// ── POS ────────────────────────────────────────────────────────────────────
// USD lines keep their unitPrice in dollars while on the ticket; the sale is
// booked in GEL at the rate shown next to the total, so history/stats/cash
// stay single-currency.
interface TicketLine extends SaleItemInput { key: string; currency: 'GEL' | 'USD' }

function PosView({ session }: { session: Session }) {
  const { products } = useProducts();
  const { catalog } = useCatalog();
  const { models } = useModels();
  const [modelFilter, setModelFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<{ sectionId: string; subId: string } | null>(null);
  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [payment, setPayment] = useState<Payment>('cash');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ saleId: number; total: number } | null>(null);
  const [err, setErr] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [inv, setInv] = useState<Record<string, number>>({});
  const [rateStr, setRateStr] = useState(() => String(getUsdRate()));

  useEffect(() => {
    getInventory(session).then(setInv).catch(() => {});
  }, [session]);

  const StockChip = ({ id }: { id: string }) => {
    const n = inv[id];
    if (n === undefined) return null;
    // negative balance = oversold, i.e. the physical count was wrong
    return <span className={`pos-stock ${n <= 0 ? 'pos-stock-zero' : ''}`}>{n === 0 ? 'ამოიწურა' : `მარაგი: ${n}`}</span>;
  };

  // model filter — like admin-products; parts with no ticked models fit all
  const posProducts = useMemo(() => {
    if (modelFilter === 'all') return products;
    return products.filter(p => Object.keys(p.fits).length === 0 || !!p.fits[modelFilter]);
  }, [products, modelFilter]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return posProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.nameGe.toLowerCase().includes(q) ||
      p.partNumber.toLowerCase().includes(q) ||
      (p.batch ?? '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, posProducts]);

  // product counts per subsection, for the catalogue tree
  const countBySub = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of posProducts) {
      const k = `${p.sectionId}|${p.subsectionId}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [posProducts]);

  const sectionCount = (sectionId: string) => {
    let n = 0;
    for (const [k, v] of countBySub) if (k.startsWith(sectionId + '|')) n += v;
    return n;
  };

  const subProducts = useMemo(() => {
    if (!activeSub) return [];
    return posProducts.filter(p => p.sectionId === activeSub.sectionId && p.subsectionId === activeSub.subId);
  }, [activeSub, posProducts]);

  const add = (p: Product) => {
    setDone(null);
    setTicket(t => {
      const existing = t.find(l => l.productId === p.id);
      if (existing) return t.map(l => l.productId === p.id ? { ...l, qty: l.qty + 1 } : l);
      return [...t, {
        key: `${p.id}_${t.length}`, productId: p.id, name: p.name, partNumber: p.partNumber,
        qty: 1, unitPrice: p.price, currency: p.currency === 'USD' ? 'USD' : 'GEL',
      }];
    });
    setQuery('');
  };

  const addCustom = () => {
    const price = parseFloat(customPrice);
    if (!customName.trim() || !isFinite(price) || price < 0) return;
    setDone(null);
    setTicket(t => [...t, { key: `custom_${Date.now()}_${t.length}`, productId: 'custom', name: customName.trim(), qty: 1, unitPrice: price, currency: 'GEL' }]);
    setCustomName(''); setCustomPrice('');
  };

  const setQty = (key: string, qty: number) =>
    setTicket(t => qty <= 0 ? t.filter(l => l.key !== key) : t.map(l => l.key === key ? { ...l, qty } : l));
  const setPrice = (key: string, price: number) =>
    setTicket(t => t.map(l => l.key === key ? { ...l, unitPrice: isFinite(price) && price >= 0 ? price : 0 } : l));

  const parsedRate = parseFloat(rateStr);
  const usdRate = isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 0;
  const hasUsd = ticket.some(l => l.currency === 'USD');
  const lineGel = (l: TicketLine) => l.currency === 'USD' ? round2(l.unitPrice * usdRate) : l.unitPrice;
  const usdTotal = ticket.reduce((s, l) => s + (l.currency === 'USD' ? l.qty * l.unitPrice : 0), 0);
  const total = ticket.reduce((s, l) => s + l.qty * lineGel(l), 0);

  const complete = async () => {
    if (ticket.length === 0 || busy) return;
    if (hasUsd && usdRate <= 0) { setErr('მიუთითეთ დოლარის კურსი'); return; }
    setBusy(true); setErr('');
    try {
      // book USD lines in GEL at today's rate; the rate is kept in the note
      const usdNote = hasUsd ? `USD: ${fmtUsd(usdTotal)} × ${usdRate} = ${GEL(round2(usdTotal * usdRate))}` : '';
      const fullNote = [note.trim(), usdNote].filter(Boolean).join(' | ');
      const res = await recordSale(session, {
        items: ticket.map(l => ({ productId: l.productId, name: l.name, partNumber: l.partNumber, qty: l.qty, unitPrice: lineGel(l) })),
        payment, customerPhone: phone.trim() || undefined, note: fullNote || undefined,
      });
      setDone(res);
      // reflect sold quantities in the visible stock immediately
      setInv(prev => {
        const next = { ...prev };
        for (const l of ticket) {
          if (l.productId !== 'custom') {
            next[l.productId] = (next[l.productId] ?? 0) - l.qty;
          }
        }
        return next;
      });
      setTicket([]); setPhone(''); setNote(''); setPayment('cash');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally {
      setBusy(false);
    }
  };

  const activeSection = activeSub ? catalog.find(s => s.id === activeSub.sectionId) : null;
  const activeSubDef = activeSection?.subsections.find(s => s.id === activeSub?.subId);

  return (
    <div className="staff-content pos-layout">
      {/* ── Column 1: model filter + catalogue tree ── */}
      <section className="pos-col-tree">
        <h2 className="staff-section-title">კატალოგი</h2>
        <div className="pos-model-filter">
          <button
            className={`pos-model-btn ${modelFilter === 'all' ? 'pos-model-btn-active' : ''}`}
            onClick={() => { setModelFilter('all'); setActiveSub(null); }}
          >
            ყველა მოდელი
          </button>
          {models.map(mdl => (
            <button
              key={mdl.id}
              className={`pos-model-btn ${modelFilter === mdl.id ? 'pos-model-btn-active' : ''}`}
              style={modelFilter === mdl.id ? { borderColor: mdl.color, color: mdl.color } : undefined}
              onClick={() => { setModelFilter(modelFilter === mdl.id ? 'all' : mdl.id); setActiveSub(null); }}
            >
              {mdl.id}
            </button>
          ))}
        </div>
        <div className="pos-tree">
          {catalog.map(sec => {
            const total = sectionCount(sec.id);
            if (total === 0) return null; // only categories that have products
            const isOpen = openSection === sec.id;
            return (
              <div key={sec.id} className="pos-tree-section">
                <button className={`pos-tree-sec-btn ${isOpen ? 'pos-tree-sec-open' : ''}`}
                  onClick={() => { setOpenSection(isOpen ? null : sec.id); }}>
                  <span className="pos-tree-caret">{isOpen ? '▾' : '▸'}</span>
                  {sec.groupNumber != null && <span className="pos-tree-num">{sec.groupNumber}</span>}
                  <span className="pos-tree-sec-name">{getCatName(sec, 'ka', 'section')}</span>
                  <span className="pos-tree-count">{total}</span>
                </button>
                {isOpen && (
                  <div className="pos-tree-subs">
                    {sec.subsections.map(sub => {
                      const n = countBySub.get(`${sec.id}|${sub.id}`) ?? 0;
                      if (n === 0) return null;
                      const isActive = activeSub?.sectionId === sec.id && activeSub?.subId === sub.id;
                      return (
                        <button key={sub.id}
                          className={`pos-tree-sub-btn ${isActive ? 'pos-tree-sub-active' : ''}`}
                          onClick={() => setActiveSub(isActive ? null : { sectionId: sec.id, subId: sub.id })}>
                          <span className="pos-tree-sub-name">{getCatName(sub, 'ka', 'sub')}</span>
                          <span className="pos-tree-count">{n}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {catalog.every(sec => sectionCount(sec.id) === 0) && (
            <p className="pos-empty">
              {modelFilter === 'all' ? 'პროდუქტები ჯერ არ არის' : 'ამ მოდელისთვის პროდუქტები არ არის'}
            </p>
          )}
        </div>
      </section>

      {/* ── Column 2: search + selected category products ── */}
      <section className="pos-col-products">
        <h2 className="staff-section-title">პროდუქტის დამატება</h2>
        <input className="staff-input pos-search" placeholder="🔍 მოძებნეთ სახელით ან პარტ-ნომრით…"
          value={query} onChange={e => setQuery(e.target.value)} />
        {results.length > 0 && (
          <div className="pos-results">
            {results.map(p => (
              <button key={p.id} className="pos-result" onClick={() => add(p)}>
                <img src={p.image} alt="" className="pos-result-img" onError={onImgError} />
                <span className="pos-result-name">{p.name}<small>{p.partNumber}{p.batch ? ` · ${p.batch}` : ''}</small></span>
                <StockChip id={p.id} />
                <span className={`pos-result-price ${p.currency === 'USD' ? 'pos-price-usd' : ''}`}>{posPrice(p)}</span>
              </button>
            ))}
          </div>
        )}

        {activeSub && (
          <>
            <div className="pos-breadcrumb">
              {activeSection?.groupNumber != null && <span className="pos-tree-num">{activeSection.groupNumber}</span>}
              <span>{activeSection ? getCatName(activeSection, 'ka', 'section') : ''}</span>
              <span className="pos-breadcrumb-sep">›</span>
              <strong>{activeSubDef ? getCatName(activeSubDef, 'ka', 'sub') : ''}</strong>
            </div>
            <div className="pos-tree-products">
              {subProducts.length === 0 && <p className="pos-empty">ამ სექციაში პროდუქტები არ არის</p>}
              {subProducts.map(p => (
                <button key={p.id} className="pos-result" onClick={() => add(p)}>
                  <img src={p.image} alt="" className="pos-result-img" onError={onImgError} />
                  <span className="pos-result-name">{p.name}<small>{p.partNumber}{p.batch ? ` · ${p.batch}` : ''}</small></span>
                  <StockChip id={p.id} />
                  <span className={`pos-result-price ${p.currency === 'USD' ? 'pos-price-usd' : ''}`}>{posPrice(p)}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {!activeSub && results.length === 0 && (
          <p className="pos-empty pos-hint">← აირჩიეთ კატეგორია კატალოგიდან ან მოძებნეთ ზემოთ</p>
        )}

        <div className="pos-custom">
          <span className="pos-custom-label">სხვა პოზიცია:</span>
          <input className="staff-input" placeholder="დასახელება" value={customName} onChange={e => setCustomName(e.target.value)} />
          <input className="staff-input pos-custom-price" placeholder="ფასი ₾" inputMode="decimal" value={customPrice} onChange={e => setCustomPrice(e.target.value)} />
          <button className="staff-btn-secondary" onClick={addCustom}>+ დამატება</button>
        </div>
      </section>

      <section className="pos-right">
        <h2 className="staff-section-title">მიმდინარე გაყიდვა</h2>
        {ticket.length === 0 && !done && <p className="pos-empty">ცარიელია — მოძებნეთ და დაამატეთ პროდუქტი</p>}
        {done && (
          <div className="pos-done">✅ გაყიდვა #{done.saleId} შენახულია — {GEL(done.total)}</div>
        )}
        {ticket.map(l => (
          <div key={l.key} className="pos-line">
            <span className="pos-line-name">{l.name}{l.partNumber && <small>{l.partNumber}</small>}</span>
            <div className="pos-line-qty">
              <button onClick={() => setQty(l.key, l.qty - 1)}>−</button>
              <span>{l.qty}</span>
              <button onClick={() => setQty(l.key, l.qty + 1)}>+</button>
            </div>
            <div className="pos-line-price-wrap">
              <input className="staff-input pos-line-price" inputMode="decimal" value={l.unitPrice}
                onChange={e => setPrice(l.key, parseFloat(e.target.value))} />
              <span className={`pos-line-cur ${l.currency === 'USD' ? 'pos-price-usd' : ''}`}>{l.currency === 'USD' ? '$' : '₾'}</span>
            </div>
            <span className="pos-line-sum">
              {l.currency === 'USD'
                ? <><span className="pos-price-usd">{fmtUsd(l.qty * l.unitPrice)}</span><small>≈ {GEL(l.qty * lineGel(l))}</small></>
                : GEL(l.qty * l.unitPrice)}
            </span>
            <button className="pos-line-x" onClick={() => setQty(l.key, 0)}>✕</button>
          </div>
        ))}

        {ticket.length > 0 && (
          <>
            <div className="pos-payment">
              {(Object.keys(PAYMENT_LABELS) as Payment[]).map(p => (
                <button key={p} className={payment === p ? 'pos-pay-btn pos-pay-active' : 'pos-pay-btn'}
                  onClick={() => setPayment(p)}>{PAYMENT_LABELS[p]}</button>
              ))}
            </div>
            <input className="staff-input" placeholder="მყიდველის ტელეფონი (არასავალდ.)" value={phone} onChange={e => setPhone(e.target.value)} />
            <input className="staff-input" placeholder="შენიშვნა (არასავალდ.)" value={note} onChange={e => setNote(e.target.value)} />
            {hasUsd && (
              <div className="pos-usd-rate">
                <span className="pos-usd-rate-label">💵 კურსი: $1 =</span>
                <input className="staff-input pos-usd-rate-input" inputMode="decimal" value={rateStr}
                  onChange={e => setRateStr(e.target.value)} />
                <span className="pos-usd-rate-label">₾</span>
                <span className="pos-usd-rate-sum">{fmtUsd(usdTotal)} ≈ {GEL(round2(usdTotal * usdRate))}</span>
              </div>
            )}
            <div className="pos-total"><span>ჯამი</span><strong>{GEL(total)}</strong></div>
            {err && <div className="staff-login-err">{err}</div>}
            <button className="staff-btn-primary pos-complete" disabled={busy} onClick={complete}>
              {busy ? 'ინახება…' : `✓ გაყიდვის დასრულება — ${GEL(total)}`}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
const PERIODS = [7, 14, 30, 90] as const;

function DashboardView({ session }: { session: Session }) {
  const [period, setPeriod] = useState<number>(14);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState('');
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    setStats(null);
    getStats(session, period).then(setStats).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));
  }, [session, period]);

  if (err) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!stats) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  // fill missing days with zeros for the selected window
  const byDay = new Map(stats.daily.map(d => [d.day, d]));
  const days: { day: string; revenue: number; sales: number }[] = [];
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push(byDay.get(key) ?? { day: key, revenue: 0, sales: 0 });
  }
  const max = Math.max(1, ...days.map(d => Number(d.revenue)));
  const payTotal = Math.max(1, stats.payments.reduce((s, p) => s + Number(p.revenue), 0));
  const labelEvery = period > 40 ? 7 : period > 20 ? 2 : 1;
  const periodRevenue = days.reduce((s, d) => s + Number(d.revenue), 0);
  const periodSales = days.reduce((s, d) => s + d.sales, 0);

  const tiles = [
    { label: 'დღეს', agg: stats.today },
    { label: '7 დღე', agg: stats.week },
    { label: '30 დღე', agg: stats.month },
    { label: 'სულ', agg: stats.all },
  ];

  return (
    <div className="staff-content">
      <div className="dash-tiles">
        {tiles.map(t => (
          <div key={t.label} className="dash-tile">
            <span className="dash-tile-label">{t.label}</span>
            <strong className="dash-tile-value">{GEL(t.agg.revenue)}</strong>
            <span className="dash-tile-sub">{t.agg.sales} გაყიდვა{t.agg.sales > 0 ? ` · საშ. ${GEL(Number(t.agg.revenue) / t.agg.sales)}` : ''}</span>
          </div>
        ))}
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h3 className="dash-panel-title">შემოსავალი — ბოლო {period} დღე ({GEL(periodRevenue)} · {periodSales} გაყიდვა)</h3>
          <div className="dash-period">
            {PERIODS.map(p => (
              <button key={p} className={period === p ? 'dash-period-btn dash-period-active' : 'dash-period-btn'}
                onClick={() => setPeriod(p)}>{p} დღე</button>
            ))}
          </div>
        </div>
        <div className="dash-chart" onMouseLeave={() => setHover(null)}>
          {days.map((d, i) => {
            const h = Math.round((Number(d.revenue) / max) * 100);
            const date = new Date(d.day + 'T00:00:00');
            return (
              <div key={d.day} className="dash-bar-col"
                onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)}>
                {hover === i && (
                  <div className="dash-tooltip">
                    <strong>{GEL(d.revenue)}</strong>
                    <span>{d.sales} გაყიდვა · {date.getDate()}.{String(date.getMonth() + 1).padStart(2, '0')}</span>
                  </div>
                )}
                <div className="dash-bar-track">
                  <div className={`dash-bar ${hover === i ? 'dash-bar-hover' : ''}`} style={{ height: `${Math.max(h, Number(d.revenue) > 0 ? 3 : 0)}%` }} />
                </div>
                <span className="dash-bar-label">{i % labelEvery === 0 ? date.getDate() : ''}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dash-panel">
        <h3 className="dash-panel-title">თანამშრომლების მიხედვით — ბოლო {period} დღე</h3>
        {stats.byEmployee.length === 0 && <p className="pos-empty">ჯერ არ არის გაყიდვები</p>}
        {stats.byEmployee.length > 0 && (
          <div className="dash-emp-table">
            <div className="dash-emp-row dash-emp-head">
              <span>თანამშრომელი</span><span>გაყიდვები</span><span>საშ. ჩეკი</span><span>შემოსავალი</span>
            </div>
            {stats.byEmployee.map(e => (
              <div key={e.employee} className="dash-emp-row">
                <span className="dash-emp-name">{e.employee}</span>
                <span>{e.sales}</span>
                <span>{GEL(e.avgTicket)}</span>
                <strong>{GEL(e.revenue)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dash-two-col">
        <div className="dash-panel">
          <h3 className="dash-panel-title">ტოპ პროდუქტები — 30 დღე</h3>
          {stats.topProducts.length === 0 && <p className="pos-empty">ჯერ არ არის გაყიდვები</p>}
          {stats.topProducts.map(p => (
            <div key={`${p.name}|${p.partNumber}`} className="dash-top-row">
              <span className="dash-top-name">{p.name}<small>{p.partNumber}</small></span>
              <span className="dash-top-qty">{p.qty} ც.</span>
              <span className="dash-top-rev">{GEL(p.revenue)}</span>
            </div>
          ))}
        </div>

        <div className="dash-panel">
          <h3 className="dash-panel-title">გადახდის ტიპები — 30 დღე</h3>
          {stats.payments.length === 0 && <p className="pos-empty">ჯერ არ არის გაყიდვები</p>}
          {stats.payments.map(p => (
            <div key={p.payment} className="dash-pay-row">
              <span className="dash-pay-label">{PAYMENT_LABELS[p.payment]}</span>
              <div className="dash-pay-track">
                <div className="dash-pay-fill" style={{ width: `${Math.round((Number(p.revenue) / payTotal) * 100)}%` }} />
              </div>
              <span className="dash-pay-val">{GEL(p.revenue)} · {p.sales}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Inventory ──────────────────────────────────────────────────────────────
// purchase/disassembly are legacy types kept only so old history rows render;
// products and stock quantities are now added from the admin panel
const STOCK_TYPE_LABELS: Record<string, string> = {
  purchase: 'შესყიდვა', disassembly: 'ავტოს დაშლა', sale: 'გაყიდვა',
  return: 'დაბრუნება', adjustment: 'კორექტირება',
};
const EDITABLE_MOVE_TYPES: StockMoveType[] = ['sale', 'return', 'adjustment'];

function InventoryView({ session }: { session: Session }) {
  const { products } = useProducts();
  const [inv, setInv] = useState<Record<string, number> | null>(null);
  const [err, setErr] = useState('');
  const [view, setView] = useState<'stock' | 'report'>('stock');
  const [filter, setFilter] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  // report
  const [repDays, setRepDays] = useState(30);
  const [moves, setMoves] = useState<StockMovement[] | null>(null);
  // movement edit/delete (admin)
  const [mvEditing, setMvEditing] = useState<number | null>(null);
  const [mvQty, setMvQty] = useState('');
  const [mvType, setMvType] = useState<StockMoveType>('adjustment');
  const [mvNote, setMvNote] = useState('');
  const [mvDeleting, setMvDeleting] = useState<number | null>(null);
  const [mvBusy, setMvBusy] = useState(false);
  const [mvMsg, setMvMsg] = useState('');
  const [mvClearing, setMvClearing] = useState(false);
  // reset all stock balances (admin)
  const [invResetting, setInvResetting] = useState(false);
  const [invMsg, setInvMsg] = useState('');

  const reloadInv = () => getInventory(session).then(setInv).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));
  const reloadMoves = () =>
    getStockMovements(session, repDays).then(setMoves).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));

  const flashMv = (m: string) => { setMvMsg(m); setErr(''); setTimeout(() => setMvMsg(''), 4000); };

  const startMvEdit = (m: StockMovement) => {
    setMvEditing(m.id); setMvDeleting(null);
    setMvQty(String(m.qty)); setMvType(m.type); setMvNote(m.note);
  };

  const submitMvEdit = async (m: StockMovement) => {
    if (mvBusy) return;
    const qty = parseInt(mvQty, 10);
    if (!Number.isFinite(qty) || qty === 0) { setErr('რაოდენობა უნდა იყოს არანულოვანი რიცხვი'); return; }
    setMvBusy(true); setErr('');
    try {
      await updateStockMovement(session, { id: m.id, qty, type: mvType, note: mvNote.trim() });
      setMvEditing(null);
      flashMv('✅ შენახულია — მარაგი შესწორდა');
      await Promise.all([reloadMoves(), reloadInv()]);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally { setMvBusy(false); }
  };

  const submitMvDelete = async (m: StockMovement) => {
    if (mvBusy) return;
    setMvBusy(true); setErr('');
    try {
      await deleteStockMovement(session, m.id);
      setMvDeleting(null);
      flashMv('🗑 ჩანაწერი წაიშალა — მარაგი შესწორდა');
      await Promise.all([reloadMoves(), reloadInv()]);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
      setMvDeleting(null);
    } finally { setMvBusy(false); }
  };

  const submitInvReset = async () => {
    if (mvBusy) return;
    setMvBusy(true); setErr('');
    try {
      await resetInventory(session);
      setInvResetting(false);
      setInvMsg('🧹 ყველა ნაშთი განულდა');
      setTimeout(() => setInvMsg(''), 4000);
      await reloadInv();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
      setInvResetting(false);
    } finally { setMvBusy(false); }
  };

  const submitMvClear = async () => {
    if (mvBusy) return;
    setMvBusy(true); setErr('');
    try {
      await clearStockMovements(session);
      setMvClearing(false);
      flashMv('🧹 ისტორია გასუფთავდა — მარაგის ნაშთები არ შეცვლილა');
      await reloadMoves();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
      setMvClearing(false);
    } finally { setMvBusy(false); }
  };

  useEffect(() => {
    getInventory(session).then(setInv).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));
  }, [session]);

  useEffect(() => {
    if (view !== 'report') return;
    setMoves(null);
    getStockMovements(session, repDays).then(setMoves).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));
  }, [session, view, repDays]);

  if (err && !inv) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!inv) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  const q = filter.trim().toLowerCase();
  const list = products.filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.nameGe.toLowerCase().includes(q) ||
    p.partNumber.toLowerCase().includes(q) || (p.batch ?? '').toLowerCase().includes(q)
  );
  const totalUnits = products.reduce((s, p) => s + (inv[p.id] ?? 0), 0);
  const outOfStock = products.filter(p => (inv[p.id] ?? 0) <= 0).length;

  // quick edit in the stock list — logged as adjustment so the report stays true
  const adjustTo = async (p: { id: string; name: string; partNumber: string }, target: number) => {
    const current = inv[p.id] ?? 0;
    const clean = Math.round(target) || 0;
    const delta = clean - current;
    if (delta === 0) return;
    setInv(prev => ({ ...(prev ?? {}), [p.id]: clean }));
    try {
      await addStock(session, {
        type: 'adjustment',
        items: [{ productId: p.id, name: p.name, partNumber: p.partNumber, qty: delta }],
        note: 'ხელით კორექტირება',
      });
      setSavedId(p.id);
      setTimeout(() => setSavedId(s => (s === p.id ? null : s)), 1500);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
      reloadInv();
    }
  };

  return (
    <div className="staff-content">
      <div className="dash-tiles inv-tiles">
        <div className="dash-tile"><span className="dash-tile-label">პოზიციები</span><strong className="dash-tile-value">{products.length}</strong></div>
        <div className="dash-tile"><span className="dash-tile-label">სულ ერთეული</span><strong className="dash-tile-value">{totalUnits}</strong></div>
        <div className="dash-tile"><span className="dash-tile-label">ამოწურული</span><strong className="dash-tile-value">{outOfStock}</strong></div>
      </div>

      <div className="dash-period inv-subtabs">
        <button className={view === 'stock' ? 'dash-period-btn dash-period-active' : 'dash-period-btn'} onClick={() => setView('stock')}>ნაშთები</button>
        <button className={view === 'report' ? 'dash-period-btn dash-period-active' : 'dash-period-btn'} onClick={() => setView('report')}>მოძრაობის რეპორტი</button>
      </div>

      <p className="cash-meta inv-admin-note">
        📦 პროდუქტის დამატება და მარაგის შევსება ხდება <Link to="/admin">ადმინ პანელიდან</Link> — რაოდენობის ველით.
        აქ შესაძლებელია მხოლოდ სწრაფი კორექტირება.
      </p>

      {err && <div className="staff-login-err emp-err">{err}</div>}

      {view === 'stock' && (
        <>
          <div className="inv-stock-tools">
            <input className="staff-input pos-search" placeholder="🔍 ფილტრი — სახელი ან პარტ-ნომერი…"
              value={filter} onChange={e => setFilter(e.target.value)} />
            {totalUnits > 0 && !invResetting && (
              <button className="dash-period-btn row-clear-btn" onClick={() => setInvResetting(true)}>🧹 განულება</button>
            )}
          </div>
          {invResetting && (
            <div className="hist-del-confirm row-del-confirm">
              განულდეს ყველა პოზიციის ნაშთი? ეს მოქმედება ვერ გაუქმდება.
              <button className="staff-btn-primary hist-del-yes" disabled={mvBusy} onClick={submitInvReset}>დიახ, განულება</button>
              <button className="staff-btn-secondary" onClick={() => setInvResetting(false)}>არა</button>
            </div>
          )}
          {invMsg && <div className="pos-done">{invMsg}</div>}
          <div className="inv-table">
            {list.map(p => {
              const qty = inv[p.id] ?? 0;
              return (
                <div key={p.id} className={`inv-row ${qty <= 0 ? 'inv-row-zero' : ''}`}>
                  <img src={p.image} alt="" className="pos-result-img" onError={onImgError} />
                  <span className="pos-result-name">{p.name}<small>{p.partNumber}{p.batch ? ` · ${p.batch}` : ''}</small></span>
                  <span className={`inv-price ${p.currency === 'USD' ? 'pos-price-usd' : ''}`}>{posPrice(p)}</span>
                  <div className="inv-qty-ctrl">
                    <button onClick={() => adjustTo(p, qty - 1)}>−</button>
                    <input className="staff-input inv-qty-input" inputMode="numeric" defaultValue={qty} key={`${p.id}_${qty}`}
                      onBlur={e => adjustTo(p, parseInt(e.target.value) || 0)} />
                    <button onClick={() => adjustTo(p, qty + 1)}>+</button>
                  </div>
                  <span className={`inv-saved ${savedId === p.id ? 'inv-saved-show' : ''}`}>✓</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'report' && (
        <div className="dash-panel">
          <div className="dash-panel-head">
            <h3 className="dash-panel-title">მარაგის მოძრაობა</h3>
            <div className="dash-period">
              {[7, 30, 90].map(p => (
                <button key={p} className={repDays === p ? 'dash-period-btn dash-period-active' : 'dash-period-btn'}
                  onClick={() => setRepDays(p)}>{p} დღე</button>
              ))}
              {moves && moves.length > 0 && !mvClearing && (
                <button className="dash-period-btn row-clear-btn" onClick={() => setMvClearing(true)}>🧹 გასუფთავება</button>
              )}
            </div>
          </div>
          {mvClearing && (
            <div className="hist-del-confirm row-del-confirm">
              წაიშალოს მოძრაობის მთელი ისტორია? მარაგის ნაშთები არ შეიცვლება.
              <button className="staff-btn-primary hist-del-yes" disabled={mvBusy} onClick={submitMvClear}>დიახ, გასუფთავება</button>
              <button className="staff-btn-secondary" onClick={() => setMvClearing(false)}>არა</button>
            </div>
          )}
          {mvMsg && <div className="pos-done">{mvMsg}</div>}
          {!moves && <p className="pos-empty">იტვირთება…</p>}
          {moves && moves.length === 0 && <p className="pos-empty">მოძრაობა არ არის ამ პერიოდში</p>}
          {moves && moves.map(m => {
            const dt = new Date(m.createdAt.includes('T') ? m.createdAt : m.createdAt.replace(' ', 'T'));
            const inbound = m.qty > 0;
            return (
              <div key={m.id} className="row-wrap">
                <div className="stock-row">
                  <span className={`stock-qty ${inbound ? 'cash-in' : 'cash-out'}`}>{inbound ? `+${m.qty}` : m.qty}</span>
                  <span className={`stock-type stock-type-${m.type}`}>{STOCK_TYPE_LABELS[m.type] ?? m.type}</span>
                  <span className="pos-result-name">{m.name}<small>{m.partNumber}</small></span>
                  <span className="cash-meta">{m.note || '—'}</span>
                  <span className="cash-meta">{m.employee}</span>
                  <span className="cash-meta">{dt.getDate()}.{String(dt.getMonth() + 1).padStart(2, '0')} {String(dt.getHours()).padStart(2, '0')}:{String(dt.getMinutes()).padStart(2, '0')}</span>
                  <span className="row-actions">
                    <button className="row-icon-btn" title="რედაქტირება" onClick={() => mvEditing === m.id ? setMvEditing(null) : startMvEdit(m)}>✎</button>
                    <button className="row-icon-btn row-icon-del" title="წაშლა" onClick={() => { setMvDeleting(mvDeleting === m.id ? null : m.id); setMvEditing(null); }}>🗑</button>
                  </span>
                </div>
                {mvDeleting === m.id && (
                  <div className="hist-del-confirm row-del-confirm">
                    წაიშალოს ჩანაწერი? მარაგი შესწორდება ({m.qty > 0 ? `−${m.qty}` : `+${-m.qty}`} ც.)
                    <button className="staff-btn-primary hist-del-yes" disabled={mvBusy} onClick={() => submitMvDelete(m)}>დიახ, წაშლა</button>
                    <button className="staff-btn-secondary" onClick={() => setMvDeleting(null)}>არა</button>
                  </div>
                )}
                {mvEditing === m.id && (
                  <div className="hist-return-form">
                    <p className="hist-return-title">რედაქტირება — {m.name}</p>
                    <div className="row-edit-grid">
                      <select className="staff-input" value={mvType} onChange={e => setMvType(e.target.value as StockMoveType)}>
                        {(EDITABLE_MOVE_TYPES.includes(m.type) ? EDITABLE_MOVE_TYPES : [m.type, ...EDITABLE_MOVE_TYPES]).map(t => (
                          <option key={t} value={t}>{STOCK_TYPE_LABELS[t] ?? t}</option>
                        ))}
                      </select>
                      <input className="staff-input" inputMode="numeric" placeholder="რაოდენობა (+/−)" value={mvQty} onChange={e => setMvQty(e.target.value)} />
                      <input className="staff-input" placeholder="შენიშვნა" value={mvNote} onChange={e => setMvNote(e.target.value)} />
                    </div>
                    <p className="cash-meta">რაოდენობის შეცვლა ავტომატურად შეასწორებს მარაგს</p>
                    <div className="hist-return-actions">
                      <button className="staff-btn-primary" disabled={mvBusy} onClick={() => submitMvEdit(m)}>{mvBusy ? 'ინახება…' : 'შენახვა'}</button>
                      <button className="staff-btn-secondary" onClick={() => setMvEditing(null)}>გაუქმება</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ── Cash movements ─────────────────────────────────────────────────────────
function CashView({ session }: { session: Session }) {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<CashReport | null>(null);
  const [err, setErr] = useState('');
  const [mType, setMType] = useState<'in' | 'out'>('out');
  const [mAmount, setMAmount] = useState('');
  const [mReason, setMReason] = useState('');
  const [busy, setBusy] = useState(false);
  // operation edit/delete (admin)
  const [editing, setEditing] = useState<number | null>(null);
  const [eType, setEType] = useState<'in' | 'out'>('out');
  const [eAmount, setEAmount] = useState('');
  const [eReason, setEReason] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [clearing, setClearing] = useState(false);
  const [msg, setMsg] = useState('');

  const reload = () =>
    getCash(session, days).then(setReport).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));

  const flash = (m: string) => { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 4000); };

  const startEdit = (m: { id: number; type: 'in' | 'out'; amount: number; reason: string }) => {
    setEditing(m.id); setDeleting(null);
    setEType(m.type); setEAmount(String(m.amount)); setEReason(m.reason);
  };

  const submitEdit = async (id: number) => {
    if (busy) return;
    const amount = parseFloat(eAmount);
    if (!(amount > 0)) { setErr('თანხა უნდა იყოს 0-ზე მეტი'); return; }
    setBusy(true); setErr('');
    try {
      await updateCashMovement(session, { id, type: eType, amount, reason: eReason.trim() });
      setEditing(null);
      flash('✅ შენახულია');
      await reload();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally { setBusy(false); }
  };

  const submitDelete = async (id: number) => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      await deleteCashMovement(session, id);
      setDeleting(null);
      flash('🗑 ოპერაცია წაიშალა');
      await reload();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
      setDeleting(null);
    } finally { setBusy(false); }
  };

  const submitClear = async () => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      await clearCashMovements(session);
      setClearing(false);
      flash('🧹 ოპერაციების ისტორია გასუფთავდა');
      await reload();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
      setClearing(false);
    } finally { setBusy(false); }
  };

  useEffect(() => { setReport(null); reload(); }, [session, days]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr('');
    try {
      await addCashMovement(session, { type: mType, amount: parseFloat(mAmount), reason: mReason.trim() });
      setMAmount(''); setMReason('');
      await reload();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally { setBusy(false); }
  };

  if (err && !report) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!report) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  const s = report.summary;

  return (
    <div className="staff-content">
      <div className="dash-panel-head cash-head">
        <h2 className="staff-section-title">სალარო — ფულადი მოძრაობა</h2>
        <div className="dash-period">
          {[7, 30, 90].map(p => (
            <button key={p} className={days === p ? 'dash-period-btn dash-period-active' : 'dash-period-btn'}
              onClick={() => setDays(p)}>{p} დღე</button>
          ))}
        </div>
      </div>

      <div className="dash-tiles">
        <div className="dash-tile"><span className="dash-tile-label">ნაღდი გაყიდვები</span><strong className="dash-tile-value">{GEL(s.cashSales)}</strong><span className="dash-tile-sub">{s.cashSalesCount} გაყიდვა</span></div>
        <div className="dash-tile"><span className="dash-tile-label">შემოტანილი</span><strong className="dash-tile-value cash-in">+{GEL(s.manualIn)}</strong></div>
        <div className="dash-tile"><span className="dash-tile-label">გატანილი / ხარჯი</span><strong className="dash-tile-value cash-out">−{GEL(s.manualOut)}</strong></div>
        <div className="dash-tile"><span className="dash-tile-label">სალაროში (ნეტო)</span><strong className="dash-tile-value">{GEL(s.net)}</strong></div>
      </div>

      <div className="dash-panel">
        <h3 className="dash-panel-title">ოპერაციის დამატება</h3>
        <form className="cash-form" onSubmit={submit}>
          <div className="pos-payment cash-type">
            <button type="button" className={mType === 'in' ? 'pos-pay-btn pos-pay-active' : 'pos-pay-btn'} onClick={() => setMType('in')}>+ შემოტანა</button>
            <button type="button" className={mType === 'out' ? 'pos-pay-btn pos-pay-active' : 'pos-pay-btn'} onClick={() => setMType('out')}>− გატანა / ხარჯი</button>
          </div>
          <input className="staff-input" placeholder="თანხა ₾" inputMode="decimal" value={mAmount} onChange={e => setMAmount(e.target.value)} />
          <input className="staff-input" placeholder="მიზეზი (მაგ: ინკასაცია, კურიერი, ხურდა)" value={mReason} onChange={e => setMReason(e.target.value)} />
          {err && <div className="staff-login-err">{err}</div>}
          <button className="staff-btn-primary cash-submit" disabled={busy}>{busy ? 'ინახება…' : 'დამატება'}</button>
        </form>
      </div>

      <div className="dash-panel">
        <div className="dash-panel-head">
          <h3 className="dash-panel-title">ოპერაციები</h3>
          {report.movements.length > 0 && !clearing && (
            <button className="dash-period-btn row-clear-btn" onClick={() => setClearing(true)}>🧹 გასუფთავება</button>
          )}
        </div>
        {clearing && (
          <div className="hist-del-confirm row-del-confirm">
            წაიშალოს ოპერაციების მთელი ისტორია?
            <button className="staff-btn-primary hist-del-yes" disabled={busy} onClick={submitClear}>დიახ, გასუფთავება</button>
            <button className="staff-btn-secondary" onClick={() => setClearing(false)}>არა</button>
          </div>
        )}
        {msg && <div className="pos-done">{msg}</div>}
        {report.movements.length === 0 && <p className="pos-empty">ოპერაციები არ არის ამ პერიოდში</p>}
        {report.movements.map(m => {
          const dt = new Date(m.createdAt.includes('T') ? m.createdAt : m.createdAt.replace(' ', 'T'));
          return (
            <div key={m.id} className="row-wrap">
              <div className="cash-row">
                <span className={`cash-badge ${m.type === 'in' ? 'cash-in' : 'cash-out'}`}>{m.type === 'in' ? '+' : '−'}{GEL(m.amount)}</span>
                <span className="cash-reason">{m.reason || '—'}</span>
                <span className="cash-meta">{m.employee}</span>
                <span className="cash-meta">{dt.getDate()}.{String(dt.getMonth() + 1).padStart(2, '0')} {String(dt.getHours()).padStart(2, '0')}:{String(dt.getMinutes()).padStart(2, '0')}</span>
                <span className="row-actions">
                  <button className="row-icon-btn" title="რედაქტირება" onClick={() => editing === m.id ? setEditing(null) : startEdit(m)}>✎</button>
                  <button className="row-icon-btn row-icon-del" title="წაშლა" onClick={() => { setDeleting(deleting === m.id ? null : m.id); setEditing(null); }}>🗑</button>
                </span>
              </div>
              {deleting === m.id && (
                <div className="hist-del-confirm row-del-confirm">
                  წაიშალოს ოპერაცია ({m.type === 'in' ? '+' : '−'}{GEL(m.amount)})?
                  <button className="staff-btn-primary hist-del-yes" disabled={busy} onClick={() => submitDelete(m.id)}>დიახ, წაშლა</button>
                  <button className="staff-btn-secondary" onClick={() => setDeleting(null)}>არა</button>
                </div>
              )}
              {editing === m.id && (
                <div className="hist-return-form">
                  <p className="hist-return-title">რედაქტირება #{m.id}</p>
                  <div className="pos-payment cash-type">
                    <button type="button" className={eType === 'in' ? 'pos-pay-btn pos-pay-active' : 'pos-pay-btn'} onClick={() => setEType('in')}>+ შემოტანა</button>
                    <button type="button" className={eType === 'out' ? 'pos-pay-btn pos-pay-active' : 'pos-pay-btn'} onClick={() => setEType('out')}>− გატანა / ხარჯი</button>
                  </div>
                  <div className="row-edit-grid">
                    <input className="staff-input" placeholder="თანხა ₾" inputMode="decimal" value={eAmount} onChange={e => setEAmount(e.target.value)} />
                    <input className="staff-input" placeholder="მიზეზი" value={eReason} onChange={e => setEReason(e.target.value)} />
                  </div>
                  <div className="hist-return-actions">
                    <button className="staff-btn-primary" disabled={busy} onClick={() => submitEdit(m.id)}>{busy ? 'ინახება…' : 'შენახვა'}</button>
                    <button className="staff-btn-secondary" onClick={() => setEditing(null)}>გაუქმება</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Sales history ──────────────────────────────────────────────────────────
const saleItemKey = (it: { productId?: string; name: string; unitPrice: number }) =>
  `${it.productId ?? ''}|${it.name}|${Number(it.unitPrice).toFixed(2)}`;

function SalesHistoryView({ session }: { session: Session }) {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  const [returning, setReturning] = useState<number | null>(null);
  const [retQty, setRetQty] = useState<Record<string, number>>({});
  const [retReason, setRetReason] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [editPayment, setEditPayment] = useState<Payment>('cash');
  const [editPhone, setEditPhone] = useState('');
  const [editNote, setEditNote] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isAdmin = session.employee.role === 'admin';

  const reload = () =>
    getSales(session, 100).then(setSales).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));

  useEffect(() => { reload(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  if (err && !sales) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!sales) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  const flash = (m: string) => { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 4000); };

  const startReturn = (s: Sale) => {
    setReturning(s.id); setEditing(null); setRetReason('');
    const remaining = returnableItems(s, sales);
    const q: Record<string, number> = {};
    s.items.forEach((it, i) => { q[`${i}`] = Math.max(0, remaining.get(saleItemKey(it)) ?? 0); });
    setRetQty(q);
  };

  const submitReturn = async (s: Sale) => {
    if (busy) return;
    const items = s.items
      .map((it, i) => ({ ...it, qty: retQty[`${i}`] ?? 0 }))
      .filter(it => it.qty > 0)
      .map(it => ({ productId: it.productId, name: it.name, partNumber: it.partNumber, qty: Number(it.qty), unitPrice: Number(it.unitPrice) }));
    if (items.length === 0) { setErr('აირჩიეთ დასაბრუნებელი რაოდენობა'); return; }
    setBusy(true); setErr('');
    try {
      await recordReturn(session, {
        items,
        payment: s.payment,
        refSaleId: s.id,
        note: `დაბრუნება #${s.id}${retReason.trim() ? ' — ' + retReason.trim() : ''}`,
      });
      setReturning(null); setOpen(null);
      flash('✅ დაბრუნება გაფორმდა — თანხა გამოაკლდა, ნაწილები დაბრუნდა მარაგში');
      await reload();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally { setBusy(false); }
  };

  const startEdit = (s: Sale) => {
    setEditing(s.id); setReturning(null);
    setEditPayment(s.payment);
    setEditPhone(s.customerPhone ?? '');
    setEditNote(s.note ?? '');
  };

  const submitEdit = async (s: Sale) => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      await updateSale(session, { id: s.id, payment: editPayment, customerPhone: editPhone.trim(), note: editNote.trim() });
      setEditing(null);
      flash('✅ შენახულია');
      await reload();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally { setBusy(false); }
  };

  const submitDelete = async (s: Sale) => {
    if (busy) return;
    setBusy(true); setErr('');
    try {
      await deleteSale(session, s.id);
      setDeleting(null); setOpen(null);
      flash('🗑 ჩანაწერი წაიშალა — მარაგი აღდგა');
      await reload();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
      setDeleting(null);
    } finally { setBusy(false); }
  };

  return (
    <div className="staff-content">
      <h2 className="staff-section-title">ბოლო გაყიდვები</h2>
      {msg && <div className="pos-done">{msg}</div>}
      {err && <div className="staff-login-err emp-err">{err}</div>}
      {sales.length === 0 && <p className="pos-empty">ჯერ არ არის გაყიდვები</p>}
      {sales.map(s => {
        const dt = new Date(s.createdAt.includes('T') ? s.createdAt : s.createdAt.replace(' ', 'T'));
        const isReturn = Number(s.total) < 0;
        const remaining = !isReturn ? returnableItems(s, sales) : null;
        const anyReturnable = remaining ? [...remaining.values()].some(v => v > 0) : false;
        return (
          <div key={s.id} className="hist-row-wrap">
            <button className="hist-row" onClick={() => { setOpen(open === s.id ? null : s.id); setReturning(null); setEditing(null); }}>
              <span className="hist-id">#{s.id}</span>
              <span className="hist-date">{dt.getDate()}.{String(dt.getMonth() + 1).padStart(2, '0')} {String(dt.getHours()).padStart(2, '0')}:{String(dt.getMinutes()).padStart(2, '0')}</span>
              <span className="hist-emp">{s.employee}{isReturn && <span className="hist-return-chip">↩ დაბრუნება{s.refSaleId ? ` #${s.refSaleId}` : ''}</span>}</span>
              <span className="hist-pay">{PAYMENT_LABELS[s.payment]}</span>
              <span className={`hist-total ${isReturn ? 'hist-total-neg' : ''}`}>{GEL(s.total)}</span>
            </button>
            {open === s.id && (
              <div className="hist-detail">
                {s.items.map((it, i) => (
                  <div key={i} className="hist-item">
                    <span>{it.name}{it.partNumber ? ` (${it.partNumber})` : ''}</span>
                    <span>{Number(it.qty)} × {GEL(it.unitPrice)}</span>
                  </div>
                ))}
                {s.customerPhone && <div className="hist-meta">📞 {s.customerPhone}</div>}
                {s.note && <div className="hist-meta">📝 {s.note}</div>}

                {editing !== s.id && returning !== s.id && (
                  <div className="hist-actions">
                    {!isReturn && anyReturnable && (
                      <button className="staff-btn-secondary" onClick={() => startReturn(s)}>↩ დაბრუნება</button>
                    )}
                    {!isReturn && !anyReturnable && (
                      <span className="hist-meta">✔ სრულად დაბრუნებულია</span>
                    )}
                    {isAdmin && <button className="staff-btn-secondary" onClick={() => startEdit(s)}>✎ რედაქტირება</button>}
                    {isAdmin && deleting !== s.id && (
                      <button className="staff-btn-secondary hist-del-btn" onClick={() => setDeleting(s.id)}>🗑 წაშლა</button>
                    )}
                    {isAdmin && deleting === s.id && (
                      <span className="hist-del-confirm">
                        დარწმუნებული ხართ?
                        <button className="staff-btn-primary hist-del-yes" disabled={busy} onClick={() => submitDelete(s)}>დიახ, წაშლა</button>
                        <button className="staff-btn-secondary" onClick={() => setDeleting(null)}>არა</button>
                      </span>
                    )}
                  </div>
                )}

                {editing === s.id && (
                  <div className="hist-return-form">
                    <p className="hist-return-title">რედაქტირება #{s.id}</p>
                    <div className="pos-payment cash-type">
                      {(Object.keys(PAYMENT_LABELS) as Payment[]).map(p => (
                        <button key={p} type="button" className={editPayment === p ? 'pos-pay-btn pos-pay-active' : 'pos-pay-btn'}
                          onClick={() => setEditPayment(p)}>{PAYMENT_LABELS[p]}</button>
                      ))}
                    </div>
                    <input className="staff-input" placeholder="მყიდველის ტელეფონი" value={editPhone} onChange={e => setEditPhone(e.target.value)} />
                    <input className="staff-input" placeholder="შენიშვნა" value={editNote} onChange={e => setEditNote(e.target.value)} />
                    <div className="hist-return-actions">
                      <button className="staff-btn-primary" disabled={busy} onClick={() => submitEdit(s)}>{busy ? 'ინახება…' : 'შენახვა'}</button>
                      <button className="staff-btn-secondary" onClick={() => setEditing(null)}>გაუქმება</button>
                    </div>
                  </div>
                )}

                {returning === s.id && remaining && (
                  <div className="hist-return-form">
                    <p className="hist-return-title">რა ბრუნდება?</p>
                    {s.items.map((it, i) => {
                      const max = Math.max(0, remaining.get(saleItemKey(it)) ?? 0);
                      return (
                        <div key={i} className="hist-return-line">
                          <span className="pos-result-name">{it.name}<small>{it.partNumber}</small></span>
                          <div className="pos-line-qty">
                            <button onClick={() => setRetQty(q => ({ ...q, [`${i}`]: Math.max(0, (q[`${i}`] ?? 0) - 1) }))}>−</button>
                            <span>{retQty[`${i}`] ?? 0}</span>
                            <button onClick={() => setRetQty(q => ({ ...q, [`${i}`]: Math.min(max, (q[`${i}`] ?? 0) + 1) }))}>+</button>
                          </div>
                          <span className="cash-meta">{max === 0 ? 'დაბრუნებულია' : `დარჩა ${max}`}</span>
                        </div>
                      );
                    })}
                    <input className="staff-input" placeholder="მიზეზი (არასავალდ.)" value={retReason} onChange={e => setRetReason(e.target.value)} />
                    <div className="hist-return-actions">
                      <button className="staff-btn-primary" disabled={busy} onClick={() => submitReturn(s)}>
                        {busy ? 'ინახება…' : 'დაბრუნების დადასტურება'}
                      </button>
                      <button className="staff-btn-secondary" onClick={() => setReturning(null)}>გაუქმება</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
