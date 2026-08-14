'use client';

import { WelcomeCard } from '@/features/dashboard/WelcomeCard';
import { StatsGrid } from '@/features/dashboard/StatsGrid';
import { UrgentActions } from '@/features/dashboard/UrgentActions';
import { DashboardMap } from '@/features/dashboard/DashboardMap';
import { RecentReportsTable } from '@/features/dashboard/RecentReportsTable';
import { ActivityTimeline } from '@/features/dashboard/ActivityTimeline';
import { QuickActions } from '@/features/dashboard/QuickActions';
import { DashboardCharts } from '@/features/dashboard/DashboardCharts';
import { DashboardTrends } from '@/features/dashboard/DashboardTrends';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Welcome Header */}
      <WelcomeCard />

      {/* KPI Statistics Grid */}
      <StatsGrid />

      {/* Urgent Action Required */}
      <UrgentActions />

      {/* Trends & Composition (2-column layout) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <DashboardTrends />
        </div>
        <div>
          <DashboardCharts />
        </div>
      </div>

      {/* Live Pollution Map */}
      <div>
        <DashboardMap />
      </div>

      {/* Recent Reports + Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentReportsTable />
        </div>
        <div>
          <ActivityTimeline />
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}