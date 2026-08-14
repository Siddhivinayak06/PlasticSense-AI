'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardList, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface CreateAssignmentDialogProps {
  hotspotId?: string;
  trigger?: React.ReactNode;
}

export function CreateAssignmentDialog({ hotspotId, trigger }: CreateAssignmentDialogProps) {
  const [open, setOpen] = useState(false);

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
            Assign a verified hotspot to an NGO team for cleanup.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="hotspot" className="text-sm font-medium">Target Hotspot ID</label>
            <Input id="hotspot" defaultValue={hotspotId || 'HS-2026-001'} className="bg-background/50" />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="ngo" className="text-sm font-medium">Assign to NGO</label>
            <select id="ngo" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
              <option value="" disabled selected>Select an NGO team</option>
              <option value="ocean-crusaders">Ocean Crusaders</option>
              <option value="beach-please">Beach Please</option>
              <option value="green-waves">Green Waves</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="date" className="text-sm font-medium">Scheduled Date</label>
              <div className="relative">
                <Input id="date" type="date" className="bg-background/50 pl-10" />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="priority" className="text-sm font-medium">Priority</label>
              <select id="priority" defaultValue="high" className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="notes" className="text-sm font-medium">Supervisor Notes (Optional)</label>
            <Input id="notes" placeholder="Special equipment needed, access instructions..." className="bg-background/50" />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)}>Create Assignment</Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
