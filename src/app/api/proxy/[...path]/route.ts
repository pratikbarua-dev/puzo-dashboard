import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

const PUZO_API_BASE = process.env.PUZO_API_BASE || 'http://localhost:8080';

/** Responses the browser must never cache, in the backend's envelope shape. */
function jsonError(status: number, code: string, message: string) {
  return new Response(JSON.stringify({ success: false, error: { code, message } }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Roles resolved from the backend, cached briefly so an admin page's burst of
 * requests costs one `/api/me` lookup instead of one per request.
 */
const roleCache = new Map<string, { role: string; expires: number }>();
const ROLE_TTL_MS = 30_000;

async function resolveRole(userId: string, token: string): Promise<string | null> {
  const hit = roleCache.get(userId);
  if (hit && hit.expires > Date.now()) return hit.role;

  try {
    const res = await fetch(new URL('/api/me', PUZO_API_BASE), {
      headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { profile?: { role?: string } } };
    const role = body?.data?.profile?.role ?? null;
    if (role) roleCache.set(userId, { role, expires: Date.now() + ROLE_TTL_MS });
    return role;
  } catch {
    return null;
  }
}

/** Rate-limit headers the client needs to show a real "try again in Ns" countdown. */
const FORWARDED_RESPONSE_HEADERS = [
  'retry-after',
  'ratelimit',
  'ratelimit-policy',
  'ratelimit-limit',
  'ratelimit-remaining',
  'ratelimit-reset',
];

/**
 * BFF proxy: forwards browser requests to the PUZO backend.
 *
 * The browser never sees a bearer token — this route validates the Better Auth
 * session server-side and mints a short-lived RS256 JWT the backend verifies
 * against the dashboard's JWKS. Upstream responses (including errors) are
 * passed through untouched, so the UI always reflects real backend state.
 */
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.session) {
    console.log('[BFF Proxy] 401: No session found in request headers');
    return jsonError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  let token: string | null = null;
  try {
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
  } catch (jwtErr) {
    console.error('[BFF Proxy] Failed to sign JWT:', jwtErr);
  }

  if (!token) {
    console.log('[BFF Proxy] 401: Could not mint token');
    return jsonError(
      401,
      'UNAUTHORIZED',
      'Could not mint an API token for this session. Please sign in again.',
    );
  }

  const target = new URL(`/api/${path.join('/')}${request.nextUrl.search}`, PUZO_API_BASE);

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  const accept = request.headers.get('accept');
  if (accept) headers.set('accept', accept);
  headers.set('authorization', `Bearer ${token}`);

  // The shared admin key is only ever attached to admin routes, and only for a
  // caller the backend itself reports as an admin. Sending it on every request
  // would let any signed-in user reach /api/admin/* through this proxy.
  if (path[0] === 'admin' && process.env.ADMIN_API_KEY) {
    const role = await resolveRole(session.user.id, token);
    if (role === 'admin' || role === 'super_admin') {
      headers.set('x-admin-key', process.env.ADMIN_API_KEY);
    }
  }

  const method = request.method;
  const body = ['GET', 'HEAD'].includes(method) ? undefined : request.body;

  try {
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
    responseHeaders.set(
      'content-type',
      upstream.headers.get('content-type') || 'application/json',
    );
    responseHeaders.set('cache-control', 'no-store');
    for (const name of FORWARDED_RESPONSE_HEADERS) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }

    if (!upstream.ok) {
      const clone = new Response(responseBody);
      const text = await clone.text();
      console.log(`[BFF Proxy] Upstream returned status ${upstream.status} for ${target.toString()}:`, text);
    }

    return new Response(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    console.error(`[BFF Proxy] Upstream fetch error for ${target.toString()}:`, err);
    return jsonError(
      502,
      'UPSTREAM_ERROR',
      err instanceof Error ? err.message : 'Upstream service error',
    );
  }
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
