'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, Users, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useQuery } from '@tanstack/react-query';
import { fetchHotspots } from '@/services/hotspots';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface UrgentHotspot {
  id: string;
  name: string;
  city: string;
  severityScore: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  wasteCount: number;
  dominantWaste: string;
  lastDetected: string;
  reportCount: number;
  cleanupStatus: string;
  recommendedTeamSize: string;
}

export function UrgentActions() {
  const { data } = useQuery({
    queryKey: ['hotspots'],
    queryFn: fetchHotspots,
  });

  const hotspots: UrgentHotspot[] = useMemo(() => {
    if (!data?.hotspots || data.hotspots.length === 0) return [];
    return data.hotspots.map((h) => ({
      id: h.id,
      name: h.name,
      city: `Lat ${h.latitude.toFixed(3)}, Lng ${h.longitude.toFixed(3)}`,
      severityScore: Math.round(h.max_risk_score),
      severity: h.severity,
      wasteCount: h.total_waste_objects,
      dominantWaste: `${h.most_common_material} Debris`,
      lastDetected: 'Monitored',
      reportCount: h.report_count,
      cleanupStatus: h.status,
      recommendedTeamSize: `${Math.min(15, Math.max(3, Math.round(h.total_waste_objects / 2) + 2))} Members`,
    })).sort((a, b) => b.severityScore - a.severityScore).slice(0, 4);
  }, [data]);

  if (hotspots.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 dark:bg-red-500/20">
            <Flame className="size-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Urgent Action Required</h2>
            <p className="text-xs text-muted-foreground">High-risk pollution zones prioritized by dual-model analysis</p>
          </div>
        </div>
        <Link href="/hotspots">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            View all hotspots
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {hotspots.map((hotspot, index) => (
          <motion.div
            key={hotspot.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={cn(
              'glass rounded-2xl p-4 flex flex-col justify-between space-y-3 relative overflow-hidden group',
              'hover:shadow-md transition-shadow',
              hotspot.severity === 'critical' && 'border-l-4 border-l-red-500',
              hotspot.severity === 'high' && 'border-l-4 border-l-orange-500',
              hotspot.severity === 'medium' && 'border-l-4 border-l-amber-500',
              hotspot.severity === 'low' && 'border-l-4 border-l-emerald-500',
            )}
          >
            {/* Header: Name + Badges */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {hotspot.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{hotspot.city}</span>
                  </div>
                </div>
                <SeverityBadge severity={hotspot.severity} size="sm" />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 py-1 text-xs">
              <div className="rounded-lg bg-muted/40 p-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Risk Score</p>
                <p className="font-bold text-foreground text-sm mt-0.5">{hotspot.severityScore}/100</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-2 text-center">
                <p className="text-[10px] text-muted-foreground uppercase font-medium">Waste Objects</p>
                <p className="font-bold text-foreground text-sm mt-0.5">{hotspot.wasteCount}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Material:</span>
                <span className="font-medium text-foreground">{hotspot.dominantWaste}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reports:</span>
                <span className="font-medium text-foreground">{hotspot.reportCount} sightings</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="size-3" />
                  Recommended Crew:
                </span>
                <span className="font-medium text-foreground">{hotspot.recommendedTeamSize}</span>
              </div>
            </div>

            {/* Action */}
            <div className="pt-1 flex gap-2">
              <Link href={`/assignments?hotspot_id=${hotspot.id}`} className="flex-1">
                <Button variant="default" size="xs" className="w-full text-xs h-7">
                  Deploy Team
                </Button>
              </Link>
              <Link href="/hotspots">
                <Button variant="outline" size="xs" className="text-xs h-7 px-2">
                  Inspect
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
