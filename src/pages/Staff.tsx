import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../context/ProductsContext';
import { Product } from '../types';
import {
  Session, Sale, Stats, SaleItemInput, Payment,
  login, loadSession, saveSession, recordSale, getSales, getStats,
} from '../utils/staffApi';
import './Staff.css';

const PAYMENT_LABELS: Record<Payment, string> = {
  cash: 'ნაღდი', card: 'ბარათი', transfer: 'გადარიცხვა',
};

const GEL = (n: number) => `${n.toFixed(2)} ₾`;

export default function Staff() {
  const [session, setSession] = useState<Session | null>(loadSession);
  const [tab, setTab] = useState<'pos' | 'dashboard' | 'sales'>('pos');

  const logout = () => { saveSession(null); setSession(null); };

  if (!session) {
    return <StaffLogin onLogin={s => { saveSession(s); setSession(s); }} />;
  }

  return (
    <div className="staff-page">
      <header className="staff-header">
        <Link to="/" className="staff-logo"><span className="logo-t">T</span>Hub<span className="staff-logo-ge">.ge</span> <span className="staff-logo-suffix">Staff</span></Link>
        <nav className="staff-tabs">
          <button className={tab === 'pos' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('pos')}>🧾 გაყიდვა (POS)</button>
          <button className={tab === 'dashboard' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('dashboard')}>📊 სტატისტიკა</button>
          <button className={tab === 'sales' ? 'staff-tab staff-tab-active' : 'staff-tab'} onClick={() => setTab('sales')}>📋 ისტორია</button>
        </nav>
        <div className="staff-header-right">
          {session.local && <span className="staff-local-badge" title="მონაცემთა ბაზა არ არის მიერთებული — გაყიდვები ინახება მხოლოდ ამ ბრაუზერში">ლოკალური რეჟიმი</span>}
          <span className="staff-user">{session.employee.displayName}</span>
          <button className="staff-logout" onClick={logout}>გასვლა</button>
        </div>
      </header>

      {tab === 'pos' && <PosView session={session} />}
      {tab === 'dashboard' && <DashboardView session={session} />}
      {tab === 'sales' && <SalesHistoryView session={session} />}
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
  const [query, setQuery] = useState('');
  const [ticket, setTicket] = useState<TicketLine[]>([]);
  const [payment, setPayment] = useState<Payment>('cash');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ saleId: number; total: number } | null>(null);
  const [err, setErr] = useState('');
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.nameGe.toLowerCase().includes(q) ||
      p.partNumber.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, products]);

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
      setTicket([]); setPhone(''); setNote(''); setPayment('cash');
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="staff-content pos-layout">
      <section className="pos-left">
        <h2 className="staff-section-title">პროდუქტის დამატება</h2>
        <input className="staff-input pos-search" placeholder="🔍 მოძებნეთ სახელით ან პარტ-ნომრით…"
          value={query} onChange={e => setQuery(e.target.value)} />
        {results.length > 0 && (
          <div className="pos-results">
            {results.map(p => (
              <button key={p.id} className="pos-result" onClick={() => add(p)}>
                <img src={p.image} alt="" className="pos-result-img" />
                <span className="pos-result-name">{p.name}<small>{p.partNumber}</small></span>
                <span className="pos-result-price">{GEL(p.price)}</span>
              </button>
            ))}
          </div>
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
function DashboardView({ session }: { session: Session }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState('');
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    getStats(session, 14).then(setStats).catch(ex => setErr(ex instanceof Error ? ex.message : 'შეცდომა'));
  }, [session]);

  if (err) return <div className="staff-content"><div className="staff-login-err">{err}</div></div>;
  if (!stats) return <div className="staff-content"><p className="pos-empty">იტვირთება…</p></div>;

  // fill missing days with zeros
  const byDay = new Map(stats.daily.map(d => [d.day, d]));
  const days: { day: string; revenue: number; sales: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    days.push(byDay.get(key) ?? { day: key, revenue: 0, sales: 0 });
  }
  const max = Math.max(1, ...days.map(d => d.revenue));
  const payTotal = Math.max(1, stats.payments.reduce((s, p) => s + p.revenue, 0));

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
            <span className="dash-tile-sub">{t.agg.sales} გაყიდვა</span>
          </div>
        ))}
      </div>

      <div className="dash-panel">
        <h3 className="dash-panel-title">შემოსავალი — ბოლო 14 დღე</h3>
        <div className="dash-chart" onMouseLeave={() => setHover(null)}>
          {days.map((d, i) => {
            const h = Math.round((d.revenue / max) * 100);
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
                  <div className={`dash-bar ${hover === i ? 'dash-bar-hover' : ''}`} style={{ height: `${Math.max(h, d.revenue > 0 ? 3 : 0)}%` }} />
                </div>
                <span className="dash-bar-label">{date.getDate()}</span>
              </div>
            );
          })}
        </div>
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
                <div className="dash-pay-fill" style={{ width: `${Math.round((p.revenue / payTotal) * 100)}%` }} />
              </div>
              <span className="dash-pay-val">{GEL(p.revenue)} · {p.sales}</span>
            </div>
          ))}
        </div>
      </div>
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
