'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import type { KPI } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface KPICardProps {
  kpi: KPI;
  index: number;
}

export function KPICard({ kpi, index }: KPICardProps) {
  const isPositiveTrend = kpi.trend === 'up';
  const isNeutral = kpi.trend === 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="glass rounded-2xl p-5 flex flex-col justify-between group"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{kpi.title}</p>
          <h3 className="text-2xl font-bold text-foreground">{kpi.value}</h3>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border",
          isNeutral ? "text-muted-foreground bg-muted/40 border-border" :
          isPositiveTrend ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-red-500 bg-red-500/10 border-red-500/20"
        )}>
          {isNeutral ? <Minus className="size-3" /> : isPositiveTrend ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {Math.abs(kpi.percentageChange)}%
        </div>
      </div>

      <div className="h-12 w-full mt-auto opacity-60 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={kpi.sparklineData}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={isPositiveTrend ? '#10b981' : isNeutral ? '#64748b' : '#ef4444'} 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function KPIGrid({ kpis }: { kpis: KPI[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.id} kpi={kpi} index={index} />
      ))}
    </div>
  );
}
