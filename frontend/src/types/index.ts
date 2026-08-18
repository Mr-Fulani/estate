export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Property {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  address: string;
  city: string;
  district: string | null;
  area: number;
  rooms: number;
  floor: number | null;
  total_floors: number | null;
  year_built: number | null;
  is_featured: boolean;
  is_active: boolean;
  images: string[];
  category_id: number;
  category: Category | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
  property_id?: number;
}

export interface PropertyListResponse {
  items: Property[];
  total: number;
  page: number;
  per_page: number;
}

export interface PropertyFilter {
  category_id?: number;
  city?: string;
  min_price?: number;
  max_price?: number;
  rooms?: number;
  min_area?: number;
  max_area?: number;
}
