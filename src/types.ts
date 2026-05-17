export type ModelId = string;

export interface ModelYearRange {
  from: number;
  to: number;
}

export interface TeslaModel {
  id: ModelId;
  name: string;
  fullName: string;
  years: ModelYearRange;
  color: string;
}

export interface VehicleSelection {
  modelId: ModelId;
  year: number;
}

export interface CatalogSubsection {
  id: string;
  name: string;
  nameGe?: string;
  icon: string;
}

export interface CatalogSection {
  id: string;
  name: string;
  nameGe?: string;
  icon: string;
  image: string;
  groupNumber?: number;
  subsections: CatalogSubsection[];
}

export interface Product {
  id: string;
  partNumber: string;
  name: string;
  nameGe: string;
  sectionId: string;
  subsectionId: string;
  price: number;
  currency: 'GEL';
  image: string;
  description: string;
  fits: Partial<Record<ModelId, ModelYearRange>>;
  inStock: boolean;
  badge?: 'new' | 'sale' | 'popular';
  rating: number;
  reviews: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
