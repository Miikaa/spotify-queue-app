import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rate limiting map
const rateLimit = new Map();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100; // Maximum requests per window

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get the host for CSP
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self' https://accounts.spotify.com https://api.spotify.com; " +
    `connect-src 'self' https://accounts.spotify.com https://api.spotify.com ${protocol}://${host}/api/monitoring; ` +
    "img-src 'self' https://i.scdn.co data:; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline';"
  );

  // Skip rate limiting for monitoring endpoint
  if (request.nextUrl.pathname === '/api/monitoring') {
    return response;
  }

  // Only rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.headers.get('x-forwarded-for') ?? 
               request.headers.get('x-real-ip') ?? 
               'anonymous';
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Clean up old entries
    for (const [key, timestamp] of rateLimit.entries()) {
      if (timestamp < windowStart) {
        rateLimit.delete(key);
      }
    }

    // Count requests for this IP
    const requestCount = Array.from(rateLimit.entries())
      .filter(([key, timestamp]) => key.startsWith(ip) && timestamp > windowStart)
      .length;

    if (requestCount >= MAX_REQUESTS) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Add this request to the map
    rateLimit.set(`${ip}-${now}`, now);
  }

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 