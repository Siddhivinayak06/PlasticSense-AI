'use client';

import { CleanupAssignment } from '@/types/assignment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, CalendarDays, Download, MapPin, Users, Phone, Mail, Activity, CheckCircle, FileText, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProgressTracker } from './ProgressTracker';
import { TaskChecklist } from './TaskChecklist';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';

interface CleanupDetailProps {
  assignment: CleanupAssignment;
}

export const CleanupDetail = ({ assignment }: CleanupDetailProps) => {
  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Link href="/assignments">
            <Button variant="outline" size="icon" className="size-8 rounded-full">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold font-mono text-primary">{assignment.id}</h1>
              <StatusBadge status={assignment.status} />
              <SeverityBadge severity={assignment.priority} />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-medium uppercase tracking-wider text-foreground">Target Hotspot:</span>
              <div className="flex items-center text-xs bg-muted/40 px-2.5 py-1 rounded-md">
                <MapPin className="size-3 mr-1" />
                <span>{assignment.hotspotName}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none gap-2">
            <Download className="size-4" />
            Export PDF
          </Button>
          {assignment.status !== 'closed' && (
            <Button className="flex-1 sm:flex-none gap-2">
              <CheckCircle className="size-4" />
              Update Status
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5 border-l-4 border-l-blue-500 bg-blue-500/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <CalendarDays className="size-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Scheduled Date</p>
                  <p className="text-lg font-bold text-foreground">
                    {new Date(assignment.scheduledDate).toLocaleDateString(undefined, {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-blue-500/10">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <Clock className="size-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Est. Duration</p>
                  <p className="text-lg font-bold text-foreground">{assignment.estimatedDurationHours} hours</p>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-5 border-l-4 border-l-emerald-500 bg-emerald-500/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Users className="size-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-0.5">Assigned NGO</p>
                  <p className="text-lg font-bold text-foreground">{assignment.assignedNgo}</p>
                </div>
              </div>
              <div className="space-y-1 pt-4 border-t border-emerald-500/10">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team Details</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground text-sm">{assignment.team.name}</p>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {assignment.team.volunteers.length} members
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Users className="size-5 text-primary" />
              Team Roster
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {assignment.team.volunteers.map(volunteer => (
                <div key={volunteer.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl border border-border/50">
                  <div className="size-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 shadow-sm">
                    {volunteer.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{volunteer.name}</p>
                    <Badge variant={volunteer.role === 'leader' ? 'default' : 'secondary'} className="text-[10px] py-0 px-2 mt-1 capitalize font-medium">
                      {volunteer.role}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Activity className="size-5 text-primary" />
                  Cleanup Evidence
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Photos from before and after the operation.</p>
              </div>
              {(assignment.status === 'in-progress' || assignment.status === 'completed') && (
                <Button size="sm" variant="secondary" className="gap-2 text-xs">
                  <UploadCloud className="size-3.5" />
                  Upload Photo
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground">Before (AI Detected)</h4>
                <div className="w-full h-[200px] bg-muted/50 rounded-xl border border-border/60 flex items-center justify-center overflow-hidden">
                  {/* Mock image area */}
                  <span className="text-muted-foreground text-xs font-medium">Standard Scene Logged</span>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-muted-foreground">After (Verified)</h4>
                <div className="w-full h-[200px] bg-muted/50 rounded-xl border border-border/60 flex items-center justify-center overflow-hidden relative">
                  {assignment.status === 'completed' || assignment.status === 'verified' || assignment.status === 'closed' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-emerald-500/5">
                      <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">Cleanup Verified</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs font-medium">Pending completion</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {assignment.supervisorNotes && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-2xl p-5">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <FileText className="size-5 text-primary" />
                Supervisor Notes
              </h2>
              <p className="text-sm p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-200 italic">
                "{assignment.supervisorNotes}"
              </p>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <ProgressTracker timeline={assignment.timeline} />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <TaskChecklist tasks={assignment.equipmentChecklist} />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
