'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Sparkles } from 'lucide-react';
import type { Insight } from '@/types/analytics';
import { cn } from '@/lib/utils';

export function InsightCards({ insights }: { insights: Insight[] }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sparkles className="size-4 text-violet-500" />
          AI-Generated Insights
        </h3>
        <span className="text-xs text-muted-foreground font-medium">Last 7 Days</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={cn(
              "p-4 rounded-xl border relative overflow-hidden group",
              insight.type === 'positive' ? 'bg-emerald-500/5 border-emerald-500/20' :
              insight.type === 'negative' ? 'bg-orange-500/5 border-orange-500/20' :
              insight.type === 'alert' ? 'bg-red-500/5 border-red-500/20' :
              'bg-blue-500/5 border-blue-500/20'
            )}
          >
            {/* Background Icon Watermark */}
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {insight.type === 'positive' ? <TrendingUp className="size-24" /> :
               insight.type === 'negative' ? <TrendingDown className="size-24" /> :
               insight.type === 'alert' ? <AlertTriangle className="size-24" /> :
               <Minus className="size-24" />}
            </div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "p-1.5 rounded-md",
                  insight.type === 'positive' ? 'bg-emerald-500/20 text-emerald-600' :
                  insight.type === 'negative' ? 'bg-orange-500/20 text-orange-600' :
                  insight.type === 'alert' ? 'bg-red-500/20 text-red-600' :
                  'bg-blue-500/20 text-blue-600'
                )}>
                  {insight.type === 'positive' ? <TrendingUp className="size-3" /> :
                   insight.type === 'negative' ? <TrendingDown className="size-3" /> :
                   insight.type === 'alert' ? <AlertTriangle className="size-3" /> :
                   <Minus className="size-3" />}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{insight.type}</span>
              </div>
              <p className="text-sm font-medium text-foreground/90 leading-snug flex-1">
                {insight.message}
              </p>
              <span className="text-[10px] text-muted-foreground mt-3 block font-medium">
                Detected {insight.timestamp}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
