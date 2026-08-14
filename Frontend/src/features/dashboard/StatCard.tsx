'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { DashboardStat } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface StatCardProps {
  stat: DashboardStat;
  index: number;
}

export function StatCard({ stat, index }: StatCardProps) {
  const Icon = stat.icon;
  const isPositive = stat.trend === 'up';
  const isNeutral = stat.trend === 'neutral';
  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  // Generate a simple sparkline dataset
  const sparkData = Array.from({ length: 12 }, (_, i) => ({
    v: Math.floor(stat.value * (0.7 + Math.sin(i * 0.8 + index) * 0.3 + Math.random() * 0.1)),
  }));

  const trendColor = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400';

  const trendBg = isNeutral
    ? 'bg-muted/60'
    : isPositive
      ? 'bg-emerald-500/10'
      : 'bg-red-500/10';

  const sparkColor = isNeutral
    ? '#94a3b8'
    : isPositive
      ? '#10b981'
      : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group glass rounded-2xl p-4 cursor-default transition-shadow hover:shadow-lg relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex size-10 items-center justify-center rounded-xl', stat.color)}>
          <Icon className={cn('size-5', stat.iconColor)} />
        </div>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            trendBg,
            trendColor,
          )}
        >
          <TrendIcon className="size-3" />
          <span>{stat.change === 0 ? '—' : `${Math.abs(stat.change)}%`}</span>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
      </div>

      {/* Sparkline */}
      <div className="mt-2 h-8 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={`spark-${stat.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={sparkColor}
              strokeWidth={1.5}
              fill={`url(#spark-${stat.id})`}
              dot={false}
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
