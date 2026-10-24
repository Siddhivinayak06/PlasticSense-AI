'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Box, Users, Gauge, MapPin, ArrowRight } from 'lucide-react';
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
               aria-label="Close hotspot details"
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
               {hotspot.lat.toFixed(4)}, {hotspot.lng.toFixed(4)}
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
                 <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Peak Risk</p>
                 <p className="text-xl font-bold text-foreground flex items-center gap-1.5">
                   <Gauge className="size-4 text-muted-foreground" aria-hidden="true" />
                   {hotspot.maxRiskScore === null ? '—' : Math.round(hotspot.maxRiskScore)}
                 </p>
              </div>
              <div className="glass bg-white/40 dark:bg-slate-900/40 rounded-xl p-3 border-none">
                 <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Objects</p>
                 <p className="text-xl font-bold text-foreground">{hotspot.wasteObjects}</p>
              </div>
            </div>

            {/* Plastic Types */}
            <div>
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <Box className="size-3.5 text-muted-foreground" />
                Dominant Materials
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {hotspot.plasticTypes.map((pt, i) => (
                  <span key={i} className="inline-flex rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 px-2 py-0.5 text-[11px] font-medium">
                    {pt}
                  </span>
                ))}
              </div>
            </div>

            {/* Cleanup status from linked assignments */}
            <div className="pt-2 border-t border-border/50">
               <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
                 <Users className="size-3.5 text-muted-foreground" aria-hidden="true" />
                 Cleanup
               </h3>
               <p className="text-sm text-muted-foreground capitalize">
                 {hotspot.status.replace('_', ' ')}{hotspot.assignedTeam ? ` · ${hotspot.assignedTeam}` : ' · no team assigned'}
               </p>
            </div>

            <Link href={`/hotspots/${encodeURIComponent(hotspot.id)}`} className="block">
              <Button className="w-full mt-2 gap-2" variant="default">
                Open hotspot details
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
