'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2, Clock, Users, Activity, ArrowRight, Timer, Search } from 'lucide-react';
import type { AssignmentStatus, CleanupAssignment } from '@/types/assignment';
import { CleanupTable } from './CleanupTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CleanupDashboardProps {
  assignments: CleanupAssignment[];
}

const STATUS_FILTERS: { value: '' | AssignmentStatus; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed (awaiting verification)' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Verification failed' },
];

export const CleanupDashboard = ({ assignments }: CleanupDashboardProps) => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'' | AssignmentStatus>('');

  const total = assignments.length;
  const done = assignments.filter((a) => a.status === 'completed' || a.status === 'verified').length;
  const inProgress = assignments.filter((a) => a.status === 'in-progress').length;
  const pending = assignments.filter((a) => a.status === 'pending' || a.status === 'assigned').length;
  const activeNgos = new Set(
    assignments.filter((a) => ['assigned', 'in-progress'].includes(a.status) && a.ngoTeamId).map((a) => a.ngoTeamId),
  ).size;

  // Mean days from creation to completion, over assignments that actually completed.
  const finished = assignments.filter((a) => a.completedDate);
  const avgDays = finished.length
    ? finished.reduce((s, a) => s + (new Date(a.completedDate!).getTime() - new Date(a.createdAt).getTime()), 0) /
      finished.length / 86_400_000
    : null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assignments.filter(
      (a) =>
        (!status || a.status === status) &&
        (!q || [a.title, a.id, a.locationName, a.ngoTeamName ?? ''].some((v) => v.toLowerCase().includes(q))),
    );
  }, [assignments, query, status]);

  const kpis = [
    { title: 'Total Cleanups', value: total, icon: ClipboardList, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Completed', value: done, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'In Progress', value: inProgress, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { title: 'Pending', value: pending, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.08 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">{kpi.title}</p>
                <p className="text-3xl font-bold">{kpi.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`size-5 ${kpi.color}`} aria-hidden="true" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="md:col-span-2 glass rounded-2xl p-5 flex flex-col">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Activity className="size-5 text-primary" aria-hidden="true" />
            Recent Assignments
          </h2>
          <div className="flex-1 overflow-x-auto">
            <CleanupTable assignments={assignments.slice(0, 5)} compact emptyMessage="No assignments yet. Create one from a hotspot or with the button above." />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5 flex flex-col gap-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="size-5 text-primary" aria-hidden="true" />
            Resources
          </h2>
          <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 border border-indigo-500/20">
              <Users className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-0.5">NGOs on active jobs</p>
              <p className="text-2xl font-bold text-foreground leading-none">{activeNgos}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-500 border border-violet-500/20">
              <Timer className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-0.5">Avg time to complete</p>
              <p className="text-2xl font-bold text-foreground leading-none">
                {avgDays === null ? '—' : avgDays.toFixed(1)}
                {avgDays !== null && <span className="text-xs font-medium text-muted-foreground ml-1">days</span>}
              </p>
              {avgDays === null && <p className="text-[11px] text-muted-foreground mt-1">No completed cleanups yet</p>}
            </div>
          </div>
          <div className="mt-auto pt-2">
            <Link href="/ngo-teams">
              <Button variant="outline" className="w-full text-xs gap-2">
                Manage NGO Teams <ArrowRight className="size-3.5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" aria-hidden="true" />
            All Assignments
            <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                aria-label="Search assignments"
                placeholder="Search title, ID, team…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 h-9 sm:w-64 bg-background/50"
              />
            </div>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-9 rounded-md border border-input bg-background/50 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {STATUS_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <CleanupTable assignments={filtered} emptyMessage={total ? 'No assignments match these filters.' : 'No cleanup assignments yet.'} />
        </div>
      </motion.div>
    </div>
  );
};
