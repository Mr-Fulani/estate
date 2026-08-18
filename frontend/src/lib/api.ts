import { Category, ContactRequest, Property, PropertyFilter, PropertyListResponse } from '@/types';

function getApiBaseUrl(): string {
  // If running on server (SSR/RSC) inside Docker or Node
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:8000/api/v1';
  }
  // If running in client browser
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
}

export async function fetchProperties(
  params: Partial<PropertyFilter> & { page?: number; per_page?: number; sort_by?: string; order?: string } = {}
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
    const res = await fetch(url, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return { items: [], total: 0, page: 1, per_page: 10 };
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    return { items: [], total: 0, page: 1, per_page: 10 };
  }
}

export async function fetchFeaturedProperties(): Promise<Property[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/properties/featured?limit=6`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch featured properties:', error);
    return [];
  }
}

export async function fetchProperty(id: number | string): Promise<Property | null> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/properties/${id}`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Failed to fetch property ${id}:`, error);
    return null;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/categories`, {
      next: { revalidate: 3600 },
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

export async function submitContact(data: ContactRequest): Promise<void> {
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
}
