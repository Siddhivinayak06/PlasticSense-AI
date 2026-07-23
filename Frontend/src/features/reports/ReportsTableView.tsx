'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { severityConfig, statusConfig, priorityConfig } from '@/constants/reports';
import { ReportActionMenu } from './ReportActionMenu';
import type { Report } from '@/types/report';
import { cn } from '@/lib/utils';

interface ReportsTableViewProps {
  reports: Report[];
}

export function ReportsTableView({ reports }: ReportsTableViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[110px]">Report ID</TableHead>
            <TableHead className="w-[48px]">Image</TableHead>
            <TableHead>Plastic Type</TableHead>
            <TableHead className="hidden sm:table-cell">Confidence</TableHead>
            <TableHead className="hidden lg:table-cell">Objects</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead className="hidden md:table-cell">Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead className="hidden xl:table-cell">City</TableHead>
            <TableHead className="hidden xl:table-cell">Team</TableHead>
            <TableHead className="w-[44px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report, index) => (
            <motion.tr
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className="border-b transition-colors hover:bg-muted/50 group"
            >
              <TableCell>
                <Link
                  href={`/reports/${report.id}`}
                  className="font-mono text-xs font-semibold text-primary hover:underline"
                >
                  {report.id}
                </Link>
              </TableCell>
              <TableCell>
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60">
                  <ImageIcon className="size-4 text-muted-foreground" />
                </div>
              </TableCell>
              <TableCell className="font-medium text-sm">{report.plasticTypeLabel}</TableCell>
              <TableCell className="hidden sm:table-cell">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${report.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{report.confidence}%</span>
                </div>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                {report.detectedObjects}
              </TableCell>
              <TableCell>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', severityConfig[report.severity].bg, severityConfig[report.severity].color)}>
                  {severityConfig[report.severity].label}
                </span>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', priorityConfig[report.cleanupPriority].bg, priorityConfig[report.cleanupPriority].color)}>
                  {priorityConfig[report.cleanupPriority].label}
                </span>
              </TableCell>
              <TableCell>
                <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border', statusConfig[report.status].bg, statusConfig[report.status].color)}>
                  {statusConfig[report.status].label}
                </span>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                {new Date(report.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </TableCell>
              <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">{report.city}</TableCell>
              <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{report.assignedTeam}</TableCell>
              <TableCell>
                <ReportActionMenu reportId={report.id} />
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
}
