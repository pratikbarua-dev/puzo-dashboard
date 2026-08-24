import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
  const isLandingPage = request.nextUrl.pathname === '/';
  const isReservePage = request.nextUrl.pathname.startsWith('/reserve');
  const isPublicPage = isLandingPage || isReservePage;

  if (sessionCookie && isLandingPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/overview';
    return NextResponse.redirect(url);
  }

  if (!sessionCookie && !isAuthPage && !isApiRoute && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all paths except Next internals, PWA assets, and static files.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico)$).*)',
  ],
};
