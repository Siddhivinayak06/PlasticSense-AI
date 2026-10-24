import { Loader2 } from 'lucide-react';

export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground" role="status" aria-live="polite">
      <Loader2 className="size-8 animate-spin" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
