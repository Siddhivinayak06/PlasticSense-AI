'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Map, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SkeletonMap } from '@/components/shared/LoadingSkeleton';

const DashboardMapView = dynamic(
  () => import('./DashboardMapView').then((mod) => mod.DashboardMapView),
  {
    ssr: false,
    loading: () => <SkeletonMap className="h-[380px]" />,
  },
);

export function DashboardMap() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Map className="size-4 text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Live Pollution Overview</h2>
            <p className="text-xs text-muted-foreground">Real-time pollution hotspot and report locations</p>
          </div>
        </div>
        <Link href="/map">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
            Full map
            <ChevronRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      <div className="h-[380px]">
        <DashboardMapView />
      </div>
    </motion.div>
  );
}
