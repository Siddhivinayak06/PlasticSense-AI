'use client';

import { motion } from 'framer-motion';
import { Check, Clock, X } from 'lucide-react';
import { statusStages } from '@/constants/reports';
import type { Report, FullReportStatus } from '@/types/report';
import { cn } from '@/lib/utils';

interface ReportStatusTimelineProps {
  report: Report;
}

const completedStatuses = (currentStatus: FullReportStatus): Set<FullReportStatus> => {
  const order: FullReportStatus[] = ['pending', 'verified', 'assigned', 'in-progress', 'resolved'];
  const idx = order.indexOf(currentStatus);
  if (currentStatus === 'rejected') {
    // For rejected: show completed up to where it was rejected
    return new Set(['pending']);
  }
  if (idx < 0) return new Set(['pending']);
  return new Set(order.slice(0, idx + 1));
};

export function ReportStatusTimeline({ report }: ReportStatusTimelineProps) {
  const completed = completedStatuses(report.status);
  const isRejected = report.status === 'rejected';

  // Filter out 'rejected' from stages unless the report is actually rejected
  const stages = isRejected
    ? statusStages
    : statusStages.filter((s) => s.status !== 'rejected');

  const historyMap = new Map(
    report.statusHistory.map((h) => [h.status, h]),
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass rounded-2xl p-5"
    >
      <h3 className="text-sm font-semibold text-foreground mb-5">Status Timeline</h3>

      <div className="relative">
        {stages.map((stage, index) => {
          const isCompleted = completed.has(stage.status);
          const isCurrent = stage.status === report.status;
          const isRejectedStage = stage.status === 'rejected';
          const historyEntry = historyMap.get(stage.status);

          return (
            <motion.div
              key={stage.status}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.08 }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              {/* Timeline line */}
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    'absolute left-[14px] top-8 w-0.5 h-[calc(100%-16px)]',
                    isCompleted && !isCurrent ? 'bg-primary/40' : 'bg-border/60',
                  )}
                />
              )}

              {/* Icon */}
              <div className={cn(
                'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                isRejectedStage && isRejected
                  ? 'bg-red-500 border-red-500 text-white'
                  : isCompleted
                    ? 'bg-primary border-primary text-primary-foreground'
                    : isCurrent
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-muted/60 border-border text-muted-foreground',
              )}>
                {isRejectedStage && isRejected ? (
                  <X className="size-3.5" />
                ) : isCompleted ? (
                  <Check className="size-3.5" />
                ) : isCurrent ? (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Clock className="size-3.5" />
                  </motion.div>
                ) : (
                  <Clock className="size-3" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p className={cn(
                  'text-sm font-medium',
                  isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground/60',
                )}>
                  {stage.label}
                </p>
                <p className={cn(
                  'text-xs mt-0.5',
                  isCompleted || isCurrent ? 'text-muted-foreground' : 'text-muted-foreground/40',
                )}>
                  {stage.description}
                </p>
                {historyEntry && (
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/70">
                    <span>{new Date(historyEntry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <span>{historyEntry.user}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
