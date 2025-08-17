import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Only apply middleware to dashboard and account routes
  // All other routes pass through without middleware
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
