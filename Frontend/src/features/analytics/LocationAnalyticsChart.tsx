'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { LocationData } from '@/types/analytics';

interface LocationAnalyticsChartProps {
  data: LocationData[];
}

export function LocationAnalyticsChart({ data }: LocationAnalyticsChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass rounded-2xl p-5 flex flex-col h-full"
    >
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MapPin className="size-4 text-violet-500" />
          Location Vulnerability (Radar)
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Comparing hotspots vs average severity across coastal cities.</p>
      </div>

      <div className="flex-1 min-h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="city" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 600 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <Radar name="Hotspots Volume" dataKey="hotspots" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
            <Radar name="Avg Severity" dataKey="avgSeverity" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
