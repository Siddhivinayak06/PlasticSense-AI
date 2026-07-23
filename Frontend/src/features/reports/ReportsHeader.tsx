'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReportViewMode } from '@/types/report';
import { cn } from '@/lib/utils';

interface ReportsHeaderProps {
  totalCount: number;
  viewMode: ReportViewMode;
  onViewModeChange: (mode: ReportViewMode) => void;
}

export function ReportsHeader({ totalCount, viewMode, onViewModeChange }: ReportsHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage and track pollution reports •{' '}
          <span className="font-medium text-foreground">{totalCount}</span> total reports
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* View Toggle */}
        <div className="flex items-center rounded-lg bg-muted/60 p-0.5">
          <button
            onClick={() => onViewModeChange('table')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
              viewMode === 'table'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <List className="size-3.5" />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => onViewModeChange('card')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all',
              viewMode === 'card'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <LayoutGrid className="size-3.5" />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>

        <Link href="/reports/create">
          <Button size="default" className="gap-1.5">
            <Plus className="size-4" />
            <span className="hidden sm:inline">Create Report</span>
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
