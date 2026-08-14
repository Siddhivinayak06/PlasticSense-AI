'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMapDetections, resolveImageUrl } from '@/services/detection';
import type { Detection } from '@/types/detection';
import { MapPin, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Fix for default Leaflet marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// A component to automatically fit bounds to all markers
function FitBounds({ detections }: { detections: Detection[] }) {
  const map = useMap();
  useEffect(() => {
    if (detections.length === 0) return;
    const bounds = L.latLngBounds(detections.map((d) => [d.latitude as number, d.longitude as number]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, detections]);
  return null;
}

export default function MapClient() {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchMapDetections();
        setDetections(res.detections);
      } catch (err: any) {
        setError('Failed to load map data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading geospatial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
          <AlertTriangle className="size-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  if (detections.length === 0) {
    return (
      <div className="flex h-[calc(100vh-10rem)] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <MapPin className="size-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">No Geotagged Detections</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Upload images with GPS location or provide coordinates manually to see them on the map.
            </p>
          </div>
          <Link href="/detect">
            <Button className="mt-4">Run Detection</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] w-full rounded-2xl overflow-hidden border border-border shadow-md">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitBounds detections={detections} />
        {detections.map((detection) => (
          <Marker 
            key={detection.id} 
            position={[detection.latitude as number, detection.longitude as number]}
          >
            <Popup className="custom-popup">
              <div className="w-48 space-y-3">
                <img 
                  src={resolveImageUrl(detection.image_url)} 
                  alt="Detection"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {detection.items.length} Object{detection.items.length !== 1 && 's'} Found
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {new Date(detection.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Link href={`/history/${detection.id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-1.5">
                    View Details
                    <ExternalLink className="size-3" />
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
