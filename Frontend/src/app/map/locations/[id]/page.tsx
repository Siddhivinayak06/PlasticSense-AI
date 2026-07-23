'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, Info, AlertTriangle, Users, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { mockMapReports } from '@/mock/map';
import { severityConfig, statusConfig, priorityConfig } from '@/constants/reports';
import { ReportStatusTimeline } from '@/features/reports/ReportStatusTimeline';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const StaticMiniMap = dynamic(() => import('@/features/map/StaticMiniMap'), { ssr: false, loading: () => <div className="h-full w-full bg-slate-900/50 animate-pulse" /> });

export default function ReportLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  // Find report in either map mock or regular reports mock (try map first)
  const report = mockMapReports.find((r) => r.id === id);

  if (!report) {
    return (
      <div className="max-w-[1600px] mx-auto pt-10">
        <EmptyState title="Location Not Found" description={`We couldn't find a map report with ID ${id}.`} />
        <div className="flex justify-center mt-4">
           <Link href="/map"><Button variant="outline">Return to Map</Button></Link>
        </div>
      </div>
    );
  }

  // Find nearby reports in map data (rough distance calc)
  const nearbyReports = mockMapReports.filter(r => r.id !== report.id && r.city === report.city).slice(0, 3);

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/map">
            <Button variant="ghost" size="icon" className="shrink-0"><ArrowLeft className="size-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-foreground">Location Details: {report.id}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{report.address}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" className="gap-1.5"><Navigation className="size-3.5" /> Navigate</Button>
           <Button variant="default" size="sm" className="gap-1.5"><AlertTriangle className="size-3.5" /> Escalate</Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Map & Imagery */}
        <div className="xl:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="relative h-80 rounded-2xl overflow-hidden glass p-1 shadow-md">
             <div className="absolute inset-1 rounded-xl overflow-hidden">
                <StaticMiniMap lat={report.lat} lng={report.lng} severity={report.severity} />
             </div>
             <div className="absolute top-4 left-4 glass px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2">
                <MapPin className="size-4 text-red-500" />
                <span className="text-xs font-mono font-bold text-foreground">{report.lat.toFixed(6)}, {report.lng.toFixed(6)}</span>
             </div>
          </motion.div>

          {/* Details Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 flex flex-col items-center justify-center bg-muted/20">
                <img src={report.imageUrl} alt={report.plasticTypeLabel} className="h-40 w-auto object-contain drop-shadow-xl mb-4" />
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold border', severityConfig[report.severity].bg, severityConfig[report.severity].color)}>
                  {severityConfig[report.severity].label} Severity
                </span>
             </motion.div>
             <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Info className="size-4 text-muted-foreground" /> Detection Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Plastic Type</span>
                    <span className="font-semibold text-foreground">{report.plasticTypeLabel}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">AI Confidence</span>
                    <span className="font-semibold text-primary">{report.confidence}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Detected Objects</span>
                    <span className="font-semibold text-foreground">{report.detectedObjects}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">Cleanup Priority</span>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', priorityConfig[report.cleanupPriority].bg, priorityConfig[report.cleanupPriority].color)}>
                      {priorityConfig[report.cleanupPriority].label}
                    </span>
                  </div>
                </div>
             </motion.div>
          </div>
        </div>

        {/* Right Column - Status & Nearby */}
        <div className="space-y-6">
           <ReportStatusTimeline report={report} />
           
           <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
             <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><Target className="size-4 text-muted-foreground" /> Nearby Reports</h3>
             <div className="space-y-3">
               {nearbyReports.map(r => (
                 <Link key={r.id} href={`/map/locations/${r.id}`}>
                   <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border/50">
                     <div className="size-10 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                       <img src={r.imageUrl} className="size-6 object-contain opacity-70" />
                     </div>
                     <div className="flex-1 min-w-0">
                       <p className="text-xs font-bold text-foreground truncate">{r.plasticTypeLabel}</p>
                       <p className="text-[10px] text-muted-foreground truncate">{r.address}</p>
                     </div>
                     <span className={cn('size-2.5 rounded-full shrink-0', r.severity === 'critical' ? 'bg-red-500' : r.severity === 'high' ? 'bg-orange-500' : 'bg-amber-400')} />
                   </div>
                 </Link>
               ))}
             </div>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
