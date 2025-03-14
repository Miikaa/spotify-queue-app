import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  debug: process.env.NODE_ENV === 'development',
  tracesSampleRate: 1.0,
  tunnel: '/api/monitoring',
  environment: process.env.NODE_ENV,

  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Sending event to Sentry:', JSON.stringify(event, null, 2));
    }
    return event;
  },
}); 