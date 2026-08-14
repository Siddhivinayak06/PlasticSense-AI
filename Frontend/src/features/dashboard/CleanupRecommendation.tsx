'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, Truck, Sparkles, Clock, MapPin, ExternalLink, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RiskAssessment } from '@/types/detection';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CleanupRecommendationProps {
  risk: RiskAssessment;
  wasteCount: number;
}

const SEVERITY_CONFIG = {
  low: { 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    title: 'Routine Maintenance',
    team: 'Small Volunteer Group (2-3)',
    time: '1-2 hours',
    equipment: 'Trash bags, gloves, pickers',
    urgency: 'Within 2-4 weeks'
  },
  medium: { 
    color: 'text-amber-500', 
    bg: 'bg-amber-500/10 border-amber-500/30',
    title: 'Standard Cleanup',
    team: 'Standard Team (4-8)',
    time: '3-4 hours',
    equipment: 'Trash bags, gloves, pickers, 1 small collection vehicle',
    urgency: 'Within 1-2 weeks'
  },
  high: { 
    color: 'text-orange-500', 
    bg: 'bg-orange-500/10 border-orange-500/30',
    title: 'Priority Operation',
    team: 'Large Cleanup Team (10-15)',
    time: '5-8 hours',
    equipment: 'Heavy duty bags, shovels, 2 collection vehicles, safety gear',
    urgency: 'Within 3-5 days'
  },
  critical: { 
    color: 'text-red-500', 
    bg: 'bg-red-500/10 border-red-500/30',
    title: 'Emergency Response',
    team: 'Professional NGO Team + Volunteers (20+)',
    time: 'Multiple days',
    equipment: 'Machinery/JCB (if accessible), multiple large trucks, specialized safety equipment',
    urgency: 'Immediate action (24-48 hours)'
  },
};

export function CleanupRecommendation({ risk, wasteCount }: CleanupRecommendationProps) {
  const config = SEVERITY_CONFIG[risk.level];
  if (!config) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn('glass rounded-2xl overflow-hidden border', config.bg)}
    >
      <div className="flex items-center justify-between p-4 border-b border-background/20 bg-background/20">
        <div className="flex items-center gap-2">
          <Sparkles className={cn('size-4.5', config.color)} />
          <h3 className="text-sm font-semibold text-foreground">AI Recommended Action</h3>
        </div>
        <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border', config.bg, config.color)}>
          {risk.level} Priority
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Why this recommendation */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Assessment</p>
          <p className="text-sm font-medium text-foreground">
            {config.title}: <span className="font-normal text-muted-foreground">
              Based on the detection of {wasteCount} waste objects and a severity score of {risk.score.toFixed(1)}/100.
            </span>
          </p>
        </div>

        {/* Resources grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex gap-2.5 rounded-xl bg-background/40 p-3">
            <Users className={cn('size-4 shrink-0', config.color)} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Recommended Team</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{config.team}</p>
            </div>
          </div>
          
          <div className="flex gap-2.5 rounded-xl bg-background/40 p-3">
            <Clock className={cn('size-4 shrink-0', config.color)} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Estimated Time</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{config.time}</p>
            </div>
          </div>
          
          <div className="flex gap-2.5 rounded-xl bg-background/40 p-3">
            <Layers className={cn('size-4 shrink-0', config.color)} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Estimated Density</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">
                {wasteCount > 50 ? 'Severe' : wasteCount > 20 ? 'High' : wasteCount > 10 ? 'Medium' : 'Low'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2.5 rounded-xl bg-background/40 p-3 sm:col-span-2">
            <Truck className={cn('size-4 shrink-0', config.color)} />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Suggested Resources</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{config.equipment}</p>
            </div>
          </div>
        </div>

        {/* Urgency and CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
            <ShieldAlert className={cn('size-4', config.color)} />
            <span>Target Response:</span>
            <span className={cn('font-bold', config.color)}>{config.urgency}</span>
          </div>
          
          <Link href="/assignments" className="w-full sm:w-auto">
            <Button size="default" className={cn('w-full font-semibold shadow-md gap-2', risk.level === 'critical' ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-primary hover:bg-primary/90 text-primary-foreground')}>
              <Users className="size-4" />
              Create Cleanup Assignment
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
