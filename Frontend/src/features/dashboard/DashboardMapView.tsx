'use client';

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchMapDetections } from '@/services/detection';

interface MapHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high' | 'critical' | 'unknown';
  severityScore: number | null;
  wasteObjects: number;
  reports: number;
  cleanupStatus: string;
  detailUrl?: string;
  explanation?: string;
}

const SEVERITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
  unknown: '#94a3b8',
};

// Default view (India) when no report carries coordinates yet.
const DEFAULT_CENTER: [number, number] = [21.0, 78.0];

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center[0], center[1], zoom, map]);
  return null;
}

export function DashboardMapView() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  // Use standard OSM to avoid API key watermarks
  const tileUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const { data } = useQuery({
    queryKey: ['mapDetections'],
    queryFn: fetchMapDetections,
  });

  const realHotspots: MapHotspot[] = (data?.detections || [])
    .filter((d) => d.latitude != null && d.longitude != null)
    .map((d) => {
      // A report without a risk assessment is shown as "not assessed", never as medium/50.
      const rawLevel = String(d.risk?.level ?? '').toLowerCase();
      const severity: MapHotspot['severity'] =
        rawLevel === 'low' || rawLevel === 'medium' || rawLevel === 'high' || rawLevel === 'critical' ? rawLevel : 'unknown';
      const score = d.risk?.score != null ? Math.round(d.risk.score) : null;
      const wasteCount = d.items?.length ?? 0;
      const coverage = d.segmentation?.waste_coverage_percent ?? d.summary?.waste_coverage_percent;
      const cleanupStatus = d.risk?.cleanup_priority ?? '—';
      const locationName = `Report #${d.id.slice(0, 8)}${coverage != null ? ` (${coverage}% cover)` : ''}`;

      return {
        id: d.id,
        name: locationName,
        lat: d.latitude!,
        lng: d.longitude!,
        severity,
        severityScore: score,
        wasteObjects: wasteCount,
        reports: 1,
        cleanupStatus,
        detailUrl: `/history/${d.id}`,
        explanation: d.risk?.explanation,
      };
    });

  const hotspots = realHotspots;
  const activeCenter: [number, number] = realHotspots.length > 0
    ? [realHotspots[0].lat, realHotspots[0].lng]
    : DEFAULT_CENTER;
  const activeZoom = realHotspots.length > 0 ? 9 : 4;

  return (
    <div className="relative h-full w-full">
    {data && realHotspots.length === 0 && (
      <div className="absolute inset-x-4 top-4 z-[500] rounded-xl bg-background/90 backdrop-blur px-4 py-3 text-sm shadow-lg border border-border/50">
        <p className="font-semibold">No geolocated reports yet</p>
        <p className="text-xs text-muted-foreground mt-0.5">Reports appear here once an analysed image has GPS coordinates.</p>
      </div>
    )}
    <MapContainer
      center={activeCenter}
      zoom={activeZoom}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
      style={{ background: isDark ? '#0f172a' : '#f8fafc' }}
    >
      {realHotspots.length > 0 && <MapRecenter center={activeCenter} zoom={activeZoom} />}
      <TileLayer
        url={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        className={isDark ? 'dark-map-tiles' : ''}
      />
      <style>{`
        .dark-map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>

      {hotspots.map((hotspot) => (
        <CircleMarker
          key={hotspot.id}
          center={[hotspot.lat, hotspot.lng]}
          radius={Math.max(8, Math.min(28, Math.sqrt(hotspot.wasteObjects) * 1.5))}
          pathOptions={{
            fillColor: SEVERITY_COLORS[hotspot.severity],
            color: SEVERITY_COLORS[hotspot.severity],
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.5,
          }}
        >
          <Popup className="!rounded-xl" maxWidth={280}>
            <div className="space-y-2 py-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm">{hotspot.name}</h3>
                {hotspot.severity === 'unknown'
                  ? <span className="text-[11px] font-semibold text-muted-foreground">Not assessed</span>
                  : <SeverityBadge severity={hotspot.severity} size="sm" />}
              </div>
              {hotspot.explanation && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 italic">
                  {hotspot.explanation}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Score</span>
                  <p className="font-semibold">{hotspot.severityScore === null ? '—' : `${hotspot.severityScore}/100`}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Waste Objects</span>
                  <p className="font-semibold">{hotspot.wasteObjects}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reports</span>
                  <p className="font-semibold">{hotspot.reports}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Priority</span>
                  <p className="font-semibold">{hotspot.cleanupStatus}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Link href={hotspot.detailUrl ?? '/hotspots'} className="flex-1">
                  <Button variant="outline" size="xs" className="w-full text-[11px]">View Report</Button>
                </Link>
                <Link href="/assignments" className="flex-1">
                  <Button variant="default" size="xs" className="w-full text-[11px]">Assign Cleanup</Button>
                </Link>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
    </div>
  );
}
