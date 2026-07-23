'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

import type { Report } from '@/types/report';
import type { Hotspot, MapOverlayState } from '@/types/map';
import { MapMarkerPopup } from './MapMarkerPopup';

// Fix default icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for Severities
const createIcon = (colorUrl: string) => new L.Icon({
  iconUrl: colorUrl,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const icons = {
  low: createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'),
  medium: createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png'),
  high: createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png'),
  critical: createIcon('https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'),
};

interface DynamicMapProps {
  reports: Report[];
  hotspots: Hotspot[];
  overlays: MapOverlayState;
  onHotspotClick: (h: Hotspot) => void;
  center?: [number, number];
  zoom?: number;
}

// Map Controller for external zoom/center commands
function MapController({ center, zoom }: { center?: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.flyTo(center, zoom, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Heatmap Layer using leaflet.heat
function HeatmapLayer({ reports, active }: { reports: Report[]; active: boolean }) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!active) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
      return;
    }

    if (!heatLayerRef.current) {
      const heatData = reports.map(r => {
        // Intensity based on severity
        const intensity = r.severity === 'critical' ? 1.0 : r.severity === 'high' ? 0.8 : r.severity === 'medium' ? 0.5 : 0.2;
        return [r.lat, r.lng, intensity] as [number, number, number];
      });
      heatLayerRef.current = (L as any).heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      }).addTo(map);
    }
  }, [active, reports, map]);

  return null;
}

export default function DynamicMap({ reports, hotspots, overlays, onHotspotClick, center = [20.5937, 78.9629], zoom = 5 }: DynamicMapProps) {
  
  const renderMarkers = () => {
    return reports.map(r => (
      <Marker key={r.id} position={[r.lat, r.lng]} icon={icons[r.severity]}>
        <MapMarkerPopup report={r} />
      </Marker>
    ));
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        zoomControl={false}
        className="w-full h-full"
        style={{ background: '#0f172a' }} // dark background to match theme somewhat
      >
        <MapController center={center} zoom={zoom} />
        
        {/* Base Map (Dark Theme OpenStreetMap via CartoDB) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Heatmap Layer */}
        <HeatmapLayer reports={reports} active={overlays.showHeatmap} />

        {/* Hotspots */}
        {overlays.showHotspots && hotspots.map(h => (
          <Circle
            key={h.id}
            center={[h.lat, h.lng]}
            radius={h.radius}
            pathOptions={{
              color: h.averageSeverity === 'critical' ? '#ef4444' : h.averageSeverity === 'high' ? '#f97316' : '#eab308',
              fillColor: h.averageSeverity === 'critical' ? '#ef4444' : h.averageSeverity === 'high' ? '#f97316' : '#eab308',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '4 4'
            }}
            eventHandlers={{
              click: () => onHotspotClick(h),
            }}
          />
        ))}

        {/* Markers & Clusters */}
        {overlays.showMarkers && (
          overlays.showClusters ? (
            <MarkerClusterGroup
              chunkedLoading
              showCoverageOnHover={false}
              maxClusterRadius={50}
            >
              {renderMarkers()}
            </MarkerClusterGroup>
          ) : (
            renderMarkers()
          )
        )}
      </MapContainer>
      
      {/* Inject custom CSS for popups and leaflet here to override defaults */}
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-container {
          font-family: inherit;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2);
          padding: 0;
          overflow: hidden;
        }
        .dark .custom-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95);
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .custom-popup .leaflet-popup-content {
          margin: 12px;
        }
        .custom-popup .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        .dark .custom-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .leaflet-control-zoom {
          display: none;
        }
      `}} />
    </div>
  );
}
