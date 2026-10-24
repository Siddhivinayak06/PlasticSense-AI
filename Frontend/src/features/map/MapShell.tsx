'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchMapDetections, resolveImageUrl } from '@/services/detection';
import { fetchHotspots } from '@/services/hotspots';
import { detectionToReport } from '@/services/reportAdapter';
import { downloadCsv, REPORT_CSV_HEADER, reportCsvRows } from '@/lib/csv';

import { MapToolbar } from './MapToolbar';
import { MapFilterSidebar } from './MapFilterSidebar';
import { MapLegend } from './MapLegend';
import { HotspotDetailPanel } from './HotspotDetailPanel';

import type { Report, ReportFilters } from '@/types/report';
import type { Hotspot, MapOverlayState } from '@/types/map';

// Dynamically import the map to avoid SSR issues with window/Leaflet
const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-3">
         <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
         <p className="text-sm font-medium animate-pulse">Initializing GIS Engine...</p>
      </div>
    </div>
  )
});

const defaultFilters: ReportFilters = {
  search: '',
  severity: [],
  plasticType: [],
  status: [],
  cleanupPriority: [],
  dateFrom: '',
  dateTo: '',
  location: '',
};

export function MapShell() {
  const [overlays, setOverlays] = useState<MapOverlayState>({
    showMarkers: true,
    showHeatmap: false,
    showHotspots: true,
    showClusters: true,
  });

  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // Real data queries
  const { data: mapData, isLoading: isMapLoading } = useQuery({
    queryKey: ['mapDetections'],
    queryFn: fetchMapDetections,
  });

  const { data: hotspotsData } = useQuery({
    queryKey: ['hotspots'],
    queryFn: fetchHotspots,
  });

  // Convert real detections to Report interface
  const realReports: Report[] = useMemo(() => {
    if (!mapData?.detections) return [];
    // Shared adapter: fields the backend does not produce stay empty instead of invented.
    return mapData.detections
      .filter((d) => d.latitude != null && d.longitude != null)
      .map((d) => {
        const report = detectionToReport(d);
        return { ...report, imageUrl: resolveImageUrl(report.imageUrl) };
      });
  }, [mapData]);

  // Convert real hotspots to Map Hotspot interface
  const realHotspots: Hotspot[] = useMemo(() => {
    if (!hotspotsData?.hotspots) return [];
    return hotspotsData.hotspots.map((h) => ({
      id: h.id,
      name: h.name,
      lat: h.latitude,
      lng: h.longitude,
      radius: h.radius,
      totalReports: h.report_count,
      wasteObjects: h.total_waste_objects,
      averageSeverity: h.severity,
      maxRiskScore: h.max_risk_score,
      lastUpdated: h.last_updated,
      priorityBadge: h.severity === 'unknown' ? 'NOT ASSESSED' : `${h.severity.toUpperCase()} RISK`,
      plasticTypes: h.dominant_materials,
      status: h.status,
      assignedTeam: h.assigned_team ?? undefined,
    }));
  }, [hotspotsData]);

  // Dynamic Map center state
  const defaultCenter: [number, number] = realReports.length > 0
    ? [realReports[0].lat, realReports[0].lng]
    : [21.0, 78.0]; // India overview until geolocated reports exist
  // The view follows the data until the user picks a hotspot or recentres.
  const [userView, setUserView] = useState<{ center: [number, number]; zoom: number } | null>(null);
  const mapCenter = userView?.center ?? defaultCenter;
  const mapZoom = userView?.zoom ?? (realReports.length > 0 ? 11 : 5);
  const setMapView = (center: [number, number], zoom: number) => setUserView({ center, zoom });

  const toggleOverlay = (key: keyof MapOverlayState) => {
    setOverlays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFilter = <K extends keyof ReportFilters>(key: K, value: string) => {
    setFilters(f => {
      const current = f[key];
      if (Array.isArray(current)) {
        const arr = current as string[];
        return {
          ...f,
          [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
        };
      }
      return { ...f, [key]: value };
    });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.severity.length > 0 || filters.plasticType.length > 0 ||
           filters.status.length > 0 || filters.cleanupPriority.length > 0 ||
           filters.dateFrom !== '' || filters.dateTo !== '' || filters.search !== '';
  }, [filters]);

  const filteredReports = useMemo(() => {
    let result = [...realReports];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(r =>
        r.id.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) ||
        r.plasticTypeLabel.toLowerCase().includes(q)
      );
    }
    if (filters.severity.length > 0) result = result.filter(r => filters.severity.includes(r.severity));
    if (filters.status.length > 0) result = result.filter(r => filters.status.includes(r.status));
    if (filters.cleanupPriority.length > 0) result = result.filter(r => filters.cleanupPriority.includes(r.cleanupPriority));
    if (filters.dateFrom) result = result.filter(r => r.reportedDate >= filters.dateFrom);
    if (filters.dateTo) result = result.filter(r => r.reportedDate <= filters.dateTo);

    return result;
  }, [realReports, filters]);

  const handleHotspotClick = (h: Hotspot) => {
    setSelectedHotspot(h);
    setMapView([h.lat, h.lng], 13);
  };

  const handleLocate = () => {
    if (realReports.length > 0) {
      setMapView([realReports[0].lat, realReports[0].lng], 12);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[550px] rounded-2xl overflow-hidden border border-border/50 bg-background shadow-lg">
      {/* Top Toolbar */}
      <MapToolbar
        overlays={overlays}
        toggleOverlay={toggleOverlay}
        onReset={() => setFilters(defaultFilters)}
        onLocate={handleLocate}
        onDownload={() => {
          const visible = (mapData?.detections ?? []).filter((d) => filteredReports.some((r) => r.id === d.id));
          downloadCsv(`wastesense-map-reports-${new Date().toISOString().slice(0, 10)}.csv`, REPORT_CSV_HEADER, reportCsvRows(visible));
        }}
      />

      {/* Main Map */}
      <DynamicMap
        reports={filteredReports}
        hotspots={realHotspots}
        overlays={overlays}
        onHotspotClick={handleHotspotClick}
        center={mapCenter}
        zoom={mapZoom}
      />

      {/* Floating Filter Toggle for Mobile */}
      <div className="absolute top-4 left-4 z-10 md:hidden">
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-lg bg-background/90 backdrop-blur-md"
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter className="size-4" />
        </Button>
      </div>

      {/* Map Legend */}
      <MapLegend />

      {/* Filter Sidebar */}
      <MapFilterSidebar
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        setSearch={(s) => setFilters(f => ({ ...f, search: s }))}
        toggleFilter={toggleFilter}
        clearFilters={() => setFilters(defaultFilters)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Hotspot Detail Flyout */}
      {selectedHotspot && (
        <HotspotDetailPanel
          hotspot={selectedHotspot}
          onClose={() => setSelectedHotspot(null)}
        />
      )}
    </div>
  );
}
