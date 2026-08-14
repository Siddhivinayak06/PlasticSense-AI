'use client';

import { CleanupAssignment } from '@/types/assignment';
import { ClipboardList, CheckCircle2, Clock, Users, Activity, Loader2, ArrowRight } from 'lucide-react';
import { CleanupTable } from './CleanupTable';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface CleanupDashboardProps {
  assignments: CleanupAssignment[];
}

export const CleanupDashboard = ({ assignments }: CleanupDashboardProps) => {
  const total = assignments.length;
  const completed = assignments.filter(a => ['completed', 'verified', 'closed'].includes(a.status)).length;
  const pending = assignments.filter(a => ['pending', 'assigned'].includes(a.status)).length;
  const inProgress = assignments.filter(a => a.status === 'in-progress').length;
  
  const activeNgos = new Set(assignments.filter(a => a.status === 'in-progress' || a.status === 'assigned').map(a => a.assignedNgo)).size;

  const kpis = [
    {
      title: 'Total Cleanups',
      value: total,
      icon: ClipboardList,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: Activity,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'Pending',
      value: pending,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">{kpi.title}</p>
                <p className="text-3xl font-bold">{kpi.value}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`size-5 ${kpi.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="md:col-span-2 glass rounded-2xl p-5 flex flex-col"
        >
          <div className="flex flex-row items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Recent Assignments
            </h2>
            <Link href="/assignments">
              <Button variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1">
                View All <ArrowRight className="size-3" />
              </Button>
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto">
            <CleanupTable assignments={assignments.slice(0, 5)} compact />
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-5 flex flex-col gap-6"
        >
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Active Resources
          </h2>
          
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-500 shadow-sm border border-indigo-500/20">
                <Users className="size-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-0.5">Active NGOs</p>
                <p className="text-2xl font-bold text-foreground leading-none">{activeNgos}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-violet-500/10 rounded-xl text-violet-500 shadow-sm border border-violet-500/20">
                <Loader2 className="size-5 animate-spin-slow" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-0.5">Avg Completion</p>
                <p className="text-2xl font-bold text-foreground leading-none">4.2 <span className="text-xs font-medium text-muted-foreground ml-0.5">days</span></p>
              </div>
            </div>
          </div>
          
          <div className="mt-auto pt-2">
            <Link href="/ngo-teams">
              <Button variant="outline" className="w-full text-xs gap-2">
                Manage NGO Teams <ArrowRight className="size-3.5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex flex-row items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            All Assignments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <CleanupTable assignments={assignments} />
        </div>
      </motion.div>
    </div>
  );
};
