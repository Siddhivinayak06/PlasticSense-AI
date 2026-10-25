'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';
import { cardEntrance } from '@/lib/motion';

interface WasteDistributionChartProps {
  breakdown: Record<string, number>;
}

const COLORS: Record<string, string> = {
  plastic: '#0ea5e9', // sky-500
  glass: '#10b981',   // emerald-500
  metal: '#64748b',   // slate-500
  paper: '#f59e0b',   // amber-500
  cardboard: '#f97316', // orange-500
  organic: '#84cc16', // lime-500
  textile: '#ec4899', // pink-500
  wood: '#d97706',    // amber-600
  rubber: '#334155',  // slate-700
  foam: '#e11d48',    // rose-600
  other: '#94a3b8',   // slate-400
  unknown: '#94a3b8',
};

export function WasteDistributionChart({ breakdown }: WasteDistributionChartProps) {
  // Format data for Recharts
  const data = Object.entries(breakdown || {})
    .filter(([k]) => k !== 'total_objects' && k !== 'total')
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof value === 'number' ? value : 0,
      fill: COLORS[key.toLowerCase()] || COLORS.other,
    }))
    .filter((item) => item.value > 0);

  const totalCount = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      className="glass rounded-3xl p-5 sm:p-6 flex flex-col h-full min-h-[350px] border border-slate-200/70 dark:border-slate-800/70 shadow-sm"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex size-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
          <Box className="size-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
            Waste Category Distribution
          </h3>
          <p className="text-xs text-muted-foreground">Breakdown of detected pollution by material type</p>
        </div>
      </div>

      <div className="flex-1 w-full mt-4 min-h-[260px] relative">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={68}
                outerRadius={96}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
                animationDuration={900}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [
                  `${value} items (${Math.round(((value as number) / (totalCount || 1)) * 100)}%)`,
                  'Volume',
                ]}
              />
              <Legend
                iconType="circle"
                layout="vertical"
                verticalAlign="middle"
                align="right"
                wrapperStyle={{ fontSize: '11px', lineHeight: '22px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No detection data available yet.
          </div>
        )}
      </div>
    </motion.div>
  );
}
