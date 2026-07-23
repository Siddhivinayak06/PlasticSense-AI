import { mockAssignments } from '@/mock/assignments';
import { CleanupCalendar } from '@/features/assignments/CleanupCalendar';
import { CalendarDays, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CalendarPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center gap-4">
        <Link href="/assignments">
          <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-blue-500" />
            Cleanup Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            View scheduled operations and team availability by date.
          </p>
        </div>
      </div>

      <CleanupCalendar assignments={mockAssignments} />
    </div>
  );
}
