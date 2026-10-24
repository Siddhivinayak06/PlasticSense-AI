'use client';

import {
  FileText,
  Layers,
  Flame,
  Clock,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics, fetchDashboardSummary } from '@/services/analytics';
import { QueryError } from '@/components/shared/QueryError';
import { StatCard } from './StatCard';
import { SkeletonCard } from '@/components/shared/LoadingSkeleton';
import { containerVariants } from '@/lib/motion';
import type { DashboardStat } from '@/types/dashboard';

export function StatsGrid() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: fetchDashboardSummary,
  });
  const { data: analytics } = useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (isError) return <QueryError onRetry={() => refetch()} />;

  // Week-over-week change in reports, from real daily counts (null without 14 days of history).
  const series = analytics?.time_series ?? [];
  const last7 = series.slice(-7).reduce((a, d) => a + d.total, 0);
  const prev7 = series.slice(-14, -7).reduce((a, d) => a + d.total, 0);
  const reportChange = series.length >= 14 && prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 1000) / 10 : null;
  const reportTrend: DashboardStat['trend'] = reportChange === null || reportChange === 0 ? 'neutral' : reportChange > 0 ? 'up' : 'down';

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
      change: reportChange,
      trend: reportTrend,
      sparkline: series.slice(-14).map((d) => d.total),
      color: 'bg-blue-500/10 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      id: 'total-objects',
      label: 'Waste Objects Detected',
      value: totalObjects,
      icon: Layers,
      change: null,
      trend: 'neutral',
      color: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      id: 'critical-hotspots',
      label: 'High-Risk Sites',
      value: criticalHotspots,
      icon: Flame,
      change: null,
      trend: 'neutral',
      color: 'bg-red-500/10 dark:bg-red-500/20',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      id: 'pending-cleanups',
      label: 'Active Cleanups',
      value: pendingCleanups,
      icon: Clock,
      change: null,
      trend: 'neutral',
      color: 'bg-amber-500/10 dark:bg-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'active-ngos',
      label: 'Active NGO Teams',
      value: activeNgos,
      icon: Building2,
      change: null,
      trend: 'neutral',
      color: 'bg-violet-500/10 dark:bg-violet-500/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      id: 'completed-cleanups',
      label: 'Cleanups Completed',
      value: completedCleanups,
      icon: CheckCircle,
      change: null,
      trend: 'neutral',
      color: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-3 gap-4"
    >
      {dashboardKPIs.map((stat, index) => (
        <StatCard key={stat.id} stat={stat} index={index} />
      ))}
    </motion.div>
  );
}
