import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes to avoid Edge Runtime issues with Supabase
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // For now, just pass through all requests
  // TODO: Re-enable Supabase middleware after resolving Edge Runtime compatibility
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'
  ]
};
