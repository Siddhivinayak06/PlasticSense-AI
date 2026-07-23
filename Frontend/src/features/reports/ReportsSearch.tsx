'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ReportsSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ReportsSearch({ value, onChange }: ReportsSearchProps) {
  const [local, setLocal] = useState(value);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => onChange(local), 250);
    return () => clearTimeout(timer);
  }, [local, onChange]);

  // Sync external resets
  useEffect(() => {
    setLocal(value);
  }, [value]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search by ID, type, city, status..."
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="pl-9 pr-8 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
      />
      {local && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-1.5 top-1/2 -translate-y-1/2"
          onClick={() => setLocal('')}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}
