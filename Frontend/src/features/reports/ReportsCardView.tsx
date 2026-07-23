'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ImageIcon, MapPin, Calendar, Target } from 'lucide-react';
import { severityConfig, statusConfig, priorityConfig } from '@/constants/reports';
import { ReportActionMenu } from './ReportActionMenu';
import type { Report } from '@/types/report';
import { cn } from '@/lib/utils';

interface ReportsCardViewProps {
  reports: Report[];
}

export function ReportsCardView({ reports }: ReportsCardViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {reports.map((report, index) => (
        <motion.div
          key={report.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.03 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="glass rounded-2xl overflow-hidden group"
        >
          {/* Image */}
          <div className="relative h-36 bg-muted/40 flex items-center justify-center">
            <ImageIcon className="size-10 text-muted-foreground/30" />
            {/* Status badge overlay */}
            <span className={cn(
              'absolute top-3 left-3 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border',
              statusConfig[report.status].bg, statusConfig[report.status].color,
            )}>
              {statusConfig[report.status].label}
            </span>
            {/* Action menu */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <ReportActionMenu reportId={report.id} />
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* ID + Type */}
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/reports/${report.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
                  {report.id}
                </Link>
                <p className="text-sm font-semibold text-foreground mt-0.5">{report.plasticTypeLabel}</p>
              </div>
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border shrink-0',
                severityConfig[report.severity].bg, severityConfig[report.severity].color,
              )}>
                {severityConfig[report.severity].label}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Target className="size-3" />
                <span>{report.confidence}%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">{report.detectedObjects}</span> objects
              </div>
              <span className={cn(
                'inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium border ml-auto',
                priorityConfig[report.cleanupPriority].bg, priorityConfig[report.cleanupPriority].color,
              )}>
                {priorityConfig[report.cleanupPriority].label}
              </span>
            </div>

            {/* Location + Date */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3 shrink-0" />
                <span className="truncate">{report.address}, {report.city}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="size-3 shrink-0" />
                <span>{new Date(report.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Team */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <span className="text-[11px] text-muted-foreground">Team: <span className="font-medium text-foreground">{report.assignedTeam}</span></span>
              <Link
                href={`/reports/${report.id}`}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                View →
              </Link>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
