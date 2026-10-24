'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import type { LocationData } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface HotspotRankingTableProps {
  data: LocationData[];
}

function riskClass(score: number | null) {
  if (score === null) return 'bg-muted/50 text-muted-foreground';
  if (score >= 75) return 'bg-red-500/15 text-red-600 dark:text-red-400';
  if (score >= 50) return 'bg-orange-500/15 text-orange-600 dark:text-orange-400';
  if (score >= 25) return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
  return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
}

export function HotspotRankingTable({ data }: HotspotRankingTableProps) {
  // Assessed clusters first, highest peak risk first; unassessed ones after.
  const sorted = [...data].sort((a, b) => (b.maxRisk ?? -1) - (a.maxRisk ?? -1) || b.reports - a.reports);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="glass rounded-2xl p-5"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Flame className="size-4 text-red-500" aria-hidden="true" />
          Hotspot Ranking
        </h3>
        <p className="text-xs text-muted-foreground mt-1">Observed clusters ranked by peak risk score.</p>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No geolocated reports yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40">
              <tr>
                <th scope="col" className="px-4 py-3 rounded-l-lg">Rank</th>
                <th scope="col" className="px-4 py-3">Cluster</th>
                <th scope="col" className="px-4 py-3 text-center">Reports</th>
                <th scope="col" className="px-4 py-3 text-center">Objects</th>
                <th scope="col" className="px-4 py-3 text-center">Avg / Peak Risk</th>
                <th scope="col" className="px-4 py-3 text-right rounded-r-lg">Cleanups Done</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, index) => (
                <tr key={item.hotspotId} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-muted-foreground">#{index + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/hotspots/${encodeURIComponent(item.hotspotId)}`} className="font-semibold text-foreground hover:text-primary hover:underline">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center font-medium">{item.reports}</td>
                  <td className="px-4 py-3 text-center font-medium">{item.wasteObjects}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold', riskClass(item.maxRisk))}>
                      {item.avgRisk === null ? 'Not assessed' : `${item.avgRisk} / ${item.maxRisk}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{item.cleanupsCompleted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
