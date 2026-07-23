'use client';

import { CleanupAssignment } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, CheckCircle2, Clock, Users, Activity, Loader2 } from 'lucide-react';
import { CleanupTable } from './CleanupTable';
import { motion } from 'framer-motion';

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-3xl font-bold">{kpi.value}</p>
                  </div>
                  <div className={`p-2 rounded-full ${kpi.bg}`}>
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <CleanupTable assignments={assignments.slice(0, 5)} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-500">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active NGOs</p>
                  <p className="text-2xl font-bold">{activeNgos}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-full text-violet-500">
                  <Loader2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Avg Completion Time</p>
                  <p className="text-2xl font-bold">4.2 <span className="text-sm font-normal text-muted-foreground">days</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <CleanupTable assignments={assignments} />
        </CardContent>
      </Card>
    </div>
  );
};
