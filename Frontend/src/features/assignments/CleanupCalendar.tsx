'use client';

import { useState } from 'react';
import { CleanupAssignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface CleanupCalendarProps {
  assignments: CleanupAssignment[];
}

export const CleanupCalendar = ({ assignments }: CleanupCalendarProps) => {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const selectedAssignments = assignments.filter(a => {
    if (!date) return false;
    const aDate = new Date(a.scheduledDate);
    return aDate.getDate() === date.getDate() && 
           aDate.getMonth() === date.getMonth() && 
           aDate.getFullYear() === date.getFullYear();
  });

  // Calculate dates with events for highlighting in a real calendar
  // (In standard shadcn calendar we just pick one date, but we could customize it to show dots)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="md:col-span-1 border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border shadow"
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>
            {date ? (
              <span>Schedule for {date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
            ) : (
              <span>Select a date to view schedule</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedAssignments.length > 0 ? (
            <div className="space-y-4">
              {selectedAssignments.map(assignment => (
                <div key={assignment.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold">{assignment.id}</span>
                      <Badge variant="outline" className="capitalize text-[10px] py-0">
                        {assignment.status}
                      </Badge>
                    </div>
                    <p className="font-semibold">{assignment.hotspotName}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {assignment.assignedNgo}</span>
                    </div>
                  </div>
                  
                  <Link href={`/assignments/${assignment.id}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-muted-foreground">No cleanup operations scheduled for this date.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
