import { CleanupAssignment } from '@/types/assignment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Eye, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface CleanupTableProps {
  assignments: CleanupAssignment[];
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
    case 'critical': return 'text-red-600 dark:text-red-400 font-semibold';
    case 'high': return 'text-orange-600 dark:text-orange-400 font-semibold';
    case 'medium': return 'text-amber-600 dark:text-amber-400 font-semibold';
    case 'low': return 'text-blue-600 dark:text-blue-400 font-semibold';
    default: return 'text-gray-600 dark:text-gray-400';
  }
};

export const CleanupTable = ({ assignments }: CleanupTableProps) => {
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cleanup ID</TableHead>
            <TableHead>Hotspot</TableHead>
            <TableHead>Assigned NGO</TableHead>
            <TableHead>Scheduled Date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell className="font-medium font-mono text-xs">{assignment.id}</TableCell>
                <TableCell className="max-w-[150px] truncate" title={assignment.hotspotName}>
                  {assignment.hotspotName}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{assignment.assignedNgo}</span>
                    <span className="text-xs text-muted-foreground">{assignment.team.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(assignment.scheduledDate).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </TableCell>
                <TableCell className="capitalize">
                  <span className={getPriorityColor(assignment.priority)}>
                    {assignment.priority}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`capitalize border-0 ${getStatusColor(assignment.status)}`}>
                    {assignment.status.replace('-', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${assignment.progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${assignment.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-8 text-right">{assignment.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/assignments/${assignment.id}`} className="cursor-pointer flex items-center">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Report
                      </DropdownMenuItem>
                      {assignment.status === 'completed' && (
                        <DropdownMenuItem className="cursor-pointer flex items-center text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Verify Cleanup
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No cleanup assignments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
