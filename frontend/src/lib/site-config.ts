/** Server runtime configuration. Never derive canonical URLs from request headers. */
export function validateSiteOrigin(value: string, production: boolean): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error('SITE_URL must be an absolute origin'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password
    || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('SITE_URL must contain only scheme and host, without credentials, path, query or fragment');
  }
  const host = url.hostname.toLowerCase();
  const placeholder = host === 'localhost' || host.endsWith('.localhost') || host === '[::1]'
    || /^127\./.test(host) || host === '0.0.0.0' || host === 'example.com'
    || /\.(example|invalid|test)$/.test(host);
  if (production && (url.protocol !== 'https:' || placeholder)) {
    throw new Error('Production SITE_URL must be a real HTTPS origin');
  }
  return url.origin;
}

export function getSiteOrigin(): string {
  const production = process.env.NODE_ENV === 'production' && process.env.DEPLOYMENT_ENV !== 'test';
  const value = process.env.SITE_URL;
  if (!value && production) throw new Error('SITE_URL is required in production');
  return validateSiteOrigin(value || 'http://localhost:3000', production);
}

export function absoluteSiteUrl(path: string): string {
  return new URL(path, `${getSiteOrigin()}/`).toString();
}
