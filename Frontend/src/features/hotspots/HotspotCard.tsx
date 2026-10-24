'use client';

import { Hotspot } from '@/types/hotspot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ClipboardList, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CreateAssignmentDialog, type AssignmentTarget } from '@/features/assignments/CreateAssignmentDialog';

interface HotspotCardProps {
  hotspot: Hotspot;
  index?: number;
}

export function hotspotAssignmentTarget(hotspot: Hotspot): AssignmentTarget {
  return {
    kind: 'hotspot',
    hotspotId: hotspot.id,
    detectionId: hotspot.detectionIds[0],
    name: hotspot.name,
    lat: hotspot.location.lat,
    lng: hotspot.location.lng,
    riskScore: hotspot.severityScore,
    severity: hotspot.priority ?? undefined,
    wasteCount: hotspot.wasteObjects,
  };
}

export function HotspotSeverityBadge({ hotspot, size = 'sm' }: { hotspot: Hotspot; size?: 'sm' | 'md' }) {
  if (!hotspot.priority) {
    return (
      <span className="shrink-0 inline-flex items-center rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
        Not assessed
      </span>
    );
  }
  return <SeverityBadge severity={hotspot.priority} size={size} className="shrink-0" />;
}

export const HotspotCard = ({ hotspot, index = 0 }: HotspotCardProps) => {
  const closed = hotspot.status === 'resolved' || hotspot.status === 'verified';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="glass rounded-2xl p-5 flex flex-col h-full hover:shadow-lg transition-all"
    >
      <div className="flex justify-between items-start gap-4 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground line-clamp-1" title={hotspot.name}>
            {hotspot.name}
          </h3>
          <div className="text-xs text-muted-foreground flex items-center mt-1 gap-1">
            <MapPin className="size-3 shrink-0" />
            <span className="truncate">{hotspot.location.city}</span>
          </div>
        </div>
        <HotspotSeverityBadge hotspot={hotspot} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 mt-2">
        <div className="flex flex-col bg-muted/30 rounded-xl p-2.5">
          <span className="text-[10px] uppercase font-medium text-muted-foreground">Reports</span>
          <span className="font-semibold text-sm">{hotspot.reportCount}</span>
        </div>
        <div className="flex flex-col bg-muted/30 rounded-xl p-2.5">
          <span className="text-[10px] uppercase font-medium text-muted-foreground">Peak Risk</span>
          <span className="font-semibold text-sm">{hotspot.severityScore === null ? '—' : `${hotspot.severityScore}/100`}</span>
        </div>
        <div className="flex flex-col bg-muted/30 rounded-xl p-2.5 col-span-2">
          <span className="text-[10px] uppercase font-medium text-muted-foreground">Detected Objects</span>
          <span className="font-semibold text-sm">{hotspot.wasteObjects.toLocaleString()}</span>
        </div>
      </div>

      {hotspot.assignedTeam && (
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
          <Users className="size-3.5" aria-hidden="true" />
          <span className="truncate">Team: <span className="font-medium text-foreground">{hotspot.assignedTeam}</span></span>
        </p>
      )}

      <div className="flex flex-col gap-1 mb-4">
        <span className="text-[10px] uppercase font-medium text-muted-foreground">Waste Detected</span>
        <div className="flex flex-wrap gap-1.5">
          {hotspot.plasticTypes.slice(0, 3).map((type, i) => (
            <Badge key={i} variant="secondary" className="text-[10px] py-0 px-2 font-medium bg-background/50 border-border/50">
              {type}
            </Badge>
          ))}
          {hotspot.plasticTypes.length > 3 && (
            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium bg-background/50 border-border/50">
              +{hotspot.plasticTypes.length - 3}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-border/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <StatusBadge status={hotspot.status} size="sm" />
          <span className="text-[10px] text-muted-foreground">
            Updated {new Date(hotspot.lastUpdated).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/hotspots/${encodeURIComponent(hotspot.id)}`} className="flex-1">
            <Button variant="outline" size="xs" className="w-full text-xs">
              View details
            </Button>
          </Link>
          {!closed && (
            <div className="flex-1">
              <CreateAssignmentDialog
                target={hotspotAssignmentTarget(hotspot)}
                trigger={
                  <Button variant="default" size="xs" className="w-full text-xs gap-1">
                    <ClipboardList className="size-3" aria-hidden="true" />
                    Assign
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
