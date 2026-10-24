'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CleanupAssignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CalendarX, Users, ChevronRight } from 'lucide-react';
import { SampleTag } from './CleanupTable';

interface CleanupCalendarProps {
  assignments: CleanupAssignment[];
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function AssignmentRow({ assignment }: { assignment: CleanupAssignment }) {
  return (
    <Link
      href={`/assignments/${assignment.id}`}
      className="flex items-center justify-between gap-3 p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/60 transition-colors"
    >
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-semibold">{assignment.id}</span>
          <StatusBadge status={assignment.status} size="sm" />
          {assignment.isSample && <SampleTag />}
        </div>
        <p className="font-semibold truncate">{assignment.title}</p>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Users className="w-3 h-3" aria-hidden="true" /> {assignment.ngoTeamName ?? 'No team assigned'}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
    </Link>
  );
}

export const CleanupCalendar = ({ assignments }: CleanupCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const scheduled = useMemo(() => assignments.filter((a) => a.scheduledDate), [assignments]);
  const unscheduled = useMemo(
    () => assignments.filter((a) => !a.scheduledDate && !['verified', 'rejected', 'completed'].includes(a.status)),
    [assignments],
  );
  const scheduledDays = useMemo(() => scheduled.map((a) => new Date(a.scheduledDate!)), [scheduled]);
  const selected = date ? scheduled.filter((a) => sameDay(new Date(a.scheduledDate!), date)) : [];
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scheduled
      .filter((a) => new Date(a.scheduledDate!) >= today)
      .sort((a, b) => new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime());
  }, [scheduled]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            modifiers={{ scheduled: scheduledDays }}
            modifiersClassNames={{ scheduled: 'font-bold text-primary underline underline-offset-4 decoration-2' }}
            className="rounded-md border shadow"
          />
          <p className="text-xs text-muted-foreground">Underlined dates have scheduled cleanups.</p>
          {upcoming.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setDate(new Date(upcoming[0].scheduledDate!))}>
              Jump to next scheduled cleanup
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {date
                ? `Schedule for ${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
                : 'Select a date to view schedule'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selected.length > 0 ? (
              <div className="space-y-3">
                {selected.map((a) => <AssignmentRow key={a.id} assignment={a} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CalendarX className="w-10 h-10 text-muted-foreground opacity-50 mb-3" aria-hidden="true" />
                <p className="text-muted-foreground">No cleanup operations scheduled for this date.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {unscheduled.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Open assignments without a date ({unscheduled.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unscheduled.map((a) => <AssignmentRow key={a.id} assignment={a} />)}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
