'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardList, Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNGOs } from '@/services/ngos';
import { createAssignment } from '@/services/assignments';

interface CreateAssignmentDialogProps {
  hotspotId?: string;
  detectionId?: string;
  trigger?: React.ReactNode;
}

export function CreateAssignmentDialog({ hotspotId, detectionId, trigger }: CreateAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetId, setTargetId] = useState(hotspotId || detectionId || 'HS-2026-01');
  const [ngoId, setNgoId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: ngos } = useQuery({
    queryKey: ['ngos'],
    queryFn: fetchNGOs,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const selectedNgo = ngos?.find(n => n.id === ngoId);
      return createAssignment({
        title: title || `Target Cleanup Operation #${targetId.slice(0, 8)}`,
        hotspot_id: targetId.startsWith('HS') ? targetId : undefined,
        detection_id: !targetId.startsWith('HS') ? targetId : undefined,
        location_name: `Location assigned from ${targetId}`,
        ngo_team_id: ngoId || undefined,
        ngo_team_name: selectedNgo?.name,
        priority,
        severity: priority === 'urgent' ? 'critical' : priority,
        risk_score: priority === 'urgent' ? 85 : priority === 'high' ? 65 : 45,
        scheduled_date: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      setOpen(false);
      setTitle('');
      setNotes('');
    },
  });

  return (
    <>
      <div onClick={() => setOpen(true)} className="inline-flex w-full sm:w-auto cursor-pointer">
        {trigger || (
          <Button className="gap-2 w-full">
            <Plus className="size-4" />
            Create Assignment
          </Button>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] glass border border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              New Cleanup Assignment
            </DialogTitle>
            <DialogDescription>
              Assign a verified hotspot or detection to an NGO team for cleanup.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">Operation Title</label>
              <Input
                id="title"
                placeholder="e.g. Shoreline High-Density Plastic Cleanup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="hotspot" className="text-sm font-medium">Target Hotspot / Detection ID</label>
              <Input
                id="hotspot"
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="ngo" className="text-sm font-medium">Assign to NGO</label>
              <select
                id="ngo"
                value={ngoId}
                onChange={(e) => setNgoId(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select an NGO team (or leave pending)</option>
                {ngos?.map((ngo) => (
                  <option key={ngo.id} value={ngo.id}>
                    {ngo.name} ({ngo.city} - {ngo.availability})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="date" className="text-sm font-medium">Scheduled Date</label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="bg-background/50 pl-10"
                  />
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="priority" className="text-sm font-medium">Priority</label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium">Supervisor Notes (Optional)</label>
              <Input
                id="notes"
                placeholder="Special equipment needed, access instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin mr-1" />}
              Create Assignment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
