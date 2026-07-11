import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductImageEditor from '../components/ProductImageEditor';
import { publishLocalContent } from '../utils/contentSync';
import { useProducts } from '../context/ProductsContext';
import { useCatalog } from '../context/CatalogContext';
import { useModels } from '../context/ModelsContext';
import { useGenerations } from '../context/GenerationsContext';
import { GenerationDef, genLabel } from '../data/generations';
import { useTheme } from '../context/ThemeContext';
import { useSiteSettings, ContactSettings, HomeSettings } from '../context/SiteSettingsContext';
import { useCars } from '../context/CarsContext';
import { getCatName, slugify } from '../utils/catalog';
import { fmtUsd, productGel } from '../utils/currency';
import { TeslaModel, Product, CatalogSection, CatalogSubsection, CarListing } from '../types';
import EmployeesPanel from '../components/EmployeesPanel';
import { suggestCategory, CategorySuggestion } from '../utils/partNumber';
import { isValidImageSrc } from '../utils/imageProcess';
import { onImgError } from '../utils/imgFallback';
import { uploadProductImage, isDataImage, uploadedFileName } from '../utils/imageUpload';
import { login as staffLogin, loadSession, saveSession, getInventory, addStock, Session as StaffSession } from '../utils/staffApi';
import './Admin.css';

const SESSION_KEY  = 'thub_admin_auth';
function genId() {
  return 'adm_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Product form helpers ───────────────────────────────────────────────────
type FitsState = Record<string, { enabled: boolean; from: string; to: string }>;
interface ProductForm {
  name: string; nameGe: string; partNumber: string; batch: string;
  sectionId: string; subsectionId: string;
  price: string; currency: 'GEL' | 'USD'; description: string; image: string;
  stockQty: string;
  inStock: boolean; visible: boolean; badge: '' | 'new-original' | 'used-original' | 'new-replica' | 'used-replica';
  rating: string; reviews: string;
  fits: FitsState;
}

function emptyProductForm(catalog: CatalogSection[], models: TeslaModel[]): ProductForm {
  const fits = {} as FitsState;
  models.forEach(m => { fits[m.id] = { enabled: false, from: String(m.years.from), to: String(m.years.to) }; });
  const firstSection = catalog[0];
  return {
    name: '', nameGe: '', partNumber: '', batch: '',
    sectionId: firstSection?.id ?? '',
    subsectionId: firstSection?.subsections[0]?.id ?? '',
    price: '', currency: 'GEL', description: '', image: '',
    stockQty: '0',
    inStock: true, visible: true, badge: '', rating: '4.5', reviews: '0', fits,
  };
}

function productToForm(p: Product, models: TeslaModel[], stockQty: number): ProductForm {
  const fits = {} as FitsState;
  models.forEach(m => {
    const r = p.fits[m.id];
    fits[m.id] = r
      ? { enabled: true, from: String(r.from), to: String(r.to) }
      : { enabled: false, from: String(m.years.from), to: String(m.years.to) };
  });
  return {
    name: p.name, nameGe: p.nameGe, partNumber: p.partNumber, batch: p.batch ?? '',
    sectionId: p.sectionId, subsectionId: p.subsectionId,
    price: String(p.price), currency: p.currency === 'USD' ? 'USD' : 'GEL',
    description: p.description, image: p.image,
    stockQty: String(stockQty),
    inStock: p.inStock, visible: p.visible !== false, badge: p.badge ?? '', rating: String(p.rating), reviews: String(p.reviews), fits,
  };
}

function formToProduct(f: ProductForm, id: string): Product {
  const fitsOut: Product['fits'] = {};
  Object.entries(f.fits).forEach(([modelId, fi]) => {
    if (fi.enabled) fitsOut[modelId] = { from: parseInt(fi.from), to: parseInt(fi.to) };
  });
  return {
    id, partNumber: f.partNumber.trim(), name: f.name.trim(), nameGe: f.nameGe.trim(),
    batch: f.batch.trim() || undefined,
    sectionId: f.sectionId, subsectionId: f.subsectionId,
    price: parseFloat(f.price) || 0, currency: f.currency,
    image: f.image.trim() || 'https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=600&q=80',
    description: f.description.trim(), fits: fitsOut, inStock: f.inStock, visible: f.visible,
    badge: f.badge || undefined, rating: parseFloat(f.rating) || 4.5, reviews: parseInt(f.reviews) || 0,
  };
}

// ── Car form helpers ───────────────────────────────────────────────────────
interface CarForm {
  model: string; year: string; price: string; mileage: string;
  exteriorColor: string; interiorColor: string;
  condition: 'excellent' | 'good' | 'fair';
  batteryRange: string; autopilot: boolean; fsd: boolean;
  description: string; photos: string[]; available: boolean;
}

function emptyCarForm(): CarForm {
  return {
    model: 'Model 3', year: String(new Date().getFullYear()), price: '', mileage: '',
    exteriorColor: '', interiorColor: '',
    condition: 'excellent', batteryRange: '', autopilot: false, fsd: false,
    description: '', photos: [], available: true,
  };
}

function carToForm(c: CarListing): CarForm {
  return {
    model: c.model, year: String(c.year), price: String(c.price), mileage: String(c.mileage),
    exteriorColor: c.exteriorColor, interiorColor: c.interiorColor,
    condition: c.condition, batteryRange: String(c.batteryRange),
    autopilot: c.autopilot, fsd: c.fsd, description: c.description,
    photos: [...c.photos], available: c.available,
  };
}

function formToCar(f: CarForm, id: string): CarListing {
  return {
    id, model: f.model.trim(), year: parseInt(f.year) || new Date().getFullYear(),
    price: parseFloat(f.price) || 0, mileage: parseInt(f.mileage) || 0,
    exteriorColor: f.exteriorColor.trim(), interiorColor: f.interiorColor.trim(),
    condition: f.condition, batteryRange: parseInt(f.batteryRange) || 0,
    autopilot: f.autopilot, fsd: f.fsd, description: f.description.trim(),
    photos: f.photos, available: f.available,
  };
}

// ── Main ───────────────────────────────────────────────────────────────────
type Tab  = 'products' | 'categories' | 'models' | 'home' | 'contact' | 'users' | 'cars';
type View = 'list' | 'product-form';

export default function Admin() {
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(SESSION_KEY));
  const [tab,  setTab]  = useState<Tab>('products');
  const [view, setView] = useState<View>('list');

  const { products, isAdminProduct, addProduct, updateProduct, deleteProduct } = useProducts();
  const { catalog } = useCatalog();
  const { models } = useModels();
  const { cars, addCar, updateCar, deleteCar } = useCars();
  const { theme, toggleTheme } = useTheme();

  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [productForm, setProductForm]     = useState<ProductForm>(() => emptyProductForm(catalog, models));
  const [savingProduct, setSavingProduct] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productSectionFilter, setProductSectionFilter] = useState('all');
  const [productModelFilter, setProductModelFilter] = useState('all');
  const [deleteProductTarget, setDeleteProductTarget]   = useState<string | null>(null);

  const [carsView, setCarsView] = useState<'list' | 'form'>('list');
  const [editCarId, setEditCarId] = useState<string | null>(null);
  const [carForm, setCarForm] = useState<CarForm>(emptyCarForm());
  const [deleteCarTarget, setDeleteCarTarget] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);

  // Stock balances (qty per product id) — edited from the product form now that
  // POS intake is gone and stock arrives via the admin panel only.
  const [inventory, setInventory] = useState<Record<string, number>>({});

  // Once an admin is logged in, publish any local-only edits the server doesn't
  // yet have, so pre-existing changes become visible site-wide.
  useEffect(() => { if (authed) publishLocalContent(); }, [authed]);

  useEffect(() => {
    if (!authed) return;
    const s = loadSession();
    if (s) getInventory(s).then(setInventory).catch(() => {});
  }, [authed]);

  // Migrate embedded (base64) photos to server files, one per pass, so the
  // catalog JSON shrinks. Corrupt photo data is skipped — those need a manual
  // re-upload; failed uploads keep the embedded copy and everything works.
  const migrationTried = useRef<Set<string>>(new Set());
  const migrating = useRef(false);
  const productsRef = useRef(products);
  productsRef.current = products;
  useEffect(() => {
    if (!authed || migrating.current) return;
    const target = products.find(p =>
      isDataImage(p.image) && isValidImageSrc(p.image) && !migrationTried.current.has(p.id));
    if (!target) return;
    migrating.current = true;
    migrationTried.current.add(target.id);
    const targetId = target.id;
    uploadProductImage(target.image, { partNumber: target.partNumber, productId: target.id })
      .then(url => {
        if (!url) return;
        // Merge only the image onto the *latest* version of the product — the
        // admin may have edited/saved it while the upload was in flight, so we
        // must not write back the stale snapshot captured above.
        const latest = productsRef.current.find(p => p.id === targetId);
        if (latest) updateProduct({ ...latest, image: url });
      })
      .finally(() => { migrating.current = false; });
  });

  if (!authed) return <LoginScreen onLogin={() => { sessionStorage.setItem(SESSION_KEY, '1'); setAuthed(true); }} />;

  const startAddProduct = () => {
    setEditProductId(null);
    setProductForm(emptyProductForm(catalog, models));
    setView('product-form');
  };
  const startEditProduct = (p: Product) => {
    setEditProductId(p.id);
    setProductForm(productToForm(p, models, inventory[p.id] ?? 0));
    setView('product-form');
  };
  const handleSaveProduct = async () => {
    if (savingProduct) return; // guard against a double-click minting two products
    if (!productForm.name.trim() || !productForm.partNumber.trim() || !productForm.price) {
      alert('შეავსეთ სახელი, ნომერი და ფასი.'); return;
    }
    if (productForm.image && !isValidImageSrc(productForm.image)) {
      alert('ფოტოს მონაცემები დაზიანებულია და ბრაუზერი ვერ აჩვენებს — ატვირთეთ ფოტო ხელახლა.'); return;
    }
    // An empty qty field means "don't touch stock" — never read it as 0, which
    // would post a negative adjustment and wipe the product's balance.
    const qtyRaw = productForm.stockQty.trim();
    const qtyGiven = qtyRaw !== '' && Number.isFinite(parseInt(qtyRaw, 10));
    const qty = qtyGiven ? Math.max(0, parseInt(qtyRaw, 10)) : (inventory[editProductId ?? ''] ?? 0);
    const delta = qty - (inventory[editProductId ?? ''] ?? 0);
    if (delta < 0 && !confirm(`მარაგი შემცირდება ${-delta} ერთეულით (→ ${qty}). გავაგრძელოთ?`)) return;

    setSavingProduct(true);
    try {
      const id = editProductId ?? genId();
      // photos are stored as files on the server (small catalog JSON + SEO
      // names); when the upload isn't possible the embedded copy is kept
      let form = productForm;
      if (isDataImage(form.image)) {
        const prev = editProductId ? products.find(p => p.id === editProductId)?.image : undefined;
        const url = await uploadProductImage(form.image, {
          partNumber: form.partNumber.trim(),
          productId: id,
          replaces: prev ? uploadedFileName(prev) : undefined,
        });
        if (url) form = { ...form, image: url };
      }
      if (editProductId) updateProduct(formToProduct(form, id));
      else               addProduct(formToProduct(form, id));

      // stock changes go through addStock so they land in the movement report
      // (მოძრაობის რეპორტი) with the date and the admin's name
      if (delta !== 0) {
        const s = loadSession();
        if (s) {
          try {
            await addStock(s, {
              type: 'adjustment',
              items: [{ productId: id, name: form.name.trim(), partNumber: form.partNumber.trim(), qty: delta }],
              note: editProductId ? 'ადმინ პანელი — მარაგის ცვლილება' : 'ადმინ პანელი — ახალი პროდუქტი',
            });
            setInventory(prev => ({ ...prev, [id]: qty }));
          } catch (ex) {
            // keep the form open so the qty can be retried rather than lost
            alert(`პროდუქტი შენახულია, მაგრამ მარაგის რაოდენობა ვერ შეინახა: ${ex instanceof Error ? ex.message : 'შეცდომა'}`);
            return;
          }
        } else {
          alert('პროდუქტი შენახულია, მაგრამ მარაგის შესანახად საჭიროა ხელახლა შესვლა ადმინის ანგარიშით.');
          return;
        }
      }
      setView('list');
    } finally {
      setSavingProduct(false);
    }
  };

  const displayedProducts = products.filter(p => {
    if (productSectionFilter !== 'all' && p.sectionId !== productSectionFilter) return false;
    if (productModelFilter !== 'all' && !p.fits[productModelFilter]) return false;
    if (productSearch) {
      const q = productSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.nameGe.toLowerCase().includes(q) || p.partNumber.toLowerCase().includes(q);
    }
    return true;
  });

  const switchTab = (t: Tab) => { setTab(t); setView('list'); setNavOpen(false); };

  const downloadBackup = async () => {
    const s = loadSession();
    if (!s || s.local) { alert('ბექაფი მუშაობს მხოლოდ მონაცემთა ბაზასთან — გახსენით საიტი thub.ge-ზე'); return; }
    try {
      const res = await fetch('api/backup.php?mode=download', { headers: { Authorization: `Bearer ${s.token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `thub-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      alert('ბექაფის ჩამოტვირთვა ვერ მოხერხდა');
    }
  };

  const Sidebar = () => (
    <aside className={`admin-sidebar ${navOpen ? 'admin-sidebar-open' : ''}`}>
      <div className="admin-sidebar-top">
        <div className="admin-logo">
          <span className="admin-logo-t">T</span>Hub <span className="admin-logo-admin">Admin</span>
        </div>
        <button className="admin-close-btn" onClick={() => setNavOpen(false)} aria-label="Close menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <nav className="admin-nav">
        <NavBtn active={tab === 'products'}   onClick={() => switchTab('products')}   icon={<IcoBox />}   label="პროდუქტები"    count={products.length} />
        <NavBtn active={tab === 'categories'} onClick={() => switchTab('categories')} icon={<IcoList />}  label="კატეგორიები"   count={catalog.length} />
        <NavBtn active={tab === 'models'}     onClick={() => switchTab('models')}     icon={<IcoCar />}   label="მოდელები"      count={models.length} />
        <NavBtn active={tab === 'home'}       onClick={() => switchTab('home')}       icon={<IcoHome />}  label="მთავარი გვ." />
        <NavBtn active={tab === 'contact'}    onClick={() => switchTab('contact')}    icon={<IcoPhone />} label="საკონტაქტო" />
        <NavBtn active={tab === 'users'}      onClick={() => switchTab('users')}      icon={<IcoUser />}  label="თანამშრომლები" />
        <NavBtn active={tab === 'cars'}       onClick={() => switchTab('cars')}       icon={<IcoCar />}   label="ავტომობილები" count={cars.length} />
        <Link to="/pos" className="admin-nav-btn admin-nav-pos">
          <IcoPos />
          POS — გაყიდვები
        </Link>
      </nav>
      <div className="admin-prefs">
        <button
          className="admin-theme-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'ღია თემა' : 'მუქი თემა'}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>
      <button className="admin-logout" style={{ marginBottom: 8 }} onClick={downloadBackup}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        ბაზის ბექაფი
      </button>
      <button className="admin-logout" onClick={() => { sessionStorage.removeItem(SESSION_KEY); saveSession(null); setAuthed(false); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        გამოსვლა
      </button>
    </aside>
  );

  return (
    <div className="admin-wrap">
      {navOpen && <div className="admin-backdrop" onClick={() => setNavOpen(false)} />}
      <Sidebar />

      <main className="admin-main">
        <div className="admin-topbar">
          <button className="admin-hamburger" onClick={() => setNavOpen(true)} aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="admin-topbar-logo"><span style={{ color: 'var(--red)' }}>T</span>Hub Admin</span>
        </div>
        {tab === 'products' && view === 'list' && (
          <ProductsList
            allProducts={products}
            models={models}
            inventory={inventory}
            products={displayedProducts} allCount={products.length}
            search={productSearch} sectionFilter={productSectionFilter} modelFilter={productModelFilter}
            catalog={catalog} isAdmin={isAdminProduct}
            onSearch={setProductSearch} onSectionFilter={setProductSectionFilter} onModelFilter={setProductModelFilter}
            onAdd={startAddProduct} onEdit={startEditProduct} onDelete={setDeleteProductTarget}
          />
        )}
        {tab === 'products' && view === 'product-form' && (
          <ProductFormView
            products={products} saving={savingProduct}
            form={productForm} onChange={setProductForm}
            onSave={handleSaveProduct} onCancel={() => setView('list')}
            isEdit={!!editProductId} editId={editProductId} catalog={catalog} models={models}
          />
        )}
        {tab === 'categories' && <CategoriesView />}
        {tab === 'models'     && <ModelsView />}
        {tab === 'home'       && <HomeSettingsView />}
        {tab === 'contact'    && <ContactSettingsView />}
        {tab === 'users'      && <EmployeesTab />}
        {tab === 'cars' && carsView === 'list' && (
          <CarsAdminList
            cars={cars}
            onAdd={() => { setEditCarId(null); setCarForm(emptyCarForm()); setCarsView('form'); }}
            onEdit={c => { setEditCarId(c.id); setCarForm(carToForm(c)); setCarsView('form'); }}
            onDelete={setDeleteCarTarget}
          />
        )}
        {tab === 'cars' && carsView === 'form' && (
          <CarsAdminForm
            form={carForm} onChange={setCarForm} isEdit={!!editCarId}
            onSave={() => {
              if (!carForm.model.trim() || !carForm.price) { alert('შეავსეთ მოდელი და ფასი.'); return; }
              if (editCarId) updateCar(formToCar(carForm, editCarId));
              else addCar(formToCar(carForm, genId()));
              setCarsView('list');
            }}
            onCancel={() => setCarsView('list')}
          />
        )}
      </main>

      {deleteProductTarget && (
        <ConfirmModal
          title="წაიშალოს პროდუქტი?" body="ეს მოქმედება შეუქცევადია."
          onConfirm={() => { deleteProduct(deleteProductTarget); setDeleteProductTarget(null); }}
          onCancel={() => setDeleteProductTarget(null)}
        />
      )}
      {deleteCarTarget && (
        <ConfirmModal
          title="წაიშალოს ავტომობილი?" body="ეს მოქმედება შეუქცევადია."
          onConfirm={() => { deleteCar(deleteCarTarget); setDeleteCarTarget(null); }}
          onCancel={() => setDeleteCarTarget(null)}
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
const IcoPos  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M2 9h20M7 22h10"/></svg>;

// ── Login (shared employee accounts — same as POS) ─────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr('');
    try {
      const s = await staffLogin(username.trim(), pw);
      if (s.employee.role !== 'admin') {
        setErr('წვდომა მხოლოდ ადმინისტრატორისთვის'); setBusy(false); return;
      }
      saveSession(s);
      onLogin();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'შეცდომა');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-logo" style={{ marginBottom: 24 }}>
          <span className="admin-logo-t">T</span>Hub <span className="admin-logo-admin">Admin</span>
        </div>
        <h2>ადმინ პანელი</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>შედით თანამშრომლის ანგარიშით (ადმინის როლი)</p>
        <input className={`admin-input ${err ? 'admin-input-error' : ''}`}
          placeholder="მომხმარებელი" value={username} style={{ marginBottom: 10 }}
          onChange={e => { setUsername(e.target.value); setErr(''); }} autoFocus autoComplete="username" />
        <input type="password" className={`admin-input ${err ? 'admin-input-error' : ''}`}
          placeholder="პაროლი" value={pw}
          onChange={e => { setPw(e.target.value); setErr(''); }} autoComplete="current-password" />
        {err && <p className="admin-error">{err}</p>}
        <button type="submit" className="admin-btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>
          {busy ? 'იტვირთება…' : 'შესვლა'}
        </button>
      </form>
    </div>
  );
}

// ── Products list ──────────────────────────────────────────────────────────
// USD→GEL rate: converts USD products to lari on the public site and books
// dollar sales in the POS. Synced through site settings to every device.
function UsdRateEditor() {
  const { settings, updatePos } = useSiteSettings();
  const [value, setValue] = useState(String(settings.pos.usdRate));
  const [saved, setSaved] = useState(false);

  const save = () => {
    const rate = parseFloat(value);
    if (!isFinite(rate) || rate <= 0) { setValue(String(settings.pos.usdRate)); return; }
    updatePos({ ...settings.pos, usdRate: rate });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="admin-usd-rate" title="დოლარის კურსი — ამ კურსით ჩანს $ პროდუქტების ფასი საიტზე ლარში">
      <span className="admin-usd-rate-label">$1 =</span>
      <input className="admin-input admin-usd-rate-input" type="number" min="0" step="0.01"
        value={value} onChange={e => setValue(e.target.value)}
        onBlur={save} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
      <span className="admin-usd-rate-label">₾{saved ? ' ✓' : ''}</span>
      <label className="admin-usd-show" title="ჩართვისას საიტზე ლარის გვერდით $ ფასიც გამოჩნდება USD პროდუქტებზე">
        <input type="checkbox" checked={settings.pos.showUsdOnSite === true}
          onChange={e => updatePos({ ...settings.pos, showUsdOnSite: e.target.checked })} />
        $ საიტზეც
      </label>
    </div>
  );
}

function ProductsList({ products, allProducts, models, inventory, allCount, search, sectionFilter, modelFilter, catalog, isAdmin, onSearch, onSectionFilter, onModelFilter, onAdd, onEdit, onDelete }: {
  products: Product[]; allProducts: Product[]; models: TeslaModel[]; inventory: Record<string, number>; allCount: number; search: string; sectionFilter: string; modelFilter: string;
  catalog: CatalogSection[]; isAdmin: (id: string) => boolean;
  onSearch: (s: string) => void; onSectionFilter: (s: string) => void; onModelFilter: (s: string) => void;
  onAdd: () => void; onEdit: (p: Product) => void; onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">პროდუქტები</h1>
          <p className="admin-page-sub">სულ: <strong>{allCount}</strong> · ნაჩვენებია: <strong>{products.length}</strong></p>
        </div>
        <div className="admin-header-actions">
          <UsdRateEditor />
          <button className="admin-btn-primary" onClick={onAdd}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            ახალი პროდუქტი
          </button>
        </div>
      </div>
      <div className="admin-filters">
        <input type="text" className="admin-search" style={{ marginBottom: 0 }} placeholder="ძებნა სახელით ან ნომრით..."
          value={search} onChange={e => onSearch(e.target.value)} />
        <select className="admin-input admin-select admin-cat-select-mobile" value={sectionFilter} onChange={e => onSectionFilter(e.target.value)}>
          <option value="all">ყველა კატეგორია</option>
          {catalog.map(s => <option key={s.id} value={s.id}>{s.nameGe || s.name}</option>)}
        </select>
        <select className="admin-input admin-select admin-cat-select-mobile" value={modelFilter} onChange={e => onModelFilter(e.target.value)}>
          <option value="all">ყველა მოდელი</option>
          {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="admin-prod-layout">
        <aside className="admin-cat-side">
          <div className="admin-model-filter">
            <button
              className={`admin-model-btn ${modelFilter === 'all' ? 'admin-model-btn-active' : ''}`}
              onClick={() => onModelFilter('all')}
            >
              ყველა მოდელი
            </button>
            {models.map(m => (
              <button
                key={m.id}
                className={`admin-model-btn ${modelFilter === m.id ? 'admin-model-btn-active' : ''}`}
                onClick={() => onModelFilter(m.id)}
                style={modelFilter === m.id ? { borderColor: m.color, color: m.color } : undefined}
              >
                {m.id}
              </button>
            ))}
          </div>
          <button
            className={`admin-cat-btn ${sectionFilter === 'all' ? 'admin-cat-btn-active' : ''}`}
            onClick={() => onSectionFilter('all')}
          >
            <span>ყველა</span>
            <span className="admin-cat-count">{allProducts.length}</span>
          </button>
          {catalog.map(s => {
            const n = allProducts.filter(p => p.sectionId === s.id).length;
            if (n === 0) return null;
            return (
              <button key={s.id}
                className={`admin-cat-btn ${sectionFilter === s.id ? 'admin-cat-btn-active' : ''}`}
                onClick={() => onSectionFilter(s.id)}
              >
                {s.groupNumber != null && <span className="admin-cat-num">{s.groupNumber}</span>}
                <span className="admin-cat-name">{s.nameGe || s.name}</span>
                <span className="admin-cat-count">{n}</span>
              </button>
            );
          })}
        </aside>
        {products.length === 0
          ? <div className="admin-empty"><div className="admin-empty-icon">📦</div><h3>პროდუქტები ვერ მოიძებნა</h3></div>
          : <div className="admin-product-grid">
              {products.map(p => (
                <ProductRow key={p.id} product={p} catalog={catalog} models={models} stockQty={inventory[p.id] ?? 0} isAdmin={isAdmin(p.id)} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
        }
      </div>
    </>
  );
}

// thumbnail that opens an enlarged view on click
function ZoomThumb({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <img
        src={src} alt={alt} className="admin-product-thumb admin-thumb-clickable"
        title="სურათის გადიდება"
        onClick={() => setOpen(true)} onError={onImgError}
      />
      {open && (
        <div className="admin-lightbox" onClick={() => setOpen(false)}>
          <img src={src} alt={alt} onClick={e => e.stopPropagation()} />
          <button className="admin-lightbox-close" aria-label="დახურვა" onClick={() => setOpen(false)}>×</button>
        </div>
      )}
    </>
  );
}

function ProductRow({ product, catalog, models, stockQty, isAdmin, onEdit, onDelete }: {
  product: Product; catalog: CatalogSection[]; models: TeslaModel[]; stockQty: number; isAdmin: boolean;
  onEdit: (p: Product) => void; onDelete: (id: string) => void;
}) {
  const section = catalog.find(s => s.id === product.sectionId);
  const fitEntries = Object.entries(product.fits ?? {});
  return (
    <div className="admin-product-card">
      <ZoomThumb src={product.image} alt={product.name} />
      <div className="admin-product-info">
        <p className="admin-product-name">{product.name}</p>
        <p className="admin-product-namege">{product.nameGe}</p>
        <div className="admin-product-meta">
          <span className="admin-meta-tag">#{product.partNumber}</span>
          {product.batch && <span className="admin-meta-tag">პარტია: {product.batch}</span>}
          {section && <span className="admin-meta-tag">{section.nameGe || section.name}</span>}
          <span className={`admin-meta-tag ${product.inStock ? 'tag-green' : 'tag-red'}`}>
            {product.inStock ? 'მარაგშია' : 'არ არის'}
          </span>
          <span className={`admin-meta-tag ${stockQty > 0 ? 'tag-green' : 'tag-red'}`}>რაოდ.: {stockQty}</span>
          {product.visible === false && <span className="admin-meta-tag tag-red">დამალულია</span>}
          {!isAdmin && <span className="admin-meta-tag tag-sys">სისტემური</span>}
          {fitEntries.length === 0
            ? <span className="admin-meta-tag tag-fit">ყველა მოდელი</span>
            : fitEntries.map(([mid, r]) => {
                const mdl = models.find(mm => mm.id === mid);
                return (
                  <span key={mid} className="admin-meta-tag tag-fit">
                    🚗 {mdl?.name ?? mid} {r!.from}–{r!.to}
                  </span>
                );
              })}
        </div>
      </div>
      <div className="admin-product-price">
        {product.currency === 'USD'
          ? <>{fmtUsd(product.price)}<small className="admin-price-gel">≈ {productGel(product).toLocaleString()} ₾</small></>
          : <>{product.price.toLocaleString()} ₾</>}
      </div>
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
function ProductFormView({ products, saving, form, onChange, onSave, onCancel, isEdit, editId, catalog, models }: {
  products: Product[]; saving: boolean;
  form: ProductForm; onChange: (f: ProductForm) => void;
  onSave: () => void; onCancel: () => void; isEdit: boolean; editId: string | null;
  catalog: CatalogSection[]; models: TeslaModel[];
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorFile, setEditorFile] = useState<File | string | null>(null);
  const set = (key: keyof ProductForm, value: unknown) => onChange({ ...form, [key]: value });

  const [pnSuggestion, setPnSuggestion] = useState<CategorySuggestion | null>(null);

  const handlePartNumber = (value: string) => {
    const sug = suggestCategory(value, products);
    setPnSuggestion(sug);
    // for NEW products apply the detected category automatically; when
    // editing, only suggest (the category was chosen deliberately before)
    if (sug && !isEdit) {
      onChange({ ...form, partNumber: value, sectionId: sug.sectionId, subsectionId: sug.subsectionId });
    } else {
      onChange({ ...form, partNumber: value });
    }
  };

  const applySuggestion = () => {
    if (!pnSuggestion) return;
    onChange({ ...form, sectionId: pnSuggestion.sectionId, subsectionId: pnSuggestion.subsectionId });
  };

  const suggestionLabel = (s: CategorySuggestion) => {
    const sec = catalog.find(x => x.id === s.sectionId);
    const sub = sec?.subsections.find(x => x.id === s.subsectionId);
    return `${sec?.nameGe || sec?.name || s.sectionId} → ${sub?.nameGe || sub?.name || s.subsectionId}`;
  };

  const currentSection = catalog.find(s => s.id === form.sectionId);
  const subsections    = currentSection?.subsections ?? [];

  const handleSectionChange = (sectionId: string) => {
    const sec = catalog.find(s => s.id === sectionId);
    onChange({ ...form, sectionId, subsectionId: sec?.subsections[0]?.id ?? '' });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setEditorFile(file);
  };

  const updateFits = (modelId: string, key: 'enabled' | 'from' | 'to', val: string | boolean) =>
    onChange({ ...form, fits: { ...form.fits, [modelId]: { ...form.fits[modelId], [key]: val } } });

  // Same part code on other products is allowed (old parts get a separate
  // product with a different picture/batch) — just tell the admin about it.
  const sameCode = form.partNumber.trim()
    ? products.filter(p => p.id !== editId && p.partNumber.trim().toLowerCase() === form.partNumber.trim().toLowerCase())
    : [];

  const stepQty = (d: number) => set('stockQty', String(Math.max(0, (parseInt(form.stockQty) || 0) + d)));

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
          <button className="admin-btn-ghost" onClick={onCancel} disabled={saving}>გაუქმება</button>
          <button className="admin-btn-primary" onClick={onSave} disabled={saving}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            {saving ? 'ინახება…' : 'შენახვა'}
          </button>
        </div>
      </div>

      <div className="admin-form-grid">
        <div className="admin-form-col">
          <div className="admin-card">
            <h3 className="admin-card-title">სურათი</h3>
            <div className="admin-img-preview">
              {form.image
                ? <img src={form.image} alt="preview" className="admin-img-thumb" />
                : <div className="admin-img-placeholder">📷</div>
              }
            </div>
            <div className="admin-img-actions">
              <label className="admin-btn-ghost admin-img-upload-label">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                ფოტოს ატვირთვა / გადაღება
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment"
                  style={{ display: 'none' }} onChange={handleFile} />
              </label>
              {form.image && (
                <button type="button" className="admin-btn-ghost admin-img-upload-label" onClick={() => setEditorFile(form.image)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  სურათის რედაქტირება
                </button>
              )}
              <p className="admin-img-process-note">
                ↑ 800×600 (4:3) · მუქი ფონი · THub.ge ბეიჯი · მასშტაბი და პოზიცია მორგებადია
              </p>
              <div className="admin-img-divider"><span>ან URL-ით</span></div>
              <input type="text" className="admin-input" placeholder="https://images.unsplash.com/..."
                value={form.image.startsWith('data:') ? '' : form.image}
                onChange={e => set('image', e.target.value)} />
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
            <label className="admin-toggle-row">
              <span>ვაჩვენოთ საიტზე</span>
              <button type="button" className={`admin-toggle ${form.visible ? 'admin-toggle-on' : ''}`} onClick={() => set('visible', !form.visible)}>
                <span className="admin-toggle-knob" />
              </button>
            </label>
            {!form.visible && (
              <p className="admin-hint" style={{ marginTop: 8, color: 'var(--text-muted)' }}>
                გამორთვისას პროდუქტი არ გამოჩნდება საიტზე, მარაგში არსებობის მიუხედავად.
              </p>
            )}
            <div className="admin-field" style={{ marginTop: 12 }}>
              <label className="admin-label">ნაწილის სტატუსი</label>
              <select className="admin-input" value={form.badge} onChange={e => set('badge', e.target.value)}>
                <option value="">— არ არის —</option>
                <option value="new-original">ახალი ორიგინალი</option>
                <option value="used-original">მეორადი ორიგინალი</option>
                <option value="new-replica">ახალი რეპლიკა</option>
                <option value="used-replica">მეორადი რეპლიკა</option>
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
                <input className="admin-input" value={form.partNumber} onChange={e => handlePartNumber(e.target.value)} placeholder="1494822-00-F" />
                {sameCode.length > 0 && (
                  <p className="admin-pn-hint">
                    ℹ️ ეს კოდი უკვე აქვს {sameCode.length} პროდუქტს{form.batch.trim() ? '' : ' — ძველი ნაწილი განასხვავეთ პარტიით და სხვა ფოტოთი'}
                  </p>
                )}
                {pnSuggestion && (
                  <p className={`admin-pn-hint ${pnSuggestion.confidence === 'high' ? 'admin-pn-hint-high' : ''}`}>
                    🪄 {isEdit ? 'შესაძლო კატეგორია' : 'კატეგორია განისაზღვრა'}: <strong>{suggestionLabel(pnSuggestion)}</strong>
                    <span className="admin-pn-hint-src">მსგავსი: #{pnSuggestion.matchedPartNumber} {pnSuggestion.matchedName}</span>
                    {isEdit && (form.sectionId !== pnSuggestion.sectionId || form.subsectionId !== pnSuggestion.subsectionId) && (
                      <button type="button" className="admin-pn-apply" onClick={applySuggestion}>გამოყენება</button>
                    )}
                  </p>
                )}
              </div>
              <div className="admin-field">
                <label className="admin-label">ფასი *</label>
                <div className="admin-price-row">
                  <input className="admin-input" type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="1850" />
                  <select className="admin-input admin-price-currency" value={form.currency}
                    onChange={e => set('currency', e.target.value as 'GEL' | 'USD')}>
                    <option value="GEL">₾ ლარი</option>
                    <option value="USD">$ დოლარი</option>
                  </select>
                </div>
                {form.currency === 'USD' && (
                  <p className="admin-hint" style={{ marginTop: 6, color: 'var(--text-muted)' }}>
                    საიტზე მყიდველი დაინახავს მხოლოდ ლარში გადაყვანილ ფასს — დოლარი ჩანს მხოლოდ POS-ში.
                  </p>
                )}
              </div>
            </div>
            <div className="admin-row-2">
              <div className="admin-field">
                <label className="admin-label">პარტია (ბაჩი)</label>
                <input className="admin-input" value={form.batch} onChange={e => set('batch', e.target.value)} placeholder="მაგ: 2026-07 · დონორი Model 3 '19" />
                <p className="admin-hint" style={{ marginTop: 6, color: 'var(--text-muted)' }}>
                  ძველი ნაწილი დაამატეთ ცალკე პროდუქტად — იგივე კოდით, სხვა ფოტოთი და პარტიით.
                </p>
              </div>
              <div className="admin-field">
                <label className="admin-label">რაოდენობა მარაგში</label>
                <div className="admin-qty-ctrl">
                  <button type="button" className="admin-qty-btn" onClick={() => stepQty(-1)} aria-label="კლება">−</button>
                  <input className="admin-input admin-qty-input" inputMode="numeric" value={form.stockQty}
                    onChange={e => set('stockQty', e.target.value)} />
                  <button type="button" className="admin-qty-btn" onClick={() => stepQty(1)} aria-label="მატება">+</button>
                </div>
                <p className="admin-hint" style={{ marginTop: 6, color: 'var(--text-muted)' }}>
                  ახალი მოსული ნაწილი ამავე პროდუქტს ერგება? უბრალოდ გაზარდეთ რაოდენობა.
                </p>
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
        </div>
      </div>

      {editorFile && (
        <ProductImageEditor
          source={editorFile}
          onSave={dataUrl => { set('image', dataUrl); setEditorFile(null); }}
          onCancel={() => setEditorFile(null)}
        />
      )}
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
  const { getGenerations } = useGenerations();
  const [modal, setModal]   = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [form, setForm]     = useState<ModelForm>({ id: '', name: '', fullName: '', yearFrom: '2020', yearTo: '2025', color: '#888888' });
  const [deleteTgt, setDeleteTgt] = useState<string | null>(null);
  const [genModel, setGenModel]   = useState<TeslaModel | null>(null);

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
              <button className="admin-gen-link" onClick={() => setGenModel(m)}>
                თაობები: {getGenerations(m.id, m.name, m.years.from, m.years.to).map(g => `${g.from}–${g.to}`).join(', ')} ✎
              </button>
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

      {genModel && <GenerationsModal model={genModel} onClose={() => setGenModel(null)} />}
    </>
  );
}

// ── Generations (model year-ranges) editor ─────────────────────────────────
type GenRow = { id: string; from: string; to: string; note: string };

function GenerationsModal({ model, onClose }: { model: TeslaModel; onClose: () => void }) {
  const { getDefs, saveDefs, resetDefs, isCustom } = useGenerations();
  const [rows, setRows] = useState<GenRow[]>(() =>
    getDefs(model.id, model.years.from, model.years.to).map(d => ({
      id: d.id, from: String(d.from), to: String(d.to), note: d.note ?? '',
    }))
  );

  const update = (i: number, patch: Partial<GenRow>) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const addRow = () =>
    setRows(rs => [...rs, { id: genId(), from: String(model.years.from), to: String(model.years.to), note: '' }]);
  const removeRow = (i: number) => setRows(rs => rs.filter((_, idx) => idx !== i));

  const save = () => {
    const cleaned: GenerationDef[] = rows
      .map(r => ({
        id: r.id || genId(),
        from: parseInt(r.from) || model.years.from,
        to: parseInt(r.to) || model.years.to,
        note: r.note.trim() || undefined,
      }))
      .sort((a, b) => a.from - b.from);
    if (cleaned.length === 0) { alert('დაამატეთ მინიმუმ ერთი თაობა.'); return; }
    saveDefs(model.id, cleaned);
    onClose();
  };

  const reset = () => { resetDefs(model.id); onClose(); };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-wide" onClick={e => e.stopPropagation()}>
        <h3>{model.name} — თაობები</h3>
        <p className="admin-page-sub" style={{ margin: '4px 0 16px' }}>
          წლების დიაპაზონები, რომლებიც კატალოგში მოდელზე დაჭერისას ჩანს.
        </p>

        <div className="admin-gen-rows">
          {rows.map((r, i) => (
            <div key={r.id} className="admin-gen-row">
              <input className="admin-input admin-year-input" type="number" value={r.from}
                onChange={e => update(i, { from: e.target.value })} placeholder="დან" />
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <input className="admin-input admin-year-input" type="number" value={r.to}
                onChange={e => update(i, { to: e.target.value })} placeholder="მდე" />
              <input className="admin-input" style={{ flex: 1 }} value={r.note}
                onChange={e => update(i, { note: e.target.value })} placeholder="ნიშანი (მაგ. Highland) — არასავალდებულო" />
              <button className="admin-btn-icon admin-btn-icon-danger" onClick={() => removeRow(i)} aria-label="წაშლა">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          ))}
        </div>

        <button className="admin-btn-ghost admin-gen-add" onClick={addRow}>+ თაობის დამატება</button>

        <div className="admin-gen-preview">
          {rows.filter(r => r.from && r.to).map(r => (
            <span key={r.id} className="admin-meta-tag tag-fit">
              {genLabel(model.name, { from: parseInt(r.from), to: parseInt(r.to), note: r.note.trim() || undefined })}
            </span>
          ))}
        </div>

        <div className="admin-modal-actions">
          <button className="admin-btn-primary" onClick={save}>შენახვა</button>
          {isCustom(model.id) && <button className="admin-btn-ghost" onClick={reset}>ნაგულისხმევზე დაბრუნება</button>}
          <button className="admin-btn-ghost" onClick={onClose}>გაუქმება</button>
        </div>
      </div>
    </div>
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

// ── Employees tab (shared with POS) ────────────────────────────────────────
function EmployeesTab() {
  const session: StaffSession | null = loadSession();
  if (!session || session.employee.role !== 'admin') {
    return (
      <div className="admin-card" style={{ maxWidth: 480 }}>
        <h3 className="admin-card-title">თანამშრომლები</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          სესია ვერ მოიძებნა — გამოდით და შედით ხელახლა ადმინის ანგარიშით.
        </p>
      </div>
    );
  }
  return <EmployeesPanel session={session} />;
}

// ── Cars admin list ────────────────────────────────────────────────────────
function CarsAdminList({ cars, onAdd, onEdit, onDelete }: {
  cars: CarListing[];
  onAdd: () => void; onEdit: (c: CarListing) => void; onDelete: (id: string) => void;
}) {
  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">ავტომობილები</h1>
          <p className="admin-page-sub">სულ: <strong>{cars.length}</strong></p>
        </div>
        <button className="admin-btn-primary" onClick={onAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          ახალი ავტომობილი
        </button>
      </div>
      {cars.length === 0
        ? <div className="admin-empty"><div className="admin-empty-icon">🚗</div><h3>ავტომობილები არ არის</h3></div>
        : <div className="admin-product-grid">
            {cars.map(c => (
              <div key={c.id} className="admin-product-card">
                {c.photos[0]
                  ? <img src={c.photos[0]} alt={c.model} className="admin-product-thumb" />
                  : <div className="admin-product-thumb" style={{ background: '#222', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 28 }}>🚗</div>
                }
                <div className="admin-product-info">
                  <p className="admin-product-name">{c.year} Tesla {c.model}</p>
                  <div className="admin-product-meta">
                    <span className="admin-meta-tag">{c.mileage.toLocaleString()} კმ</span>
                    <span className={`admin-meta-tag ${c.available ? 'tag-green' : 'tag-red'}`}>
                      {c.available ? 'ხელმისაწვდომია' : 'გაყიდულია'}
                    </span>
                  </div>
                </div>
                <div className="admin-product-price">{c.price.toLocaleString()} ₾</div>
                <div className="admin-product-actions">
                  <button className="admin-btn-icon" onClick={() => onEdit(c)} title="რედაქტირება">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="admin-btn-icon admin-btn-icon-danger" onClick={() => onDelete(c.id)} title="წაშლა">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
      }
    </>
  );
}

// ── Cars admin form ────────────────────────────────────────────────────────
function CarsAdminForm({ form, onChange, onSave, onCancel, isEdit }: {
  form: CarForm; onChange: (f: CarForm) => void;
  onSave: () => void; onCancel: () => void; isEdit: boolean;
}) {
  const set = <K extends keyof CarForm>(k: K, v: CarForm[K]) => onChange({ ...form, [k]: v });
  const [photoProcessing, setPhotoProcessing] = useState(false);

  const handlePhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    e.target.value = '';
    setPhotoProcessing(true);
    try {
      const newPhotos: string[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await resizeCarPhoto(file);
        newPhotos.push(dataUrl);
      }
      set('photos', [...form.photos, ...newPhotos]);
    } finally {
      setPhotoProcessing(false);
    }
  };

  const TESLA_MODELS = ['Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck'];

  return (
    <>
      <div className="admin-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="admin-btn-ghost admin-back-btn" onClick={onCancel}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="admin-page-title">{isEdit ? 'ავტომობილის რედაქტირება' : 'ახალი ავტომობილი'}</h1>
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
            <h3 className="admin-card-title">ფოტოები</h3>
            {form.photos.length > 0 && (
              <div className="admin-car-photos-grid">
                {form.photos.map((p, i) => (
                  <div key={i} className="admin-car-photo-item">
                    <img src={p} alt={`Photo ${i+1}`} />
                    {i === 0 && <span className="admin-car-photo-main-badge">მთავარი</span>}
                    <button className="admin-car-photo-remove" onClick={() => set('photos', form.photos.filter((_, j) => j !== i))}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <label className="admin-btn-ghost admin-img-upload-label" style={{ marginTop: form.photos.length ? 10 : 0 }}>
              {photoProcessing
                ? <><div className="admin-img-spinner" style={{ width: 14, height: 14 }} /> კომპრესია…</>
                : <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    ფოტოების ატვირთვა
                  </>
              }
              <input type="file" accept="image/*" multiple capture="environment" style={{ display: 'none' }} onChange={handlePhotoFile} />
            </label>
          </div>

          <div className="admin-card">
            <h3 className="admin-card-title">სტატუსი</h3>
            <label className="admin-toggle-row">
              <span>ხელმისაწვდომია (არ არის გაყიდული)</span>
              <button type="button" className={`admin-toggle ${form.available ? 'admin-toggle-on' : ''}`} onClick={() => set('available', !form.available)}>
                <span className="admin-toggle-knob" />
              </button>
            </label>
          </div>
        </div>

        <div className="admin-form-col">
          <div className="admin-card">
            <h3 className="admin-card-title">ძირითადი ინფო</h3>
            <div className="admin-row-2">
              <div className="admin-field">
                <label className="admin-label">მოდელი *</label>
                <select className="admin-input" value={form.model} onChange={e => set('model', e.target.value)}>
                  {TESLA_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="other">სხვა</option>
                </select>
              </div>
              <div className="admin-field">
                <label className="admin-label">წელი</label>
                <input className="admin-input" type="number" min="2012" max="2030" value={form.year} onChange={e => set('year', e.target.value)} />
              </div>
            </div>
            <div className="admin-row-2">
              <div className="admin-field">
                <label className="admin-label">ფასი (₾) *</label>
                <input className="admin-input" type="number" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="85000" />
              </div>
              <div className="admin-field">
                <label className="admin-label">გარბენი (კმ)</label>
                <input className="admin-input" type="number" min="0" value={form.mileage} onChange={e => set('mileage', e.target.value)} placeholder="45000" />
              </div>
            </div>
            <div className="admin-row-2">
              <div className="admin-field">
                <label className="admin-label">მარაგი (კმ)</label>
                <input className="admin-input" type="number" min="0" value={form.batteryRange} onChange={e => set('batteryRange', e.target.value)} placeholder="530" />
              </div>
              <div className="admin-field">
                <label className="admin-label">მდგომარეობა</label>
                <select className="admin-input" value={form.condition} onChange={e => set('condition', e.target.value as CarForm['condition'])}>
                  <option value="excellent">შესანიშნავი</option>
                  <option value="good">კარგი</option>
                  <option value="fair">დამაკმაყოფილებელი</option>
                </select>
              </div>
            </div>
            <div className="admin-row-2">
              <div className="admin-field">
                <label className="admin-label">გარე ფერი</label>
                <input className="admin-input" value={form.exteriorColor} onChange={e => set('exteriorColor', e.target.value)} placeholder="Pearl White" />
              </div>
              <div className="admin-field">
                <label className="admin-label">შიდა ფერი</label>
                <input className="admin-input" value={form.interiorColor} onChange={e => set('interiorColor', e.target.value)} placeholder="Black" />
              </div>
            </div>
            <div className="admin-field">
              <label className="admin-label">Autopilot</label>
              <label className="admin-toggle-row" style={{ marginTop: 0 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>გააქტიურებულია</span>
                <button type="button" className={`admin-toggle ${form.autopilot ? 'admin-toggle-on' : ''}`} onClick={() => set('autopilot', !form.autopilot)}>
                  <span className="admin-toggle-knob" />
                </button>
              </label>
            </div>
            <div className="admin-field">
              <label className="admin-label">FSD (Full Self-Driving)</label>
              <label className="admin-toggle-row" style={{ marginTop: 0 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>გააქტიურებულია</span>
                <button type="button" className={`admin-toggle ${form.fsd ? 'admin-toggle-on' : ''}`} onClick={() => set('fsd', !form.fsd)}>
                  <span className="admin-toggle-knob" />
                </button>
              </label>
            </div>
          </div>
          <div className="admin-card">
            <h3 className="admin-card-title">აღწერა</h3>
            <div className="admin-field">
              <textarea className="admin-input" rows={5} value={form.description} onChange={e => set('description', e.target.value)} placeholder="ავტომობილის დეტალური აღწერა..." />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

async function resizeCarPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1200;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('load failed')); };
    img.src = url;
  });
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
