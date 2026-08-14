'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
}

export function SkeletonCard({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('glass rounded-2xl p-5 space-y-4', className)}>
      <div className="flex items-start justify-between">
        <div className="size-10 rounded-xl bg-muted/60 skeleton-shimmer" />
        <div className="h-5 w-16 rounded-full bg-muted/60 skeleton-shimmer" />
      </div>
      <div className="space-y-2">
        <div className="h-7 w-24 rounded bg-muted/60 skeleton-shimmer" />
        <div className="h-4 w-32 rounded bg-muted/40 skeleton-shimmer" />
      </div>
      <div className="h-1 w-full rounded-full bg-muted/40 skeleton-shimmer" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className }: LoadingSkeletonProps & { rows?: number }) {
  return (
    <div className={cn('glass rounded-2xl overflow-hidden', className)}>
      <div className="px-5 py-4 border-b border-border/50">
        <div className="h-5 w-40 rounded bg-muted/60 skeleton-shimmer" />
        <div className="h-3 w-60 rounded bg-muted/40 skeleton-shimmer mt-2" />
      </div>
      <div className="divide-y divide-border/30">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3">
            <div className="size-8 rounded-lg bg-muted/40 skeleton-shimmer shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 rounded bg-muted/50 skeleton-shimmer" />
              <div className="h-3 w-1/2 rounded bg-muted/30 skeleton-shimmer" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted/40 skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('glass rounded-2xl p-5', className)}>
      <div className="h-5 w-40 rounded bg-muted/60 skeleton-shimmer mb-4" />
      <div className="h-[250px] rounded-xl bg-muted/30 skeleton-shimmer" />
    </div>
  );
}

export function SkeletonMap({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn('glass rounded-2xl overflow-hidden', className)}>
      <div className="h-[400px] bg-muted/20 skeleton-shimmer flex items-center justify-center">
        <div className="text-muted-foreground/40 text-sm">Loading map...</div>
      </div>
    </div>
  );
}

export function SkeletonKPIGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
