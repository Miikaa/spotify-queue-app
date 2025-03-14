import * as Sentry from '@sentry/nextjs';
import { useSession } from 'next-auth/react';

export function SentryTest() {
  const { data: session } = useSession();

  const triggerError = () => {
    try {
      // Set user context if available
      if (session?.user) {
        Sentry.setUser({
          email: session.user.email || undefined,
          username: session.user.name || undefined,
        });
      }

      // Add breadcrumb for the action
      Sentry.addBreadcrumb({
        category: 'test',
        message: 'User triggered test error',
        level: 'info',
        timestamp: Date.now() / 1000,
      });

      // @ts-expect-error: Intentionally calling undefined function for testing
      myUndefinedFunction();
    } catch (error) {
      Sentry.withScope((scope) => {
        scope.setTag('error_type', 'test_error');
        scope.setLevel('error');
        scope.setContext('test_details', {
          location: 'SentryTest component',
          action: 'Manual error trigger',
          timestamp: new Date().toISOString(),
          userLoggedIn: !!session,
        });
        
        if (error instanceof Error) {
          Sentry.captureException(error);
        } else {
          Sentry.captureMessage('Unknown error in SentryTest component');
        }
      });
      
      // Re-throw the error to be caught by the ErrorBoundary
      throw error;
    }
  };

  return (
    <button
      onClick={triggerError}
      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full transition-colors duration-200"
    >
      Trigger Test Error
    </button>
  );
} 