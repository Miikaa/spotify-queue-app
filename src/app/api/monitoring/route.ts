import { NextRequest, NextResponse } from 'next/server';

function parseDsn(dsn: string) {
  const match = dsn.match(/^(?:(\w+):)?\/\/(?:(\w+)(?::(\w+))?@)([\w.-]+)\/(.+)/);
  if (!match) {
    throw new Error('Invalid DSN');
  }
  const [, , publicKey, , host, projectId] = match;
  return { publicKey, host, projectId };
}

function isBase64(str: string) {
  return /^[A-Za-z0-9+/=]+$/.test(str);
}

export async function POST(request: NextRequest) {
  console.log('Monitoring endpoint called:', {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers),
  });

  try {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (!dsn) {
      console.error('Sentry DSN not configured');
      return NextResponse.json({ error: 'Sentry DSN not configured' }, { status: 500 });
    }

    const { host, projectId } = parseDsn(dsn);
    const sentryIngestUrl = `https://${host}/api/${projectId}/envelope/`;

    // Get the raw body and content type
    const body = await request.text();
    const contentType = request.headers.get('content-type');
    
    console.log('Request details:', {
      bodyLength: body.length,
      contentType,
      isBase64Looking: isBase64(body),
      firstChars: body.slice(0, 50),
    });

    // Forward to Sentry with auth header
    const sentryAuth = request.headers.get('x-sentry-auth');
    const sentryResponse = await fetch(sentryIngestUrl, {
      method: 'POST',
      body: body,
      headers: {
        // Always use application/x-sentry-envelope as content type
        'Content-Type': 'application/x-sentry-envelope',
        ...(sentryAuth ? { 'X-Sentry-Auth': sentryAuth } : {}),
      },
    });

    console.log('Sentry response:', {
      status: sentryResponse.status,
      statusText: sentryResponse.statusText,
      headers: Object.fromEntries(sentryResponse.headers),
    });

    const responseBody = await sentryResponse.text();
    console.log('Sentry response body:', responseBody);

    // Forward Sentry's response headers
    const headers = new Headers({
      'Content-Type': sentryResponse.headers.get('Content-Type') || 'text/plain',
      'Access-Control-Allow-Origin': '*',
    });
    
    // Copy relevant Sentry headers
    ['x-sentry-error', 'x-sentry-rate-limits', 'retry-after'].forEach(header => {
      const value = sentryResponse.headers.get(header);
      if (value) headers.set(header, value);
    });

    return new NextResponse(responseBody, {
      status: sentryResponse.status,
      headers,
    });

  } catch (error) {
    console.error('Error in monitoring endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type, X-Sentry-Auth',
    },
  });
} 