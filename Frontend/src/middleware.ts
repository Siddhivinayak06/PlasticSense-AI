import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require an authenticated session
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/detect',
  '/history',
  '/map',
  '/hotspots',
  '/analytics',
  '/assignments',
  '/ngo-teams',
  '/verification',
  '/impact',
  '/settings',
  '/users',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find any verified supabase auth token cookie (ignoring PKCE code-verifiers)
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(
    (c) =>
      c.name === 'wastesense_auth_session' ||
      (c.name.includes('-auth-token') && !c.name.includes('code-verifier'))
  );

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  // If visiting protected route without auth cookie, redirect to login
  if (isProtected && !hasAuthCookie) {
    // Only redirect if cookies indicate unauthenticated; client AuthGuard handles token fallback
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, images, sitemap, robots
     * - api routes and media streaming routes (handled directly by Next.js rewrites)
     */
    '/((?!api(?:/|$)|media(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
