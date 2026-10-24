import Link from 'next/link';
import type { CleanupAssignment } from '@/types/assignment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

interface CleanupTableProps {
  assignments: CleanupAssignment[];
  compact?: boolean;
  emptyMessage?: string;
}

const PRIORITY_STYLE: Record<CleanupAssignment['priority'], string> = {
  urgent: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
};

export function PriorityPill({ priority }: { priority: CleanupAssignment['priority'] }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize', PRIORITY_STYLE[priority])}>
      {priority}
    </span>
  );
}

export function SampleTag() {
  return (
    <span
      title="Seeded demonstration record with fictional details"
      className="ml-1.5 inline-flex rounded border border-dashed border-muted-foreground/40 px-1 text-[10px] font-medium uppercase text-muted-foreground"
    >
      Sample
    </span>
  );
}

export const CleanupTable = ({ assignments, compact = false, emptyMessage = 'No cleanup assignments found.' }: CleanupTableProps) => (
  <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden backdrop-blur-sm">
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow className="border-border/60">
          <TableHead className="h-10 text-xs font-semibold">Assignment</TableHead>
          {!compact && <TableHead className="h-10 text-xs font-semibold">NGO Team</TableHead>}
          <TableHead className="h-10 text-xs font-semibold">Scheduled</TableHead>
          {!compact && <TableHead className="h-10 text-xs font-semibold">Priority</TableHead>}
          <TableHead className="h-10 text-xs font-semibold">Status</TableHead>
          {!compact && <TableHead className="h-10 text-xs font-semibold">Objects (before → after)</TableHead>}
          <TableHead className="h-10 text-xs font-semibold text-right"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assignments.length > 0 ? (
          assignments.map((a) => (
            <TableRow key={a.id} className="border-border/50 hover:bg-muted/30">
              <TableCell className="max-w-[260px]">
                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-sm truncate" title={a.title}>
                    {a.title}
                    {a.isSample && <SampleTag />}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">{a.id}</span>
                </div>
              </TableCell>
              {!compact && (
                <TableCell className="text-sm">{a.ngoTeamName ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
              )}
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {a.scheduledDate
                  ? new Date(a.scheduledDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                  : 'Not scheduled'}
              </TableCell>
              {!compact && <TableCell><PriorityPill priority={a.priority} /></TableCell>}
              <TableCell><StatusBadge status={a.status} size="sm" /></TableCell>
              {!compact && (
                <TableCell className="text-sm">
                  {a.wasteBefore}
                  {a.wasteAfter !== null ? ` → ${a.wasteAfter}` : ''}
                  {a.wasteReductionPercent !== null && (
                    <span className="text-xs text-muted-foreground"> ({a.wasteReductionPercent}%)</span>
                  )}
                </TableCell>
              )}
              <TableCell className="text-right">
                <Link href={`/assignments/${a.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-xs">
                    {a.status === 'completed' ? 'Verify' : 'Open'}
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={compact ? 4 : 7} className="h-24 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </div>
);
