'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Pencil, UserPlus, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { statusConfig } from '@/constants/reports';
import type { Report } from '@/types/report';
import { cn } from '@/lib/utils';

interface ReportDetailHeaderProps {
  report: Report;
}

export function ReportDetailHeader({ report }: ReportDetailHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <Link href="/reports">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">{report.id}</h1>
            <span className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border',
              statusConfig[report.status].bg,
              statusConfig[report.status].color,
            )}>
              {statusConfig[report.status].label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{report.plasticTypeLabel} • {report.city}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Link href={`/reports/${report.id}/edit`}>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="size-3.5" />
            Edit
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="gap-1.5">
          <UserPlus className="size-3.5" />
          Assign
        </Button>
        <Button variant="default" size="sm" className="gap-1.5">
          <CheckCircle2 className="size-3.5" />
          Resolve
        </Button>
        <Button variant="destructive" size="sm" className="gap-1.5">
          <Trash2 className="size-3.5" />
          Delete
        </Button>
      </div>
    </motion.div>
  );
}
