'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Box } from 'lucide-react';
import type { PlasticDistributionData } from '@/types/analytics';

interface PlasticDistributionChartProps {
  data: PlasticDistributionData[];
}

export function PlasticDistributionChart({ data }: PlasticDistributionChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass rounded-2xl p-5 flex flex-col h-full"
    >
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Box className="size-4 text-cyan-500" />
          Plastic Type Distribution
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Breakdown of reported pollution by material type.</p>
      </div>

      <div className="flex-1 min-h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={105}
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
              formatter={(value: any) => [`${value}%`, 'Share']}
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
      </div>
    </motion.div>
  );
}
