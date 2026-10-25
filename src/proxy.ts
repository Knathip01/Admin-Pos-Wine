import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow login page and static assets
  if (
    pathname === '/admin/login' ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Check for active session cookie or Supabase auth token
  const adminSession = request.cookies.get('bottleclub_admin_session')?.value;
  const allCookies = request.cookies.getAll();
  const hasSupabaseAuth = allCookies.some(
    (c) => (c.name.includes('-auth-token') || c.name.startsWith('sb-')) && c.value
  );

  const isAuthenticated = adminSession === 'active' || hasSupabaseAuth;

  // 3. If not authenticated, redirect to /admin/login
  if (!isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Prevent browser bfcache from serving sensitive admin data on "Back" navigation
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
