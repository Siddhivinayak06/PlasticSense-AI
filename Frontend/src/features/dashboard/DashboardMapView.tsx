'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';

interface MapHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  severityScore: number;
  wasteObjects: number;
  reports: number;
  cleanupStatus: string;
}

const SEVERITY_COLORS = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const mapHotspots: MapHotspot[] = [
  { id: 'h1', name: 'Mumbai Coastal Area', lat: 19.076, lng: 72.878, severity: 'critical', severityScore: 94, wasteObjects: 238, reports: 32, cleanupStatus: 'Pending' },
  { id: 'h2', name: 'Chennai Coast', lat: 13.083, lng: 80.271, severity: 'critical', severityScore: 87, wasteObjects: 184, reports: 24, cleanupStatus: 'Assigned' },
  { id: 'h3', name: 'Kochi Waterfront', lat: 9.931, lng: 76.267, severity: 'high', severityScore: 78, wasteObjects: 156, reports: 18, cleanupStatus: 'In Progress' },
  { id: 'h4', name: 'Goa Beach Zone', lat: 15.299, lng: 74.124, severity: 'medium', severityScore: 52, wasteObjects: 92, reports: 11, cleanupStatus: 'In Progress' },
  { id: 'h5', name: 'Visakhapatnam Coast', lat: 17.687, lng: 83.219, severity: 'high', severityScore: 71, wasteObjects: 134, reports: 15, cleanupStatus: 'Pending' },
  { id: 'h6', name: 'Puri Beach', lat: 19.814, lng: 85.831, severity: 'medium', severityScore: 48, wasteObjects: 68, reports: 8, cleanupStatus: 'Completed' },
  { id: 'h7', name: 'Kolkata Estuary', lat: 22.573, lng: 88.364, severity: 'high', severityScore: 74, wasteObjects: 145, reports: 19, cleanupStatus: 'Pending' },
  { id: 'h8', name: 'Mangalore Shore', lat: 12.914, lng: 74.856, severity: 'low', severityScore: 32, wasteObjects: 34, reports: 5, cleanupStatus: 'Verified' },
];

export function DashboardMapView() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const tileUrl = isDark 
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <MapContainer
      center={[16.5, 79.0]}
      zoom={5}
      className="h-full w-full"
      zoomControl={false}
      attributionControl={false}
      style={{ background: isDark ? '#0f172a' : '#f8fafc' }}
    >
      <TileLayer
        url={tileUrl}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
      />

      {mapHotspots.map((hotspot) => (
        <CircleMarker
          key={hotspot.id}
          center={[hotspot.lat, hotspot.lng]}
          radius={Math.max(8, hotspot.wasteObjects / 20)}
          pathOptions={{
            fillColor: SEVERITY_COLORS[hotspot.severity],
            color: SEVERITY_COLORS[hotspot.severity],
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.4,
          }}
        >
          <Popup className="!rounded-xl" maxWidth={280}>
            <div className="space-y-2 py-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm">{hotspot.name}</h3>
                <SeverityBadge severity={hotspot.severity} size="sm" />
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div>
                  <span className="text-muted-foreground">Score</span>
                  <p className="font-semibold">{hotspot.severityScore}/100</p>
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
                  <span className="text-muted-foreground">Cleanup</span>
                  <p className="font-semibold">{hotspot.cleanupStatus}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Link href="/hotspots" className="flex-1">
                  <Button variant="outline" size="xs" className="w-full text-[11px]">View Hotspot</Button>
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
  );
}
