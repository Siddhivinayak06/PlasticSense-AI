'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Cache data fresh for 60 seconds
            gcTime: 5 * 60 * 1000, // Inactive cache preserved for 5 minutes
            refetchOnWindowFocus: false, // Prevent redundant refetches on tab switch
            retry: 1,
          },
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
