'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';
import type { SeverityData } from '@/types/analytics';

interface SeverityAnalysisChartProps {
  data: SeverityData[];
}

export function SeverityAnalysisChart({ data }: SeverityAnalysisChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass rounded-2xl p-5 flex flex-col h-full"
    >
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <AlertTriangle className="size-4 text-orange-500" />
          Severity by Region
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Stacked analysis of report severities across top cities.</p>
      </div>

      <div className="flex-1 min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar dataKey="low" name="Low" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
            <Bar dataKey="medium" name="Medium" stackId="a" fill="#facc15" />
            <Bar dataKey="high" name="High" stackId="a" fill="#f97316" />
            <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
