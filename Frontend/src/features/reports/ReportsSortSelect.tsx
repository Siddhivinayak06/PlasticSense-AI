'use client';

import { ArrowUpDown } from 'lucide-react';
import { sortOptions } from '@/constants/reports';
import type { ReportSortOption } from '@/types/report';

interface ReportsSortSelectProps {
  value: ReportSortOption;
  onChange: (value: ReportSortOption) => void;
}

export function ReportsSortSelect({ value, onChange }: ReportsSortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="size-3.5 text-muted-foreground shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ReportSortOption)}
        className="text-xs font-medium bg-transparent border-none outline-none cursor-pointer text-foreground appearance-none pr-4"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
