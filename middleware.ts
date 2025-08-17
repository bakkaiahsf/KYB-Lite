import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // No authentication required - all routes are public
  // Pass through all requests without any middleware processing
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * No routes need middleware - everything is public
     * This matcher will not match any routes
     */
    '/((?!.*).)*'
  ]
};
