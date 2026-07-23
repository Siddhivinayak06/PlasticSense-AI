'use client';

import { motion } from 'framer-motion';
import { Eye, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { recentReports } from '@/mock';
import type { SeverityLevel, ReportStatus } from '@/types/dashboard';
import { cn } from '@/lib/utils';

const severityConfig: Record<SeverityLevel, string> = {
  critical: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  medium: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  low: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

const statusConfig: Record<ReportStatus, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  'in-progress': 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  verified: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
};

export function RecentReportsTable() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-base font-semibold text-foreground">Recent Reports</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Latest pollution reports from the field</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px]">Report ID</TableHead>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Plastic Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead className="w-[60px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentReports.map((report) => (
            <TableRow key={report.id} className="group">
              <TableCell className="font-mono text-xs font-medium">{report.id}</TableCell>
              <TableCell>
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
                  <ImageIcon className="size-4 text-muted-foreground" />
                </div>
              </TableCell>
              <TableCell className="font-medium text-sm">{report.plasticType}</TableCell>
              <TableCell>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border',
                  severityConfig[report.severity]
                )}>
                  {report.severity}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                {report.location}
              </TableCell>
              <TableCell>
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border capitalize',
                  statusConfig[report.status]
                )}>
                  {report.status}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {new Date(report.reportedDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`View report ${report.id}`}
                >
                  <Eye className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
