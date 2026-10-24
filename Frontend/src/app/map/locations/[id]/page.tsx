'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { ArrowLeft, MapPin, Navigation, Info, Target, ClipboardList, Flame, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/PageLoader';
import { DataNote, QueryError } from '@/components/shared/QueryError';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { CreateAssignmentDialog } from '@/features/assignments/CreateAssignmentDialog';
import { fetchDetection, fetchMapDetections, resolveImageUrl } from '@/services/detection';
import { fetchHotspots } from '@/services/hotspots';
import type { Detection } from '@/types/detection';
import type { MiniMapSeverity } from '@/features/map/StaticMiniMap';

const StaticMiniMap = dynamic(() => import('@/features/map/StaticMiniMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted/40 animate-pulse" />,
});

const NEARBY_RADIUS_M = 2500;

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);
  const a = Math.sin(dPhi / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLambda / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function severityOf(d: Detection): MiniMapSeverity {
  const level = String(d.risk?.level ?? '').toLowerCase();
  return level === 'low' || level === 'medium' || level === 'high' || level === 'critical' ? level : 'unknown';
}

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Entered manually',
  user_provided: 'Entered manually',
  image_exif: 'Photo EXIF GPS',
  image_overlay_ocr: 'Read from on-image GPS overlay (OCR)',
  unavailable: 'Not available',
};

export default function ReportLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const detectionQuery = useQuery({ queryKey: ['detection', id], queryFn: () => fetchDetection(id), retry: false });
  const mapQuery = useQuery({ queryKey: ['map-detections'], queryFn: fetchMapDetections });
  const hotspotsQuery = useQuery({ queryKey: ['hotspots'], queryFn: fetchHotspots });

  const detection = detectionQuery.data?.data;

  const nearby = useMemo(() => {
    if (!detection || detection.latitude == null || detection.longitude == null) return [];
    return (mapQuery.data?.detections ?? [])
      .filter((d) => d.id !== detection.id && d.latitude != null && d.longitude != null)
      .map((d) => ({ d, distance: haversineM(detection.latitude!, detection.longitude!, d.latitude!, d.longitude!) }))
      .filter((x) => x.distance <= NEARBY_RADIUS_M)
      .sort((a, b) => a.distance - b.distance);
  }, [detection, mapQuery.data]);

  const hotspot = hotspotsQuery.data?.hotspots.find((h) => h.detection_ids.includes(id));

  if (detectionQuery.isLoading) return <PageLoader label="Loading location…" />;

  if (detectionQuery.isError || !detection) {
    const notFound = isAxiosError(detectionQuery.error) && detectionQuery.error.response?.status === 404;
    if (!notFound) return <QueryError onRetry={() => detectionQuery.refetch()} />;
    return (
      <div className="max-w-xl mx-auto pt-10 space-y-4">
        <EmptyState title="Report not found" description={`No report exists with ID ${id}.`} />
        <div className="flex justify-center">
          <Link href="/map"><Button variant="outline">Return to Map</Button></Link>
        </div>
      </div>
    );
  }

  const hasLocation = detection.latitude != null && detection.longitude != null;
  const severity = severityOf(detection);
  const avgConfidence = detection.items.length
    ? Math.round((detection.items.reduce((s, i) => s + i.confidence, 0) / detection.items.length) * 100)
    : null;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/map" aria-label="Back to map">
            <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="size-4" aria-hidden="true" /></Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground">Report Location</h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono truncate">{detection.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasLocation && (
            <a
              href={`https://www.openstreetmap.org/?mlat=${detection.latitude}&mlon=${detection.longitude}#map=17/${detection.latitude}/${detection.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <Navigation className="size-3.5" aria-hidden="true" /> Open in OpenStreetMap
                <ExternalLink className="size-3" aria-hidden="true" />
              </Button>
            </a>
          )}
          {detection.detection_status === 'completed' && (
            <CreateAssignmentDialog
              target={{
                kind: 'report',
                detectionId: detection.id,
                name: hasLocation ? `Report near ${detection.latitude!.toFixed(4)}, ${detection.longitude!.toFixed(4)}` : `Report ${detection.id.slice(0, 8)}`,
                lat: detection.latitude,
                lng: detection.longitude,
                riskScore: detection.risk?.score ?? null,
                wasteCount: detection.items.length,
              }}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <ClipboardList className="size-3.5" aria-hidden="true" /> Create Assignment
                </Button>
              }
            />
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="relative h-80 rounded-2xl overflow-hidden glass p-1 shadow-md">
            {hasLocation ? (
              <>
                <div className="absolute inset-1 rounded-xl overflow-hidden">
                  <StaticMiniMap
                    lat={detection.latitude!}
                    lng={detection.longitude!}
                    severity={severity}
                    zoom={nearby.length ? 14 : 16}
                    interactive
                    points={nearby.map(({ d, distance }) => ({
                      id: d.id,
                      lat: d.latitude!,
                      lng: d.longitude!,
                      severity: severityOf(d),
                      label: `${Math.round(distance)} m away · ${d.items.length} objects`,
                    }))}
                  />
                </div>
                <div className="absolute top-4 left-4 z-[500] glass px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                  <MapPin className="size-4 text-red-500" aria-hidden="true" />
                  <span className="text-xs font-mono font-bold text-foreground">
                    {detection.latitude!.toFixed(6)}, {detection.longitude!.toFixed(6)}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-6">
                <EmptyState
                  title="No location for this report"
                  description="The image had no EXIF GPS or readable overlay, and no coordinates were entered."
                />
              </div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-3 flex flex-col items-center justify-center bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element -- served by the API / Supabase Storage */}
              <img
                src={resolveImageUrl(detection.annotated_image_url || detection.image_url)}
                alt={`Annotated analysis of report ${detection.id.slice(0, 8)}`}
                className="max-h-56 w-auto rounded-lg object-contain"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Info className="size-4 text-muted-foreground" aria-hidden="true" /> Detection Summary</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Risk</dt>
                  <dd>
                    {severity === 'unknown'
                      ? <span className="font-semibold text-muted-foreground">Not assessed</span>
                      : <span className="flex items-center gap-2"><SeverityBadge severity={severity} size="sm" /> <span className="font-semibold">{Math.round(detection.risk!.score)}/100</span></span>}
                  </dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Detected objects</dt>
                  <dd className="font-semibold">{detection.items.length}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Mean confidence</dt>
                  <dd className="font-semibold">{avgConfidence === null ? '—' : `${avgConfidence}%`}</dd>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <dt className="text-muted-foreground">Location source</dt>
                  <dd className="font-semibold text-right">{SOURCE_LABEL[detection.location_source ?? 'unavailable'] ?? detection.location_source}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Photo taken</dt>
                  <dd className="font-semibold">{detection.captured_at ? new Date(detection.captured_at).toLocaleString() : 'Unknown (no EXIF time)'}</dd>
                </div>
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground">Uploaded</dt>
                  <dd className="font-semibold">{new Date(detection.created_at).toLocaleString()}</dd>
                </div>
              </dl>
              <Link href={`/history/${detection.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full">Open full report</Button>
              </Link>
            </motion.div>
          </div>
        </div>

        <div className="space-y-6">
          {hotspot && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-5">
              <h2 className="text-sm font-semibold flex items-center gap-2 mb-2"><Flame className="size-4 text-orange-500" aria-hidden="true" /> Part of a hotspot</h2>
              <p className="text-sm text-muted-foreground">
                {hotspot.report_count} reports · {hotspot.total_waste_objects} objects · cleanup {hotspot.status.replace('_', ' ')}
              </p>
              <Link href={`/hotspots/${encodeURIComponent(hotspot.id)}`} className="block mt-3">
                <Button variant="secondary" size="sm" className="w-full">View hotspot</Button>
              </Link>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4"><Target className="size-4 text-muted-foreground" aria-hidden="true" /> Nearby Reports (within 2.5 km)</h2>
            {!hasLocation ? (
              <p className="text-sm text-muted-foreground">Unavailable without coordinates.</p>
            ) : nearby.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other geolocated reports nearby.</p>
            ) : (
              <ul className="space-y-2">
                {nearby.slice(0, 8).map(({ d, distance }) => (
                  <li key={d.id}>
                    <Link href={`/map/locations/${d.id}`} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/50">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground">{distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`} away</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {new Date(d.created_at).toLocaleDateString()} · {d.items.length} objects
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold capitalize text-muted-foreground">{severityOf(d) === 'unknown' ? 'not assessed' : severityOf(d)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <DataNote>
            Coordinates come from the photo itself or manual entry. No street address is shown because reverse geocoding is not
            configured.
          </DataNote>
        </div>
      </div>
    </div>
  );
}
