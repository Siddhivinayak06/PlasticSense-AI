'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { DashboardStat } from '@/types/dashboard';
import { cn } from '@/lib/utils';

interface StatCardProps {
  stat: DashboardStat;
  index: number;
}

export function StatCard({ stat, index }: StatCardProps) {
  const Icon = stat.icon;
  const isPositive = stat.trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="group glass rounded-2xl p-4 sm:p-5 cursor-default transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex size-10 items-center justify-center rounded-xl', stat.color)}>
          <Icon className={cn('size-5', stat.iconColor)} />
        </div>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            isPositive
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          )}
        >
          <TrendIcon className="size-3" />
          <span>{Math.abs(stat.change)}%</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-2xl font-bold text-foreground">
          {stat.value.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
      </div>

      {/* Subtle bottom gradient line on hover */}
      <div className="mt-3 h-1 w-full rounded-full bg-muted/50 overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            isPositive ? 'bg-emerald-500/40' : 'bg-red-500/40'
          )}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(Math.abs(stat.change) * 5, 100)}%` }}
          transition={{ duration: 0.8, delay: index * 0.05 + 0.3 }}
        />
      </div>
    </motion.div>
  );
}
