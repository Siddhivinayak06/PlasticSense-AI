import { CleanupAssignment } from '@/types/assignment';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Eye, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface CleanupTableProps {
  assignments: CleanupAssignment[];
  compact?: boolean;
}

export const CleanupTable = ({ assignments, compact = false }: CleanupTableProps) => {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden backdrop-blur-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="border-border/60">
            <TableHead className="h-10 text-xs font-semibold">ID</TableHead>
            <TableHead className="h-10 text-xs font-semibold">Hotspot</TableHead>
            {!compact && <TableHead className="h-10 text-xs font-semibold">Assigned NGO</TableHead>}
            <TableHead className="h-10 text-xs font-semibold">Scheduled Date</TableHead>
            {!compact && <TableHead className="h-10 text-xs font-semibold">Priority</TableHead>}
            <TableHead className="h-10 text-xs font-semibold">Status</TableHead>
            <TableHead className="h-10 text-xs font-semibold">Progress</TableHead>
            <TableHead className="h-10 text-xs font-semibold text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.length > 0 ? (
            assignments.map((assignment) => (
              <TableRow key={assignment.id} className="border-border/50 hover:bg-muted/30">
                <TableCell className="font-mono text-xs text-muted-foreground">{assignment.id}</TableCell>
                <TableCell className="max-w-[150px] truncate font-medium text-sm" title={assignment.hotspotName}>
                  {assignment.hotspotName}
                </TableCell>
                {!compact && (
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{assignment.assignedNgo}</span>
                      <span className="text-[11px] text-muted-foreground uppercase">{assignment.team.name}</span>
                    </div>
                  </TableCell>
                )}
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(assignment.scheduledDate).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </TableCell>
                {!compact && (
                  <TableCell>
                    <SeverityBadge severity={assignment.priority} size="sm" />
                  </TableCell>
                )}
                <TableCell>
                  <StatusBadge status={assignment.status} size="sm" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${assignment.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                        style={{ width: `${assignment.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold w-8 text-right">{assignment.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {/* Using base-ui dropdown menu requires manual classname propagation or careful use */}
                  {/* Here we use the DropdownMenu provided by shadcn components which in this app requires no asChild for triggers usually */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent hover:bg-muted ml-auto">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="p-0">
                        <Link href={`/assignments/${assignment.id}`} className="cursor-pointer flex items-center w-full px-2 py-1.5 text-sm">
                          <Eye className="w-4 h-4 mr-2 text-primary" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer flex items-center px-2 py-1.5 text-sm">
                        <FileText className="w-4 h-4 mr-2 text-primary" />
                        Generate Report
                      </DropdownMenuItem>
                      {assignment.status === 'completed' && (
                        <DropdownMenuItem className="cursor-pointer flex items-center px-2 py-1.5 text-sm text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 dark:focus:text-emerald-300">
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
              <TableCell colSpan={compact ? 6 : 8} className="h-24 text-center text-sm text-muted-foreground">
                No cleanup assignments found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
