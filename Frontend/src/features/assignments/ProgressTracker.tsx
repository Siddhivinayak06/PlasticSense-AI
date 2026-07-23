import { TimelineEvent } from '@/types/assignment';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProgressTrackerProps {
  timeline: TimelineEvent[];
}

export const ProgressTracker = ({ timeline }: ProgressTrackerProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative pl-6 border-l-2 border-border/50 ml-4 space-y-6">
          {timeline.map((event, index) => {
            const isLast = index === timeline.length - 1;
            
            return (
              <div key={event.id} className="relative">
                <div className="absolute -left-[35px] top-0 bg-background">
                  {event.completed ? (
                    <div className="p-0.5 bg-emerald-500/10 rounded-full">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  ) : (
                    <div className="p-0.5 bg-secondary rounded-full">
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className={`text-sm font-semibold ${event.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {event.label}
                  </h4>
                  {event.completed ? (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(event.date).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Pending</p>
                  )}
                  {event.description && (
                    <p className="text-sm mt-2">{event.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
