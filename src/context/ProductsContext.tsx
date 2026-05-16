import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { products as HARDCODED } from '../data/products';
import { Product, ModelId } from '../types';

const STORAGE_KEY = 'thub_admin_products';

function readStored(): Product[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

interface ProductsContextType {
  products: Product[];
  adminProducts: Product[];
  addProduct:    (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  getById: (id: string) => Product | undefined;
  filterByVehicle: (modelId: ModelId, year: number) => Product[];
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [adminProducts, setAdminProducts] = useState<Product[]>(readStored);

  const products = useMemo(() => {
    const adminIds = new Set(adminProducts.map(p => p.id));
    return [...HARDCODED.filter(p => !adminIds.has(p.id)), ...adminProducts];
  }, [adminProducts]);

  const persist = (list: Product[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    setAdminProducts(list);
  };

  const addProduct    = (p: Product) => persist([...adminProducts, p]);
  const updateProduct = (p: Product) => persist(adminProducts.map(x => x.id === p.id ? p : x));
  const deleteProduct = (id: string) => persist(adminProducts.filter(p => p.id !== id));

  const getById = (id: string) => products.find(p => p.id === id);

  const filterByVehicle = (modelId: ModelId, year: number) =>
    products.filter(p => {
      const r = p.fits[modelId];
      return r && year >= r.from && year <= r.to;
    });

  return (
    <ProductsContext.Provider value={{
      products, adminProducts,
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
