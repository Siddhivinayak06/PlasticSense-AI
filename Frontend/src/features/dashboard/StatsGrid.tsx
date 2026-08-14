'use client';

import {
  FileText,
  Layers,
  Flame,
  Clock,
  Building2,
  CheckCircle,
  Target,
  Package,
} from 'lucide-react';
import { StatCard } from './StatCard';
import type { DashboardStat } from '@/types/dashboard';

const dashboardKPIs: DashboardStat[] = [
  {
    id: 'total-reports',
    label: 'Total Reports',
    value: 1284,
    icon: FileText,
    change: 12.5,
    trend: 'up',
    color: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'total-objects',
    label: 'Waste Objects Detected',
    value: 42856,
    icon: Layers,
    change: 18.3,
    trend: 'up',
    color: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'critical-hotspots',
    label: 'Critical Hotspots',
    value: 12,
    icon: Flame,
    change: -8.3,
    trend: 'down',
    color: 'bg-red-500/10 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'pending-cleanups',
    label: 'Pending Cleanups',
    value: 28,
    icon: Clock,
    change: 4.1,
    trend: 'up',
    color: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'active-ngos',
    label: 'Active NGO Teams',
    value: 9,
    icon: Building2,
    change: 12.0,
    trend: 'up',
    color: 'bg-violet-500/10 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'completed-cleanups',
    label: 'Completed Cleanups',
    value: 186,
    icon: CheckCircle,
    change: 15.2,
    trend: 'up',
    color: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  }
];

export function StatsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {dashboardKPIs.map((stat, index) => (
        <StatCard key={stat.id} stat={stat} index={index} />
      ))}
    </div>
  );
}
