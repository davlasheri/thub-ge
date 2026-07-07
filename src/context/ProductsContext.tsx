import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { Product, ModelId } from '../types';
import { syncContent } from '../utils/contentSync';

const ADMIN_KEY   = 'thub_admin_products';
const DELETED_KEY = 'thub_deleted_products';

function readStored(): Product[] {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY) ?? '[]'); }
  catch { return []; }
}
function readDeleted(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(DELETED_KEY) ?? '[]')); }
  catch { return new Set(); }
}

interface ProductsContextType {
  products:      Product[];
  /** Products visible on the public website (excludes those toggled off in admin). */
  visibleProducts: Product[];
  adminProducts: Product[];
  isAdminProduct: (id: string) => boolean;
  addProduct:    (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  getById:       (id: string) => Product | undefined;
  filterByVehicle: (modelId: ModelId, year: number) => Product[];
}

/** A product is public unless it has been explicitly hidden (visible === false). */
const isVisible = (p: Product) => p.visible !== false;

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [adminProducts, setAdminProducts] = useState<Product[]>(readStored);
  const [deletedIds,    setDeletedIds]    = useState<Set<string>>(readDeleted);

  // Only admin-created products exist now. Ids without the 'adm_' prefix are
  // stored overrides of the demo catalogue that used to ship with the site —
  // drop them along with anything the admin deleted.
  const products = useMemo(
    () => adminProducts.filter(p => p.id.startsWith('adm_') && !deletedIds.has(p.id)),
    [adminProducts, deletedIds],
  );

  const persistAdmin = (list: Product[]) => {
    syncContent(ADMIN_KEY, JSON.stringify(list));
    setAdminProducts(list);
  };
  const persistDeleted = (set: Set<string>) => {
    syncContent(DELETED_KEY, JSON.stringify([...set]));
    setDeletedIds(set);
  };

  const addProduct = (p: Product) => persistAdmin([...adminProducts, p]);

  // Works for both hardcoded (saves override) and admin products
  const updateProduct = (p: Product) => {
    const exists = adminProducts.some(x => x.id === p.id);
    persistAdmin(exists ? adminProducts.map(x => x.id === p.id ? p : x) : [...adminProducts, p]);
  };

  const deleteProduct = (id: string) => {
    persistAdmin(adminProducts.filter(p => p.id !== id));
    persistDeleted(new Set([...deletedIds, id]));
  };

  const isAdminProduct = (id: string) => adminProducts.some(p => p.id === id);

  const visibleProducts = useMemo(() => products.filter(isVisible), [products]);

  // Public lookups only surface visible products, so a hidden product's direct
  // link 404s just like it disappears from the listings.
  const getById = (id: string) => visibleProducts.find(p => p.id === id);

  const filterByVehicle = (modelId: ModelId, year: number) =>
    visibleProducts.filter(p => {
      const r = p.fits[modelId];
      return r && year >= r.from && year <= r.to;
    });

  return (
    <ProductsContext.Provider value={{
      products, visibleProducts, adminProducts, isAdminProduct,
      addProduct, updateProduct, deleteProduct,
      getById, filterByVehicle,
    }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
