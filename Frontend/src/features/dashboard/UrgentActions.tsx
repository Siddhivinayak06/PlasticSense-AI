'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, MapPin, Users, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

const urgentHotspots: UrgentHotspot[] = [
  {
    id: 'HS-2026-001',
    name: 'Juhu Beach Shoreline',
    city: 'Mumbai',
    severityScore: 94,
    severity: 'critical',
    wasteCount: 238,
    dominantWaste: 'PET Bottles',
    lastDetected: '2 hours ago',
    reportCount: 32,
    cleanupStatus: 'pending',
    recommendedTeamSize: '8–12',
  },
  {
    id: 'HS-2026-002',
    name: 'Marina Beach Road',
    city: 'Chennai',
    severityScore: 87,
    severity: 'critical',
    wasteCount: 184,
    dominantWaste: 'Plastic Bags',
    lastDetected: '5 hours ago',
    reportCount: 24,
    cleanupStatus: 'assigned',
    recommendedTeamSize: '6–10',
  },
  {
    id: 'HS-2026-003',
    name: 'Versova Seafront',
    city: 'Mumbai',
    severityScore: 81,
    severity: 'high',
    wasteCount: 156,
    dominantWaste: 'Food Packaging',
    lastDetected: '8 hours ago',
    reportCount: 18,
    cleanupStatus: 'in-progress',
    recommendedTeamSize: '5–8',
  },
  {
    id: 'HS-2026-004',
    name: 'Baga Beach Strip',
    city: 'Goa',
    severityScore: 76,
    severity: 'high',
    wasteCount: 128,
    dominantWaste: 'Plastic Films',
    lastDetected: '12 hours ago',
    reportCount: 14,
    cleanupStatus: 'pending',
    recommendedTeamSize: '4–6',
  },
];

export function UrgentActions() {
  if (urgentHotspots.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10">
            <AlertTriangle className="size-4 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Urgent Action Required</h2>
            <p className="text-xs text-muted-foreground">Highest-priority pollution locations requiring immediate attention</p>
          </div>
        </div>
        <Link href="/hotspots">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            View all hotspots
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {urgentHotspots.map((hotspot, index) => (
          <motion.div
            key={hotspot.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 + index * 0.06 }}
            className={cn(
              'glass rounded-2xl p-4 space-y-3 transition-shadow hover:shadow-lg',
              hotspot.severity === 'critical' && 'pulse-urgent',
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{hotspot.name}</p>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  <MapPin className="size-3 shrink-0" />
                  <span>{hotspot.city}</span>
                </div>
              </div>
              <SeverityBadge severity={hotspot.severity} size="sm" />
            </div>

            {/* Score */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Flame className={cn(
                  'size-4',
                  hotspot.severity === 'critical' ? 'text-red-500' : 'text-orange-500',
                )} />
                <span className={cn(
                  'text-lg font-bold',
                  hotspot.severity === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400',
                )}>
                  {hotspot.severityScore}
                </span>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
              <StatusBadge status={hotspot.cleanupStatus} size="sm" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Waste Objects</span>
                <p className="font-semibold text-foreground">{hotspot.wasteCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reports</span>
                <p className="font-semibold text-foreground">{hotspot.reportCount}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Dominant Waste</span>
                <p className="font-semibold text-foreground truncate">{hotspot.dominantWaste}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Team Size</span>
                <div className="flex items-center gap-1">
                  <Users className="size-3 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{hotspot.recommendedTeamSize}</span>
                </div>
              </div>
            </div>

            {/* Last detected */}
            <p className="text-[10px] text-muted-foreground/70">Last detected: {hotspot.lastDetected}</p>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Link href="/hotspots" className="flex-1">
                <Button variant="outline" size="xs" className="w-full text-xs">
                  View
                </Button>
              </Link>
              <Link href="/assignments" className="flex-1">
                <Button variant="default" size="xs" className="w-full text-xs">
                  Assign
                </Button>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
