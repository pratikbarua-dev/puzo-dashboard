import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const PUZO_API_BASE = process.env.PUZO_API_BASE || 'http://localhost:8080';

/**
 * BFF proxy: forwards browser requests to the PUZO backend. It validates the
 * Better Auth session server-side, mints a short-lived RS256 JWT via the JWT
 * plugin, and attaches it as a Bearer token so the backend can verify it
 * against this app's JWKS endpoint. Admin paths also get the legacy admin key.
 */
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  let token: string | null = null;
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (session?.session) {
    const res = await auth.api.signJWT({
      body: {
        payload: {
          sub: session.user.id,
          email: session.user.email ?? '',
          name: session.user.name ?? '',
        },
      },
    });
    token = res.token ?? null;
  }

  const target = new URL(
    `/api/${path.join('/')}${request.nextUrl.search}`,
    PUZO_API_BASE,
  );

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (request.headers.get('accept')) {
    headers.set('accept', request.headers.get('accept')!);
  }
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  // Legacy admin-key support for admin routes (only attach if session has admin/super_admin role).
  const isAdminPath = path[0] === 'admin';
  const userRole = (session?.user as { role?: string } | undefined)?.role;
  if (isAdminPath && process.env.ADMIN_API_KEY && (userRole === 'admin' || userRole === 'super_admin')) {
    headers.set('x-admin-key', process.env.ADMIN_API_KEY);
  }

  const method = request.method;
  const body = ['GET', 'HEAD'].includes(method) ? undefined : request.body;

  const upstream = await fetch(target, {
    method,
    headers,
    body: body as BodyInit | undefined,
    duplex: 'half',
    cache: 'no-store',
    redirect: 'follow',
  } as RequestInit);

  const responseBody = await upstream.arrayBuffer();
  const responseHeaders = new Headers();
  responseHeaders.set('content-type', upstream.headers.get('content-type') || 'application/json');

  return new Response(responseBody, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  params: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, params);
}

export async function POST(
  request: NextRequest,
  params: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, params);
}

export async function PUT(
  request: NextRequest,
  params: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, params);
}

export async function PATCH(
  request: NextRequest,
  params: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, params);
}

export async function DELETE(
  request: NextRequest,
  params: { params: Promise<{ path: string[] }> },
) {
  return proxy(request, params);
}
