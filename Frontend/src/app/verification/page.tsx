'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Building2,
  Upload,
  Loader2,
  Percent,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAssignments, verifyAssignment, updateAssignment, type AssignmentItem } from '@/services/assignments';
import { resolveImageUrl } from '@/services/detection';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function VerificationPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => fetchAssignments(),
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, file, notes }: { id: string; file: File; notes?: string }) => {
      return verifyAssignment(id, file, notes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['impact'] });
      setVerifyingId(null);
      setSelectedFile(null);
      setVerificationNotes('');
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return updateAssignment(id, { status: status as any });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    },
  });

  // Verification candidates are completed, verified, or pending assignments
  const verificationItems = (assignments || []).filter((a) =>
    ['completed', 'verified', 'rejected', 'in_progress'].includes(a.status)
  );

  const filtered = verificationItems.filter((v) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return v.status === 'completed' || v.status === 'in_progress';
    return v.status === filter;
  });

  const pendingCount = verificationItems.filter((v) => v.status === 'completed' || v.status === 'in_progress').length;

  const handleStartVerify = (id: string) => {
    setVerifyingId(id);
    setSelectedFile(null);
    setVerificationNotes('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRunAiVerification = (id: string) => {
    if (!selectedFile) return;
    verifyMutation.mutate({ id, file: selectedFile, notes: verificationNotes });
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="size-7 text-blue-500" />
            Cleanup Verification
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review completed cleanups, upload post-cleanup images, and verify waste reduction with dual-model AI.
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-800 px-4 py-2">
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              {pendingCount} cleanup(s) awaiting verification
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'verified', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f === 'pending' ? 'Needs Verification' : f} {f === 'pending' && pendingCount > 0 && `(${pendingCount})`}
          </Button>
        ))}
      </div>

      {/* Verification list */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No verifications found"
          description={filter === 'pending' ? 'All cleanup verifications have been processed.' : 'No verifications match the current filter.'}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item, index) => {
            const isVerifying = verifyingId === item.id;
            const wasteBefore = item.waste_before || item.waste_count || 1;
            const wasteAfter = item.waste_after ?? (item.status === 'verified' ? 0 : null);
            const reduction = item.waste_reduction_percent ?? (item.status === 'verified' ? 100 : null);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
                className={cn(
                  'glass rounded-2xl p-5 space-y-4',
                  (item.status === 'completed' || item.status === 'in_progress') && 'border-l-4 border-l-amber-500',
                  item.status === 'verified' && 'border-l-4 border-l-emerald-500',
                )}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <SeverityBadge severity={item.severity} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3" />
                        {item.ngo_team_name || 'Unassigned NGO'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {item.scheduled_date ? format(new Date(item.scheduled_date), 'MMM d, yyyy') : 'No Date'}
                      </span>
                      <span className="font-mono text-[11px] bg-muted/40 px-1.5 py-0.5 rounded">
                        {item.id}
                      </span>
                    </div>
                  </div>
                  <StatusBadge
                    status={item.status === 'verified' ? 'verified' : item.status === 'rejected' ? 'rejected' : 'verification-pending'}
                    size="md"
                  />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Before</p>
                    <p className="text-lg font-bold text-foreground">{wasteBefore}</p>
                    <p className="text-[10px] text-muted-foreground">waste objects</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">After</p>
                    <p className="text-lg font-bold text-foreground">
                      {wasteAfter != null ? wasteAfter : 'Awaiting Photo'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">remaining debris</p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/5 border border-emerald-200/50 dark:border-emerald-800/50 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Waste Reduction</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {reduction != null ? `${reduction}%` : 'Pending AI'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">surface cleared</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">Risk Score</p>
                    <p className="text-lg font-bold text-foreground">{Math.round(item.risk_score)}</p>
                    <p className="text-[10px] text-muted-foreground">/100 points</p>
                  </div>
                </div>

                {/* Before & After Images Preview */}
                {(item.before_image_url || item.after_image_url) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {item.before_image_url && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">Pre-Cleanup Image</span>
                        <div className="h-40 rounded-xl overflow-hidden bg-muted/40 border border-border/40">
                          <img
                            src={resolveImageUrl(item.before_image_url)}
                            alt="Pre-cleanup"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    {item.after_image_url && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          Post-Cleanup Verified Mask
                        </span>
                        <div className="h-40 rounded-xl overflow-hidden bg-muted/40 border border-emerald-500/30">
                          <img
                            src={resolveImageUrl(item.after_image_url)}
                            alt="Post-cleanup verified"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {item.notes && (
                  <p className="text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 italic">
                    {item.notes}
                  </p>
                )}

                {/* Verification Upload Box */}
                {isVerifying && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-primary" />
                      <h4 className="text-sm font-semibold text-foreground">AI Post-Cleanup Inspection</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload a post-cleanup photo of this location. The dual-model engine will evaluate remaining waste objects, compute coverage reduction, and update the database record.
                    </p>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="size-4" />
                        {selectedFile ? selectedFile.name : 'Select Verification Photo'}
                      </Button>

                      <input
                        type="text"
                        placeholder="Optional inspection notes..."
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />

                      <Button
                        size="sm"
                        disabled={!selectedFile || verifyMutation.isPending}
                        onClick={() => handleRunAiVerification(item.id)}
                        className="gap-1.5"
                      >
                        {verifyMutation.isPending ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" />
                            Running Dual-Model AI...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-3.5" />
                            Execute Verification
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setVerifyingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                {!isVerifying && item.status !== 'verified' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleStartVerify(item.id)}
                    >
                      <Upload className="size-3.5" />
                      Upload Post-Cleanup Photo
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => statusMutation.mutate({ id: item.id, status: 'verified' })}
                    >
                      <CheckCircle className="size-3.5 text-emerald-500" />
                      Approve Cleanup
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:text-destructive"
                      onClick={() => statusMutation.mutate({ id: item.id, status: 'rejected' })}
                    >
                      <XCircle className="size-3.5" />
                      Reject Cleanup
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
