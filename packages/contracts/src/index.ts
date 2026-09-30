export type ApiResponse<T> = { data: T; meta?: Record<string, unknown> };

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'OUT_OF_STOCK' | 'ARCHIVED';
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  pricePence: number;
  retailPricePence: number | null;
  currency: 'GBP';
  featured: boolean;
  availableSizes: string[];
}

export interface ProductDetail extends ProductSummary {
  description: string;
  colour: string;
  images: string[];
  variants: Array<{ id: string; size: string; sku: string; stock: number }>;
  delivery: string;
  returns: string;
}
