'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Users, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { useQuery } from '@tanstack/react-query';
import { fetchHotspots } from '@/services/hotspots';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { containerVariants, cardEntrance, microInteractions } from '@/lib/motion';

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
  assignedTeam?: string;
}

export function UrgentActions() {
  const { data } = useQuery({
    queryKey: ['hotspots'],
    queryFn: fetchHotspots,
  });

  const hotspots: UrgentHotspot[] = useMemo(() => {
    if (!data?.hotspots || data.hotspots.length === 0) return [];
    // Only assessed, not-yet-closed clusters can be ranked by urgency.
    return data.hotspots
      .filter((h) => h.max_risk_score !== null && h.severity !== 'unknown')
      .filter((h) => h.status !== 'resolved' && h.status !== 'verified')
      .map((h) => ({
        id: h.id,
        name: h.name,
        city: (h.latitude != null && h.longitude != null && !isNaN(Number(h.latitude)))
          ? `${Number(h.latitude).toFixed(4)}, ${Number(h.longitude).toFixed(4)}`
          : 'Unknown Location',
        severityScore: Math.round(Number(h.max_risk_score ?? 0)),
        severity: h.severity as UrgentHotspot['severity'],
        wasteCount: h.total_waste_objects ?? 0,
        dominantWaste: h.most_common_material || 'Mixed Waste',
        lastDetected: h.last_updated,
        reportCount: h.report_count ?? 1,
        cleanupStatus: (h.status || 'pending').replace('_', ' '),
        assignedTeam: h.assigned_team ?? undefined,
      }))
      .sort((a, b) => b.severityScore - a.severityScore)
      .slice(0, 4);
  }, [data]);

  if (hotspots.length === 0) return null;

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="flex size-8 items-center justify-center rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20"
          >
            <Flame className="size-4.5" />
          </motion.div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Urgent Action Required</h2>
            <p className="text-xs text-muted-foreground">High-risk pollution zones prioritized by dual-model analysis</p>
          </div>
        </div>
        <Link href="/hotspots">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground group">
            <span>View all hotspots</span>
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {hotspots.map((hotspot, index) => (
          <motion.div
            key={hotspot.id}
            variants={cardEntrance}
            transition={{ delay: index * 0.05 }}
            whileHover={microInteractions.hoverLift}
            className={cn(
              'glass-card rounded-2xl p-4 flex flex-col justify-between space-y-3.5 relative overflow-hidden group',
              hotspot.severity === 'critical' && 'border-l-4 border-l-red-500 pulse-urgent',
              hotspot.severity === 'high' && 'border-l-4 border-l-orange-500',
              hotspot.severity === 'medium' && 'border-l-4 border-l-amber-500',
              hotspot.severity === 'low' && 'border-l-4 border-l-emerald-500'
            )}
          >
            {/* Header: Name + Badges */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {hotspot.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="size-3 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{hotspot.city}</span>
                  </div>
                </div>
                <SeverityBadge severity={hotspot.severity} size="sm" />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-muted/50 p-2.5 text-center border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Risk Score</p>
                <p className="font-extrabold text-foreground text-sm mt-0.5">{hotspot.severityScore}/100</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2.5 text-center border border-border/40">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Waste Objects</p>
                <p className="font-extrabold text-foreground text-sm mt-0.5">{hotspot.wasteCount}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Material:</span>
                <span className="font-medium text-foreground">{hotspot.dominantWaste}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Reports:</span>
                <span className="font-medium text-foreground">{hotspot.reportCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="size-3 text-muted-foreground/80" aria-hidden="true" />
                  Cleanup:
                </span>
                <span className="font-medium text-foreground capitalize truncate max-w-[60%]">
                  {hotspot.assignedTeam ? `${hotspot.cleanupStatus} · ${hotspot.assignedTeam}` : hotspot.cleanupStatus}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-1 flex gap-2">
              <Link href={`/hotspots/${encodeURIComponent(hotspot.id)}`} className="flex-1">
                <Button
                  variant="default"
                  size="xs"
                  className="w-full text-xs h-8 rounded-xl font-medium shadow-xs transition-transform active:scale-95"
                >
                  {hotspot.cleanupStatus === 'pending' ? 'Plan Cleanup' : 'View Progress'}
                </Button>
              </Link>
              <Link href={`/hotspots/${encodeURIComponent(hotspot.id)}`} aria-label={`Inspect ${hotspot.name}`}>
                <Button
                  variant="outline"
                  size="xs"
                  className="text-xs h-8 px-3 rounded-xl border-border/80 hover:bg-muted/60 transition-transform active:scale-95"
                >
                  Inspect
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
