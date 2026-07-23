'use client';

import { motion } from 'framer-motion';
import { MapPin, Navigation, Droplets, Recycle, Users, Calendar, Target, Box, AlertTriangle, Gauge } from 'lucide-react';
import { severityConfig, priorityConfig } from '@/constants/reports';
import type { Report } from '@/types/report';
import { cn } from '@/lib/utils';

interface ReportDetailInfoProps {
  report: Report;
}

function InfoItem({ icon: Icon, label, value, iconColor }: { icon: typeof MapPin; label: string; value: string; iconColor?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
        <Icon className={cn('size-4', iconColor || 'text-muted-foreground')} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export function ReportDetailInfo({ report }: ReportDetailInfoProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Basic Information */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem icon={Box} label="Plastic Type" value={report.plasticTypeLabel} iconColor="text-cyan-500" />
          <InfoItem
            icon={AlertTriangle}
            label="Severity"
            value={severityConfig[report.severity].label}
            iconColor={severityConfig[report.severity].color.split(' ')[0]}
          />
          <InfoItem
            icon={Gauge}
            label="Priority"
            value={priorityConfig[report.cleanupPriority].label}
            iconColor={priorityConfig[report.cleanupPriority].color.split(' ')[0]}
          />
          <InfoItem icon={Calendar} label="Reported Date" value={new Date(report.reportedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })} iconColor="text-blue-500" />
        </div>
        <div className="mt-4 pt-4 border-t border-border/30">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1">Description</p>
          <p className="text-sm text-foreground/80 leading-relaxed">{report.description}</p>
        </div>
      </motion.div>

      {/* AI Detection */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">AI Detection Results</h3>
        <div className="space-y-4">
          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">Confidence Score</span>
              <span className="text-sm font-bold text-foreground">{report.confidence}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${report.confidence}%` }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className={cn(
                  'h-full rounded-full',
                  report.confidence >= 90 ? 'bg-emerald-500' :
                  report.confidence >= 75 ? 'bg-blue-500' :
                  report.confidence >= 60 ? 'bg-amber-500' : 'bg-red-500',
                )}
              />
            </div>
          </div>

          <InfoItem icon={Target} label="Detected Objects" value={`${report.detectedObjects} objects identified`} iconColor="text-violet-500" />

          {/* Bounding Box Preview */}
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2">Bounding Box Preview</p>
            <div className="relative h-32 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-4 border-2 border-dashed border-primary/40 rounded-lg" />
              <div className="absolute top-6 left-6 w-16 h-12 border-2 border-red-400/60 rounded" />
              <div className="absolute bottom-8 right-8 w-12 h-10 border-2 border-amber-400/60 rounded" />
              <span className="text-[10px] text-muted-foreground/50 z-10">Detection Preview</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Location */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Location Details</h3>
        <div className="space-y-4">
          <InfoItem icon={MapPin} label="Address" value={`${report.address}, ${report.city}`} iconColor="text-red-500" />
          <InfoItem icon={Navigation} label="GPS Coordinates" value={`${report.lat}°N, ${report.lng}°E`} iconColor="text-blue-500" />
          <InfoItem icon={Droplets} label="Nearby Water Body" value={report.nearbyWaterBody} iconColor="text-cyan-500" />
        </div>
      </motion.div>

      {/* Cleanup Information */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="glass rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-4">Cleanup Information</h3>
        <div className="space-y-4">
          <InfoItem icon={Users} label="Assigned Team" value={report.assignedTeam} iconColor="text-violet-500" />
          <InfoItem icon={Recycle} label="Disposal Method" value={report.disposalMethod} iconColor="text-emerald-500" />
        </div>
      </motion.div>
    </div>
  );
}
