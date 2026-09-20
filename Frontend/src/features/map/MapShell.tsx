'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchMapDetections, resolveImageUrl } from '@/services/detection';
import { fetchHotspots } from '@/services/hotspots';

import { MapToolbar } from './MapToolbar';
import { MapFilterSidebar } from './MapFilterSidebar';
import { MapLegend } from './MapLegend';
import { HotspotDetailPanel } from './HotspotDetailPanel';

import type { Report, ReportFilters, ReportSeverity, CleanupPriority } from '@/types/report';
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
    return mapData.detections
      .filter((d) => d.latitude != null && d.longitude != null)
      .map((d) => {
        const rawSev = (d.risk?.level || d.risk?.severity || d.summary?.severity || 'low').toLowerCase();
        const severity: ReportSeverity = ['low', 'medium', 'high', 'critical'].includes(rawSev)
          ? (rawSev === 'moderate' ? 'medium' : rawSev as ReportSeverity)
          : 'medium';

        const rawPri = (d.risk?.cleanup_priority || d.summary?.cleanup_priority || 'low').toLowerCase();
        const cleanupPriority: CleanupPriority = ['low', 'medium', 'high', 'urgent'].includes(rawPri)
          ? rawPri as CleanupPriority
          : 'medium';

        const coverage = d.segmentation?.waste_coverage_percent ?? d.summary?.waste_coverage_percent;
        const dominantGroup = d.items?.[0]?.waste_group || 'Plastic';
        const plasticTypeLabel = `${dominantGroup.charAt(0).toUpperCase() + dominantGroup.slice(1)} Debris (${d.items?.length || 0} objects)`;

        return {
          id: d.id,
          imageUrl: resolveImageUrl(d.annotated_image_url || d.image_url),
          plasticType: 'other',
          plasticTypeLabel,
          confidence: Math.round(d.items?.length ? (d.items.reduce((s, it) => s + it.confidence, 0) / d.items.length) * 100 : 85),
          detectedObjects: d.items?.length || 0,
          severity,
          cleanupPriority,
          status: 'pending',
          reportedDate: d.created_at,
          lat: d.latitude!,
          lng: d.longitude!,
          city: `Lat ${d.latitude!.toFixed(3)}`,
          address: `Sector ${d.latitude!.toFixed(4)}, ${d.longitude!.toFixed(4)}`,
          assignedTeam: 'Unassigned',
          description: d.risk?.explanation || `Detected ${d.items?.length || 0} waste objects covering ${coverage || 0}% area.`,
          nearbyWaterBody: 'Coastal/Marine Buffer',
          disposalMethod: 'Standard NGO Collection',
          statusHistory: [],
          comments: [],
          riskScore: d.risk?.score != null ? Math.round(d.risk.score) : undefined,
          wasteCoverage: coverage != null ? Number(coverage) : undefined,
          locationSource: d.location_source || undefined,
        };
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
      averageSeverity: h.severity,
      criticalReports: h.severity === 'critical' ? h.report_count : 0,
      lastUpdated: h.last_updated,
      priorityBadge: h.priority.toUpperCase(),
      plasticTypes: h.dominant_materials,
      cleanupProgress: h.status === 'completed' ? 100 : h.status === 'in_progress' ? 50 : 10,
      assignedTeam: 'Coordinated Response',
      trend: 'stable',
    }));
  }, [hotspotsData]);

  // Dynamic Map center state
  const defaultCenter: [number, number] = realReports.length > 0
    ? [realReports[0].lat, realReports[0].lng]
    : [19.1616, 72.9473];
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);
  const [mapZoom, setMapZoom] = useState(realReports.length > 0 ? 11 : 5);

  useEffect(() => {
    if (realReports.length > 0) {
      setMapCenter([realReports[0].lat, realReports[0].lng]);
      setMapZoom(11);
    }
  }, [realReports]);

  const toggleOverlay = (key: keyof MapOverlayState) => {
    setOverlays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleFilter = <K extends keyof ReportFilters>(key: K, value: any) => {
    setFilters(f => {
      const current = f[key];
      if (Array.isArray(current)) {
        const arr = current as any[];
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
    setMapCenter([h.lat, h.lng]);
    setMapZoom(13);
  };

  const handleLocate = () => {
    if (realReports.length > 0) {
      setMapCenter([realReports[0].lat, realReports[0].lng]);
      setMapZoom(12);
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
        onDownload={() => {}}
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
