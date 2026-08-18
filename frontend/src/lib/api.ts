import { Category, ContactRequest, Property, PropertyFilter, PropertyListResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function fetchProperties(
  params: Partial<PropertyFilter> & { page?: number; per_page?: number; sort_by?: string; order?: string } = {}
): Promise<PropertyListResponse> {
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      urlParams.append(key, value.toString());
    }
  });

  const res = await fetch(`${API_BASE_URL}/properties?${urlParams.toString()}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    // Return empty list on failure for resilience
    return { items: [], total: 0, page: 1, per_page: 10 };
  }

  return res.json();
}

export async function fetchFeaturedProperties(): Promise<Property[]> {
  const res = await fetch(`${API_BASE_URL}/properties?is_featured=true&per_page=6`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return [];
  }

  const data: PropertyListResponse = await res.json();
  return data.items;
}

export async function fetchProperty(id: number | string): Promise<Property | null> {
  const res = await fetch(`${API_BASE_URL}/properties/${id}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/categories`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function submitContact(data: ContactRequest): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/contacts`, {
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
