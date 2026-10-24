'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { LocationData } from '@/types/analytics';

interface LocationAnalyticsChartProps {
  data: LocationData[];
}

/** Reports and detected objects per observed cluster. */
export function LocationAnalyticsChart({ data }: LocationAnalyticsChartProps) {
  const rows = [...data]
    .sort((a, b) => b.wasteObjects - a.wasteObjects)
    .slice(0, 8)
    .map((d, i) => ({ label: `#${i + 1}`, name: d.name, Reports: d.reports, 'Waste objects': d.wasteObjects }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass rounded-2xl p-5 flex flex-col h-full"
    >
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MapPin className="size-4 text-violet-500" aria-hidden="true" />
          Waste by Observed Cluster
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Geolocated reports grouped within 2.5 km; the largest clusters by detected objects.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground py-16 text-center">
          No geolocated reports yet. Reports need GPS (EXIF, overlay, or manual entry) to form clusters.
        </p>
      ) : (
        <div className="flex-1 min-h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Waste objects" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Reports" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
