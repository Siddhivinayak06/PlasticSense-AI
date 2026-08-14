'use client';

import { cn } from '@/lib/utils';
import {
  Clock,
  UserCheck,
  Play,
  CheckCircle,
  ShieldCheck,
  XCircle,
  AlertCircle,
  Hourglass,
} from 'lucide-react';

export type StatusType =
  | 'pending'
  | 'assigned'
  | 'accepted'
  | 'in-progress'
  | 'completed'
  | 'verification-pending'
  | 'verified'
  | 'rejected'
  | 'new'
  | 'closed';

const statusConfig: Record<StatusType, {
  label: string;
  icon: typeof Clock;
  color: string;
  bg: string;
}> = {
  new: {
    label: 'New',
    icon: AlertCircle,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10 border-blue-200 dark:border-blue-800',
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10 border-amber-200 dark:border-amber-800',
  },
  assigned: {
    label: 'Assigned',
    icon: UserCheck,
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10 border-violet-200 dark:border-violet-800',
  },
  accepted: {
    label: 'Accepted',
    icon: UserCheck,
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-500/10 border-indigo-200 dark:border-indigo-800',
  },
  'in-progress': {
    label: 'In Progress',
    icon: Play,
    color: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-500/10 border-cyan-200 dark:border-cyan-800',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
  },
  'verification-pending': {
    label: 'Verification Pending',
    icon: Hourglass,
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10 border-orange-200 dark:border-orange-800',
  },
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10 border-blue-200 dark:border-blue-800',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500/10 border-red-200 dark:border-red-800',
  },
  closed: {
    label: 'Closed',
    icon: CheckCircle,
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-500/10 border-slate-200 dark:border-slate-800',
  },
};

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    icon: AlertCircle,
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-500/10 border-slate-200 dark:border-slate-800',
  };

  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  const iconSizes = {
    sm: 'size-3',
    md: 'size-3.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold whitespace-nowrap',
        config.bg,
        config.color,
        sizeClasses[size],
        className,
      )}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      {config.label}
    </span>
  );
}

export { statusConfig };
