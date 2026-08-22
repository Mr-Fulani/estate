import type { Locale } from '@/i18n/config';

export interface CategoryTranslation {
  id?: number;
  locale: Locale;
  name: string;
  description?: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  translations?: CategoryTranslation[];
  created_at: string;
}

export type CurrencyCode = 'RUB' | 'USD' | 'EUR' | 'TRY';

export interface ExchangeRatesResponse {
  base: 'RUB';
  rates: Record<CurrencyCode, number>;
  effective_date: string;
  fetched_at: string;
  source: string;
  stale: boolean;
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
  transaction_type: 'sale' | 'rent';
  market_status: 'available' | 'reserved' | 'sold' | 'rented' | 'archived';
  status_badge?: string | null;
  images: string[];
  category_id: number;
  category: Category | null;
  translations?: PropertyTranslation[];
  created_at: string;
  updated_at: string;
}

export interface PropertyTranslation {
  id?: number;
  locale: Locale;
  title: string;
  description?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  status_badge?: string | null;
}

export interface NewsArticle {
  id: number;
  slug: string;
  locale: Locale;
  title: string;
  excerpt: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  cover_image: string | null;
  author: string;
  published_at: string | null;
  media: NewsMedia[];
  available_locales: Locale[];
}

export type NewsMediaType = 'image' | 'youtube';

export interface NewsMedia {
  id?: number;
  media_type: NewsMediaType;
  url: string;
  position: number;
}

export interface NewsListResponse {
  items: NewsArticle[];
  total: number;
  page: number;
  per_page: number;
}

export interface NewsTranslation {
  id?: number;
  locale: Locale;
  title: string;
  excerpt: string;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface NewsAdminArticle {
  id: number;
  slug: string;
  cover_image: string | null;
  author: string;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  translations: NewsTranslation[];
  media: NewsMedia[];
}

export interface NewsFormData {
  slug?: string;
  cover_image?: string | null;
  author: string;
  is_published: boolean;
  published_at?: string | null;
  translations: NewsTranslation[];
  media: NewsMedia[];
}

export interface ContactRequest {
  id?: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message?: string | null;
  property_id?: number | null;
  property?: { id: number; title: string; slug: string; market_status: string } | null;
  kind?: 'form' | 'click' | 'manual' | 'webhook';
  channel?: 'form' | 'phone' | 'email' | 'whatsapp' | 'telegram' | 'max' | 'instagram' | 'facebook' | 'vk';
  source?: string;
  locale?: Locale | null;
  page_url?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  session_id?: string | null;
  external_conversation_id?: string | null;
  external_username?: string | null;
  status?: 'new' | 'contacted' | 'qualified' | 'viewing' | 'negotiation' | 'won' | 'lost' | string;
  outcome?: 'sold' | 'rented' | null;
  deal_value?: number | null;
  deal_currency?: string;
  deal_value_rub?: number | null;
  deal_exchange_rate?: number | null;
  deal_rate_effective_date?: string | null;
  assigned_to?: string | null;
  next_follow_up_at?: string | null;
  closed_at?: string | null;
  is_read?: boolean;
  activities?: LeadActivity[];
  created_at?: string;
  updated_at?: string | null;
  website?: string;
}

export interface LeadActivity {
  id: number;
  event_type: string;
  from_status?: string | null;
  to_status?: string | null;
  note?: string | null;
  event_data?: Record<string, unknown> | null;
  created_at: string;
}

export interface ContactAttribution {
  property_id?: number | null;
  locale?: Locale;
  source: string;
  page_url?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  session_id?: string;
}

export interface ContactTrackData extends ContactAttribution {
  kind: 'click';
  channel: Exclude<NonNullable<ContactRequest['channel']>, 'form'>;
}

export interface ContactUpdateData {
  status?: string;
  outcome?: 'sold' | 'rented';
  deal_value?: number;
  deal_currency?: string;
  assigned_to?: string;
  next_follow_up_at?: string | null;
  is_read?: boolean;
  note?: string;
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
  min_rooms?: number;
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
  form_leads: number;
  messenger_clicks: number;
  messenger_messages: number;
  active_leads: number;
  won_deals: number;
  lost_leads: number;
  sold_properties: number;
  rented_properties: number;
  total_deal_value: number;
  deal_base_currency: 'RUB';
  deal_totals_by_currency: Partial<Record<'RUB' | 'USD' | 'EUR' | 'TRY', number>>;
  unconverted_won_deals: number;
  pending_reviews: number;
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
  transaction_type?: 'sale' | 'rent';
  market_status?: 'available' | 'reserved' | 'sold' | 'rented' | 'archived';
  status_badge?: string | null;
  translations?: Array<Omit<PropertyTranslation, 'id'>>;
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
  instagram?: string | null;
  facebook?: string | null;
  max_messenger?: string | null;
  translations?: SiteSettingsTranslation[];
}

export interface SiteSettingsTranslation {
  id?: number;
  locale: Locale;
  address: string;
  working_hours: string;
}

export interface ReviewTranslation {
  id?: number;
  locale: Locale;
  content: string;
  reviewer_role?: string | null;
  company_response?: string | null;
}

export interface PublicReview {
  id: number;
  reviewer_name: string;
  rating: number;
  locale: Locale;
  content: string;
  reviewer_role?: string | null;
  company_response?: string | null;
  is_verified: boolean;
  property_title?: string | null;
  published_at?: string | null;
}

export interface ReviewListResponse {
  items: PublicReview[];
  total: number;
  page: number;
  per_page: number;
}

export interface AdminReview {
  id: number;
  reviewer_name?: string | null;
  email?: string | null;
  phone?: string | null;
  rating?: number | null;
  source_locale: Locale;
  status: 'invited' | 'pending' | 'published' | 'rejected';
  is_verified: boolean;
  is_featured: boolean;
  display_order: number;
  consent_given: boolean;
  property_id?: number | null;
  contact_id?: number | null;
  property?: { id: number; title: string; slug: string } | null;
  contact?: { id: number; name?: string | null; status: string; outcome?: string | null } | null;
  has_active_invitation: boolean;
  invitation_expires_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  translations: ReviewTranslation[];
}

export interface ReviewSubmissionData {
  reviewer_name: string;
  email?: string;
  phone?: string;
  rating: number;
  locale: Locale;
  content: string;
  reviewer_role?: string;
  property_id?: number;
  consent_given: true;
  website?: string;
}

export interface ReviewInvitation {
  reviewer_name?: string | null;
  property_title?: string | null;
  locale: Locale;
  expires_at: string;
}

export type AdminRole = 'founder' | 'admin' | 'manager' | 'editor';

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
}

export interface AdminTelegramSettings {
  configured: boolean;
  linked: boolean;
  bot_username?: string | null;
  telegram_username?: string | null;
  linked_at?: string | null;
  notifications_enabled: boolean;
  can_notify_new_leads: boolean;
  can_notify_new_reviews: boolean;
  notify_new_leads: boolean;
  notify_new_reviews: boolean;
}

export interface AdminTelegramLink {
  url: string;
  expires_at: string;
}

export interface AdminAuditLog {
  id: number;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
  user?: AdminUser | null;
}

export interface AdminAuditLogList {
  items: AdminAuditLog[];
  total: number;
  page: number;
  per_page: number;
}
