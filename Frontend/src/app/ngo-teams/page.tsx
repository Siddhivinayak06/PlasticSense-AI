'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Users, ClipboardList, CheckCircle, Clock, Award, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { mockNGOs, type NGO } from '@/mock/ngos';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const WORKLOAD_CONFIG = {
  light: { label: 'Light', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  moderate: { label: 'Moderate', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  heavy: { label: 'Heavy', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  overloaded: { label: 'Overloaded', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
};

const AVAILABILITY_CONFIG = {
  available: { label: 'Available', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
  busy: { label: 'Busy', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-200 dark:border-amber-800' },
  unavailable: { label: 'Unavailable', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10 border-red-200 dark:border-red-800' },
};

function NGOCard({ ngo, index }: { ngo: NGO; index: number }) {
  const avail = AVAILABILITY_CONFIG[ngo.availability];
  const workload = WORKLOAD_CONFIG[ngo.currentWorkload];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="glass rounded-2xl p-5 space-y-4 hover:shadow-lg transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{ngo.name}</h3>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
            <MapPin className="size-3 shrink-0" />
            <span>{ngo.city}, {ngo.state}</span>
          </div>
        </div>
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', avail.bg, avail.color)}>
          {avail.label}
        </span>
      </div>

      {/* Performance Score */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Award className="size-4 text-primary" />
          <span className="text-lg font-bold text-primary">{ngo.performanceScore}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
        <div className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', workload.bg, workload.color)}>
          {workload.label} Load
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Users className="size-3.5 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Team Size</span>
            <p className="font-semibold text-foreground">{ngo.teamSize}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ClipboardList className="size-3.5 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Active</span>
            <p className="font-semibold text-foreground">{ngo.activeAssignments}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="size-3.5 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Completed</span>
            <p className="font-semibold text-foreground">{ngo.completedCleanups}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 text-muted-foreground" />
          <div>
            <span className="text-muted-foreground">Avg. Time</span>
            <p className="font-semibold text-foreground">{ngo.avgCompletionDays} days</p>
          </div>
        </div>
      </div>

      {/* Specializations */}
      <div className="flex flex-wrap gap-1">
        {ngo.specializations.slice(0, 3).map((spec) => (
          <span key={spec} className="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {spec}
          </span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="xs" className="flex-1 text-xs">
          View NGO
        </Button>
        <Link href="/assignments" className="flex-1">
          <Button variant="default" size="xs" className="w-full text-xs">
            Assign Cleanup
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function NGOTeamsPage() {
  const [search, setSearch] = useState('');

  const filteredNGOs = mockNGOs.filter((ngo) =>
    ngo.name.toLowerCase().includes(search.toLowerCase()) ||
    ngo.city.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="size-7 text-violet-500" />
            NGO Teams
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage NGO partners, monitor workload, and assign cleanup operations.
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search NGOs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[240px] rounded-xl border border-border/60 bg-muted/40 pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            aria-label="Search NGOs"
          />
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{mockNGOs.length}</p>
          <p className="text-xs text-muted-foreground">Total NGOs</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{mockNGOs.filter(n => n.availability === 'available').length}</p>
          <p className="text-xs text-muted-foreground">Available</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{mockNGOs.reduce((a, n) => a + n.activeAssignments, 0)}</p>
          <p className="text-xs text-muted-foreground">Active Assignments</p>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{mockNGOs.reduce((a, n) => a + n.completedCleanups, 0)}</p>
          <p className="text-xs text-muted-foreground">Total Cleanups</p>
        </div>
      </div>

      {/* NGO Grid */}
      {filteredNGOs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredNGOs.map((ngo, index) => (
            <NGOCard key={ngo.id} ngo={ngo} index={index} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title="No NGOs found"
          description="No NGO teams match your search. Try a different search term."
        />
      )}
    </div>
  );
}
