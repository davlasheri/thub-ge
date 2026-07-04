import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { useCatalog } from '../context/CatalogContext';
import { getCatName } from '../utils/catalog';
import { Product } from '../types';
import {
  Session, Sale, Stats, SaleItemInput, Payment, EmployeeRecord, CashReport,
  login, loadSession, saveSession, recordSale, getSales, getStats,
  listEmployees, createEmployee, updateEmployee,
  getInventory, setInventoryQty, seedInventory, getCash, addCashMovement,
} from '../utils/staffApi';
import './Staff.css';

const PAYMENT_LABELS: Record<Payment, string> = {
  cash: 'ნაღდი', card: 'ბარათი', transfer: 'გადარიცხვა',
};

// MySQL DECIMAL values can arrive as strings — always coerce before toFixed
const GEL = (n: number | string) => `${(Number(n) || 0).toFixed(2)} ₾`;

export default function Staff() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [tab, setTab] = useState<'pos' | 'dashboard' | 'sales' | 'inventory' | 'cash' | 'employees'>('pos');

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
          {isAdmin && <button className={tab === 'employees' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('employees')}>👥 გუნდი</button>}
          {isAdmin && <Link to="/admin" className="staff-tab staff-tab-link">⚙️ საიტის მართვა</Link>}
        </nav>
        <div className="staff-header-right">
          {session.local && <span className="staff-local-badge" title="მონაცემთა ბაზა არ არის მიერთებული — გაყიდვები ინახება მხოლოდ ამ ბრაუზერში">ლოკალური რეჟიმი</span>}
          <span className="staff-user">{session.employee.displayName}</span>
          <button className="staff-logout" onClick={logout}>გასვლა</button>
        </div>
      </header>

      {tab === 'pos' && <PosView session={session} />}
      {tab === 'dashboard' && isAdmin && <DashboardView session={session} />}
      {tab === 'sales' && <SalesHistoryView session={session} />}
      {tab === 'inventory' && isAdmin && <InventoryView session={session} />}
      {tab === 'cash' && isAdmin && <CashView session={session} />}
      {tab === 'employees' && isAdmin && <EmployeesView session={session} />}
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
interface TicketLine extends SaleItemInput { key: string }

function PosView({ session }: { session: Session }) {
  const { products } = useProducts();
  const { catalog } = useCatalog();
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

  useEffect(() => {
    getInventory(session).then(setInv).catch(() => {});
  }, [session]);

  const StockChip = ({ id }: { id: string }) => {
    const n = inv[id];
    if (n === undefined) return null;
    return <span className={`pos-stock ${n === 0 ? 'pos-stock-zero' : ''}`}>{n === 0 ? 'ამოიწურა' : `მარაგი: ${n}`}</span>;
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.nameGe.toLowerCase().includes(q) ||
      p.partNumber.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, products]);

  // product counts per subsection, for the catalogue tree
  const countBySub = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of products) {
      const k = `${p.sectionId}|${p.subsectionId}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [products]);

  const sectionCount = (sectionId: string) => {
    let n = 0;
    for (const [k, v] of countBySub) if (k.startsWith(sectionId + '|')) n += v;
    return n;
  };

  const subProducts = useMemo(() => {
    if (!activeSub) return [];
    return products.filter(p => p.sectionId === activeSub.sectionId && p.subsectionId === activeSub.subId);
  }, [activeSub, products]);

  const add = (p: Product) => {
    setDone(null);
    setTicket(t => {
      const existing = t.find(l => l.productId === p.id);
      if (existing) return t.map(l => l.productId === p.id ? { ...l, qty: l.qty + 1 } : l);
      return [...t, { key: `${p.id}_${t.length}`, productId: p.id, name: p.name, partNumber: p.partNumber, qty: 1, unitPrice: p.price }];
    });
    setQuery('');
  };

  const addCustom = () => {
    const price = parseFloat(customPrice);
    if (!customName.trim() || !isFinite(price) || price < 0) return;
    setDone(null);
    setTicket(t => [...t, { key: `custom_${Date.now()}_${t.length}`, productId: 'custom', name: customName.trim(), qty: 1, unitPrice: price }]);
    setCustomName(''); setCustomPrice('');
  };

  const setQty = (key: string, qty: number) =>
    setTicket(t => qty <= 0 ? t.filter(l => l.key !== key) : t.map(l => l.key === key ? { ...l, qty } : l));
  const setPrice = (key: string, price: number) =>
    setTicket(t => t.map(l => l.key === key ? { ...l, unitPrice: isFinite(price) && price >= 0 ? price : 0 } : l));

  const total = ticket.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  const complete = async () => {
    if (ticket.length === 0 || busy) return;
    setBusy(true); setErr('');
    try {
      const res = await recordSale(session, {
        items: ticket.map(({ key: _key, ...it }) => it),
        payment, customerPhone: phone.trim() || undefined, note: note.trim() || undefined,
      });
      setDone(res);
      // reflect sold quantities in the visible stock immediately
      setInv(prev => {
        const next = { ...prev };
        for (const l of ticket) {
          if (l.productId !== 'custom' && next[l.productId] !== undefined) {
            next[l.productId] = Math.max(0, next[l.productId] - l.qty);
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
      {/* ── Column 1: catalogue tree ── */}
      <section className="pos-col-tree">
        <h2 className="staff-section-title">კატალოგი</h2>
        <div className="pos-tree">
          {catalog.map(sec => {
            const total = sectionCount(sec.id);
            const isOpen = openSection === sec.id;
            return (
              <div key={sec.id} className="pos-tree-section">
                <button className={`pos-tree-sec-btn ${isOpen ? 'pos-tree-sec-open' : ''}`}
                  onClick={() => { setOpenSection(isOpen ? null : sec.id); }}>
                  <span className="pos-tree-caret">{isOpen ? '▾' : '▸'}</span>
                  {sec.groupNumber != null && <span className="pos-tree-num">{sec.groupNumber}</span>}
                  <span className="pos-tree-sec-name">{getCatName(sec, 'ka', 'section')}</span>
                  <span className={`pos-tree-count ${total === 0 ? 'pos-tree-count-zero' : ''}`}>{total}</span>
                </button>
                {isOpen && (
                  <div className="pos-tree-subs">
                    {sec.subsections.map(sub => {
                      const n = countBySub.get(`${sec.id}|${sub.id}`) ?? 0;
                      const isActive = activeSub?.sectionId === sec.id && activeSub?.subId === sub.id;
                      return (
                        <button key={sub.id}
                          className={`pos-tree-sub-btn ${isActive ? 'pos-tree-sub-active' : ''}`}
                          onClick={() => setActiveSub(isActive ? null : { sectionId: sec.id, subId: sub.id })}>
                          <span className="pos-tree-sub-name">{getCatName(sub, 'ka', 'sub')}</span>
                          <span className={`pos-tree-count ${n === 0 ? 'pos-tree-count-zero' : ''}`}>{n}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
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
                <img src={p.image} alt="" className="pos-result-img" />
                <span className="pos-result-name">{p.name}<small>{p.partNumber}</small></span>
                <StockChip id={p.id} />
                <span className="pos-result-price">{GEL(p.price)}</span>
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
                  <img src={p.image} alt="" className="pos-result-img" />
                  <span className="pos-result-name">{p.name}<small>{p.partNumber}</small></span>
                  <StockChip id={p.id} />
                  <span className="pos-result-price">{GEL(p.price)}</span>
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
            <input className="staff-input pos-line-price" inputMode="decimal" value={l.unitPrice}
              onChange={e => setPrice(l.key, parseFloat(e.target.value))} />
            <span className="pos-line-sum">{GEL(l.qty * l.unitPrice)}</span>
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
function InventoryView({ session }: { session: Session }) {
  const { products } = useProducts();
  const [inv, setInv] = useState<Record<string, number> | null>(null);
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let map = await getInventory(session);
        // first run: seed random 1-10 for every catalogue product
        const missing = products.filter(p => map[p.id] === undefined);
        if (missing.length > 0) {
          await seedInventory(session, missing.map(p => ({
            productId: p.id,
            qty: 1 + Math.floor(Math.random() * 10),
          })));
          map = await getInventory(session);
        }
        setInv(map);
      } catch (ex) {
        setErr(ex instanceof Error ? ex.message : 'შეცდომა');
      }
    })();
  }, [session, products]);

  if (err) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!inv) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  const q = filter.trim().toLowerCase();
  const list = products.filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.nameGe.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q)
  );
  const totalUnits = Object.values(inv).reduce((s, n) => s + n, 0);
  const outOfStock = products.filter(p => (inv[p.id] ?? 0) === 0).length;

  const save = async (productId: string, qty: number) => {
    const clean = Math.max(0, Math.round(qty) || 0);
    setInv(prev => ({ ...(prev ?? {}), [productId]: clean }));
    try {
      await setInventoryQty(session, productId, clean);
      setSavedId(productId);
      setTimeout(() => setSavedId(s => (s === productId ? null : s)), 1500);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    }
  };

  return (
    <div className="staff-content">
      <div className="dash-tiles inv-tiles">
        <div className="dash-tile"><span className="dash-tile-label">პოზიციები</span><strong className="dash-tile-value">{products.length}</strong></div>
        <div className="dash-tile"><span className="dash-tile-label">სულ ერთეული</span><strong className="dash-tile-value">{totalUnits}</strong></div>
        <div className="dash-tile"><span className="dash-tile-label">ამოწურული</span><strong className="dash-tile-value">{outOfStock}</strong></div>
      </div>

      <input className="staff-input pos-search" placeholder="🔍 ფილტრი — სახელი ან პარტ-ნომერი…"
        value={filter} onChange={e => setFilter(e.target.value)} />

      <div className="inv-table">
        {list.map(p => {
          const qty = inv[p.id] ?? 0;
          return (
            <div key={p.id} className={`inv-row ${qty === 0 ? 'inv-row-zero' : ''}`}>
              <img src={p.image} alt="" className="pos-result-img" />
              <span className="pos-result-name">{p.name}<small>{p.partNumber}</small></span>
              <span className="inv-price">{GEL(p.price)}</span>
              <div className="inv-qty-ctrl">
                <button onClick={() => save(p.id, qty - 1)}>−</button>
                <input className="staff-input inv-qty-input" inputMode="numeric" value={qty}
                  onChange={e => save(p.id, parseInt(e.target.value) || 0)} />
                <button onClick={() => save(p.id, qty + 1)}>+</button>
              </div>
              <span className={`inv-saved ${savedId === p.id ? 'inv-saved-show' : ''}`}>✓</span>
            </div>
          );
        })}
      </div>
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

  const reload = () =>
    getCash(session, days).then(setReport).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));

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
        <h3 className="dash-panel-title">ოპერაციები</h3>
        {report.movements.length === 0 && <p className="pos-empty">ოპერაციები არ არის ამ პერიოდში</p>}
        {report.movements.map(m => {
          const dt = new Date(m.createdAt.includes('T') ? m.createdAt : m.createdAt.replace(' ', 'T'));
          return (
            <div key={m.id} className="cash-row">
              <span className={`cash-badge ${m.type === 'in' ? 'cash-in' : 'cash-out'}`}>{m.type === 'in' ? '+' : '−'}{GEL(m.amount)}</span>
              <span className="cash-reason">{m.reason || '—'}</span>
              <span className="cash-meta">{m.employee}</span>
              <span className="cash-meta">{dt.getDate()}.{String(dt.getMonth() + 1).padStart(2, '0')} {String(dt.getHours()).padStart(2, '0')}:{String(dt.getMinutes()).padStart(2, '0')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Employees ──────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<'admin' | 'staff', string> = {
  admin: 'ადმინისტრატორი', staff: 'თანამშრომელი',
};

function EmployeesView({ session }: { session: Session }) {
  const [employees, setEmployees] = useState<EmployeeRecord[] | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  // new employee form
  const [nUser, setNUser] = useState('');
  const [nName, setNName] = useState('');
  const [nPass, setNPass] = useState('');
  const [nRole, setNRole] = useState<'admin' | 'staff'>('staff');
  const [busy, setBusy] = useState(false);

  const reload = () =>
    listEmployees(session).then(setEmployees).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));

  useEffect(() => { reload(); }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m: string) => { setMsg(m); setErr(''); setTimeout(() => setMsg(''), 3500); };
  const oops = (ex: unknown) => { setErr(ex instanceof Error ? ex.message : 'შეცდომა'); setMsg(''); };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await createEmployee(session, { username: nUser, password: nPass, displayName: nName, role: nRole });
      setNUser(''); setNName(''); setNPass(''); setNRole('staff');
      flash('თანამშრომელი დაემატა ✓');
      await reload();
    } catch (ex) { oops(ex); } finally { setBusy(false); }
  };

  const patch = async (payload: Parameters<typeof updateEmployee>[1], okMsg: string) => {
    try {
      await updateEmployee(session, payload);
      flash(okMsg);
      await reload();
    } catch (ex) { oops(ex); }
  };

  const resetPassword = (emp: EmployeeRecord) => {
    const pw = window.prompt(`ახალი პაროლი — ${emp.username} (მინ. 6 სიმბოლო):`);
    if (pw === null) return;
    patch({ id: emp.id, newPassword: pw }, 'პაროლი შეიცვალა ✓');
  };

  const rename = (emp: EmployeeRecord) => {
    const name = window.prompt(`სახელი — ${emp.username}:`, emp.displayName);
    if (name === null) return;
    patch({ id: emp.id, displayName: name }, 'შენახულია ✓');
  };

  if (err && !employees) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!employees) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  const isSelf = (e: EmployeeRecord) =>
    e.id === session.employee.id || e.username === session.employee.username;

  return (
    <div className="staff-content">
      <h2 className="staff-section-title">თანამშრომლები და როლები</h2>
      <p className="emp-roles-hint">
        <strong>ადმინისტრატორი</strong> — POS, ისტორია, სტატისტიკა, თანამშრომლების მართვა ·{' '}
        <strong>თანამშრომელი</strong> — მხოლოდ POS და ისტორია
      </p>

      {msg && <div className="pos-done">{msg}</div>}
      {err && <div className="staff-login-err emp-err">{err}</div>}

      <div className="emp-table">
        <div className="emp-row emp-row-head">
          <span>მომხმარებელი</span><span>სახელი</span><span>როლი</span><span>სტატუსი</span><span></span>
        </div>
        {employees.map(emp => (
          <div key={emp.id} className={`emp-row ${!emp.active ? 'emp-row-inactive' : ''}`}>
            <span className="emp-username">{emp.username}{isSelf(emp) && <small> (თქვენ)</small>}</span>
            <button className="emp-name-btn" onClick={() => rename(emp)} title="სახელის შეცვლა">{emp.displayName} ✎</button>
            <select
              className="emp-role-select"
              value={emp.role}
              disabled={isSelf(emp)}
              onChange={e => patch({ id: emp.id, role: e.target.value as 'admin' | 'staff' }, 'როლი შეიცვალა ✓')}
            >
              <option value="staff">{ROLE_LABELS.staff}</option>
              <option value="admin">{ROLE_LABELS.admin}</option>
            </select>
            <button
              className={`emp-status-btn ${emp.active ? 'emp-status-on' : 'emp-status-off'}`}
              disabled={isSelf(emp)}
              onClick={() => patch({ id: emp.id, active: !emp.active }, emp.active ? 'ანგარიში გაითიშა' : 'ანგარიში ჩაირთო ✓')}
            >
              {emp.active ? 'აქტიური' : 'გათიშული'}
            </button>
            <button className="staff-btn-secondary emp-pw-btn" onClick={() => resetPassword(emp)}>პაროლი</button>
          </div>
        ))}
      </div>

      <h3 className="staff-section-title emp-add-title">ახალი თანამშრომელი</h3>
      <form className="emp-add-form" onSubmit={addEmployee}>
        <input className="staff-input" placeholder="მომხმარებელი (ლათინურად)" value={nUser} onChange={e => setNUser(e.target.value)} />
        <input className="staff-input" placeholder="სახელი გვარი" value={nName} onChange={e => setNName(e.target.value)} />
        <input className="staff-input" type="password" placeholder="პაროლი (მინ. 6)" value={nPass} onChange={e => setNPass(e.target.value)} autoComplete="new-password" />
        <select className="emp-role-select" value={nRole} onChange={e => setNRole(e.target.value as 'admin' | 'staff')}>
          <option value="staff">{ROLE_LABELS.staff}</option>
          <option value="admin">{ROLE_LABELS.admin}</option>
        </select>
        <button className="staff-btn-primary emp-add-btn" disabled={busy}>{busy ? 'ინახება…' : '+ დამატება'}</button>
      </form>
    </div>
  );
}

// ── Sales history ──────────────────────────────────────────────────────────
function SalesHistoryView({ session }: { session: Session }) {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    getSales(session, 100).then(setSales).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));
  }, [session]);

  if (err) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!sales) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  return (
    <div className="staff-content">
      <h2 className="staff-section-title">ბოლო გაყიდვები</h2>
      {sales.length === 0 && <p className="pos-empty">ჯერ არ არის გაყიდვები</p>}
      {sales.map(s => {
        const dt = new Date(s.createdAt.includes('T') ? s.createdAt : s.createdAt.replace(' ', 'T'));
        return (
          <div key={s.id} className="hist-row-wrap">
            <button className="hist-row" onClick={() => setOpen(open === s.id ? null : s.id)}>
              <span className="hist-id">#{s.id}</span>
              <span className="hist-date">{dt.getDate()}.{String(dt.getMonth() + 1).padStart(2, '0')} {String(dt.getHours()).padStart(2, '0')}:{String(dt.getMinutes()).padStart(2, '0')}</span>
              <span className="hist-emp">{s.employee}</span>
              <span className="hist-pay">{PAYMENT_LABELS[s.payment]}</span>
              <span className="hist-total">{GEL(s.total)}</span>
            </button>
            {open === s.id && (
              <div className="hist-detail">
                {s.items.map((it, i) => (
                  <div key={i} className="hist-item">
                    <span>{it.name}{it.partNumber ? ` (${it.partNumber})` : ''}</span>
                    <span>{it.qty} × {GEL(it.unitPrice)}</span>
                  </div>
                ))}
                {s.customerPhone && <div className="hist-meta">📞 {s.customerPhone}</div>}
                {s.note && <div className="hist-meta">📝 {s.note}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
