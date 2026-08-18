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
  status_badge?: string | null;
  images: string[];
  category_id: number;
  category: Category | null;
  created_at: string;
  updated_at: string;
}

export interface ContactRequest {
  id?: number;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  property_id?: number | null;
  status?: 'new' | 'contacted' | 'closed' | string;
  created_at?: string;
}

export interface PropertyListResponse {
  items: Property[];
  total: number;
  page: number;
  per_page: number;
}

export interface PropertyFilter {
  search?: string;
  category_id?: number;
  city?: string;
  min_price?: number;
  max_price?: number;
  rooms?: number;
  min_area?: number;
  max_area?: number;
  include_inactive?: boolean;
}

export interface AdminStats {
  total_properties: number;
  active_properties: number;
  featured_properties: number;
  total_contacts: number;
  new_contacts: number;
  categories_count: number;
}

export interface PropertyFormData {
  title: string;
  slug?: string;
  description?: string;
  price: number;
  currency?: string;
  address?: string;
  city?: string;
  district?: string;
  area?: number;
  rooms?: number;
  floor?: number;
  total_floors?: number;
  year_built?: number;
  images?: string[];
  category_id: number;
  is_featured?: boolean;
  is_active?: boolean;
  status_badge?: string | null;
}

export interface SiteSettings {
  id?: number;
  phone: string;
  email: string;
  address: string;
  working_hours: string;
  telegram?: string | null;
  whatsapp?: string | null;
  vk?: string | null;
  youtube?: string | null;
}
