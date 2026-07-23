'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { MapToolbar } from './MapToolbar';
import { MapFilterSidebar } from './MapFilterSidebar';
import { MapLegend } from './MapLegend';
import { HotspotDetailPanel } from './HotspotDetailPanel';

import { mockMapReports, mockHotspots } from '@/mock/map';
import type { ReportFilters } from '@/types/report';
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
  
  // Map control state
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

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
    let result = [...mockMapReports];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(r => 
        r.id.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || 
        r.plasticTypeLabel.toLowerCase().includes(q)
      );
    }
    if (filters.severity.length > 0) result = result.filter(r => filters.severity.includes(r.severity));
    if (filters.plasticType.length > 0) result = result.filter(r => filters.plasticType.includes(r.plasticType));
    if (filters.status.length > 0) result = result.filter(r => filters.status.includes(r.status));
    if (filters.cleanupPriority.length > 0) result = result.filter(r => filters.cleanupPriority.includes(r.cleanupPriority));
    if (filters.dateFrom) result = result.filter(r => r.reportedDate >= filters.dateFrom);
    if (filters.dateTo) result = result.filter(r => r.reportedDate <= filters.dateTo);

    return result;
  }, [filters]);

  const handleHotspotClick = (h: Hotspot) => {
    setSelectedHotspot(h);
    // Pan to hotspot
    setMapCenter([h.lat, h.lng]);
    setMapZoom(12);
  };

  const handleLocate = () => {
    // Mock user location (center of India approx)
    setMapCenter([21.1458, 79.0882]);
    setMapZoom(6);
  };

  const handleReset = () => {
    setMapCenter([20.5937, 78.9629]);
    setMapZoom(5);
    setOverlays({ showMarkers: true, showHeatmap: false, showHotspots: true, showClusters: true });
    setFilters(defaultFilters);
    setSelectedHotspot(null);
  };

  const handleDownload = () => {
    alert('UI Only: This would capture a canvas screenshot of the map.');
  };

  return (
    <div className="relative w-full h-[calc(100vh-5rem)] rounded-2xl overflow-hidden border border-border shadow-2xl bg-slate-900">
      
      {/* Dynamic Map Component */}
      <DynamicMap 
        reports={filteredReports}
        hotspots={mockHotspots}
        overlays={overlays}
        onHotspotClick={handleHotspotClick}
        center={mapCenter}
        zoom={mapZoom}
      />

      {/* Floating Filter Button (when sidebar is closed) */}
      {!isFilterOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 left-4 z-[400]"
        >
          <Button 
            variant="default" 
            size="sm" 
            className="shadow-lg gap-2"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="size-4" />
            Open Filters
            {hasActiveFilters && <span className="flex size-4 items-center justify-center rounded-full bg-primary-foreground text-primary text-[10px] font-bold ml-1">!</span>}
          </Button>
        </motion.div>
      )}

      {/* Sidebar Filters */}
      <MapFilterSidebar 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        setSearch={(s) => toggleFilter('search', s)}
        toggleFilter={toggleFilter}
        clearFilters={() => setFilters(defaultFilters)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Toolbar */}
      <MapToolbar 
        overlays={overlays}
        toggleOverlay={toggleOverlay}
        onLocate={handleLocate}
        onReset={handleReset}
        onDownload={handleDownload}
      />

      {/* Legend */}
      <MapLegend />

      {/* Hotspot Sliding Panel */}
      <HotspotDetailPanel 
        hotspot={selectedHotspot}
        onClose={() => setSelectedHotspot(null)}
      />
      
    </div>
  );
}
