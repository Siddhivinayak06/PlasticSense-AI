'use client';

import { MapContainer, TileLayer, CircleMarker, Circle, Tooltip } from 'react-leaflet';
import { useTheme } from 'next-themes';
import 'leaflet/dist/leaflet.css';

export type MiniMapSeverity = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export const SEVERITY_COLORS: Record<MiniMapSeverity, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
  unknown: '#94a3b8',
};

export interface MiniMapPoint {
  id: string;
  lat: number;
  lng: number;
  severity: MiniMapSeverity;
  label?: string;
}

interface StaticMiniMapProps {
  lat: number;
  lng: number;
  severity: MiniMapSeverity;
  /** Draw the cluster extent around the centre, in metres. */
  radiusM?: number;
  /** Additional points, e.g. the member reports of a cluster or nearby reports. */
  points?: MiniMapPoint[];
  zoom?: number;
  interactive?: boolean;
}

export default function StaticMiniMap({
  lat,
  lng,
  severity,
  radiusM,
  points = [],
  zoom = 15,
  interactive = false,
}: StaticMiniMapProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const color = SEVERITY_COLORS[severity];

  return (
    <div className="w-full h-full relative z-0">
      <style>{`.minimap-dark-tiles { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }`}</style>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        zoomControl={interactive}
        dragging={interactive}
        scrollWheelZoom={false}
        doubleClickZoom={interactive}
        className="w-full h-full"
      >
        {/* Same keyless OSM tiles as the main map; dark mode inverts them via CSS. */}
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          className={isDark ? 'minimap-dark-tiles' : ''}
        />
        {radiusM && (
          <Circle center={[lat, lng]} radius={radiusM} pathOptions={{ color, weight: 1.5, fillOpacity: 0.12, dashArray: '4 4' }} />
        )}
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={6}
            pathOptions={{ color: '#fff', weight: 1.5, fillColor: SEVERITY_COLORS[p.severity], fillOpacity: 0.9 }}
          >
            {p.label && <Tooltip>{p.label}</Tooltip>}
          </CircleMarker>
        ))}
        <CircleMarker center={[lat, lng]} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 }} />
      </MapContainer>
    </div>
  );
}
