'use client';

import { Popup } from 'react-leaflet';
import Link from 'next/link';
import { Target, Calendar, MapPin, Users } from 'lucide-react';
import type { Report } from '@/types/report';
import { severityConfig, statusConfig } from '@/constants/reports';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MapMarkerPopupProps {
  report: Report;
}

export function MapMarkerPopup({ report }: MapMarkerPopupProps) {
  return (
    <Popup className="custom-popup" minWidth={280} maxWidth={320}>
      <div className="flex flex-col gap-3">
        {/* Header Image & Badges */}
        <div className="relative h-28 bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center border border-border/30">
          <img src={report.imageUrl} alt={report.plasticTypeLabel} className="max-h-full max-w-full object-contain p-2" />
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
             <span className={cn(
               'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border shadow-sm backdrop-blur-md',
               severityConfig[report.severity].bg, severityConfig[report.severity].color,
             )}>
               {severityConfig[report.severity].label}
             </span>
             <span className={cn(
               'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border shadow-sm backdrop-blur-md',
               statusConfig[report.status].bg, statusConfig[report.status].color,
             )}>
               {statusConfig[report.status].label}
             </span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
           <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-primary">{report.id}</span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                <Target className="size-3" />
                {report.confidence}% Conf.
              </div>
           </div>
           
           <p className="text-sm font-bold text-foreground leading-tight">{report.plasticTypeLabel}</p>
           
           <div className="space-y-1 mt-1">
             <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
               <MapPin className="size-3 shrink-0" />
               <span className="truncate">{report.lat.toFixed(4)}, {report.lng.toFixed(4)}</span>
             </div>
             <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
               <Calendar className="size-3 shrink-0" />
               <span>{new Date(report.reportedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
             </div>
             <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
               <Users className="size-3 shrink-0" />
               <span className="truncate">{report.assignedTeam}</span>
             </div>
           </div>
        </div>

        <Link href={`/map/locations/${report.id}`} className="mt-1 block">
          <Button variant="default" size="sm" className="w-full text-xs h-8">
            View Location Details
          </Button>
        </Link>
      </div>
    </Popup>
  );
}
