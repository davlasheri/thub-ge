export interface Product {
  id: string;
  name: string;
  nameGe: string;
  category: string;
  price: number;
  currency: 'GEL';
  image: string;
  description: string;
  descriptionGe: string;
  compatibility: string[];
  inStock: boolean;
  badge?: 'new' | 'sale' | 'popular';
  rating: number;
  reviews: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Category = {
  id: string;
  name: string;
  nameGe: string;
  icon: string;
};
