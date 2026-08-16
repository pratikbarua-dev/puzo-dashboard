import { Skeleton } from '@/components/ui';

/**
 * Route-level loading boundary for the whole (app) shell. Shows the page
 * chrome skeleton while a route segment + its data load, so the transition
 * never flashes white. Kept layout-agnostic: it just occupies the content
 * area the AppShell reserves.
 */
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-28 pt-4 md:px-6 md:pb-8">
      <Skeleton className="mb-6 h-9 w-48" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  );
}
