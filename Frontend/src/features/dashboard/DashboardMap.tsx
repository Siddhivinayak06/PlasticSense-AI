'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Map, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SkeletonMap } from '@/components/shared/LoadingSkeleton';
import { cardEntrance } from '@/lib/motion';

const DashboardMapView = dynamic(
  () => import('./DashboardMapView').then((mod) => mod.DashboardMapView),
  {
    ssr: false,
    loading: () => <SkeletonMap className="h-[400px]" />,
  }
);

export function DashboardMap() {
  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      className="glass rounded-3xl overflow-hidden border border-slate-200/70 dark:border-slate-800/70 shadow-sm"
    >
      <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Map className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Live Pollution Overview</h2>
            <p className="text-xs text-muted-foreground">Real-time geo-located plastic hotspots and verified survey sites</p>
          </div>
        </div>
        <Link href="/map">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground group">
            <span>Full map</span>
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>

      <div className="h-[400px]">
        <DashboardMapView />
      </div>
    </motion.div>
  );
}
