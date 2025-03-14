import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  debug: true, // Enable debug mode
  tracesSampleRate: 1.0,
  tunnel: '/api/monitoring',
  environment: process.env.NODE_ENV,

  beforeSend(event) {
    // Log the event in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Sentry event:', JSON.stringify(event, null, 2));
    }
    return event;
  },
}); 