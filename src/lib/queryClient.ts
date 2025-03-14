import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // Data is fresh for 1 minute
      cacheTime: 1000 * 60 * 5, // Cache persists for 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
}); 