'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, ArrowLeft, Activity, FileText, ClipboardList, Map as MapIcon, Boxes, Gauge, Users, ChevronRight,
} from 'lucide-react';
import type { Hotspot } from '@/types/hotspot';
import type { Detection } from '@/types/detection';
import type { AssignmentItem } from '@/services/assignments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataNote } from '@/components/shared/QueryError';
import { CreateAssignmentDialog } from '@/features/assignments/CreateAssignmentDialog';
import { HotspotSeverityBadge, hotspotAssignmentTarget } from '@/features/hotspots/HotspotCard';
import type { MiniMapSeverity } from '@/features/map/StaticMiniMap';

const StaticMiniMap = dynamic(() => import('@/features/map/StaticMiniMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted/40 animate-pulse" />,
});

interface HotspotDetailProps {
  hotspot: Hotspot;
  /** Member reports with coordinates (from /detections/map). */
  members: Detection[];
  assignments: AssignmentItem[];
}

function riskSeverity(d: Detection): MiniMapSeverity {
  const level = (d.risk?.level as string | undefined)?.toLowerCase();
  return level === 'low' || level === 'medium' || level === 'high' || level === 'critical' ? level : 'unknown';
}

function StatTile({ label, value, icon: Icon, delay }: { label: string; value: string; icon: typeof Activity; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <Icon className="size-5 text-primary" aria-hidden="true" />
      </div>
    </motion.div>
  );
}

export const HotspotDetail = ({ hotspot, members, assignments }: HotspotDetailProps) => {
  const closed = hotspot.status === 'resolved' || hotspot.status === 'verified';
  const memberIds = new Set(hotspot.detectionIds);
  const memberReports = members
    .filter((d) => memberIds.has(d.id))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const linked = assignments.filter((a) => hotspot.assignmentIds.includes(a.id));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/hotspots" aria-label="Back to hotspots">
            <Button variant="outline" size="icon" className="size-8 rounded-full">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold break-words">{hotspot.name}</h1>
              <HotspotSeverityBadge hotspot={hotspot} size="md" />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1 text-xs">
              <span className="font-mono bg-muted/50 px-2 py-0.5 rounded-md">{hotspot.id}</span>
              <span className="flex items-center">
                <MapPin className="size-3 mr-1" aria-hidden="true" />
                {hotspot.location.lat.toFixed(5)}, {hotspot.location.lng.toFixed(5)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/map" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full gap-2">
              <MapIcon className="size-4" aria-hidden="true" />
              Open Map
            </Button>
          </Link>
          {!closed && (
            <div className="flex-1 sm:flex-none">
              <CreateAssignmentDialog
                target={hotspotAssignmentTarget(hotspot)}
                trigger={
                  <Button className="w-full gap-2">
                    <ClipboardList className="size-4" aria-hidden="true" />
                    Assign Team
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Peak risk" value={hotspot.severityScore === null ? '—' : `${hotspot.severityScore}/100`} icon={Gauge} delay={0.05} />
        <StatTile label="Average risk" value={hotspot.avgRiskScore === null ? '—' : `${hotspot.avgRiskScore}/100`} icon={Activity} delay={0.1} />
        <StatTile label="Reports" value={String(hotspot.reportCount)} icon={FileText} delay={0.15} />
        <StatTile label="Detected objects" value={hotspot.wasteObjects.toLocaleString()} icon={Boxes} delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="size-5 text-primary" aria-hidden="true" />
                Cluster Extent
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Centroid of {hotspot.reportCount} report{hotspot.reportCount === 1 ? '' : 's'}; the dashed circle reaches the
                farthest member ({Math.round(hotspot.radiusM)} m).
              </p>
            </div>
            <div className="w-full h-[360px] rounded-xl overflow-hidden border border-border">
              <StaticMiniMap
                lat={hotspot.location.lat}
                lng={hotspot.location.lng}
                severity={hotspot.severity}
                radiusM={hotspot.radiusM}
                zoom={hotspot.radiusM > 1000 ? 13 : hotspot.radiusM > 400 ? 14 : 16}
                interactive
                points={memberReports
                  .filter((d) => d.latitude != null && d.longitude != null)
                  .map((d) => ({
                    id: d.id,
                    lat: d.latitude!,
                    lng: d.longitude!,
                    severity: riskSeverity(d),
                    label: `${new Date(d.created_at).toLocaleDateString()} · ${d.items.length} objects`,
                  }))}
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-3">Member Reports</h2>
            {memberReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Report details are unavailable.</p>
            ) : (
              <ul className="divide-y divide-border/50">
                {memberReports.map((d) => (
                  <li key={d.id}>
                    <Link href={`/history/${d.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-muted/30 rounded-lg px-2 -mx-2 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{new Date(d.created_at).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {d.items.length} objects · {d.risk ? `risk ${Math.round(d.risk.score)}/100 (${d.risk.level})` : 'not assessed'} · location via {d.location_source?.replace(/_/g, ' ') ?? 'unknown'}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="size-5 text-primary" aria-hidden="true" />
              Cleanup Status
            </h2>
            <StatusBadge status={hotspot.status} size="md" />
            {linked.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cleanup assignment yet.</p>
            ) : (
              <ul className="space-y-2">
                {linked.map((a) => (
                  <li key={a.id}>
                    <Link href={`/assignments/${a.id}`} className="block rounded-lg border border-border/50 bg-muted/30 p-2.5 hover:border-primary/40 transition-colors">
                      <p className="text-sm font-semibold truncate">{a.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.id} · {a.status.replace('_', ' ')}{a.ngo_team_name ? ` · ${a.ngo_team_name}` : ''}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-5 space-y-3">
            <h2 className="text-lg font-semibold">Materials</h2>
            {hotspot.plasticTypes.length ? (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {hotspot.plasticTypes.map((type) => (
                    <Badge key={type} variant="outline" className="font-medium text-foreground border-border">{type}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Most common: <span className="font-semibold text-foreground">{hotspot.mostCommonPlastic}</span>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No objects detected in member reports.</p>
            )}
            <p className="text-xs text-muted-foreground">
              Last report: {new Date(hotspot.lastUpdated).toLocaleString()}
            </p>
          </motion.div>

          <DataNote>
            A hotspot groups reports within 2.5 km of one another. Its ID is derived from the centroid, so it changes when new
            reports join the cluster.
          </DataNote>
        </div>
      </div>
    </div>
  );
};
