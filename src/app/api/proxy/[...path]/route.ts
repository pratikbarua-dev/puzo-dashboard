import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PUZO_API_BASE = process.env.PUZO_API_BASE || 'http://localhost:8080';

/**
 * BFF proxy: forwards browser requests to the PUZO backend, attaching the
 * user's Supabase access token server-side so it never reaches the browser.
 * Admin paths also get the legacy x-admin-key from the server env.
 */
async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

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
  if (session?.access_token) {
    headers.set('authorization', `Bearer ${session.access_token}`);
  }
  // Legacy admin-key support for admin routes (requireAdmin accepts either).
  const isAdminPath = path[0] === 'admin';
  if (isAdminPath && process.env.ADMIN_API_KEY) {
    headers.set('x-admin-key', process.env.ADMIN_API_KEY);
  }

  const method = request.method;
  const body = ['GET', 'HEAD'].includes(method) ? undefined : request.body;

  const upstream = await fetch(target, {
    method,
    headers,
    body: body as BodyInit | undefined,
    cache: 'no-store',
    redirect: 'follow',
  });

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
