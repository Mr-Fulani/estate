import { 
  Category,
  CategoryTranslation,
  ContactRequest, 
  Property, 
  PropertyFilter, 
  PropertyListResponse,
  AdminStats,
  PropertyFormData,
  SiteSettings,
  NewsArticle,
  NewsListResponse,
  NewsAdminArticle,
  NewsFormData,
  ContactTrackData,
  ContactUpdateData,
  ReviewListResponse,
  AdminReview,
  ReviewSubmissionData,
  ReviewInvitation,
  AdminUser,
  AdminRole,
  AdminAuditLogList,
  ExchangeRatesResponse,
} from '@/types';
import type { Locale } from '@/i18n/config';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

function getApiBaseUrl(): string {
  // If running on server (SSR/RSC) inside Docker or Node
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:8000/api/v1';
  }
  // If running in client browser
  return '/api/backend';
}

function readBrowserCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const prefix = `${name}=`;
  const item = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : undefined;
}

function adminHeaders(adminCookie?: string, json = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (json) headers['Content-Type'] = 'application/json';
  if (adminCookie && typeof window === 'undefined') headers.Cookie = adminCookie;
  const csrfToken = readBrowserCookie('estate_admin_csrf');
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;
  return headers;
}

function adminReadOptions(adminCookie?: string): RequestInit {
  return {
    cache: 'no-store',
    credentials: 'include',
    headers: adminHeaders(adminCookie),
  };
}

async function ensureAdminResponse(response: Response, fallback: string): Promise<Response> {
  if (response.status === 401 && typeof window !== 'undefined') {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    window.dispatchEvent(new CustomEvent('estate:auth-expired', { detail: { returnTo } }));
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: fallback }));
    throw new ApiError(error.detail || fallback, response.status);
  }
  return response;
}

function normalizeNewsArticle(article: NewsArticle): NewsArticle {
  return {
    ...article,
    media: Array.isArray(article.media) ? article.media : [],
    available_locales: Array.isArray(article.available_locales)
      ? article.available_locales
      : [article.locale],
  };
}

// ---------------- PUBLIC API ----------------

export async function fetchExchangeRates(): Promise<ExchangeRatesResponse> {
  const res = await fetch(`${getApiBaseUrl()}/currency/rates`, { cache: 'no-store' });
  if (!res.ok) throw new ApiError('Exchange rates are temporarily unavailable', res.status);
  return res.json();
}

export async function fetchProperties(
  params: Partial<PropertyFilter> & { page?: number; per_page?: number; sort_by?: string; order?: string } = {},
  adminCookie?: string,
): Promise<PropertyListResponse> {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.append(key, value.toString());
    }
  });

  try {
    const baseUrl = getApiBaseUrl();
    const query = urlParams.toString();
    const url = query ? `${baseUrl}/properties?${query}` : `${baseUrl}/properties`;
    
    // If admin context (include_inactive), do not cache. Otherwise, revalidate every 10s
    const isNoCache = !!params.include_inactive;
    const res = await fetch(
      url,
      isNoCache ? adminReadOptions(adminCookie) : { next: { revalidate: 10 } },
    );

    if (!res.ok) throw new ApiError('Failed to fetch properties', res.status);

    return await res.json() as PropertyListResponse;
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    throw error;
  }
}

export async function fetchFeaturedProperties(): Promise<Property[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/properties/featured?limit=6`, {
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      return [];
    }

    return await res.json() as Property[];
  } catch (error) {
    console.error('Failed to fetch featured properties:', error);
    return [];
  }
}

export async function fetchProperty(id: number | string, adminCookie?: string): Promise<Property | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(
      `${baseUrl}/properties/${id}`,
      adminCookie ? adminReadOptions(adminCookie) : { next: { revalidate: 60 } },
    );

    if (res.status === 404) return null;
    if (!res.ok) throw new ApiError('Failed to fetch property', res.status);

    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch property ${id}:`, error);
    throw error;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/categories`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return [];
  }
}

export async function fetchNews(locale: Locale, page = 1, perPage = 9): Promise<NewsListResponse> {
  try {
    const baseUrl = getApiBaseUrl();
    const params = new URLSearchParams({ locale, page: String(page), per_page: String(perPage) });
    const res = await fetch(`${baseUrl}/news/?${params}`, { next: { revalidate: 60 } });

    if (!res.ok) throw new ApiError('Failed to fetch news', res.status);
    const data = await res.json() as NewsListResponse;
    return {
      ...data,
      items: Array.isArray(data.items) ? data.items.map(normalizeNewsArticle) : [],
    };
  } catch (error) {
    console.error('Failed to fetch news:', error);
    throw error;
  }
}

export async function fetchNewsArticle(slug: string, locale: Locale): Promise<NewsArticle | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const params = new URLSearchParams({ locale });
    const res = await fetch(`${baseUrl}/news/${encodeURIComponent(slug)}?${params}`, {
      next: { revalidate: 60 },
    });

    if (res.status === 404) return null;
    if (!res.ok) throw new ApiError('Failed to fetch news article', res.status);
    const article = await res.json() as NewsArticle;
    return normalizeNewsArticle(article);
  } catch (error) {
    console.error(`Failed to fetch news article ${slug}:`, error);
    throw error;
  }
}

export async function fetchAdminNews(adminCookie?: string): Promise<NewsAdminArticle[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/news/admin/all`, adminReadOptions(adminCookie));
  await ensureAdminResponse(res, 'Не удалось загрузить новости');
  return await res.json();
}

export async function fetchAdminNewsArticle(id: number | string, adminCookie?: string): Promise<NewsAdminArticle | null> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/news/admin/${id}`, adminReadOptions(adminCookie));
  if (res.status === 404) return null;
  await ensureAdminResponse(res, 'Не удалось загрузить публикацию');
  return await res.json();
}

export async function createNewsArticle(data: NewsFormData): Promise<NewsAdminArticle> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/news/`, {
    method: 'POST',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  await ensureAdminResponse(res, 'Не удалось создать публикацию');
  return await res.json();
}

export async function updateNewsArticle(id: number | string, data: NewsFormData): Promise<NewsAdminArticle> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/news/${id}`, {
    method: 'PUT',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  await ensureAdminResponse(res, 'Не удалось сохранить публикацию');
  return await res.json();
}

export async function deleteNewsArticle(id: number | string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/news/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
    credentials: 'include',
  });
  await ensureAdminResponse(res, 'Не удалось удалить публикацию');
}

export async function uploadNewsImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${getApiBaseUrl()}/uploads/news`, {
    method: 'POST',
    headers: adminHeaders(),
    credentials: 'include',
    body,
  });
  await ensureAdminResponse(res, 'Не удалось загрузить изображение');
  const data: { url: string } = await res.json();
  return data.url;
}

export async function fetchReviews(locale: Locale, options: { featured?: boolean; page?: number; perPage?: number } = {}): Promise<ReviewListResponse> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams({
    locale,
    featured: String(options.featured || false),
    page: String(options.page || 1),
    per_page: String(options.perPage || 12),
  });
  const res = await fetch(`${baseUrl}/reviews?${params}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new ApiError('Failed to fetch reviews', res.status);
  return await res.json();
}

export async function submitReview(data: ReviewSubmissionData, token?: string): Promise<{ id: number; status: 'pending'; is_verified: boolean }> {
  const baseUrl = getApiBaseUrl();
  const endpoint = token ? `${baseUrl}/reviews/invitations/${encodeURIComponent(token)}` : `${baseUrl}/reviews`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Не удалось отправить отзыв' }));
    throw new Error(error.detail || 'Не удалось отправить отзыв');
  }
  return await res.json();
}

export async function fetchReviewInvitation(token: string): Promise<ReviewInvitation | null> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/reviews/invitations/${encodeURIComponent(token)}`, { cache: 'no-store' });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new Error('Не удалось проверить приглашение');
  return await res.json();
}

export async function fetchAdminReviews(adminCookie?: string): Promise<AdminReview[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/reviews/admin/all`, adminReadOptions(adminCookie));
  await ensureAdminResponse(res, 'Не удалось загрузить отзывы');
  return await res.json();
}

export async function updateAdminReview(id: number, data: Partial<AdminReview>): Promise<AdminReview> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/reviews/admin/${id}`, {
    method: 'PUT',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  await ensureAdminResponse(res, 'Не удалось сохранить отзыв');
  return await res.json();
}

export async function deleteAdminReview(id: number): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/reviews/admin/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
    credentials: 'include',
  });
  await ensureAdminResponse(res, 'Не удалось удалить отзыв');
}

export async function createReviewInvitation(contactId: number, locale: Locale): Promise<{ review: AdminReview; token: string }> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/reviews/admin/invitations/${contactId}`, {
    method: 'POST',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify({ locale }),
  });
  await ensureAdminResponse(res, 'Не удалось создать приглашение');
  return await res.json();
}

export async function submitContact(data: ContactRequest): Promise<ContactRequest> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to submit contact request');
  }

  return await res.json();
}

export async function trackContactAction(data: ContactTrackData): Promise<void> {
  const baseUrl = getApiBaseUrl();
  await fetch(`${baseUrl}/contacts/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch(() => undefined);
}

// ---------------- ADMIN API ----------------

export async function fetchAdminStats(adminCookie?: string): Promise<AdminStats> {
  const emptyStats: AdminStats = {
    total_properties: 0,
    active_properties: 0,
    featured_properties: 0,
    total_contacts: 0,
    new_contacts: 0,
    categories_count: 0,
    form_leads: 0,
    messenger_clicks: 0,
    messenger_messages: 0,
    active_leads: 0,
    won_deals: 0,
    lost_leads: 0,
    sold_properties: 0,
    rented_properties: 0,
    total_deal_value: 0,
    deal_base_currency: 'RUB',
    deal_totals_by_currency: {},
    unconverted_won_deals: 0,
    pending_reviews: 0,
  };
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/admin/stats`, adminReadOptions(adminCookie));

    if (!res.ok) {
      await ensureAdminResponse(res, 'Не удалось загрузить показатели');
      return emptyStats;
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return emptyStats;
  }
}

export async function createProperty(data: PropertyFormData): Promise<Property> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/properties`, {
    method: 'POST',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  await ensureAdminResponse(res, 'Не удалось создать объект');

  return await res.json();
}

export async function updateProperty(id: number | string, data: Partial<PropertyFormData>): Promise<Property> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/properties/${id}`, {
    method: 'PUT',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  await ensureAdminResponse(res, 'Не удалось обновить объект');

  return await res.json();
}

export async function deleteProperty(id: number | string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/properties/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
    credentials: 'include',
  });

  await ensureAdminResponse(res, 'Не удалось удалить объект');
}

export async function fetchContactRequests(
  status?: string,
  adminCookie?: string,
  options: { limit?: number } = {},
): Promise<ContactRequest[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (options.limit) params.set('limit', String(options.limit));
    const query = params.toString();
    const url = query ? `${baseUrl}/contacts?${query}` : `${baseUrl}/contacts`;
    const res = await fetch(url, adminReadOptions(adminCookie));

    if (!res.ok) {
      await ensureAdminResponse(res, 'Не удалось загрузить обращения');
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch contact requests:', error);
    return [];
  }
}

export async function updateContactStatus(id: number, status: string): Promise<ContactRequest> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/contacts/${id}/status?new_status=${status}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    credentials: 'include',
  });

  await ensureAdminResponse(res, 'Не удалось изменить статус обращения');

  return await res.json();
}

export async function updateContactRequest(id: number, data: ContactUpdateData): Promise<ContactRequest> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/contacts/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  await ensureAdminResponse(res, 'Не удалось обновить обращение');
  return await res.json();
}

export async function addContactNote(id: number, note: string): Promise<ContactRequest> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/contacts/${id}/notes`, {
    method: 'POST',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify({ note }),
  });
  await ensureAdminResponse(res, 'Не удалось добавить заметку');
  return await res.json();
}

export async function deleteContactRequest(id: number): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/contacts/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
    credentials: 'include',
  });

  await ensureAdminResponse(res, 'Не удалось удалить обращение');
}

export async function createCategory(data: { name: string; slug: string; description?: string; translations?: CategoryTranslation[] }): Promise<Category> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/categories`, {
    method: 'POST',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  await ensureAdminResponse(res, 'Не удалось создать категорию');

  return await res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/categories/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
    credentials: 'include',
  });

  await ensureAdminResponse(res, 'Не удалось удалить категорию');
}

export const fallbackSiteSettings: SiteSettings = {
  phone: '+90 (552) 123-00-00',
  email: 'support@rahathome.com',
  address: 'г. Стамбул, Бейликдюзю',
  working_hours: 'Ежедневно с 9:00 до 21:00',
  telegram: 'https://t.me/rahat_home',
  whatsapp: 'https://wa.me/905521230000',
  vk: '',
  youtube: 'https://youtube.com/@rahat_home',
  instagram: '',
  facebook: '',
  max_messenger: '',
  translations: [
    { locale: 'ru', address: 'г. Стамбул, Бейликдюзю', working_hours: 'Ежедневно с 9:00 до 21:00' },
    { locale: 'en', address: 'Istanbul, Beylikduzu', working_hours: 'Daily, 9:00–21:00' },
    { locale: 'tr', address: 'İstanbul, Beylikdüzü', working_hours: 'Her gün 09:00–21:00' },
    { locale: 'ar', address: 'إسطنبول، بيليك دوزو', working_hours: 'يومياً من 9:00 إلى 21:00' },
  ],
};

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/settings`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return fallbackSiteSettings;
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch site settings:', error);
    return fallbackSiteSettings;
  }
}

export async function updateSiteSettings(data: Partial<SiteSettings>): Promise<SiteSettings> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/settings`, {
    method: 'PUT',
    headers: adminHeaders(undefined, true),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  await ensureAdminResponse(res, 'Не удалось обновить настройки сайта');

  return await res.json();
}

// ---------------- AUTHENTICATION ----------------

export async function loginAdmin(identifier: string, password: string): Promise<AdminUser> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Не удалось войти' }));
    const message = res.status === 429
      ? 'Слишком много попыток. Повторите вход через 15 минут.'
      : 'Неверный логин, email или пароль.';
    throw new ApiError(error.detail === 'Invalid email or password' ? message : (error.detail || message), res.status);
  }
  const data = await res.json();
  return data.user;
}

export async function fetchCurrentAdmin(adminCookie?: string): Promise<AdminUser> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/me`, adminReadOptions(adminCookie));
  await ensureAdminResponse(res, 'Сессия администратора недействительна');
  return await res.json();
}

export async function logoutAdmin(): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: adminHeaders(),
  });
  await ensureAdminResponse(res, 'Не удалось завершить сеанс');
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/users`, adminReadOptions());
  await ensureAdminResponse(res, 'Не удалось загрузить команду');
  return await res.json();
}

export async function createAdminUser(data: {
  username: string;
  email: string;
  full_name: string;
  role: AdminRole;
  password: string;
}): Promise<AdminUser> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/users`, {
    method: 'POST',
    credentials: 'include',
    headers: adminHeaders(undefined, true),
    body: JSON.stringify(data),
  });
  await ensureAdminResponse(res, 'Не удалось создать аккаунт');
  return await res.json();
}

export async function updateAdminUser(
  id: number,
  data: Partial<{ username: string; full_name: string; role: AdminRole; is_active: boolean; password: string }>,
): Promise<AdminUser> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/users/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: adminHeaders(undefined, true),
    body: JSON.stringify(data),
  });
  await ensureAdminResponse(res, 'Не удалось обновить аккаунт');
  return await res.json();
}

export async function fetchAuditLogs(page = 1): Promise<AdminAuditLogList> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/auth/audit?page=${page}&per_page=30`, adminReadOptions());
  await ensureAdminResponse(res, 'Не удалось загрузить журнал действий');
  return await res.json();
}
