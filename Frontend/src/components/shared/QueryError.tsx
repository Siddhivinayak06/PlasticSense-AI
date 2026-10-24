'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QueryErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Shown when the backend could not be reached or returned an error. */
export function QueryError({
  title = 'Could not load data',
  message = 'The WasteSense API did not respond. Check that the backend is running on port 8000, then retry.',
  onRetry,
  className,
}: QueryErrorProps) {
  return (
    <div
      role="alert"
      className={cn(
        'glass rounded-2xl p-6 flex flex-col items-center text-center gap-3 border border-destructive/30 bg-destructive/5',
        className,
      )}
    >
      <AlertTriangle className="size-8 text-destructive" aria-hidden="true" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Retry
        </Button>
      )}
    </div>
  );
}

/** A short, visible caveat about what a figure does and does not mean. */
export function DataNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground bg-muted/30 border border-border/50 rounded-lg px-3 py-2', className)}>
      {children}
    </p>
  );
}
