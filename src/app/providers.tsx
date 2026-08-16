'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            // Keep data fresh-but-not-instantly-stale. Without a staleTime every
            // send/window refocus triggers a refetch that makes the optimistic
            // "Sent" beat feel sluggish before reconciliation. 30s is enough
            // for the emotional flow to settle while staying reasonably live.
            staleTime: 30_000,
            gcTime: 5 * 60_000,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
