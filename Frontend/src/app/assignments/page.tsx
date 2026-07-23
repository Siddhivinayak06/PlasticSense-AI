import { mockAssignments } from '@/mock/assignments';
import { CleanupDashboard } from '@/features/assignments/CleanupDashboard';
import { ClipboardList, CalendarDays, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AssignmentsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-blue-500" />
            Cleanup Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage cleanup assignments, monitor progress, and coordinate with NGOs.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/assignments/calendar">
            <Button variant="outline" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Calendar View
            </Button>
          </Link>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <CleanupDashboard assignments={mockAssignments} />
    </div>
  );
}