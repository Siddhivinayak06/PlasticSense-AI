'use client';

import { motion } from 'framer-motion';

export function MapLegend() {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 right-4 z-[400] glass rounded-2xl p-4 shadow-lg pointer-events-auto max-w-[200px]"
    >
      <h4 className="text-xs font-bold text-foreground mb-3">Map Legend</h4>
      
      <div className="space-y-3">
        <div>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Severity Markers</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs">
              <div className="size-3 rounded-full bg-emerald-500" /> Low
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="size-3 rounded-full bg-amber-400" /> Medium
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="size-3 rounded-full bg-orange-500" /> High
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="size-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" /> Critical
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Heatmap Intensity</p>
          <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-500 via-lime-500 via-yellow-500 to-red-600 mb-1" />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Low</span>
            <span>High Density</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
