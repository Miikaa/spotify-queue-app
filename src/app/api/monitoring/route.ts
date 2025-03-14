import { NextRequest } from 'next/server';

function parseSentryDsn(dsn: string) {
  const match = dsn.match(/^(https?:\/\/)([^@]+)@([^/]+)\/(\d+)$/);
  if (!match) throw new Error('Invalid Sentry DSN format');
  
  const [, protocol, credentials, host, projectId] = match;
  return {
    url: `${protocol}${host}/api/${projectId}/envelope/`,
    auth: credentials
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return new Response('Sentry DSN not configured', { status: 500 });
    }

    // Debug logging
    console.log('Monitoring request headers:', Object.fromEntries(request.headers.entries()));
    console.log('DSN:', process.env.NEXT_PUBLIC_SENTRY_DSN);
    
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);

    // More lenient content type check
    if (!contentType) {
      console.log('No content type provided');
      return new Response('Content type required', { status: 400 });
    }

    const envelope = await request.text();
    console.log('Envelope (first 500 chars):', envelope.slice(0, 500));

    if (!envelope.trim()) {
      console.log('Empty envelope received');
      return new Response('Empty envelope', { status: 400 });
    }

    // Log the first piece (header) of the envelope
    const pieces = envelope.split('\n');
    console.log('Number of envelope pieces:', pieces.length);
    console.log('First piece (header):', pieces[0]);

    // Parse the DSN to separate credentials from URL
    const { url, auth } = parseSentryDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
    console.log('Constructed URL:', url);

    const sentryResponse = await fetch(url, {
      method: 'POST',
      body: envelope,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=nextjs, sentry_key=${auth}`,
      },
    });

    if (!sentryResponse.ok) {
      console.log('Sentry response:', {
        status: sentryResponse.status,
        statusText: sentryResponse.statusText,
        headers: Object.fromEntries(sentryResponse.headers.entries()),
      });
      const responseBody = await sentryResponse.text();
      console.log('Sentry response body:', responseBody);
      throw new Error(`Sentry responded with ${sentryResponse.status}: ${sentryResponse.statusText}`);
    }

    const responseBody = await sentryResponse.text();
    return new Response(responseBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
    });

  } catch (error) {
    console.error('Error in monitoring endpoint:', error);
    return new Response('Internal Server Error', { status: 500 });
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