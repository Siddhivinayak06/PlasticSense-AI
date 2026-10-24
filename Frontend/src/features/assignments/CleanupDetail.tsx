'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft, MapPin, Calendar as CalendarIcon, Users, ShieldCheck, Loader2, Upload, FileText, Play, CheckCircle2, Flame,
} from 'lucide-react';
import type { CleanupAssignment } from '@/types/assignment';
import { assignmentTimeline, updateAssignment, verifyAssignment, type AssignmentUpdate } from '@/services/assignments';
import { fetchNGOs } from '@/services/ngos';
import { apiErrorMessage, resolveImageUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DataNote } from '@/components/shared/QueryError';
import { ProgressTracker } from './ProgressTracker';
import { PriorityPill, SampleTag } from './CleanupTable';

interface CleanupDetailProps {
  assignment: CleanupAssignment;
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/bmp';
const MAX_MB = 10;

function toDateInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const CleanupDetail = ({ assignment: a }: CleanupDetailProps) => {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [ngoId, setNgoId] = useState(a.ngoTeamId ?? '');
  const [date, setDate] = useState(toDateInput(a.scheduledDate));
  const [notes, setNotes] = useState(a.notes ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: ngos } = useQuery({ queryKey: ['ngos'], queryFn: fetchNGOs });

  const refresh = () => {
    for (const key of ['assignment', 'assignments', 'hotspots', 'hotspot', 'dashboardSummary', 'analytics-insights', 'ngos']) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  const update = useMutation({
    mutationFn: (payload: AssignmentUpdate) => updateAssignment(a.id, payload),
    onSuccess: () => { refresh(); toast.success('Assignment updated'); },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const verify = useMutation({
    mutationFn: (f: File) => verifyAssignment(a.id, f),
    onSuccess: (res) => {
      refresh();
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      if (res.status === 'verified') {
        toast.success('Cleanup verified', { description: `${res.waste_reduction_percent}% fewer detected objects.` });
      } else {
        toast.warning('Verification did not pass', { description: `Only ${res.waste_reduction_percent}% fewer detected objects.` });
      }
    },
  });

  const onPickFile = (f: File | null) => {
    setFileError(null);
    if (!f) return setFile(null);
    if (!ACCEPT.split(',').includes(f.type)) return setFileError('Choose a JPG, PNG, WEBP or BMP image.');
    if (f.size > MAX_MB * 1024 * 1024) return setFileError(`Image must be ${MAX_MB} MB or smaller.`);
    setFile(f);
  };

  const busy = update.isPending || verify.isPending;
  const canVerify = a.status === 'completed' || a.status === 'rejected' || a.status === 'in-progress';
  const closed = a.status === 'verified';

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-start gap-4 min-w-0">
          <Link href="/assignments" aria-label="Back to assignments">
            <Button variant="outline" size="icon" className="size-8 rounded-full">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Button>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold break-words">{a.title}</h1>
              {a.isSample && <SampleTag />}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <span className="text-xs font-mono bg-muted/50 px-2 py-0.5 rounded-md">{a.id}</span>
              <StatusBadge status={a.status} size="sm" />
              <PriorityPill priority={a.priority} />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" /> {a.locationName}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(a.status === 'pending' || a.status === 'assigned') && (
            <Button disabled={busy} onClick={() => update.mutate({ status: 'in_progress' })} className="gap-2">
              <Play className="size-4" aria-hidden="true" /> Start Cleanup
            </Button>
          )}
          {a.status === 'in-progress' && (
            <Button disabled={busy} onClick={() => update.mutate({ status: 'completed' })} className="gap-2">
              <CheckCircle2 className="size-4" aria-hidden="true" /> Mark Completed
            </Button>
          )}
        </div>
      </div>

      {a.isSample && (
        <DataNote>
          This is a seeded sample record from an earlier version of the app. Its team, notes and figures are illustrative,
          not real field data.
        </DataNote>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Key figures */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Risk score', value: `${Math.round(a.riskScore)}/100` },
              { label: 'Objects before', value: String(a.wasteBefore) },
              { label: 'Objects after', value: a.wasteAfter === null ? '—' : String(a.wasteAfter) },
              { label: 'Reduction', value: a.wasteReductionPercent === null ? '—' : `${a.wasteReductionPercent}%` },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4">
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Before / after */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
            <h2 className="text-lg font-semibold mb-4">Before &amp; After</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Before (original report)', url: a.beforeImageUrl },
                { label: 'After (verification photo)', url: a.afterImageUrl },
              ].map((img) => (
                <figure key={img.label} className="rounded-xl border border-border/50 bg-muted/30 overflow-hidden">
                  {img.url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- served by the API / Supabase Storage
                    <img src={resolveImageUrl(img.url)} alt={img.label} className="w-full aspect-video object-contain bg-black/5" />
                  ) : (
                    <div className="aspect-video flex items-center justify-center text-sm text-muted-foreground px-4 text-center">
                      {img.label.startsWith('After') ? 'No verification photo uploaded yet' : 'No image linked'}
                    </div>
                  )}
                  <figcaption className="text-xs text-muted-foreground px-3 py-2 border-t border-border/50">{img.label}</figcaption>
                </figure>
              ))}
            </div>
          </motion.div>

          {/* AI verification */}
          {!closed && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-5 space-y-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-500" aria-hidden="true" /> AI Cleanup Verification
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a photo of the site after cleanup. The same models count remaining objects; the cleanup is verified when
                  detections drop by at least 50% (or one or fewer objects remain).
                </p>
              </div>
              {!canVerify ? (
                <p className="text-sm text-muted-foreground">Start the cleanup before uploading a verification photo.</p>
              ) : (
                <form
                  className="flex flex-col sm:flex-row gap-3 sm:items-center"
                  onSubmit={(e) => { e.preventDefault(); if (file) verify.mutate(file); }}
                >
                  <label htmlFor="verify-file" className="sr-only">After-cleanup photo</label>
                  <Input
                    id="verify-file"
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                    aria-invalid={!!fileError}
                    aria-describedby={fileError ? 'verify-file-error' : undefined}
                    className="bg-background/50"
                  />
                  <Button type="submit" disabled={!file || busy} className="gap-2 shrink-0">
                    {verify.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" aria-hidden="true" />}
                    {verify.isPending ? 'Analysing…' : 'Verify Cleanup'}
                  </Button>
                </form>
              )}
              {fileError && <p id="verify-file-error" className="text-sm text-destructive">{fileError}</p>}
              {verify.isError && (
                <p role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                  {apiErrorMessage(verify.error)}
                </p>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Users className="size-4 text-primary" aria-hidden="true" /> Team &amp; Schedule
            </h2>
            <div className="grid gap-2">
              <label htmlFor="detail-ngo" className="text-xs font-medium text-muted-foreground">NGO team</label>
              <div className="flex gap-2">
                <select
                  id="detail-ngo"
                  value={ngoId}
                  onChange={(e) => setNgoId(e.target.value)}
                  disabled={closed}
                  className="flex h-9 w-full rounded-md border border-input bg-background/50 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {ngos?.map((n) => (
                    <option key={n.id} value={n.id}>{n.name}{n.is_sample ? ' (sample)' : ''}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || closed || !ngoId || ngoId === a.ngoTeamId}
                  onClick={() => update.mutate({ ngo_team_id: ngoId })}
                >
                  Save
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="detail-date" className="text-xs font-medium text-muted-foreground">Scheduled date</label>
              <div className="flex gap-2">
                <div className="relative w-full">
                  <Input
                    id="detail-date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={closed}
                    className="pl-9 h-9 bg-background/50"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || closed || !date || date === toDateInput(a.scheduledDate)}
                  onClick={() => update.mutate({ scheduled_date: new Date(`${date}T09:00:00`).toISOString() })}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 space-y-3">
            <label htmlFor="detail-notes" className="text-sm font-bold flex items-center gap-2">
              <FileText className="size-4 text-primary" aria-hidden="true" /> Notes
            </label>
            <Textarea
              id="detail-notes"
              value={notes}
              maxLength={2000}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Field observations, access instructions…"
              className="min-h-24 bg-background/50"
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={busy || notes === (a.notes ?? '')}
              onClick={() => update.mutate({ notes })}
            >
              Save notes
            </Button>
          </div>

          <ProgressTracker timeline={assignmentTimeline(a)} />

          <div className="glass rounded-2xl p-5 space-y-2 text-sm">
            <h2 className="text-sm font-bold mb-1">Source</h2>
            {a.detectionId ? (
              <Link href={`/history/${a.detectionId}`} className="flex items-center gap-2 text-primary hover:underline">
                <FileText className="size-4" aria-hidden="true" /> Original report
              </Link>
            ) : (
              <p className="text-muted-foreground">No linked report.</p>
            )}
            {a.hotspotId?.startsWith('CLUSTER-') && (
              <Link href={`/hotspots/${encodeURIComponent(a.hotspotId)}`} className="flex items-center gap-2 text-primary hover:underline">
                <Flame className="size-4" aria-hidden="true" /> Hotspot
              </Link>
            )}
            {a.lat !== null && a.lng !== null && (
              <p className="text-xs text-muted-foreground font-mono">{a.lat.toFixed(5)}, {a.lng.toFixed(5)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
