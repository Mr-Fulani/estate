import { 
  Category, 
  ContactRequest, 
  Property, 
  PropertyFilter, 
  PropertyListResponse,
  AdminStats,
  PropertyFormData
} from '@/types';

function getApiBaseUrl(): string {
  // If running on server (SSR/RSC) inside Docker or Node
  if (typeof window === 'undefined') {
    return process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://api:8000/api/v1';
  }
  // If running in client browser
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
}

// ---------------- PUBLIC API ----------------

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

// ---------------- ADMIN API ----------------

export async function fetchAdminStats(): Promise<AdminStats> {
  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/admin/stats`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return {
        total_properties: 0,
        active_properties: 0,
        featured_properties: 0,
        total_contacts: 0,
        new_contacts: 0,
        categories_count: 0,
      };
    }

    return await res.json();
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return {
      total_properties: 0,
      active_properties: 0,
      featured_properties: 0,
      total_contacts: 0,
      new_contacts: 0,
      categories_count: 0,
    };
  }
}

export async function createProperty(data: PropertyFormData): Promise<Property> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create property' }));
    throw new Error(err.detail || 'Failed to create property');
  }

  return await res.json();
}

export async function updateProperty(id: number | string, data: Partial<PropertyFormData>): Promise<Property> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/properties/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update property' }));
    throw new Error(err.detail || 'Failed to update property');
  }

  return await res.json();
}

export async function deleteProperty(id: number | string): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/properties/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete property');
  }
}

export async function fetchContactRequests(status?: string): Promise<ContactRequest[]> {
  try {
    const baseUrl = getApiBaseUrl();
    const url = status ? `${baseUrl}/contacts?status=${status}` : `${baseUrl}/contacts`;
    const res = await fetch(url, {
      cache: 'no-store',
    });

    if (!res.ok) {
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
  });

  if (!res.ok) {
    throw new Error('Failed to update contact status');
  }

  return await res.json();
}

export async function deleteContactRequest(id: number): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/contacts/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete contact request');
  }
}

export async function createCategory(data: { name: string; slug: string; description?: string }): Promise<Category> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to create category');
  }

  return await res.json();
}

export async function deleteCategory(id: number): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/categories/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete category');
  }
}
