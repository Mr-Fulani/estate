import type { Locale } from '@/i18n/config';
import type { ContactAttribution } from '@/types';


const SESSION_KEY = 'estate_contact_session';


function getSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  let value = window.sessionStorage.getItem(SESSION_KEY);
  if (!value) {
    value = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION_KEY, value);
  }
  return value;
}


export function collectContactAttribution(
  locale: Locale,
  source: string,
  propertyId?: number,
): ContactAttribution {
  if (typeof window === 'undefined') return { locale, source, property_id: propertyId };
  const params = new URLSearchParams(window.location.search);
  return {
    locale,
    source,
    property_id: propertyId,
    page_url: window.location.href,
    referrer: document.referrer || undefined,
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
    session_id: getSessionId(),
  };
}
