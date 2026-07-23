'use client';

import { WelcomeCard } from '@/features/dashboard/WelcomeCard';
import { StatsGrid } from '@/features/dashboard/StatsGrid';
import { RecentReportsTable } from '@/features/dashboard/RecentReportsTable';
import { ActivityTimeline } from '@/features/dashboard/ActivityTimeline';
import { QuickActions } from '@/features/dashboard/QuickActions';

export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Welcome Hero */}
      <WelcomeCard />

      {/* Statistics Grid */}
      <StatsGrid />

      {/* Reports Table + Activity Timeline */}
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