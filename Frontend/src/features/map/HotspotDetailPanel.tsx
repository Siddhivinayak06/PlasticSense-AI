'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Box, Users, Target, Activity, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Hotspot } from '@/types/map';
import { cn } from '@/lib/utils';

interface HotspotDetailPanelProps {
  hotspot: Hotspot | null;
  onClose: () => void;
}

export function HotspotDetailPanel({ hotspot, onClose }: HotspotDetailPanelProps) {
  return (
    <AnimatePresence>
      {hotspot && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-4 right-4 z-[410] w-[340px] max-h-[calc(100vh-120px)] flex flex-col glass rounded-2xl shadow-2xl overflow-hidden pointer-events-auto border border-red-500/10"
        >
          {/* Header */}
          <div className="relative p-5 bg-gradient-to-b from-red-500/10 to-transparent border-b border-border/50">
             <Button 
               variant="ghost" 
               size="icon-xs" 
               onClick={onClose} 
               className="absolute top-4 right-4 h-6 w-6 rounded-full bg-background/50 hover:bg-background/80"
             >
               <X className="size-3.5" />
             </Button>
             
             <div className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-600 mb-3">
               {hotspot.priorityBadge}
             </div>
             
             <h2 className="text-lg font-bold text-foreground leading-tight">{hotspot.name}</h2>
             <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
               <MapPin className="size-3" />
               {hotspot.lat.toFixed(4)}°N, {hotspot.lng.toFixed(4)}°E
             </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass bg-white/40 dark:bg-slate-900/40 rounded-xl p-3 border-none">
                 <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Total Reports</p>
                 <p className="text-xl font-bold text-foreground">{hotspot.totalReports}</p>
              </div>
              <div className="glass bg-white/40 dark:bg-slate-900/40 rounded-xl p-3 border-none">
                 <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Avg Severity</p>
                 <p className={cn(
                   "text-sm font-bold capitalize",
                   hotspot.averageSeverity === 'critical' ? 'text-red-500' :
                   hotspot.averageSeverity === 'high' ? 'text-orange-500' : 'text-amber-500'
                 )}>{hotspot.averageSeverity}</p>
              </div>
              <div className="glass bg-white/40 dark:bg-slate-900/40 rounded-xl p-3 border-none">
                 <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Critical Issues</p>
                 <p className="text-xl font-bold text-red-500">{hotspot.criticalReports}</p>
              </div>
              <div className="glass bg-white/40 dark:bg-slate-900/40 rounded-xl p-3 border-none">
                 <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Trend</p>
                 <div className="flex items-center gap-1.5 mt-1">
                   <Activity className={cn(
                     "size-4", 
                     hotspot.trend === 'increasing' ? 'text-red-500' : 
                     hotspot.trend === 'decreasing' ? 'text-emerald-500' : 'text-blue-500'
                   )} />
                   <span className="text-sm font-semibold capitalize">{hotspot.trend}</span>
                 </div>
              </div>
            </div>

            {/* Plastic Types */}
            <div>
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <Box className="size-3.5 text-muted-foreground" />
                Dominant Plastic Types
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {hotspot.plasticTypes.map((pt, i) => (
                  <span key={i} className="inline-flex rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 px-2 py-0.5 text-[11px] font-medium">
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            {/* Cleanup Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Target className="size-3.5 text-muted-foreground" />
                  Cleanup Progress
                </h3>
                <span className="text-xs font-bold text-foreground">{hotspot.cleanupProgress}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full" 
                  style={{ width: `${hotspot.cleanupProgress}%` }} 
                />
              </div>
            </div>

            {/* Assignment */}
            <div className="pt-2 border-t border-border/50">
               <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                 <Users className="size-3.5 text-muted-foreground" />
                 Assigned Team
               </h3>
               <p className="text-sm text-muted-foreground">{hotspot.assignedTeam}</p>
            </div>
            
            <Button className="w-full mt-2 gap-2" variant="default">
              <AlertTriangle className="size-4" />
              Dispatch Emergency Team
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
