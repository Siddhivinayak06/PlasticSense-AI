'use client';

import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { LocationData } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface HotspotRankingTableProps {
  data: LocationData[];
}

export function HotspotRankingTable({ data }: HotspotRankingTableProps) {
  // Sort by avgSeverity descending
  const sorted = [...data].sort((a, b) => b.avgSeverity - a.avgSeverity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="glass rounded-2xl p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Flame className="size-4 text-red-500" />
          Top Critical Hotspots
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Ranking regions by average severity.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/40">
            <tr>
              <th className="px-4 py-3 rounded-l-lg">Rank</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3 text-center">Active Hotspots</th>
              <th className="px-4 py-3 text-center">Avg Severity</th>
              <th className="px-4 py-3 text-right rounded-r-lg">Cleanup Rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, index) => (
              <tr key={item.city} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-muted-foreground">#{index + 1}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{item.city} Coast</td>
                <td className="px-4 py-3 text-center font-medium">{item.hotspots}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn(
                    "inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold",
                    item.avgSeverity >= 85 ? "bg-red-500/20 text-red-500" :
                    item.avgSeverity >= 70 ? "bg-orange-500/20 text-orange-500" : "bg-amber-500/20 text-amber-500"
                  )}>
                    {item.avgSeverity}/100
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.cleanups}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{item.cleanups}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
