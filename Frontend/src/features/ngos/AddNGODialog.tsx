'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createNGO } from '@/services/ngos';
import { apiErrorMessage } from '@/lib/api';

const EMPTY = { name: '', city: '', state: '', contact_person: '', email: '', phone: '', team_size: '10', specializations: '' };
type Form = typeof EMPTY;

function validate(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (f.name.trim().length < 2) e.name = 'Enter the organisation name.';
  if (!f.city.trim()) e.city = 'Required.';
  if (!f.state.trim()) e.state = 'Required.';
  if (!f.contact_person.trim()) e.contact_person = 'Required.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (!/^[0-9+()\-\s]{6,32}$/.test(f.phone.trim())) e.phone = 'Use digits, spaces, +, - or brackets (6-32 characters).';
  const size = Number(f.team_size);
  if (!Number.isInteger(size) || size < 1 || size > 10000) e.team_size = 'Enter a whole number from 1 to 10000.';
  return e;
}

const FIELDS: { key: keyof Form; label: string; type?: string; placeholder?: string; span?: boolean }[] = [
  { key: 'name', label: 'Organisation name', span: true },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'contact_person', label: 'Contact person' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'email', label: 'Email', type: 'email', span: true },
  { key: 'team_size', label: 'Team size', type: 'number' },
  { key: 'specializations', label: 'Specialisations', placeholder: 'Comma separated, e.g. Riverbanks' },
];

export function AddNGODialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const errors = submitted ? validate(form) : {};

  const mutation = useMutation({
    mutationFn: () =>
      createNGO({
        name: form.name.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        contact_person: form.contact_person.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        team_size: Number(form.team_size),
        specializations: form.specializations.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 20),
      }),
    onSuccess: (ngo) => {
      queryClient.invalidateQueries({ queryKey: ['ngos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
      toast.success(`${ngo.name} added`);
      setOpen(false);
      setForm(EMPTY);
      setSubmitted(false);
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(form)).length === 0) mutation.mutate();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" aria-hidden="true" /> Add NGO Team
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { mutation.reset(); setSubmitted(false); } }}>
        <DialogContent className="sm:max-w-[560px] glass border border-border/50 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add NGO Team</DialogTitle>
            <DialogDescription>Register a partner organisation that can be assigned cleanups.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {FIELDS.map((f) => (
              <div key={f.key} className={f.span ? 'grid gap-1.5 sm:col-span-2' : 'grid gap-1.5'}>
                <label htmlFor={`ngo-${f.key}`} className="text-sm font-medium">{f.label}</label>
                <Input
                  id={`ngo-${f.key}`}
                  type={f.type ?? 'text'}
                  value={form[f.key]}
                  placeholder={f.placeholder}
                  min={f.type === 'number' ? 1 : undefined}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  aria-invalid={!!errors[f.key]}
                  aria-describedby={errors[f.key] ? `ngo-${f.key}-error` : undefined}
                  className="bg-background/50"
                />
                {errors[f.key] && <p id={`ngo-${f.key}-error`} className="text-xs text-destructive">{errors[f.key]}</p>}
              </div>
            ))}
            {mutation.isError && (
              <p role="alert" className="sm:col-span-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {apiErrorMessage(mutation.error)}
              </p>
            )}
            <div className="sm:col-span-2 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="size-4 animate-spin mr-1" aria-hidden="true" />}
                Add Team
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
