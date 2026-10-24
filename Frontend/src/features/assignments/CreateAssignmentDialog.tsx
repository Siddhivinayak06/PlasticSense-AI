'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Plus, Calendar as CalendarIcon, Loader2, MapPin } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchNGOs } from '@/services/ngos';
import { createAssignment } from '@/services/assignments';
import { fetchDetections } from '@/services/detection';
import { apiErrorMessage } from '@/lib/api';

/** What the assignment is for. Hotspots anchor to one member report. */
export interface AssignmentTarget {
  kind: 'hotspot' | 'report';
  detectionId: string;
  hotspotId?: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
  /** Explicit values override what the backend would inherit from the report. */
  riskScore?: number | null;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  wasteCount?: number;
}

interface CreateAssignmentDialogProps {
  target?: AssignmentTarget;
  trigger?: React.ReactNode;
}

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';

export function CreateAssignmentDialog({ target, trigger }: CreateAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [reportId, setReportId] = useState('');
  const [ngoId, setNgoId] = useState('');
  const [priority, setPriority] = useState<'' | 'low' | 'medium' | 'high' | 'urgent'>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const queryClient = useQueryClient();
  const { data: ngos } = useQuery({ queryKey: ['ngos'], queryFn: fetchNGOs, enabled: open });
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['detections', 'assignable'],
    queryFn: () => fetchDetections(1, 100),
    enabled: open && !target,
  });
  const assignable = (reports?.data ?? []).filter((d) => d.detection_status === 'completed');

  const titleError = submitted && title.trim().length < 3 ? 'Enter a title of at least 3 characters.' : null;
  const targetError = submitted && !target && !reportId ? 'Choose the report this cleanup addresses.' : null;

  const reset = () => {
    setTitle(''); setReportId(''); setNgoId(''); setPriority(''); setScheduledDate(''); setNotes(''); setSubmitted(false);
  };

  const mutation = useMutation({
    mutationFn: () => {
      const report = assignable.find((d) => d.id === reportId);
      return createAssignment({
        title: title.trim(),
        detection_id: target?.detectionId ?? reportId,
        hotspot_id: target?.kind === 'hotspot' ? target.hotspotId : undefined,
        location_name: target?.name
          ?? (report?.latitude != null ? `Report near ${report.latitude.toFixed(4)}, ${report.longitude!.toFixed(4)}` : `Report ${reportId.slice(0, 8)}`),
        ...(target?.lat != null && target?.lng != null ? { latitude: target.lat, longitude: target.lng } : {}),
        ...(target?.riskScore != null ? { risk_score: target.riskScore } : {}),
        ...(target?.severity ? { severity: target.severity } : {}),
        ...(target?.wasteCount != null ? { waste_count: target.wasteCount } : {}),
        ...(priority ? { priority } : {}),
        ngo_team_id: ngoId || undefined,
        scheduled_date: scheduledDate ? new Date(`${scheduledDate}T09:00:00`).toISOString() : undefined,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['hotspots'] });
      queryClient.invalidateQueries({ queryKey: ['hotspot'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics-insights'] });
      toast.success(`Assignment ${created.id} created`, {
        description: created.ngo_team_name ? `Assigned to ${created.ngo_team_name}` : 'Awaiting a team',
      });
      setOpen(false);
      reset();
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (title.trim().length < 3 || (!target && !reportId)) return;
    mutation.mutate();
  };

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-flex w-full sm:w-auto">
        {trigger || (
          <Button className="gap-2 w-full">
            <Plus className="size-4" aria-hidden="true" />
            Create Assignment
          </Button>
        )}
      </div>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { reset(); mutation.reset(); } }}>
        <DialogContent className="sm:max-w-[520px] glass border border-border/50 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" aria-hidden="true" />
              New Cleanup Assignment
            </DialogTitle>
            <DialogDescription>
              Create a cleanup task for an analysed report and optionally assign an NGO team.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} noValidate className="grid gap-4 py-2">
            {target ? (
              <div className="rounded-xl border border-border/50 bg-muted/30 p-3 text-sm">
                <p className="text-xs uppercase font-medium text-muted-foreground mb-1">
                  {target.kind === 'hotspot' ? 'Hotspot' : 'Report'}
                </p>
                <p className="font-semibold flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-primary shrink-0" aria-hidden="true" />
                  {target.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {target.riskScore != null ? `Risk ${Math.round(target.riskScore)}/100` : 'Risk not assessed'}
                  {target.wasteCount != null ? ` · ${target.wasteCount} detected objects` : ''}
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                <label htmlFor="assign-report" className="text-sm font-medium">Report</label>
                <select
                  id="assign-report"
                  value={reportId}
                  onChange={(e) => setReportId(e.target.value)}
                  className={selectClass}
                  aria-invalid={!!targetError}
                  aria-describedby={targetError ? 'assign-report-error' : undefined}
                  disabled={reportsLoading}
                >
                  <option value="">{reportsLoading ? 'Loading reports…' : 'Select an analysed report'}</option>
                  {assignable.map((d) => (
                    <option key={d.id} value={d.id}>
                      {new Date(d.created_at).toLocaleDateString()} · {d.items.length} objects
                      {d.risk ? ` · risk ${Math.round(d.risk.score)}` : ''}
                      {d.latitude != null ? ` · ${d.latitude.toFixed(3)}, ${d.longitude!.toFixed(3)}` : ' · no location'}
                    </option>
                  ))}
                </select>
                {targetError && <p id="assign-report-error" className="text-xs text-destructive">{targetError}</p>}
              </div>
            )}

            <div className="grid gap-2">
              <label htmlFor="assign-title" className="text-sm font-medium">Operation title</label>
              <Input
                id="assign-title"
                placeholder="e.g. Roadside dumpsite clearance"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={!!titleError}
                aria-describedby={titleError ? 'assign-title-error' : undefined}
                className="bg-background/50"
              />
              {titleError && <p id="assign-title-error" className="text-xs text-destructive">{titleError}</p>}
            </div>

            <div className="grid gap-2">
              <label htmlFor="assign-ngo" className="text-sm font-medium">NGO team</label>
              <select id="assign-ngo" value={ngoId} onChange={(e) => setNgoId(e.target.value)} className={selectClass}>
                <option value="">Leave unassigned for now</option>
                {ngos?.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.name} ({ngo.city}){ngo.is_sample ? ' — sample record' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="assign-date" className="text-sm font-medium">Scheduled date</label>
                <div className="relative">
                  <Input
                    id="assign-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-background/50 pl-10"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="assign-priority" className="text-sm font-medium">Priority</label>
                <select
                  id="assign-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className={selectClass}
                >
                  <option value="">From risk score</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="assign-notes" className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                id="assign-notes"
                placeholder="Equipment needed, access instructions…"
                value={notes}
                maxLength={2000}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background/50 min-h-20"
              />
            </div>

            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {apiErrorMessage(mutation.error)}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin mr-1" aria-hidden="true" />}
                Create Assignment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
