import type { TimelineEvent } from '@/types/assignment';
import { CheckCircle2, Circle } from 'lucide-react';

interface ProgressTrackerProps {
  timeline: TimelineEvent[];
}

export const ProgressTracker = ({ timeline }: ProgressTrackerProps) => (
  <div className="glass rounded-2xl p-5">
    <h2 className="text-sm font-bold flex items-center gap-2 text-foreground pb-4 border-b border-border/50 mb-4">
      <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
      Workflow Timeline
    </h2>
    <ol className="relative pl-6 border-l-2 border-border/50 ml-2 space-y-5">
      {timeline.map((event) => (
        <li key={event.id} className="relative">
          <span className="absolute -left-[33px] top-0.5 bg-background rounded-full">
            {event.completed
              ? <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
              : <Circle className="size-4 text-muted-foreground/50" aria-hidden="true" />}
          </span>
          <p className={event.completed ? 'text-sm font-semibold text-foreground' : 'text-sm text-muted-foreground'}>
            {event.label}
            <span className="sr-only">{event.completed ? ' (done)' : ' (not yet)'}</span>
          </p>
          {event.date && (
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(event.date).toLocaleString()}</p>
          )}
          {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
        </li>
      ))}
    </ol>
  </div>
);
