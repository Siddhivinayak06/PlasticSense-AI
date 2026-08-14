'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';

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
  const data = Object.entries(breakdown)
    .filter(([k]) => k !== 'total_objects' && k !== 'total')
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      fill: COLORS[key.toLowerCase()] || COLORS.other,
    }))
    .filter(item => item.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass rounded-2xl p-5 flex flex-col h-full min-h-[350px]"
    >
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Box className="size-4 text-primary" />
          Waste Category Distribution
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Breakdown of detected pollution by material type.</p>
      </div>

      <div className="flex-1 w-full mt-4">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                isAnimationActive={true}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: any) => [value, 'Count']}
              />
              <Legend 
                iconType="circle" 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                wrapperStyle={{ fontSize: '12px' }}
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
