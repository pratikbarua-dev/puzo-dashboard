'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui';

/**
 * Route-level error boundary for the (app) shell. Catches render + data-load
 * errors thrown anywhere under /overview, /interactions, /devices, etc.,
 * before they blank the whole app — so a broken page degrades to a recovery
 * card rather than white-screening. `reset` re-renders the segment.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to console for debugging; the UI stays calm and recoverable.
    console.error('[app] route error:', error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-16 md:px-6 md:pb-8">
      <ErrorState
        message={error.message || 'Something went wrong loading this page.'}
        onRetry={reset}
      />
    </div>
  );
}
