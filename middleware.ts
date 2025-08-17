import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for public routes and static assets
  if (
    request.nextUrl.pathname === '/' ||
    request.nextUrl.pathname === '/signin' ||
    request.nextUrl.pathname === '/auth/callback' ||
    request.nextUrl.pathname.startsWith('/auth/reset_password') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/webhooks') ||
    request.nextUrl.pathname === '/api/companies/status' ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // For dashboard routes, redirect to signin (auth will be handled in page components)
  if (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/account')) {
    // Let the page component handle auth check to avoid Edge Runtime issues
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match only specific paths that need middleware
     * Exclude all public routes and static files
     */
    '/dashboard/:path*',
    '/account/:path*'
  ]
};
