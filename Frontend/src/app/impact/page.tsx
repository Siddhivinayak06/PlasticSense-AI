'use client';

import { PageLoader } from '@/components/shared/PageLoader';
import { QueryError } from '@/components/shared/QueryError';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Recycle,
  Layers,
  CheckCircle,
  Flame,
  ShieldCheck,
  Percent,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { fetchImpact, fetchAnalytics } from '@/services/analytics';
import { cn } from '@/lib/utils';

export default function ImpactPage() {
  const { data: impact, isLoading: isImpactLoading, isError, refetch } = useQuery({
    queryKey: ['impact'],
    queryFn: fetchImpact,
  });

  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
  });

  if (isImpactLoading) return <PageLoader label="Computing impact metrics…" />;
  if (isError || !impact) return <QueryError onRetry={() => refetch()} />;

  const totalDetections = impact.total_detections;
  const totalObjects = impact.total_objects_detected;
  const highRiskSites = impact.high_risk_sites;
  const completedCleanups = impact.completed_cleanups;
  const verifiedCleanups = impact.verified_cleanups;
  const avgReduction = impact.avg_waste_reduction;
  const activeNgos = impact.active_ngos;

  const impactMetrics = [
    {
      id: 'detected',
      label: 'Waste Objects Identified',
      value: totalObjects.toLocaleString(),
      icon: Recycle,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-500/10'
    },
    {
      id: 'sites',
      label: 'Survey Images Analyzed',
      value: totalDetections.toLocaleString(),
      icon: Layers,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      id: 'high-risk',
      label: 'High-Risk Sites Identified',
      value: highRiskSites.toString(),
      icon: Flame,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10'
    },
    {
      id: 'cleanups',
      label: 'Cleanups Completed',
      value: completedCleanups.toString(),
      icon: CheckCircle,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      id: 'verified',
      label: 'AI-Verified Operations',
      value: verifiedCleanups.toString(),
      icon: ShieldCheck,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      id: 'reduction',
      label: 'Avg Reduction in Detected Objects',
      value: avgReduction === null ? '—' : `${avgReduction}%`,
      icon: Percent,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10'
    },
  ];

  const categoryImpact = impact.category_impact;
  const timelineData = analytics?.time_series ?? [];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="size-7 text-primary" />
          Environmental Impact
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Operational metrics counted from stored detections and cleanup assignments.
          {avgReduction === null && ' Reduction figures appear once a cleanup has been AI-verified.'}
        </p>
      </div>

      {/* Hero message */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6 text-center bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5"
      >
        <p className="text-lg font-semibold text-foreground">
          WasteSense AI has analyzed <span className="text-primary">{totalDetections} field images</span>, identifying <span className="text-primary">{totalObjects} waste objects</span> with <span className="text-emerald-500">{avgReduction}% waste reduction</span> across completed cleanup operations.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Coordinating {activeNgos} active NGO partner teams to turn computer vision detections into verifiable environmental action.
        </p>
      </motion.div>

      {/* Impact Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {impactMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.06 }}
              className="glass rounded-2xl p-4 text-center space-y-2"
            >
              <div className={cn('flex size-10 items-center justify-center rounded-xl mx-auto', metric.bg)}>
                <Icon className={cn('size-5', metric.color)} />
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums">{metric.value}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">{metric.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Detection volume by date */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Detection & Resolution Volume</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="total" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Reports Received" />
              <Bar dataKey="resolved" fill="#10b981" radius={[6, 6, 0, 0]} name="Cleanups Completed" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Detected Waste by Material Classification</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryImpact} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis dataKey="category" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={120} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '12px' }}
              />
              <Bar dataKey="collected" fill="#16A34A" radius={[0, 6, 6, 0]} name="Objects Detected" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
