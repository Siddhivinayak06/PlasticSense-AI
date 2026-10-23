'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { DashboardStat } from '@/types/dashboard';
import { cn } from '@/lib/utils';
import { cardEntrance, microInteractions } from '@/lib/motion';
import { AnimatedCounter } from '@/components/shared/AnimatedCounter';

interface StatCardProps {
  stat: DashboardStat;
  index: number;
}

export function StatCard({ stat, index }: StatCardProps) {
  const Icon = stat.icon;
  const isPositive = stat.trend === 'up';
  const isNeutral = stat.trend === 'neutral';
  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  const sparkData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      v: Math.max(
        1,
        Math.floor(stat.value * (0.65 + Math.sin(i * 0.75 + index) * 0.35 + (i / 14) * 0.2))
      ),
    }));
  }, [stat.value, index]);

  const trendColor = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400';

  const trendBg = isNeutral
    ? 'bg-muted/70'
    : isPositive
      ? 'bg-emerald-500/10 dark:bg-emerald-500/20'
      : 'bg-red-500/10 dark:bg-red-500/20';

  const sparkColor = isNeutral
    ? '#94a3b8'
    : isPositive
      ? '#10b981'
      : '#ef4444';

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      transition={{ delay: index * 0.05 }}
      whileHover={microInteractions.hoverLift}
      className="group glass-card rounded-2xl p-4 sm:p-5 cursor-default relative overflow-hidden flex flex-col justify-between"
    >
      {/* Ambient background hover glow */}
      <div className="absolute -top-12 -right-12 size-28 rounded-full bg-primary/5 group-hover:bg-primary/10 blur-2xl transition-all duration-500 pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Icon with subtle hover pulse */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            className={cn(
              'flex size-12 sm:size-13 items-center justify-center rounded-2xl relative overflow-hidden transition-transform duration-300 shadow-sm',
              stat.color
            )}
          >
            <Icon className={cn('size-6 transition-transform group-hover:scale-110 duration-300', stat.iconColor)} />
          </motion.div>

          {/* Trend badge */}
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border border-transparent group-hover:border-current/10 transition-colors',
              trendBg,
              trendColor
            )}
          >
            <TrendIcon className="size-3" />
            <span>{stat.change === 0 ? '—' : `${Math.abs(stat.change)}%`}</span>
          </div>
        </div>

        {/* Value and label */}
        <div className="mt-4">
          <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            {typeof stat.value === 'number' ? (
              <AnimatedCounter value={stat.value} duration={850} />
            ) : (
              stat.value
            )}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-1 truncate">
            {stat.label}
          </p>
        </div>
      </div>

      {/* Mini Sparkline Chart */}
      <div className="mt-3 h-9 -mx-2 -mb-1 opacity-80 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={sparkColor}
              strokeWidth={1.75}
              fill={`url(#spark-${stat.id})`}
              dot={false}
              isAnimationActive={true}
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
