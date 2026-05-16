import { useState, useRef, useEffect } from 'react';
import { useProducts } from '../context/ProductsContext';
import { CATALOG } from '../data/catalog';
import { MODELS } from '../data/vehicles';
import { ModelId, Product } from '../types';
import './Admin.css';

const ADMIN_PASSWORD = 'thub2025';
const SESSION_KEY    = 'thub_admin_auth';

// ── Helpers ────────────────────────────────────────────────────────────────

function genId() {
  return 'adm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

type FitsState = Record<ModelId, { enabled: boolean; from: string; to: string }>;

interface FormState {
  name: string;
  nameGe: string;
  partNumber: string;
  sectionId: string;
  subsectionId: string;
  price: string;
  description: string;
  image: string;
  inStock: boolean;
  badge: '' | 'new' | 'sale' | 'popular';
  rating: string;
  reviews: string;
  fits: FitsState;
}

function emptyForm(): FormState {
  const fits = {} as FitsState;
  MODELS.forEach(m => { fits[m.id as ModelId] = { enabled: false, from: String(m.years.from), to: String(m.years.to) }; });
  return {
    name: '', nameGe: '', partNumber: '',
    sectionId: CATALOG[0].id, subsectionId: CATALOG[0].subsections[0].id,
    price: '', description: '', image: '',
    inStock: true, badge: '',
    rating: '4.5', reviews: '0',
    fits,
  };
}

function productToForm(p: Product): FormState {
  const fits = {} as FitsState;
  MODELS.forEach(m => {
    const r = p.fits[m.id as ModelId];
    fits[m.id as ModelId] = r
      ? { enabled: true, from: String(r.from), to: String(r.to) }
      : { enabled: false, from: String(m.years.from), to: String(m.years.to) };
  });
  return {
    name: p.name, nameGe: p.nameGe, partNumber: p.partNumber,
    sectionId: p.sectionId, subsectionId: p.subsectionId,
    price: String(p.price), description: p.description, image: p.image,
    inStock: p.inStock, badge: p.badge ?? '',
    rating: String(p.rating), reviews: String(p.reviews),
    fits,
  };
}

function formToProduct(f: FormState, id: string): Product {
  const fitsOut: Product['fits'] = {};
  MODELS.forEach(m => {
    const fi = f.fits[m.id as ModelId];
    if (fi.enabled) fitsOut[m.id as ModelId] = { from: parseInt(fi.from), to: parseInt(fi.to) };
  });
  return {
    id, partNumber: f.partNumber.trim(),
    name: f.name.trim(), nameGe: f.nameGe.trim(),
    sectionId: f.sectionId, subsectionId: f.subsectionId,
    price: parseFloat(f.price) || 0, currency: 'GEL',
    image: f.image.trim() || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=600&q=80',
    description: f.description.trim(),
    fits: fitsOut, inStock: f.inStock,
    badge: f.badge || undefined,
    rating: parseFloat(f.rating) || 4.5, reviews: parseInt(f.reviews) || 0,
  };
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Admin() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(SESSION_KEY));
  const [view, setView]   = useState<'list' | 'form'>('list');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm]   = useState<FormState>(emptyForm());
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { products, adminProducts, addProduct, updateProduct, deleteProduct } = useProducts();

  const startAdd = () => {
    setEditId(null);
    setForm(emptyForm());
    setView('form');
  };

  const startEdit = (p: Product) => {
    setEditId(p.id);
    setForm(productToForm(p));
    setView('form');
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.partNumber.trim() || !form.price) {
      alert('გთხოვთ შეავსოთ სახელი, ნომერი და ფასი.');
      return;
    }
    if (editId) {
      updateProduct(formToProduct(form, editId));
    } else {
      addProduct(formToProduct(form, genId()));
    }
    setView('list');
  };

  const confirmDelete = () => {
    if (deleteTarget) { deleteProduct(deleteTarget); setDeleteTarget(null); }
  };

  const displayedAdmin = adminProducts.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.partNumber.toLowerCase().includes(search.toLowerCase())
  );

  if (!authed) return <LoginScreen onLogin={() => { sessionStorage.setItem(SESSION_KEY, '1'); setAuthed(true); }} />;

  return (
    <div className="admin-wrap">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="admin-logo-t">T</span>Hub <span className="admin-logo-admin">Admin</span>
        </div>
        <nav className="admin-nav">
          <button className="admin-nav-btn admin-nav-active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
            პროდუქტები
          </button>
        </nav>
        <button className="admin-logout" onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          გამოსვლა
        </button>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {view === 'list' ? (
          <ListView
            adminProducts={displayedAdmin}
            totalProducts={products.length}
            search={search}
            onSearch={setSearch}
            onAdd={startAdd}
            onEdit={startEdit}
            onDelete={setDeleteTarget}
          />
        ) : (
          <FormView
            form={form}
            onChange={setForm}
            onSave={handleSave}
            onCancel={() => setView('list')}
            isEdit={!!editId}
          />
        )}
      </main>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="admin-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h3>წაიშალოს პროდუქტი?</h3>
            <p>ეს მოქმედება შეუქცევადია.</p>
            <div className="admin-modal-actions">
              <button className="admin-btn-danger" onClick={confirmDelete}>წაშლა</button>
              <button className="admin-btn-ghost" onClick={() => setDeleteTarget(null)}>გაუქმება</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Login ──────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { onLogin(); }
    else { setErr(true); setPw(''); }
  };

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-logo" style={{ marginBottom: 24 }}>
          <span className="admin-logo-t">T</span>Hub <span className="admin-logo-admin">Admin</span>
        </div>
        <h2>ადმინ პანელი</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
          შეიყვანეთ პაროლი
        </p>
        <input
          type="password"
          className={`admin-input ${err ? 'admin-input-error' : ''}`}
          placeholder="პაროლი"
          value={pw}
          onChange={e => { setPw(e.target.value); setErr(false); }}
          autoFocus
        />
        {err && <p className="admin-error">პაროლი არასწორია</p>}
        <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: 16 }}>
          შესვლა
        </button>
      </form>
    </div>
  );
}

// ── List view ──────────────────────────────────────────────────────────────

function ListView({
  adminProducts, totalProducts, search, onSearch, onAdd, onEdit, onDelete,
}: {
  adminProducts: Product[];
  totalProducts: number;
  search: string;
  onSearch: (s: string) => void;
  onAdd: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">პროდუქტები</h1>
          <p className="admin-page-sub">
            სულ კატალოგში: <strong>{totalProducts}</strong> · ადმინ-დამატებული: <strong>{adminProducts.length}</strong>
          </p>
        </div>
        <button className="admin-btn-primary" onClick={onAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ახალი პროდუქტი
        </button>
      </div>

      {adminProducts.length === 0 && !search ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📦</div>
          <h3>პროდუქტები ჯერ არ დაგიმატებიათ</h3>
          <p>დააჭირეთ "ახალი პროდუქტი" პირველი ნივთის დასამატებლად.</p>
          <button className="admin-btn-primary" onClick={onAdd}>პროდუქტის დამატება</button>
        </div>
      ) : (
        <>
          <input
            type="text"
            className="admin-search"
            placeholder="ძებნა სახელით ან ნომრით..."
            value={search}
            onChange={e => onSearch(e.target.value)}
          />
          <div className="admin-product-grid">
            {adminProducts.map(p => (
              <ProductRow key={p.id} product={p} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
          {adminProducts.length === 0 && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>ვერ მოიძებნა</p>}
        </>
      )}
    </>
  );
}

function ProductRow({ product, onEdit, onDelete }: { product: Product; onEdit: (p: Product) => void; onDelete: (id: string) => void }) {
  const section = CATALOG.find(s => s.id === product.sectionId);
  return (
    <div className="admin-product-card">
      <img src={product.image} alt={product.name} className="admin-product-thumb" />
      <div className="admin-product-info">
        <p className="admin-product-name">{product.name}</p>
        <p className="admin-product-namege">{product.nameGe}</p>
        <div className="admin-product-meta">
          <span className="admin-meta-tag">#{product.partNumber}</span>
          <span className="admin-meta-tag">{section?.name}</span>
          <span className={`admin-meta-tag ${product.inStock ? 'tag-green' : 'tag-red'}`}>
            {product.inStock ? 'მარაგშია' : 'არ არის'}
          </span>
        </div>
      </div>
      <div className="admin-product-price">{product.price.toLocaleString()} ₾</div>
      <div className="admin-product-actions">
        <button className="admin-btn-icon" onClick={() => onEdit(product)} title="რედაქტირება">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button className="admin-btn-icon admin-btn-icon-danger" onClick={() => onDelete(product.id)} title="წაშლა">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Form view ──────────────────────────────────────────────────────────────

function FormView({
  form, onChange, onSave, onCancel, isEdit,
}: {
  form: FormState;
  onChange: (f: FormState) => void;
  onSave: () => void;
  onCancel: () => void;
  isEdit: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = (key: keyof FormState, value: unknown) => onChange({ ...form, [key]: value });

  const currentSection = CATALOG.find(s => s.id === form.sectionId);
  const subsections    = currentSection?.subsections ?? [];

  const handleSectionChange = (sectionId: string) => {
    const sec = CATALOG.find(s => s.id === sectionId);
    onChange({ ...form, sectionId, subsectionId: sec?.subsections[0].id ?? '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      // Resize using canvas to keep data URL small
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        set('image', canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateFits = (modelId: ModelId, key: 'enabled' | 'from' | 'to', val: string | boolean) => {
    onChange({ ...form, fits: { ...form.fits, [modelId]: { ...form.fits[modelId], [key]: val } } });
  };

  return (
    <>
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="admin-btn-ghost admin-back-btn" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="admin-page-title">{isEdit ? 'პროდუქტის რედაქტირება' : 'ახალი პროდუქტი'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="admin-btn-ghost" onClick={onCancel}>გაუქმება</button>
          <button className="admin-btn-primary" onClick={onSave}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            შენახვა
          </button>
        </div>
      </div>

      <div className="admin-form-grid">

        {/* Left column */}
        <div className="admin-form-col">

          {/* Image */}
          <div className="admin-card">
            <h3 className="admin-card-title">სურათი</h3>
            <div className="admin-img-preview">
              {form.image
                ? <img src={form.image} alt="preview" className="admin-img-thumb" />
                : <div className="admin-img-placeholder">📷</div>}
            </div>
            <div className="admin-img-actions">
              <input
                type="text"
                className="admin-input"
                placeholder="სურათის URL (https://...)"
                value={form.image.startsWith('data:') ? '' : form.image}
                onChange={e => set('image', e.target.value)}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>ან</span>
              <button className="admin-btn-ghost" onClick={() => fileInputRef.current?.click()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                ატვირთე ფაილი
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              {form.image.startsWith('data:') && (
                <p style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center' }}>ლოკალური ფაილი შენახულია</p>
              )}
            </div>
          </div>

          {/* Compatibility */}
          <div className="admin-card">
            <h3 className="admin-card-title">თავსებადობა (მოდელები)</h3>
            <div className="admin-fits">
              {MODELS.map(m => (
                <div key={m.id} className="admin-fits-row">
                  <label className="admin-fits-check">
                    <input
                      type="checkbox"
                      checked={form.fits[m.id as ModelId].enabled}
                      onChange={e => updateFits(m.id as ModelId, 'enabled', e.target.checked)}
                    />
                    <span className="admin-model-dot" style={{ background: m.color }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                  </label>
                  {form.fits[m.id as ModelId].enabled && (
                    <div className="admin-fits-years">
                      <input
                        type="number"
                        className="admin-input admin-year-input"
                        placeholder="From"
                        value={form.fits[m.id as ModelId].from}
                        onChange={e => updateFits(m.id as ModelId, 'from', e.target.value)}
                      />
                      <span style={{ color: 'var(--text-muted)' }}>–</span>
                      <input
                        type="number"
                        className="admin-input admin-year-input"
                        placeholder="To"
                        value={form.fits[m.id as ModelId].to}
                        onChange={e => updateFits(m.id as ModelId, 'to', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stock & Badge */}
          <div className="admin-card">
            <h3 className="admin-card-title">სტატუსი</h3>
            <label className="admin-toggle-row">
              <span>მარაგშია</span>
              <button
                type="button"
                className={`admin-toggle ${form.inStock ? 'admin-toggle-on' : ''}`}
                onClick={() => set('inStock', !form.inStock)}
              >
                <span className="admin-toggle-knob" />
              </button>
            </label>
            <div className="admin-field" style={{ marginTop: 12 }}>
              <label className="admin-label">ბეჯი</label>
              <select className="admin-input" value={form.badge} onChange={e => set('badge', e.target.value)}>
                <option value="">— ბეჯი არ არის —</option>
                <option value="new">new</option>
                <option value="sale">sale</option>
                <option value="popular">popular</option>
              </select>
            </div>
          </div>

        </div>

        {/* Right column */}
        <div className="admin-form-col">

          <div className="admin-card">
            <h3 className="admin-card-title">ძირითადი ინფო</h3>

            <div className="admin-field">
              <label className="admin-label">სახელი (ქართული) *</label>
              <input className="admin-input" value={form.nameGe} onChange={e => set('nameGe', e.target.value)} placeholder="წინა ბამპერი..." />
            </div>

            <div className="admin-field">
              <label className="admin-label">სახელი (ინგლისური) *</label>
              <input className="admin-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Front Bumper Cover" />
            </div>

            <div className="admin-row-2">
              <div className="admin-field">
                <label className="admin-label">ნაწილის ნომერი *</label>
                <input className="admin-input" value={form.partNumber} onChange={e => set('partNumber', e.target.value)} placeholder="1494822-00-F" />
              </div>
              <div className="admin-field">
                <label className="admin-label">ფასი (₾) *</label>
                <input className="admin-input" type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="1850" />
              </div>
            </div>

            <div className="admin-row-2">
              <div className="admin-field">
                <label className="admin-label">სექცია</label>
                <select className="admin-input" value={form.sectionId} onChange={e => handleSectionChange(e.target.value)}>
                  {CATALOG.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">ქვე-სექცია</label>
                <select className="admin-input" value={form.subsectionId} onChange={e => set('subsectionId', e.target.value)}>
                  {subsections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="admin-field">
              <label className="admin-label">აღწერა</label>
              <textarea className="admin-input" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="ნაწილის დეტალური აღწერა..." />
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">რეიტინგი</h3>
            <div className="admin-row-2">
              <div className="admin-field">
                <label className="admin-label">შეფასება (0–5)</label>
                <input className="admin-input" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set('rating', e.target.value)} />
              </div>
              <div className="admin-field">
                <label className="admin-label">მიმოხილვების რაოდ.</label>
                <input className="admin-input" type="number" min="0" value={form.reviews} onChange={e => set('reviews', e.target.value)} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
