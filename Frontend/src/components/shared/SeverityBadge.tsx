'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

const severityConfig: Record<SeverityLevel, {
  label: string;
  icon: typeof AlertTriangle;
  color: string;
  bg: string;
  emoji: string;
}> = {
  low: {
    label: 'Low',
    icon: Info,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
    emoji: '🟢',
  },
  medium: {
    label: 'Medium',
    icon: AlertCircle,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10 border-amber-200 dark:border-amber-800',
    emoji: '🟡',
  },
  high: {
    label: 'High',
    icon: AlertTriangle,
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10 border-orange-200 dark:border-orange-800',
    emoji: '🟠',
  },
  critical: {
    label: 'Critical',
    icon: ShieldAlert,
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500/10 border-red-200 dark:border-red-800',
    emoji: '🔴',
  },
};

interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showEmoji?: boolean;
  className?: string;
}

export function SeverityBadge({
  severity,
  size = 'sm',
  showIcon = true,
  showEmoji = false,
  className,
}: SeverityBadgeProps) {
  const config = severityConfig[severity] || severityConfig.medium;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  const iconSizes = {
    sm: 'size-3',
    md: 'size-3.5',
    lg: 'size-4',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold',
        config.bg,
        config.color,
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label={`Severity: ${config.label}`}
    >
      {showEmoji && <span aria-hidden="true">{config.emoji}</span>}
      {showIcon && !showEmoji && <Icon className={iconSizes[size]} aria-hidden="true" />}
      {config.label}
    </span>
  );
}

export { severityConfig };
