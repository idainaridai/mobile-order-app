export enum ProductCategory {
  DRINK_ALCOHOL = 'アルコール',
  DRINK_SOFT = 'ソフトドリンク',
  FOOD = 'フード',
  RECOMMEND = '本日のおすすめ',
}

export enum FoodSubcategory {
  APPETIZER = '前菜',
  MAIN = 'メイン',
  SIDE = '一品',
  SALAD = 'サラダ',
  OTHER = 'その他',
}

export enum OrderStatus {
  PENDING = 'pending',
  SERVED = 'served',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  description?: string;
  imageUrl: string;
  isSoldOut: boolean;
  isSpecial?: boolean; // For AI generated specials
  subCategory?: FoodSubcategory; // Optional grouping for foods
}

export interface CartItem extends Product {
  quantity: number;
  customizations?: string[];
  cartKey: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  timestamp: number;
}

export interface TableSession {
  tableId: string;
  isActive: boolean;
}
