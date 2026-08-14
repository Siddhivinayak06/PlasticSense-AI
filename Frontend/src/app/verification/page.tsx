'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle, XCircle, Eye, Package, Scale, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';

interface VerificationItem {
  id: string;
  assignmentId: string;
  hotspotName: string;
  ngoName: string;
  completedDate: string;
  wasteBefore: number;
  wasteRemoved: number;
  estimatedWeightKg: number;
  status: 'pending' | 'approved' | 'rejected';
  severity: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
}

const mockVerifications: VerificationItem[] = [
  {
    id: 'VER-001',
    assignmentId: 'CLN-2026-0012',
    hotspotName: 'Juhu Beach Shoreline',
    ngoName: 'Green Earth Foundation',
    completedDate: '2026-08-12',
    wasteBefore: 238,
    wasteRemoved: 184,
    estimatedWeightKg: 320,
    status: 'pending',
    severity: 'critical',
    notes: 'Before and after photos submitted. Remaining waste primarily buried debris.',
  },
  {
    id: 'VER-002',
    assignmentId: 'CLN-2026-0028',
    hotspotName: 'Marina Beach Road',
    ngoName: 'Ocean Crusaders',
    completedDate: '2026-08-11',
    wasteBefore: 156,
    wasteRemoved: 148,
    estimatedWeightKg: 245,
    status: 'pending',
    severity: 'high',
    notes: 'Excellent cleanup. Only minor debris remains in rocky areas.',
  },
  {
    id: 'VER-003',
    assignmentId: 'CLN-2026-0035',
    hotspotName: 'Versova Seafront',
    ngoName: 'Eco Warriors India',
    completedDate: '2026-08-10',
    wasteBefore: 128,
    wasteRemoved: 128,
    estimatedWeightKg: 190,
    status: 'pending',
    severity: 'high',
  },
  {
    id: 'VER-004',
    assignmentId: 'CLN-2026-0041',
    hotspotName: 'Kovalam Beach',
    ngoName: 'Clean Coast Initiative',
    completedDate: '2026-08-09',
    wasteBefore: 92,
    wasteRemoved: 88,
    estimatedWeightKg: 135,
    status: 'approved',
    severity: 'medium',
  },
  {
    id: 'VER-005',
    assignmentId: 'CLN-2026-0048',
    hotspotName: 'Baga Beach',
    ngoName: 'Beach Please Foundation',
    completedDate: '2026-08-08',
    wasteBefore: 64,
    wasteRemoved: 60,
    estimatedWeightKg: 85,
    status: 'approved',
    severity: 'medium',
  },
  {
    id: 'VER-006',
    assignmentId: 'CLN-2026-0052',
    hotspotName: 'Puri Beach',
    ngoName: 'Marine Protectors',
    completedDate: '2026-08-06',
    wasteBefore: 42,
    wasteRemoved: 30,
    estimatedWeightKg: 45,
    status: 'rejected',
    severity: 'low',
    notes: 'Insufficient cleanup. Significant waste remains at site.',
  },
];

export default function VerificationPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const filtered = mockVerifications.filter((v) => filter === 'all' || v.status === filter);
  const pendingCount = mockVerifications.filter((v) => v.status === 'pending').length;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="size-7 text-blue-500" />
            Cleanup Verification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and verify cleanup results submitted by NGO teams.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-800 px-4 py-2">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">{pendingCount} pending verifications</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f} {f === 'pending' && pendingCount > 0 && `(${pendingCount})`}
          </Button>
        ))}
      </div>

      {/* Verification list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No verifications found"
          description={filter === 'pending' ? 'All cleanup verifications have been processed.' : 'No verifications match the current filter.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className={cn(
                'glass rounded-2xl p-5 space-y-4',
                item.status === 'pending' && 'border-l-4 border-l-amber-500',
              )}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-foreground">{item.hotspotName}</h3>
                    <SeverityBadge severity={item.severity} size="sm" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="size-3" />{item.ngoName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />{item.completedDate}
                    </span>
                    <span className="font-mono">{item.assignmentId}</span>
                  </div>
                </div>
                <StatusBadge
                  status={item.status === 'approved' ? 'verified' : item.status === 'rejected' ? 'rejected' : 'verification-pending'}
                  size="md"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl bg-muted/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Before</p>
                  <p className="text-lg font-bold text-foreground">{item.wasteBefore}</p>
                  <p className="text-[10px] text-muted-foreground">objects</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-800/50 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Removed</p>
                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{item.wasteRemoved}</p>
                  <p className="text-[10px] text-muted-foreground">objects</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Progress</p>
                  <p className="text-lg font-bold text-foreground">{Math.round(item.wasteRemoved / item.wasteBefore * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground">cleanup</p>
                </div>
                <div className="rounded-xl bg-muted/30 p-3 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase font-medium">Weight</p>
                  <p className="text-lg font-bold text-foreground">{item.estimatedWeightKg}</p>
                  <p className="text-[10px] text-muted-foreground">kg</p>
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 italic">
                  {item.notes}
                </p>
              )}

              {/* Actions */}
              {item.status === 'pending' && (
                <div className="flex gap-3 pt-1">
                  <Button variant="default" size="sm" className="gap-1.5">
                    <CheckCircle className="size-3.5" />
                    Approve Cleanup
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive">
                    <XCircle className="size-3.5" />
                    Request Rework
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 ml-auto">
                    <Eye className="size-3.5" />
                    View Details
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
