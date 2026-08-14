import React from 'react';
import { cn } from '@/lib/utils';
import type { DetectionItem } from '@/types/detection';

interface ConfidenceBadgeProps {
  confidence: number;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percent = Math.round(confidence * 100);
  let color = 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30';
  let label = 'Low';
  
  if (percent >= 80) {
    color = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    label = 'High';
  } else if (percent >= 60) {
    color = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
    label = 'Medium';
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('text-[13px] font-bold', color.replace('bg-', 'text-').split(' ')[1])}>
        {percent}%
      </span>
      <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold border', color)} title={`${percent}% Confidence`}>
        {label}
      </span>
    </div>
  );
}

interface DetectionCardProps {
  item: DetectionItem;
  index: number;
}

export function DetectionCard({ item, index }: DetectionCardProps) {
  // Simple mapping for colors based on waste group
  const groupColors: Record<string, string> = {
    plastic: 'border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400',
    glass: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
    metal: 'border-slate-500/30 bg-slate-500/5 text-slate-600 dark:text-slate-400',
    paper: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400',
    cardboard: 'border-orange-500/30 bg-orange-500/5 text-orange-600 dark:text-orange-400',
  };

  const groupClass = groupColors[item.waste_group.toLowerCase()] || 'border-border/50 bg-muted/20 text-muted-foreground';

  return (
    <div className={cn("flex items-center justify-between rounded-xl border p-3", groupClass)}>
      <div className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-background/50 text-[10px] font-mono font-bold shadow-sm shrink-0">
          {index.toString().padStart(2, '0')}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-foreground capitalize">
            {item.class_name.replace(/_/g, ' ')}
          </span>
          <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">
            {item.waste_group || 'UNKNOWN'}
          </span>
          {item.bbox_w > 0 && item.bbox_h > 0 && (
            <span className="text-[10px] opacity-60">
              Bounding box available
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end justify-center">
        <ConfidenceBadge confidence={item.confidence} />
      </div>
    </div>
  );
}
