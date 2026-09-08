import { indexingEnabled, previewResponse } from '@/lib/indexing';
import { getLocaleConfig } from '@/lib/runtime-locales';
import { NextRequest, NextResponse } from 'next/server';

import { documentLanguageTags, isLocale } from '@/i18n/config';


const PUBLIC_FILE = /\.[^/]+$/;


export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const preview = previewResponse(request);
  if (preview) return preview;
  const protect = (response: NextResponse) => {
    if (!indexingEnabled() || pathname.startsWith('/admin') || pathname.startsWith('/api')) response.headers.set('X-Robots-Tag','noindex, follow');
    return response;
  };

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = request.cookies.get('estate_admin_session');
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('returnTo', `${pathname}${request.nextUrl.search}`);
      return protect(NextResponse.redirect(loginUrl));
    }
    try {
      const apiUrl = process.env.INTERNAL_API_URL || 'http://api:8000/api/v1';
      const verification = await fetch(`${apiUrl}/auth/me`, {
        headers: { cookie: request.headers.get('cookie') || '' },
        cache: 'no-store',
      });
      if (!verification.ok) throw new Error('Invalid administrator session');
    } catch {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('reason', 'expired');
      loginUrl.searchParams.set('returnTo', `${pathname}${request.nextUrl.search}`);
      const redirect = NextResponse.redirect(loginUrl);
      redirect.cookies.delete('estate_admin_session');
      redirect.cookies.delete('estate_admin_csrf');
      return protect(redirect);
    }
  }

  // Resolve the upstream at request time so one image can serve separate installations.
  if (pathname === '/api/backend' || pathname.startsWith('/api/backend/') || pathname.startsWith('/uploads/')) {
    const api = new URL(process.env.INTERNAL_API_URL || 'http://api:8000/api/v1');
    const destination = new URL(api.origin);
    destination.pathname = pathname.startsWith('/api/backend')
      ? `${api.pathname.replace(/\/$/, '')}${pathname.slice('/api/backend'.length)}`
      : pathname;
    destination.search = request.nextUrl.search;
    return protect(NextResponse.rewrite(destination));
  }

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname === '/icon' || pathname === '/apple-icon' ||
    PUBLIC_FILE.test(pathname)
  ) {
    return protect(NextResponse.next());
  }

  const { locales: activeLocales, defaultLocale } = getLocaleConfig();
  const firstSegment = pathname.split('/')[1];
  if (isLocale(firstSegment) && !activeLocales.includes(firstSegment)) return new NextResponse('Not found', { status: 404, headers: {'X-Robots-Tag': 'noindex'} });
  if (isLocale(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-estate-locale', firstSegment);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('Content-Language', documentLanguageTags[firstSegment]);
    if (request.nextUrl.searchParams.has('token') || request.nextUrl.searchParams.has('preview')) {
      response.headers.set('X-Robots-Tag', 'noindex, follow');
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
      response.headers.set('Referrer-Policy', 'no-referrer');
    }
    return protect(response);
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return protect(NextResponse.redirect(redirectUrl, 308));
}


export const config = {
  matcher: ['/((?!_next/static).*)'],
};
