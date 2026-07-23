'use client';

import { motion } from 'framer-motion';
import { Map, MapPin, Layers, RefreshCcw, Download, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MapOverlayState } from '@/types/map';
import { cn } from '@/lib/utils';

interface MapToolbarProps {
  overlays: MapOverlayState;
  toggleOverlay: (key: keyof MapOverlayState) => void;
  onReset: () => void;
  onLocate: () => void;
  onDownload: () => void;
}

export function MapToolbar({ overlays, toggleOverlay, onReset, onLocate, onDownload }: MapToolbarProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-4 right-4 z-[400] flex items-center gap-2 pointer-events-none"
    >
      <div className="flex items-center gap-1 glass p-1.5 rounded-xl pointer-events-auto shadow-sm">
        <Button 
          variant={overlays.showMarkers ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => toggleOverlay('showMarkers')}
          className={cn("h-8 gap-1.5 px-3 rounded-lg text-xs font-semibold", overlays.showMarkers ? "" : "text-muted-foreground")}
        >
          <MapPin className="size-3.5" />
          <span className="hidden sm:inline">Markers</span>
        </Button>
        <Button 
          variant={overlays.showClusters ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => toggleOverlay('showClusters')}
          className={cn("h-8 gap-1.5 px-3 rounded-lg text-xs font-semibold", overlays.showClusters ? "" : "text-muted-foreground")}
        >
          <Layers className="size-3.5" />
          <span className="hidden sm:inline">Clusters</span>
        </Button>
        <Button 
          variant={overlays.showHeatmap ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => toggleOverlay('showHeatmap')}
          className={cn("h-8 gap-1.5 px-3 rounded-lg text-xs font-semibold", overlays.showHeatmap ? "bg-orange-500/20 text-orange-600 hover:bg-orange-500/30" : "text-muted-foreground")}
        >
          <Map className="size-3.5" />
          <span className="hidden sm:inline">Heatmap</span>
        </Button>
        <Button 
          variant={overlays.showHotspots ? 'default' : 'ghost'} 
          size="sm" 
          onClick={() => toggleOverlay('showHotspots')}
          className={cn("h-8 gap-1.5 px-3 rounded-lg text-xs font-semibold", overlays.showHotspots ? "bg-rose-500/20 text-rose-600 hover:bg-rose-500/30" : "text-muted-foreground")}
        >
          <Navigation className="size-3.5" />
          <span className="hidden sm:inline">Hotspots</span>
        </Button>
      </div>

      <div className="flex items-center gap-1 glass p-1.5 rounded-xl pointer-events-auto shadow-sm">
        <Button variant="ghost" size="icon-sm" onClick={onLocate} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Navigation className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onReset} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <RefreshCcw className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDownload} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Download className="size-4" />
        </Button>
      </div>
    </motion.div>
  );
}
