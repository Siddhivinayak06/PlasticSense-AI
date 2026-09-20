'use client';

import { Popup } from 'react-leaflet';
import Link from 'next/link';
import { Target, Calendar, MapPin, Users, Layers, ShieldAlert, Percent, Eye } from 'lucide-react';
import type { Report } from '@/types/report';
import { severityConfig, statusConfig } from '@/constants/reports';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MapMarkerPopupProps {
  report: Report;
}

export function MapMarkerPopup({ report }: MapMarkerPopupProps) {
  const sevConfig = severityConfig[report.severity] || severityConfig.medium;
  const statConfig = statusConfig[report.status] || statusConfig.pending;

  return (
    <Popup className="custom-popup" minWidth={290} maxWidth={330}>
      <div className="flex flex-col gap-3 p-1">
        {/* Header Image & Badges */}
        <div className="relative h-32 bg-muted/30 rounded-xl overflow-hidden flex items-center justify-center border border-border/40">
          <img
            src={report.imageUrl}
            alt={report.plasticTypeLabel}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
             <span className={cn(
               'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border shadow-sm backdrop-blur-md',
               sevConfig.bg, sevConfig.color,
             )}>
               {sevConfig.label}
             </span>
             {report.wasteCoverage != null && (
               <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border bg-background/85 text-foreground backdrop-blur-md">
                 <Percent className="size-2.5" />
                 {Number(report.wasteCoverage).toFixed(1)}% Area
               </span>
             )}
          </div>
          <div className="absolute bottom-2 right-2">
            <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border bg-background/85 text-foreground backdrop-blur-md">
              {report.detectedObjects} Objects
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
           <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary truncate max-w-[140px]">
                #{report.id.slice(0, 8)}
              </span>
              {report.riskScore != null && (
                <div className="flex items-center gap-1 text-[11px] font-bold text-foreground">
                  <ShieldAlert className="size-3 text-orange-500" />
                  Score: {report.riskScore}/100
                </div>
              )}
           </div>

           <p className="text-xs font-semibold text-foreground leading-snug">
             {report.plasticTypeLabel}
           </p>

           <div className="space-y-1.5 pt-1 text-[11px] text-muted-foreground border-t border-border/40">
             <div className="flex items-center justify-between">
               <span className="flex items-center gap-1">
                 <MapPin className="size-3 shrink-0" />
                 Coordinates:
               </span>
               <span className="font-mono font-medium text-foreground">
                 {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
               </span>
             </div>

             <div className="flex items-center justify-between">
               <span className="flex items-center gap-1">
                 <Layers className="size-3 shrink-0" />
                 GPS Source:
               </span>
               <span className="font-medium text-foreground">
                 {report.locationSource === 'image_exif' ? 'EXIF Camera GPS' :
                  report.locationSource === 'image_overlay_ocr' ? 'OCR Text Overlay' :
                  report.locationSource === 'user_provided' ? 'Manual GPS' : 'Detected'}
               </span>
             </div>

             <div className="flex items-center justify-between">
               <span className="flex items-center gap-1">
                 <Calendar className="size-3 shrink-0" />
                 Recorded:
               </span>
               <span>
                 {new Date(report.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
               </span>
             </div>
           </div>
        </div>

        <Link href={`/history/${report.id}`} className="mt-1 block">
          <Button variant="default" size="sm" className="w-full text-xs h-8 gap-1.5 font-medium">
            <Eye className="size-3.5" />
            View Full Report Details
          </Button>
        </Link>
      </div>
    </Popup>
  );
}
