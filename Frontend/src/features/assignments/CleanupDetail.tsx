import { CleanupAssignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, CalendarDays, Download, MapPin, Users, Phone, Mail } from 'lucide-react';
import Link from 'next/link';
import { ProgressTracker } from './ProgressTracker';
import { TaskChecklist } from './TaskChecklist';

interface CleanupDetailProps {
  assignment: CleanupAssignment;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'assigned': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'verified': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    case 'closed': return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    case 'high': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'low': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export const CleanupDetail = ({ assignment }: CleanupDetailProps) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Link href="/assignments">
            <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-mono">{assignment.id}</h1>
              <Badge variant="outline" className={`capitalize border-0 ${getStatusColor(assignment.status)}`}>
                {assignment.status.replace('-', ' ')}
              </Badge>
              <Badge variant="outline" className={`capitalize ${getPriorityColor(assignment.priority)}`}>
                {assignment.priority}
              </Badge>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" />
              <span>{assignment.hotspotName}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          {assignment.status !== 'closed' && (
            <Button>Update Status</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-full">
                    <CalendarDays className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Scheduled Date</p>
                    <p className="text-lg font-semibold">
                      {new Date(assignment.scheduledDate).toLocaleDateString(undefined, {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500/10 rounded-full">
                    <Clock className="w-6 h-6 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Est. Duration</p>
                    <p className="text-lg font-semibold">{assignment.estimatedDurationHours} hours</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-emerald-500/10 rounded-full">
                    <Users className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Assigned NGO</p>
                    <p className="text-lg font-semibold">{assignment.assignedNgo}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Team Details</p>
                  <p className="font-medium">{assignment.team.name}</p>
                  <p className="text-sm text-muted-foreground">{assignment.team.volunteers.length} members assigned</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Team Roster</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {assignment.team.volunteers.map(volunteer => (
                  <div key={volunteer.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                      {volunteer.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{volunteer.name}</p>
                      <Badge variant={volunteer.role === 'leader' ? 'default' : 'secondary'} className="text-[10px] py-0 mt-1 capitalize">
                        {volunteer.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cleanup Evidence</CardTitle>
              <CardDescription>Photos from before and after the operation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Before</h4>
                  <div className="w-full h-[200px] bg-secondary rounded-lg border border-border/50 flex items-center justify-center overflow-hidden">
                    <span className="text-muted-foreground">No image uploaded</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">After</h4>
                  <div className="w-full h-[200px] bg-secondary rounded-lg border border-border/50 flex items-center justify-center overflow-hidden">
                    {assignment.status === 'completed' || assignment.status === 'verified' || assignment.status === 'closed' ? (
                      <span className="text-emerald-500 font-medium">Cleanup Verified</span>
                    ) : (
                      <span className="text-muted-foreground">Pending completion</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {assignment.supervisorNotes && (
            <Card>
              <CardHeader>
                <CardTitle>Supervisor Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 rounded-lg text-yellow-800 dark:text-yellow-200">
                  {assignment.supervisorNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProgressTracker timeline={assignment.timeline} />
          <TaskChecklist tasks={assignment.equipmentChecklist} />
        </div>
      </div>
    </div>
  );
};
