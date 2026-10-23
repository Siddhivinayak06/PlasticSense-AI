'use client';

import { motion } from 'framer-motion';
import { WelcomeCard } from '@/features/dashboard/WelcomeCard';
import { StatsGrid } from '@/features/dashboard/StatsGrid';
import { UrgentActions } from '@/features/dashboard/UrgentActions';
import { DashboardMap } from '@/features/dashboard/DashboardMap';
import { RecentReportsTable } from '@/features/dashboard/RecentReportsTable';
import { ActivityTimeline } from '@/features/dashboard/ActivityTimeline';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { DashboardCharts } from '@/features/dashboard/DashboardCharts';
import { DashboardTrends } from '@/features/dashboard/DashboardTrends';
import { containerVariants } from '@/lib/motion';

export default function DashboardPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8 max-w-[1600px] mx-auto pb-8"
    >
      {/* Welcome Header */}
      <section aria-label="System Overview">
        <WelcomeCard />
      </section>

      {/* KPI Statistics Grid */}
      <section aria-label="Key Performance Indicators">
        <StatsGrid />
      </section>

      {/* Urgent Action Required */}
      <section aria-label="High Priority Hotspots">
        <UrgentActions />
      </section>

      {/* Trends & Material Composition (2-column layout) */}
      <section aria-label="Analytical Trends and Material Breakdown" className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="min-w-0">
          <DashboardTrends />
        </div>
        <div className="min-w-0">
          <DashboardCharts />
        </div>
      </section>

      {/* Live Geospatial Pollution Map */}
      <section aria-label="Geospatial Pollution Mapping">
        <DashboardMap />
      </section>

      {/* Recent Reports + Activity Feed */}
      <section aria-label="Field Surveys and Activity Stream" className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 min-w-0">
          <RecentReportsTable />
        </div>
        <div className="min-w-0">
          <ActivityTimeline />
        </div>
      </section>

      {/* Quick Action Operations */}
      <section aria-label="Quick Action Triggers">
        <QuickActions />
      </section>
    </motion.div>
  );
}