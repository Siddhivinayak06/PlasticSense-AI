'use client';

import {
  FileText,
  Layers,
  Flame,
  Clock,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary } from '@/services/analytics';
import { StatCard } from './StatCard';
import type { DashboardStat } from '@/types/dashboard';

export function StatsGrid() {
  const { data } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary,
  });

  const totalReports = data?.total_detections ?? 0;
  const totalObjects = data?.total_objects_detected ?? 0;
  const criticalHotspots = data?.critical_hotspots ?? 0;
  const pendingCleanups = data?.pending_cleanups ?? 0;
  const activeNgos = data?.active_ngos ?? 0;
  const completedCleanups = data?.completed_cleanups ?? 0;

  const dashboardKPIs: DashboardStat[] = [
    {
      id: 'total-reports',
      label: 'Total Reports',
      value: totalReports,
      icon: FileText,
      change: 12.5,
      trend: 'up',
      color: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'total-objects',
      label: 'Waste Objects Detected',
      value: totalObjects,
      icon: Layers,
      change: 18.3,
      trend: 'up',
      color: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'critical-hotspots',
      label: 'High-Risk Sites',
      value: criticalHotspots,
      icon: Flame,
      change: 0,
      trend: 'neutral',
      color: 'bg-red-500/10 dark:bg-red-500/20',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'pending-cleanups',
      label: 'Active Cleanups',
      value: pendingCleanups,
      icon: Clock,
      change: 4.1,
      trend: 'up',
      color: 'bg-amber-500/10 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'active-ngos',
      label: 'Active NGO Teams',
      value: activeNgos,
      icon: Building2,
      change: 0,
      trend: 'neutral',
      color: 'bg-violet-500/10 dark:bg-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      id: 'completed-cleanups',
      label: 'Cleanups Completed',
      value: completedCleanups,
      icon: CheckCircle,
      change: 15.2,
      trend: 'up',
      color: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {dashboardKPIs.map((stat, index) => (
        <StatCard key={stat.id} stat={stat} index={index} />
      ))}
    </div>
  );
}
