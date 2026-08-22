import { NextRequest, NextResponse } from 'next/server';

import { defaultLocale, isLocale } from '@/i18n/config';


const PUBLIC_FILE = /\.[^/]+$/;


export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = request.cookies.get('estate_admin_session');
    if (!session) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.searchParams.set('returnTo', `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }
    try {
      const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
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
      return redirect;
    }
  }

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split('/')[1];
  if (isLocale(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-estate-locale', firstSegment);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname === '/' ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(redirectUrl, 308);
}


export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
