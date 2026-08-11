import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

  if (!sessionCookie && !isAuthPage && !isApiRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (sessionCookie && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on all paths except Next internals and static assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
