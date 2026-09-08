import type { Locale } from '@/i18n/config';
import type { ContactAttribution } from '@/types';

export type AttributionTouch = {
  at: string;
  page_url: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};
export type TouchState = { origin: string; first: AttributionTouch; last: AttributionTouch; expires: number };
const UTM_LIMITS = { utm_source: 120, utm_medium: 120, utm_campaign: 160, utm_content: 160, utm_term: 160 } as const;
const STORAGE_KEY = 'estate_attribution_v1';

/** Keep page identity, never invitation tokens, search text or URL fragments. */
export function attributionUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    return `${url.origin}${url.pathname}`.slice(0, 2000);
  } catch { return undefined; }
}

export function nextTouchState(previous: TouchState | undefined, href: string, referrer: string, now: number, freshDocument: boolean, retentionDays: number): TouchState {
  const url = new URL(href);
  const valid = previous?.origin === url.origin && previous.expires > now ? previous : undefined;
  const campaign = Object.fromEntries(Object.entries(UTM_LIMITS).flatMap(([key, limit]) => {
    const value = url.searchParams.get(key)?.trim();
    return value ? [[key, value.slice(0, limit)]] : [];
  }));
  const cleanReferrer = attributionUrl(referrer);
  const external = freshDocument && cleanReferrer && new URL(cleanReferrer).origin !== url.origin;
  const changedCampaign = Object.keys(campaign).length > 0 && (freshDocument || Object.keys(UTM_LIMITS).some(key => campaign[key] !== valid?.last[key as keyof typeof UTM_LIMITS]));
  const touch: AttributionTouch = { at: new Date(now).toISOString(), page_url: attributionUrl(href)!, ...(external ? { referrer: cleanReferrer } : {}), ...campaign };
  return {
    origin: url.origin,
    first: valid?.first || touch,
    last: !valid || external || changedCampaign ? touch : valid.last,
    // Do not extend the first-touch retention period on every internal navigation.
    expires: valid?.expires || now + (retentionDays || 1) * 86400000,
  };
}

let state: TouchState | undefined;
let freshDocument = true;
let enabled = true;
let retentionDays = 0;
let sessionId: string | undefined;
let configuration = '';

function storage(): Storage | undefined {
  try { return retentionDays ? window.localStorage : window.sessionStorage; } catch { return undefined; }
}

export function configureAttribution(options: { enabled?: boolean; retentionDays?: number }) {
  const days = Math.max(0, Math.min(90, Math.floor(options.retentionDays || 0)));
  const key = `${options.enabled !== false}|${days}`;
  if (configuration === key) return;
  configuration = key;
  enabled = options.enabled !== false;
  retentionDays = days;
  state = undefined;
  freshDocument = true;
}

export function captureAttribution(): TouchState | undefined {
  if (!enabled || typeof window === 'undefined' || window.location.pathname.startsWith('/admin')) return undefined;
  if (!state) {
    try {
      const saved = JSON.parse(storage()?.getItem(STORAGE_KEY) || 'null');
      if (saved?.origin === window.location.origin && Number.isFinite(saved.expires) && saved.expires > Date.now()
        && [saved.first, saved.last].every(touch => touch && Number.isFinite(Date.parse(touch.at)) && attributionUrl(touch.page_url))) {
        state = saved;
      }
    } catch { /* Storage can be disabled; the in-memory visit remains usable. */ }
  }
  state = nextTouchState(state, window.location.href, document.referrer, Date.now(), freshDocument, retentionDays);
  freshDocument = false;
  try { storage()?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Keep the in-memory visit. */ }
  return state;
}

function getSessionId(): string {
  if (sessionId) return sessionId;
  try { sessionId = window.sessionStorage.getItem('estate_contact_session') || undefined; } catch { /* Optional storage. */ }
  sessionId ||= typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try { window.sessionStorage.setItem('estate_contact_session', sessionId); } catch { /* Optional storage. */ }
  return sessionId;
}

export function collectContactAttribution(locale: Locale, source: string, propertyId?: number): ContactAttribution {
  const base = { locale, source, property_id: propertyId };
  const visit = captureAttribution();
  if (!visit) return base;
  return {
    ...base,
    ...Object.fromEntries(Object.keys(UTM_LIMITS).map(key => [key, visit.last[key as keyof typeof UTM_LIMITS]])),
    page_url: attributionUrl(window.location.href),
    referrer: visit.last.referrer,
    session_id: getSessionId(),
    first_touch: visit.first,
    last_touch: visit.last,
  };
}
