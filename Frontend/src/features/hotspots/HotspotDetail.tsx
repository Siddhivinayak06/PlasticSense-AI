'use client';

import { Hotspot } from '@/types/hotspot';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, AlertTriangle, Droplets, ArrowLeft, Activity, 
  TrendingUp, TrendingDown, Minus, Info, ShieldAlert, FileText,
  ClipboardList, Navigation
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CreateAssignmentDialog } from '@/features/assignments/CreateAssignmentDialog';

interface HotspotDetailProps {
  hotspot: Hotspot;
}

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'increasing') return <TrendingUp className="size-4 text-destructive" />;
  if (trend === 'decreasing') return <TrendingDown className="size-4 text-emerald-500" />;
  return <Minus className="size-4 text-amber-500" />;
};

export const HotspotDetail = ({ hotspot }: HotspotDetailProps) => {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Link href="/hotspots">
            <Button variant="outline" size="icon" className="size-8 rounded-full">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">{hotspot.name}</h1>
              <SeverityBadge severity={hotspot.priority} />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded-md">{hotspot.id}</span>
              <span className="hidden sm:inline">•</span>
              <div className="flex items-center text-xs">
                <MapPin className="size-3 mr-1" />
                {hotspot.location.city}, {hotspot.location.address}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          {hotspot.status !== 'resolved' && hotspot.status !== 'verified' && (
            <div className="flex-1 sm:flex-none">
              <CreateAssignmentDialog 
                hotspotId={hotspot.id} 
                trigger={
                  <Button className="w-full gap-2">
                    <ClipboardList className="size-4" />
                    Assign Team
                  </Button>
                }
              />
            </div>
          )}
          <Button variant="outline" className="flex-1 sm:flex-none gap-2">
            <FileText className="size-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content (Left col) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5 border-l-4 border-l-destructive bg-destructive/5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-destructive uppercase tracking-wider">Severity Score</p>
                  <p className="text-3xl font-bold">{hotspot.severityScore}<span className="text-lg text-muted-foreground font-normal">/100</span></p>
                </div>
                <div className="p-2 bg-destructive/10 rounded-xl">
                  <Activity className="size-5 text-destructive" />
                </div>
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 border-l-4 border-l-blue-500 bg-blue-500/5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Reports</p>
                  <p className="text-3xl font-bold">{hotspot.reportCount}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <FileText className="size-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5 border-l-4 border-l-amber-500 bg-amber-500/5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Critical Reports</p>
                  <p className="text-3xl font-bold">{hotspot.criticalReports}</p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="size-5 text-primary" />
                Pollution Map Area
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Estimated physical boundaries of the reported waste.</p>
            </div>
            
            {/* Mock Map Area */}
            <div className="w-full h-[400px] bg-secondary/50 rounded-xl overflow-hidden relative group border border-border">
              {/* Note: the placeholder map image URL is used from standard nextjs assets if available, or just a gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 opacity-80" />
              
              {/* Radar pulse effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="size-24 bg-red-500/20 rounded-full animate-ping absolute" />
                <div className="size-32 bg-red-500/10 rounded-full animate-ping absolute" style={{ animationDelay: '500ms' }} />
                <div className="size-8 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 relative z-10 shadow-lg flex items-center justify-center">
                  <MapPin className="size-4 text-white" />
                </div>
              </div>
              
              <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md p-3 rounded-xl border border-border/50 text-sm flex justify-between items-center shadow-lg">
                <div className="font-mono text-xs text-muted-foreground flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5"><span className="text-foreground font-medium">Lat:</span> {hotspot.location.lat.toFixed(6)}</span>
                  <span className="flex items-center gap-1.5"><span className="text-foreground font-medium">Lng:</span> {hotspot.location.lng.toFixed(6)}</span>
                </div>
                <Button variant="secondary" size="sm" className="gap-2 text-xs">
                  <Navigation className="size-3.5" />
                  View on Full Map
                </Button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar (Right col) */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Hotspot Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-2">Current Status</h4>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={hotspot.status} size="md" />
                  </div>
                  {hotspot.assignedTeam && (
                    <div className="text-sm bg-muted/40 p-2.5 rounded-lg border border-border/50">
                      Assigned to: <span className="font-semibold text-foreground">{hotspot.assignedTeam}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-2">Cleanup Progress</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted/60 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${hotspot.cleanupProgress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                      style={{ width: `${hotspot.cleanupProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-10 text-right">{hotspot.cleanupProgress}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Risk Level</h4>
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="size-4 text-orange-500" />
                    <span className="capitalize font-semibold text-sm">{hotspot.riskLevel}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Trend</h4>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={hotspot.trend} />
                    <span className="capitalize font-semibold text-sm">{hotspot.trend}</span>
                  </div>
                </div>
              </div>

              {hotspot.nearbyWaterBody && (
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Nearby Water Body</h4>
                  <div className="flex items-center gap-2">
                    <Droplets className="size-4 text-blue-500" />
                    <span className="font-semibold text-sm">{hotspot.nearbyWaterBody}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border/50">
                <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-2">Detected Plastics</h4>
                <div className="flex flex-wrap gap-1.5">
                  {hotspot.plasticTypes.map((type, i) => (
                    <Badge key={i} variant="secondary" className="font-medium bg-muted/50 border-border/50">
                      {type}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 bg-muted/30 p-2.5 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Most common: <span className="font-semibold text-foreground">{hotspot.mostCommonPlastic}</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Info className="size-5 text-primary" />
              NGO Recommendations
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Recommended Action</h4>
                <p className="text-sm bg-primary/5 text-foreground p-3 rounded-xl border border-primary/20">
                  {hotspot.recommendedAction}
                </p>
              </div>
              {hotspot.notes && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Field Notes</h4>
                  <p className="text-sm bg-muted/40 text-muted-foreground p-3 rounded-xl border border-border/50 italic">
                    "{hotspot.notes}"
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
