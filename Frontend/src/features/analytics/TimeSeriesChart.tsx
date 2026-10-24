'use client';

import { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import type { TimeSeriesData } from '@/types/analytics';
import { cardEntrance, springSmooth } from '@/lib/motion';

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
  const canAggregate = data.every((d) => d.isoDate);
  const chartData = useMemo(() => {
    if (period === 'daily' || !canAggregate) return data;
    const months = new Map<string, TimeSeriesData>();
    for (const d of data) {
      const key = d.isoDate!.slice(0, 7);
      const label = new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      const m = months.get(key) ?? { date: label, isoDate: key, total: 0, resolved: 0, critical: 0 };
      m.total += d.total;
      m.resolved += d.resolved;
      m.critical += d.critical;
      months.set(key, m);
    }
    return [...months.values()];
  }, [data, period, canAggregate]);

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      className="glass rounded-3xl p-5 sm:p-6 border border-slate-200/70 dark:border-slate-800/70 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Activity className="size-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
              Report Volume Trends
            </h3>
            <p className="text-xs text-muted-foreground hidden sm:block">Reports received, cleanups completed and high-risk assessments per {period === 'daily' ? 'day' : 'month'}</p>
          </div>
        </div>

        {/* Animated Segmented Period Control */}
        {canAggregate && (
        <div role="group" aria-label="Aggregation period" className="flex items-center bg-muted/60 dark:bg-slate-800/60 rounded-xl p-1 border border-border/40">
          {(['daily', 'monthly'] as const).map((p) => {
            const isActive = period === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={isActive}
                onClick={() => setPeriod(p)}
                className="relative px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors z-10 text-muted-foreground hover:text-foreground"
              >
                {isActive && (
                  <motion.div
                    layoutId="period-active"
                    className="absolute inset-0 rounded-lg bg-background shadow-xs border border-border/50"
                    transition={springSmooth}
                  />
                )}
                <span className={`relative z-20 ${isActive ? 'text-foreground' : ''}`}>
                  {p}
                </span>
              </button>
            );
          })}
        </div>
        )}
      </div>

      <div className="h-[320px] sm:h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
              opacity={0.4}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                backdropFilter: 'blur(12px)',
                borderColor: 'hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
            />
            <Area
              type="monotone"
              dataKey="total"
              name="Total Reports"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorTotal)"
              isAnimationActive={true}
              animationDuration={850}
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="Cleanups Completed"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorResolved)"
              isAnimationActive={true}
              animationDuration={950}
            />
            <Area
              type="monotone"
              dataKey="critical"
              name="High/Critical Risk"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCritical)"
              isAnimationActive={true}
              animationDuration={1050}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
