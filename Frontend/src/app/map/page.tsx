'use client';

import { MapShell } from '@/features/map/MapShell';

export default function MapPage() {
  return (
    <div className="max-w-[1600px] mx-auto pb-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Pollution Map</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Interactive GIS monitoring dashboard for identifying and analyzing plastic pollution hotspots.
        </p>
      </div>
      
      <MapShell />
    </div>
  );
}