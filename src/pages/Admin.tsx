import { useState, useRef } from 'react';
import { useProducts } from '../context/ProductsContext';
import { useCatalog } from '../context/CatalogContext';
import { useModels } from '../context/ModelsContext';
import { useSiteSettings, ContactSettings, HomeSettings } from '../context/SiteSettingsContext';
import { getCatName, slugify } from '../utils/catalog';
import { TeslaModel, Product, CatalogSection, CatalogSubsection } from '../types';
import './Admin.css';

const ADMIN_PW_KEY = 'thub_admin_pw';
const SESSION_KEY  = 'thub_admin_auth';
const DEFAULT_PW   = 'thub2025';

function getAdminPassword() {
  return localStorage.getItem(ADMIN_PW_KEY) || DEFAULT_PW;
}

function genId() {
  return 'adm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Product form helpers ───────────────────────────────────────────────────
type FitsState = Record<string, { enabled: boolean; from: string; to: string }>;
interface ProductForm {
  name: string; nameGe: string; partNumber: string;
  sectionId: string; subsectionId: string;
  price: string; description: string; image: string;
  inStock: boolean; badge: '' | 'new' | 'sale' | 'popular';
  rating: string; reviews: string;
  fits: FitsState;
}

function emptyProductForm(catalog: CatalogSection[], models: TeslaModel[]): ProductForm {
  const fits = {} as FitsState;
  models.forEach(m => { fits[m.id] = { enabled: false, from: String(m.years.from), to: String(m.years.to) }; });
  const firstSection = catalog[0];
  return {
    name: '', nameGe: '', partNumber: '',
    sectionId: firstSection?.id ?? '',
    subsectionId: firstSection?.subsections[0]?.id ?? '',
    price: '', description: '', image: '',
    inStock: true, badge: '', rating: '4.5', reviews: '0', fits,
  };
}

function productToForm(p: Product, models: TeslaModel[]): ProductForm {
  const fits = {} as FitsState;
  models.forEach(m => {
    const r = p.fits[m.id];
    fits[m.id] = r
      ? { enabled: true, from: String(r.from), to: String(r.to) }
      : { enabled: false, from: String(m.years.from), to: String(m.years.to) };
  });
  return {
    name: p.name, nameGe: p.nameGe, partNumber: p.partNumber,
    sectionId: p.sectionId, subsectionId: p.subsectionId,
    price: String(p.price), description: p.description, image: p.image,
    inStock: p.inStock, badge: p.badge ?? '', rating: String(p.rating), reviews: String(p.reviews), fits,
  };
}

function formToProduct(f: ProductForm, id: string): Product {
  const fitsOut: Product['fits'] = {};
  Object.entries(f.fits).forEach(([modelId, fi]) => {
    if (fi.enabled) fitsOut[modelId] = { from: parseInt(fi.from), to: parseInt(fi.to) };
  });
  return {
    id, partNumber: f.partNumber.trim(), name: f.name.trim(), nameGe: f.nameGe.trim(),
    sectionId: f.sectionId, subsectionId: f.subsectionId,
    price: parseFloat(f.price) || 0, currency: 'GEL',
    image: f.image.trim() || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=600&q=80',
    description: f.description.trim(), fits: fitsOut, inStock: f.inStock,
    badge: f.badge || undefined, rating: parseFloat(f.rating) || 4.5, reviews: parseInt(f.reviews) || 0,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────
type Tab  = 'products' | 'categories' | 'models' | 'home' | 'contact' | 'users';
type View = 'list' | 'product-form';

export default function Admin() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(SESSION_KEY));
  const [tab,  setTab]  = useState<Tab>('products');
  const [view, setView] = useState<View>('list');

  const { products, isAdminProduct, addProduct, updateProduct, deleteProduct } = useProducts();
  const { catalog } = useCatalog();
  const { models } = useModels();

  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [productForm, setProductForm]     = useState<ProductForm>(() => emptyProductForm(catalog, models));
  const [productSearch, setProductSearch] = useState('');
  const [productSectionFilter, setProductSectionFilter] = useState('all');
  const [deleteProductTarget, setDeleteProductTarget]   = useState<string | null>(null);

  if (!authed) return <LoginScreen onLogin={() => { sessionStorage.setItem(SESSION_KEY, '1'); setAuthed(true); }} />;

  const startAddProduct = () => {
    setEditProductId(null);
    setProductForm(emptyProductForm(catalog, models));
    setView('product-form');
  };
  const startEditProduct = (p: Product) => {
    setEditProductId(p.id);
    setProductForm(productToForm(p, models));
    setView('product-form');
  };
  const handleSaveProduct = () => {
    if (!productForm.name.trim() || !productForm.partNumber.trim() || !productForm.price) {
      alert('შეავსეთ სახელი, ნომერი და ფასი.'); return;
    }
    if (editProductId) updateProduct(formToProduct(productForm, editProductId));
    else               addProduct(formToProduct(productForm, genId()));
    setView('list');
  };

  const displayedProducts = products.filter(p => {
    if (productSectionFilter !== 'all' && p.sectionId !== productSectionFilter) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.nameGe.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q);
    }
    return true;
  });

  const switchTab = (t: Tab) => { setTab(t); setView('list'); };

  return (
    <div className="admin-wrap">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="admin-logo-t">T</span>Hub <span className="admin-logo-admin">Admin</span>
        </div>
        <nav className="admin-nav">
          <NavBtn active={tab === 'products'}   onClick={() => switchTab('products')}   icon={<IcoBox />}   label="პროდუქტები"     count={products.length} />
          <NavBtn active={tab === 'categories'} onClick={() => switchTab('categories')} icon={<IcoList />}  label="კატეგორიები"    count={catalog.length} />
          <NavBtn active={tab === 'models'}     onClick={() => switchTab('models')}     icon={<IcoCar />}   label="მოდელები"       count={models.length} />
          <NavBtn active={tab === 'home'}       onClick={() => switchTab('home')}       icon={<IcoHome />}  label="მთავარი გვ." />
          <NavBtn active={tab === 'contact'}    onClick={() => switchTab('contact')}    icon={<IcoPhone />} label="საკონტაქტო" />
          <NavBtn active={tab === 'users'}      onClick={() => switchTab('users')}      icon={<IcoUser />}  label="მომხმარებლები" />
        </nav>
        <button className="admin-logout" onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          გამოსვლა
        </button>
      </aside>

      <main className="admin-main">
        {tab === 'products' && view === 'list' && (
          <ProductsList
            products={displayedProducts} allCount={products.length}
            search={productSearch} sectionFilter={productSectionFilter}
            catalog={catalog} isAdmin={isAdminProduct}
            onSearch={setProductSearch} onSectionFilter={setProductSectionFilter}
            onAdd={startAddProduct} onEdit={startEditProduct} onDelete={setDeleteProductTarget}
          />
        )}
        {tab === 'products' && view === 'product-form' && (
          <ProductFormView
            form={productForm} onChange={setProductForm}
            onSave={handleSaveProduct} onCancel={() => setView('list')}
            isEdit={!!editProductId} catalog={catalog} models={models}
          />
        )}
        {tab === 'categories' && <CategoriesView />}
        {tab === 'models'     && <ModelsView />}
        {tab === 'home'       && <HomeSettingsView />}
        {tab === 'contact'    && <ContactSettingsView />}
        {tab === 'users'      && <UsersView />}
      </main>

      {deleteProductTarget && (
        <ConfirmModal
          title="წაიშალოს პროდუქტი?" body="ეს მოქმედება შეუქცევადია."
          onConfirm={() => { deleteProduct(deleteProductTarget); setDeleteProductTarget(null); }}
          onCancel={() => setDeleteProductTarget(null)}
        />
      )}
    </div>
  );
}

// ── Nav button ─────────────────────────────────────────────────────────────
function NavBtn({ active, onClick, icon, label, count }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count?: number;
}) {
  return (
    <button className={`admin-nav-btn ${active ? 'admin-nav-active' : ''}`} onClick={onClick}>
      {icon}{label}
      {count !== undefined && <span className="admin-nav-count">{count}</span>}
    </button>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────
const IcoBox  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20z"/></svg>;
const IcoList = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h8M4 18h8"/></svg>;
const IcoCar  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 0 1-2-2V9l3-6h12l3 6v6a2 2 0 0 1-2 2h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>;
const IcoHome = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcoPhone= () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
const IcoUser = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

// ── Login ──────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === getAdminPassword()) onLogin();
    else { setErr(true); setPw(''); }
  };
  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-logo" style={{ marginBottom: 24 }}>
          <span className="admin-logo-t">T</span>Hub <span className="admin-logo-admin">Admin</span>
        </div>
        <h2>ადმინ პანელი</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>შეიყვანეთ პაროლი</p>
        <input type="password" className={`admin-input ${err ? 'admin-input-error' : ''}`}
          placeholder="პაროლი" value={pw}
          onChange={e => { setPw(e.target.value); setErr(false); }} autoFocus />
        {err && <p className="admin-error">პაროლი არასწორია</p>}
        <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: 16 }}>შესვლა</button>
      </form>
    </div>
  );
}

// ── Products list ──────────────────────────────────────────────────────────
function ProductsList({ products, allCount, search, sectionFilter, catalog, isAdmin, onSearch, onSectionFilter, onAdd, onEdit, onDelete }: {
  products: Product[]; allCount: number; search: string; sectionFilter: string;
  catalog: CatalogSection[]; isAdmin: (id: string) => boolean;
  onSearch: (s: string) => void; onSectionFilter: (s: string) => void;
  onAdd: () => void; onEdit: (p: Product) => void; onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">პროდუქტები</h1>
          <p className="admin-page-sub">სულ: <strong>{allCount}</strong> · ნაჩვენებია: <strong>{products.length}</strong></p>
        </div>
        <button className="admin-btn-primary" onClick={onAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ახალი პროდუქტი
        </button>
      </div>
      <div className="admin-filters">
        <input type="text" className="admin-search" style={{ marginBottom: 0 }} placeholder="ძებნა სახელით ან ნომრით..."
          value={search} onChange={e => onSearch(e.target.value)} />
        <select className="admin-input admin-select" value={sectionFilter} onChange={e => onSectionFilter(e.target.value)}>
          <option value="all">ყველა კატეგორია</option>
          {catalog.map(s => <option key={s.id} value={s.id}>{s.nameGe || s.name}</option>)}
        </select>
      </div>
      {products.length === 0
        ? <div className="admin-empty"><div className="admin-empty-icon">📦</div><h3>პროდუქტები ვერ მოიძებნა</h3></div>
        : <div className="admin-product-grid">
            {products.map(p => (
              <ProductRow key={p.id} product={p} catalog={catalog} isAdmin={isAdmin(p.id)} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
      }
    </>
  );
}

function ProductRow({ product, catalog, isAdmin, onEdit, onDelete }: {
  product: Product; catalog: CatalogSection[]; isAdmin: boolean;
  onEdit: (p: Product) => void; onDelete: (id: string) => void;
}) {
  const section = catalog.find(s => s.id === product.sectionId);
  return (
    <div className="admin-product-card">
      <img src={product.image} alt={product.name} className="admin-product-thumb" />
      <div className="admin-product-info">
        <p className="admin-product-name">{product.name}</p>
        <p className="admin-product-namege">{product.nameGe}</p>
        <div className="admin-product-meta">
          <span className="admin-meta-tag">#{product.partNumber}</span>
          {section && <span className="admin-meta-tag">{section.nameGe || section.name}</span>}
          <span className={`admin-meta-tag ${product.inStock ? 'tag-green' : 'tag-red'}`}>
            {product.inStock ? 'მარაგშია' : 'არ არის'}
          </span>
          {!isAdmin && <span className="admin-meta-tag tag-sys">სისტემური</span>}
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

// ── Product form ───────────────────────────────────────────────────────────
function ProductFormView({ form, onChange, onSave, onCancel, isEdit, catalog, models }: {
  form: ProductForm; onChange: (f: ProductForm) => void;
  onSave: () => void; onCancel: () => void; isEdit: boolean;
  catalog: CatalogSection[]; models: TeslaModel[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = (key: keyof ProductForm, value: unknown) => onChange({ ...form, [key]: value });

  const currentSection = catalog.find(s => s.id === form.sectionId);
  const subsections    = currentSection?.subsections ?? [];

  const handleSectionChange = (sectionId: string) => {
    const sec = catalog.find(s => s.id === sectionId);
    onChange({ ...form, sectionId, subsectionId: sec?.subsections[0]?.id ?? '' });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800; const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * ratio; canvas.height = img.height * ratio;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        set('image', canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file); e.target.value = '';
  };

  const updateFits = (modelId: string, key: 'enabled' | 'from' | 'to', val: string | boolean) =>
    onChange({ ...form, fits: { ...form.fits, [modelId]: { ...form.fits[modelId], [key]: val } } });

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
        <div className="admin-form-col">
          <div className="admin-card">
            <h3 className="admin-card-title">სურათი</h3>
            <div className="admin-img-preview">
              {form.image ? <img src={form.image} alt="preview" className="admin-img-thumb" /> : <div className="admin-img-placeholder">📷</div>}
            </div>
            <div className="admin-img-actions">
              <input type="text" className="admin-input" placeholder="სურათის URL (https://...)"
                value={form.image.startsWith('data:') ? '' : form.image}
                onChange={e => set('image', e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center' }}>ან</span>
              <button className="admin-btn-ghost" onClick={() => fileInputRef.current?.click()}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                ატვირთე ფაილი
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">თავსებადობა</h3>
            <div className="admin-fits">
              {models.map(m => (
                <div key={m.id} className="admin-fits-row">
                  <label className="admin-fits-check">
                    <input type="checkbox" checked={!!form.fits[m.id]?.enabled}
                      onChange={e => updateFits(m.id, 'enabled', e.target.checked)} />
                    <span className="admin-model-dot" style={{ background: m.color }} />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{m.name}</span>
                  </label>
                  {form.fits[m.id]?.enabled && (
                    <div className="admin-fits-years">
                      <input type="number" className="admin-input admin-year-input"
                        value={form.fits[m.id].from}
                        onChange={e => updateFits(m.id, 'from', e.target.value)} />
                      <span style={{ color: 'var(--text-muted)' }}>–</span>
                      <input type="number" className="admin-input admin-year-input"
                        value={form.fits[m.id].to}
                        onChange={e => updateFits(m.id, 'to', e.target.value)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">სტატუსი</h3>
            <label className="admin-toggle-row">
              <span>მარაგშია</span>
              <button type="button" className={`admin-toggle ${form.inStock ? 'admin-toggle-on' : ''}`} onClick={() => set('inStock', !form.inStock)}>
                <span className="admin-toggle-knob" />
              </button>
            </label>
            <div className="admin-field" style={{ marginTop: 12 }}>
              <label className="admin-label">ბეჯი</label>
              <select className="admin-input" value={form.badge} onChange={e => set('badge', e.target.value)}>
                <option value="">— არ არის —</option>
                <option value="new">new</option>
                <option value="sale">sale</option>
                <option value="popular">popular</option>
              </select>
            </div>
          </div>
        </div>

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
                  {catalog.map(s => <option key={s.id} value={s.id}>{s.nameGe || s.name}</option>)}
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">ქვე-სექცია</label>
                <select className="admin-input" value={form.subsectionId} onChange={e => set('subsectionId', e.target.value)}>
                  {subsections.map(s => <option key={s.id} value={s.id}>{s.nameGe || s.name}</option>)}
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

// ── Categories view ────────────────────────────────────────────────────────
interface SectionForm { name: string; nameGe: string; icon: string; image: string; }
interface SubForm     { name: string; nameGe: string; }

function CategoriesView() {
  const { catalog, isAdminSection, addSection, updateSection, deleteSection, addSubsection, updateSubsection, deleteSubsection } = useCatalog();

  const [sectionModal, setSectionModal] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [sectionForm, setSectionForm]   = useState<SectionForm>({ name: '', nameGe: '', icon: '📦', image: '' });
  const [subModal, setSubModal]         = useState<{ open: boolean; sectionId: string; editId: string | null }>({ open: false, sectionId: '', editId: null });
  const [subForm, setSubForm]           = useState<SubForm>({ name: '', nameGe: '' });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'section' | 'sub'; sectionId: string; subId?: string } | null>(null);
  const [expanded, setExpanded]         = useState<string | null>(null);

  const openAddSection = () => { setSectionForm({ name: '', nameGe: '', icon: '📦', image: '' }); setSectionModal({ open: true, editId: null }); };
  const openEditSection = (s: CatalogSection) => { setSectionForm({ name: s.name, nameGe: s.nameGe ?? '', icon: s.icon, image: s.image }); setSectionModal({ open: true, editId: s.id }); };
  const saveSectionForm = () => {
    if (!sectionForm.name.trim()) { alert('შეავსეთ სახელი'); return; }
    if (sectionModal.editId) {
      const existing = catalog.find(s => s.id === sectionModal.editId)!;
      updateSection({ ...existing, name: sectionForm.name.trim(), nameGe: sectionForm.nameGe.trim(), icon: sectionForm.icon, image: sectionForm.image.trim() });
    } else {
      const id = slugify(sectionForm.name) || genId();
      addSection({ id, name: sectionForm.name.trim(), nameGe: sectionForm.nameGe.trim(), icon: sectionForm.icon, image: sectionForm.image.trim(), subsections: [] });
    }
    setSectionModal({ open: false, editId: null });
  };

  const openAddSub = (sectionId: string) => { setSubForm({ name: '', nameGe: '' }); setSubModal({ open: true, sectionId, editId: null }); };
  const openEditSub = (sectionId: string, sub: CatalogSubsection) => { setSubForm({ name: sub.name, nameGe: sub.nameGe ?? '' }); setSubModal({ open: true, sectionId, editId: sub.id }); };
  const saveSubForm = () => {
    if (!subForm.name.trim()) { alert('შეავსეთ სახელი'); return; }
    if (subModal.editId) {
      const section = catalog.find(s => s.id === subModal.sectionId)!;
      const existing = section.subsections.find(s => s.id === subModal.editId)!;
      updateSubsection(subModal.sectionId, { ...existing, name: subForm.name.trim(), nameGe: subForm.nameGe.trim() });
    } else {
      const id = slugify(subForm.name) || genId();
      addSubsection(subModal.sectionId, { id, name: subForm.name.trim(), nameGe: subForm.nameGe.trim(), icon: '🔩' });
    }
    setSubModal({ open: false, sectionId: '', editId: null });
  };

  const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
  const DelIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">კატეგორიები</h1>
          <p className="admin-page-sub">სექციები: <strong>{catalog.length}</strong></p>
        </div>
        <button className="admin-btn-primary" onClick={openAddSection}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ახალი სექცია
        </button>
      </div>

      <div className="admin-cat-list">
        {catalog.map(section => (
          <div key={section.id} className="admin-cat-section">
            <div className="admin-cat-section-header">
              <button className="admin-cat-expand" onClick={() => setExpanded(expanded === section.id ? null : section.id)}>
                <span className="admin-cat-icon">{section.icon}</span>
                <span className="admin-cat-name">{section.nameGe || section.name}</span>
                <span className="admin-cat-sub-count">{section.subsections.length} ქვე-სექ.</span>
                {!isAdminSection(section.id) && <span className="admin-meta-tag tag-sys" style={{ marginLeft: 8 }}>სისტ.</span>}
                <svg className={`tree-chevron ${expanded === section.id ? 'tree-chevron-open' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div className="admin-cat-actions">
                <button className="admin-btn-icon" onClick={() => openEditSection(section)}><EditIcon /></button>
                <button className="admin-btn-icon admin-btn-icon-danger" onClick={() => setDeleteTarget({ type: 'section', sectionId: section.id })}><DelIcon /></button>
              </div>
            </div>

            {expanded === section.id && (
              <div className="admin-cat-subs">
                {section.subsections.map(sub => (
                  <div key={sub.id} className="admin-cat-sub-row">
                    <span className="admin-cat-sub-name">{sub.nameGe || sub.name}</span>
                    <span className="admin-cat-sub-name-en">{sub.name}</span>
                    <div className="admin-product-actions">
                      <button className="admin-btn-icon" onClick={() => openEditSub(section.id, sub)}><EditIcon /></button>
                      <button className="admin-btn-icon admin-btn-icon-danger" onClick={() => setDeleteTarget({ type: 'sub', sectionId: section.id, subId: sub.id })}><DelIcon /></button>
                    </div>
                  </div>
                ))}
                <button className="admin-cat-add-sub" onClick={() => openAddSub(section.id)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  ქვე-სექციის დამატება
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {sectionModal.open && (
        <div className="admin-modal-overlay" onClick={() => setSectionModal({ open: false, editId: null })}>
          <div className="admin-modal admin-modal-wide" onClick={e => e.stopPropagation()}>
            <h3>{sectionModal.editId ? 'სექციის რედაქტირება' : 'ახალი სექცია'}</h3>
            <div style={{ marginTop: 16 }}>
              <div className="admin-field"><label className="admin-label">სახელი (ქართული) *</label><input className="admin-input" value={sectionForm.nameGe} onChange={e => setSectionForm({ ...sectionForm, nameGe: e.target.value })} placeholder="კუზოვი" /></div>
              <div className="admin-field"><label className="admin-label">სახელი (ინგლისური) *</label><input className="admin-input" value={sectionForm.name} onChange={e => setSectionForm({ ...sectionForm, name: e.target.value })} placeholder="Body" /></div>
              <div className="admin-field"><label className="admin-label">ემოჯი / ხატი</label><input className="admin-input" value={sectionForm.icon} onChange={e => setSectionForm({ ...sectionForm, icon: e.target.value })} placeholder="🚗" /></div>
              <div className="admin-field"><label className="admin-label">სურათის URL</label><input className="admin-input" value={sectionForm.image} onChange={e => setSectionForm({ ...sectionForm, image: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-primary" onClick={saveSectionForm}>შენახვა</button>
              <button className="admin-btn-ghost" onClick={() => setSectionModal({ open: false, editId: null })}>გაუქმება</button>
            </div>
          </div>
        </div>
      )}

      {subModal.open && (
        <div className="admin-modal-overlay" onClick={() => setSubModal({ open: false, sectionId: '', editId: null })}>
          <div className="admin-modal admin-modal-wide" onClick={e => e.stopPropagation()}>
            <h3>{subModal.editId ? 'ქვე-სექციის რედაქტირება' : 'ახალი ქვე-სექცია'}</h3>
            <div style={{ marginTop: 16 }}>
              <div className="admin-field"><label className="admin-label">სახელი (ქართული) *</label><input className="admin-input" value={subForm.nameGe} onChange={e => setSubForm({ ...subForm, nameGe: e.target.value })} placeholder="წინა ბამპერი" autoFocus /></div>
              <div className="admin-field"><label className="admin-label">სახელი (ინგლისური) *</label><input className="admin-input" value={subForm.name} onChange={e => setSubForm({ ...subForm, name: e.target.value })} placeholder="Front Bumper" /></div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-primary" onClick={saveSubForm}>შენახვა</button>
              <button className="admin-btn-ghost" onClick={() => setSubModal({ open: false, sectionId: '', editId: null })}>გაუქმება</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          title={deleteTarget.type === 'section' ? 'წაიშალოს სექცია?' : 'წაიშალოს ქვე-სექცია?'}
          body="ეს მოქმედება შეუქცევადია."
          onConfirm={() => {
            if (deleteTarget.type === 'section') deleteSection(deleteTarget.sectionId);
            else if (deleteTarget.subId) deleteSubsection(deleteTarget.sectionId, deleteTarget.subId);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ── Models view ────────────────────────────────────────────────────────────
interface ModelForm { id: string; name: string; fullName: string; yearFrom: string; yearTo: string; color: string; }

function ModelsView() {
  const { models, isAdminModel, addModel, updateModel, deleteModel } = useModels();
  const [modal, setModal]   = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm]     = useState<ModelForm>({ id: '', name: '', fullName: '', yearFrom: '2020', yearTo: '2025', color: '#888888' });
  const [deleteTgt, setDeleteTgt] = useState<string | null>(null);

  const openAdd = () => {
    setForm({ id: '', name: '', fullName: '', yearFrom: '2020', yearTo: '2025', color: '#888888' });
    setModal({ open: true, editId: null });
  };
  const openEdit = (m: TeslaModel) => {
    setForm({ id: m.id, name: m.name, fullName: m.fullName, yearFrom: String(m.years.from), yearTo: String(m.years.to), color: m.color });
    setModal({ open: true, editId: m.id });
  };
  const save = () => {
    if (!form.name.trim() || !form.fullName.trim()) { alert('შეავსეთ სახელი'); return; }
    const m: TeslaModel = {
      id: modal.editId || form.id.trim() || slugify(form.name) || genId(),
      name: form.name.trim(), fullName: form.fullName.trim(),
      years: { from: parseInt(form.yearFrom) || 2017, to: parseInt(form.yearTo) || 2024 },
      color: form.color,
    };
    if (modal.editId) updateModel(m);
    else addModel(m);
    setModal({ open: false, editId: null });
  };

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">მოდელები</h1>
          <p className="admin-page-sub">Tesla-ს მოდელები: <strong>{models.length}</strong></p>
        </div>
        <button className="admin-btn-primary" onClick={openAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ახალი მოდელი
        </button>
      </div>

      <div className="admin-model-list">
        {models.map(m => (
          <div key={m.id} className="admin-model-item">
            <div className="admin-model-color-dot" style={{ background: m.color }} />
            <div className="admin-model-info">
              <p className="admin-model-name">{m.fullName}</p>
              <p className="admin-model-years">{m.years.from}–{m.years.to} · ID: <code>{m.id}</code></p>
            </div>
            {!isAdminModel(m.id) && <span className="admin-meta-tag tag-sys">სისტ.</span>}
            <div className="admin-model-color-chip" style={{ background: m.color }}>{m.color}</div>
            <div className="admin-product-actions">
              <button className="admin-btn-icon" onClick={() => openEdit(m)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="admin-btn-icon admin-btn-icon-danger" onClick={() => setDeleteTgt(m.id)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <div className="admin-modal-overlay" onClick={() => setModal({ open: false, editId: null })}>
          <div className="admin-modal admin-modal-wide" onClick={e => e.stopPropagation()}>
            <h3>{modal.editId ? 'მოდელის რედაქტირება' : 'ახალი მოდელი'}</h3>
            <div style={{ marginTop: 16 }}>
              {!modal.editId && (
                <div className="admin-field">
                  <label className="admin-label">ID (M3, MY, MS, MX ან ახალი)</label>
                  <input className="admin-input" value={form.id} onChange={e => setForm({ ...form, id: e.target.value.toUpperCase() })} placeholder="CT" autoFocus />
                </div>
              )}
              <div className="admin-field"><label className="admin-label">მოკლე სახელი *</label><input className="admin-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Model 3" /></div>
              <div className="admin-field"><label className="admin-label">სრული სახელი *</label><input className="admin-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Tesla Model 3" /></div>
              <div className="admin-row-2">
                <div className="admin-field"><label className="admin-label">წელი დან</label><input className="admin-input" type="number" value={form.yearFrom} onChange={e => setForm({ ...form, yearFrom: e.target.value })} /></div>
                <div className="admin-field"><label className="admin-label">წელი მდე</label><input className="admin-input" type="number" value={form.yearTo} onChange={e => setForm({ ...form, yearTo: e.target.value })} /></div>
              </div>
              <div className="admin-field">
                <label className="admin-label">ფერი</label>
                <div className="admin-color-row">
                  <input type="color" className="admin-color-picker" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                  <input className="admin-input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="#e31937" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn-primary" onClick={save}>შენახვა</button>
              <button className="admin-btn-ghost" onClick={() => setModal({ open: false, editId: null })}>გაუქმება</button>
            </div>
          </div>
        </div>
      )}

      {deleteTgt && (
        <ConfirmModal
          title="წაიშალოს მოდელი?" body="პროდუქტების თავსებადობა ამ მოდელთან შენარჩუნდება."
          onConfirm={() => { deleteModel(deleteTgt); setDeleteTgt(null); }}
          onCancel={() => setDeleteTgt(null)}
        />
      )}
    </>
  );
}

// ── Home settings view ─────────────────────────────────────────────────────
function HomeSettingsView() {
  const { settings, updateHome } = useSiteSettings();
  const [form, setForm] = useState<HomeSettings>(settings.home);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof HomeSettings, v: string) => setForm(f => ({ ...f, [k]: v }));
  const save = () => { updateHome(form); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">მთავარი გვერდი</h1><p className="admin-page-sub">ტეგლაინისა და ბანერის მართვა</p></div>
        <button className="admin-btn-primary" onClick={save}>{saved ? '✓ შენახულია' : 'შენახვა'}</button>
      </div>
      <div className="admin-settings-grid">
        <div className="admin-card">
          <h3 className="admin-card-title">ტეგლაინი (სათაურის ქვემოთ)</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>თუ ცარიელია, გამოიყენება ნაგულისხმევი ტექსტი.</p>
          <div className="admin-field"><label className="admin-label">ქართული</label><input className="admin-input" value={form.taglineKa} onChange={e => set('taglineKa', e.target.value)} placeholder="Tesla-ს ნაწილები საქართველოში..." /></div>
          <div className="admin-field"><label className="admin-label">ინგლისური</label><input className="admin-input" value={form.taglineEn} onChange={e => set('taglineEn', e.target.value)} placeholder="Premium Tesla Parts in Georgia..." /></div>
          <div className="admin-field"><label className="admin-label">რუსული</label><input className="admin-input" value={form.taglineRu} onChange={e => set('taglineRu', e.target.value)} placeholder="Запчасти Tesla в Грузии..." /></div>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">პრომო ბანერი</h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>ჩვენდება მოდელების სელექტორის ქვემოთ. ცარიელი = დამალულია.</p>
          <div className="admin-field"><label className="admin-label">ქართული</label><textarea className="admin-input" rows={3} value={form.bannerKa} onChange={e => set('bannerKa', e.target.value)} placeholder="სეზონური ფასდაკლება 15%..." /></div>
          <div className="admin-field"><label className="admin-label">ინგლისური</label><textarea className="admin-input" rows={3} value={form.bannerEn} onChange={e => set('bannerEn', e.target.value)} placeholder="Seasonal discount 15%..." /></div>
          <div className="admin-field"><label className="admin-label">რუსული</label><textarea className="admin-input" rows={3} value={form.bannerRu} onChange={e => set('bannerRu', e.target.value)} placeholder="Сезонная скидка 15%..." /></div>
        </div>
      </div>
    </>
  );
}

// ── Contact settings view ──────────────────────────────────────────────────
function ContactSettingsView() {
  const { settings, updateContact } = useSiteSettings();
  const [form, setForm] = useState<ContactSettings>(settings.contact);
  const [saved, setSaved] = useState(false);
  const set = (k: keyof ContactSettings, v: string) => setForm(f => ({ ...f, [k]: v }));
  const save = () => { updateContact(form); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">საკონტაქტო ინფო</h1><p className="admin-page-sub">მისამართი, ტელეფონი, სამუშაო საათები</p></div>
        <button className="admin-btn-primary" onClick={save}>{saved ? '✓ შენახულია' : 'შენახვა'}</button>
      </div>
      <div className="admin-settings-grid">
        <div className="admin-card">
          <h3 className="admin-card-title">მისამართი და რუკა</h3>
          <div className="admin-field"><label className="admin-label">მისამართი (ტექსტი)</label><input className="admin-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Tbilisi, Georgia" /></div>
          <div className="admin-field"><label className="admin-label">Google Maps URL</label><input className="admin-input" value={form.mapsUrl} onChange={e => set('mapsUrl', e.target.value)} placeholder="https://maps.app.goo.gl/..." /></div>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">ტელეფონი</h3>
          <div className="admin-field"><label className="admin-label">ნომერი (ჩვენდება)</label><input className="admin-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+995 599 286 244" /></div>
          <div className="admin-field"><label className="admin-label">ნომერი (tel: ბმული)</label><input className="admin-input" value={form.phoneHref} onChange={e => set('phoneHref', e.target.value)} placeholder="tel:+995599286244" /></div>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">ელ. ფოსტა</h3>
          <div className="admin-field"><label className="admin-label">ელ. ფოსტა 1</label><input className="admin-input" value={form.email1} onChange={e => set('email1', e.target.value)} placeholder="info@thub.ge" /></div>
          <div className="admin-field"><label className="admin-label">ელ. ფოსტა 2</label><input className="admin-input" value={form.email2} onChange={e => set('email2', e.target.value)} placeholder="orders@thub.ge" /></div>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">სამუშაო საათები</h3>
          <div className="admin-field"><label className="admin-label">სამუშაო დღეები</label><input className="admin-input" value={form.hoursWeekday} onChange={e => set('hoursWeekday', e.target.value)} placeholder="Mon–Fri: 10:00–19:00" /></div>
          <div className="admin-field"><label className="admin-label">შაბათ-კვირა</label><input className="admin-input" value={form.hoursWeekend} onChange={e => set('hoursWeekend', e.target.value)} placeholder="Sat–Sun: 10:00–18:00" /></div>
        </div>
      </div>
    </>
  );
}

// ── Users view ─────────────────────────────────────────────────────────────
function UsersView() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const changePassword = () => {
    if (currentPw !== getAdminPassword()) { setMsg({ ok: false, text: 'მიმდინარე პაროლი არასწორია' }); return; }
    if (newPw.length < 6)                 { setMsg({ ok: false, text: 'ახალი პაროლი მინ. 6 სიმბოლო' }); return; }
    if (newPw !== confirmPw)              { setMsg({ ok: false, text: 'პაროლები არ ემთხვევა' }); return; }
    localStorage.setItem(ADMIN_PW_KEY, newPw);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
    setMsg({ ok: true, text: 'პაროლი წარმატებით შეიცვალა' });
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <>
      <div className="admin-page-header">
        <div><h1 className="admin-page-title">მომხმარებლები</h1><p className="admin-page-sub">ადმინ წვდომის მართვა</p></div>
      </div>
      <div className="admin-settings-grid">
        <div className="admin-card">
          <h3 className="admin-card-title">ადმინ მომხმარებელი</h3>
          <div className="admin-user-row">
            <div className="admin-user-avatar">A</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15 }}>Admin</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>სრული წვდომა · thub.ge/admin</p>
            </div>
            <span className="admin-meta-tag tag-green" style={{ marginLeft: 'auto' }}>აქტიური</span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.6 }}>
            ადმინ პანელი ხელმისაწვდომია <strong>/#/admin</strong> მისამართზე.<br />
            სესია ინახება ბრაუზერის დახურვამდე.
          </p>
        </div>
        <div className="admin-card">
          <h3 className="admin-card-title">პაროლის შეცვლა</h3>
          <div className="admin-field"><label className="admin-label">მიმდინარე პაროლი</label><input type="password" className="admin-input" value={currentPw} onChange={e => setCurrentPw(e.target.value)} /></div>
          <div className="admin-field"><label className="admin-label">ახალი პაროლი (მინ. 6 სიმბ.)</label><input type="password" className="admin-input" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
          <div className="admin-field"><label className="admin-label">გაიმეორეთ ახალი პაროლი</label><input type="password" className="admin-input" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} /></div>
          {msg && <p style={{ fontSize: 13, color: msg.ok ? '#27ae60' : 'var(--red)', marginBottom: 12 }}>{msg.text}</p>}
          <button className="admin-btn-primary" onClick={changePassword}>პაროლის შეცვლა</button>
        </div>
      </div>
    </>
  );
}

// ── Shared confirm modal ───────────────────────────────────────────────────
function ConfirmModal({ title, body, onConfirm, onCancel }: { title: string; body: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="admin-modal-overlay" onClick={onCancel}>
      <div className="admin-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{body}</p>
        <div className="admin-modal-actions">
          <button className="admin-btn-danger" onClick={onConfirm}>წაშლა</button>
          <button className="admin-btn-ghost" onClick={onCancel}>გაუქმება</button>
        </div>
      </div>
    </div>
  );
}
