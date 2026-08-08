import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

/**
 * Session refresh + route protection.
 *
 * Public: the design preview ("/"), the auth screens, and API routes. The
 * account/onboarding/memory surfaces require a session. When Supabase isn't
 * configured, the middleware is a no-op so the app stays usable for local
 * development and the design preview.
 */

const PROTECTED_PREFIXES = ['/home', '/account', '/onboarding', '/memory'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Degraded mode — auth not configured. Let everything through.
  if (!url || !anon) return NextResponse.next();

  const res = NextResponse.next();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies: { name: string; value: string; options?: Record<string, unknown> }[]) =>
        cookies.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;
  if (!user && isProtected(pathname)) {
    const redirect = new URL('/auth', req.url);
    redirect.searchParams.set('next', pathname);
    return NextResponse.redirect(redirect);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)'],
};
