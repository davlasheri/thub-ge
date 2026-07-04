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

export type ItemStatus = 'new-original' | 'used-original' | 'new-replica' | 'used-replica';

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
  badge?: ItemStatus;
  rating: number;
  reviews: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CarListing {
  id: string;
  model: string;           // 'Model S' | 'Model 3' | 'Model X' | 'Model Y' | 'Cybertruck' | string
  year: number;
  price: number;
  mileage: number;         // km
  exteriorColor: string;
  interiorColor: string;
  condition: 'excellent' | 'good' | 'fair';
  batteryRange: number;    // km
  autopilot: boolean;
  fsd: boolean;
  description: string;
  photos: string[];        // data URLs or https URLs
  available: boolean;
}
