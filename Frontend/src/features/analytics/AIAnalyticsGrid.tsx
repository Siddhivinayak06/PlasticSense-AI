'use client';

import { motion } from 'framer-motion';
import { Brain, Cpu, Database, Network } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { AIAnalyticsData } from '@/types/analytics';

interface AIAnalyticsGridProps {
  data: AIAnalyticsData[];
}

export function AIAnalyticsGrid({ data }: AIAnalyticsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Metrics Column */}
      <div className="lg:col-span-1 space-y-4">
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5 border-blue-500/20 bg-blue-500/5">
           <Cpu className="size-6 text-blue-500 mb-3" />
           <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Model Version</p>
           <h3 className="text-2xl font-bold text-foreground">v2.4.1 (YOLO-Vis)</h3>
           <p className="text-xs text-muted-foreground mt-2">Latest deployment running on Edge nodes.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="glass rounded-2xl p-5">
           <Database className="size-6 text-emerald-500 mb-3" />
           <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Total Processed Images</p>
           <h3 className="text-2xl font-bold text-foreground">1.2M+</h3>
           <p className="text-xs text-emerald-500 font-semibold mt-2">↑ 42k this week</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5">
           <Network className="size-6 text-violet-500 mb-3" />
           <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Avg Objects Per Frame</p>
           <h3 className="text-2xl font-bold text-foreground">14.8</h3>
           <p className="text-xs text-muted-foreground mt-2">Density factor calculation metric.</p>
        </motion.div>
      </div>

      {/* Accuracy Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2 glass rounded-2xl p-5 flex flex-col h-full">
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="size-4 text-primary" />
            AI Detection Accuracy by Category
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Comparing true-positive accuracy against model confidence.</p>
        </div>
        
        <div className="flex-1 min-h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', fontWeight: 500 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
              />
              <Bar dataKey="accuracy" name="Accuracy (%)" radius={[0, 4, 4, 0]} barSize={12}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.accuracy > 90 ? '#10b981' : entry.accuracy > 80 ? '#3b82f6' : '#f59e0b'} />
                ))}
              </Bar>
              <Bar dataKey="confidence" name="Avg Confidence (%)" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={6} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
