'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { plasticTypeOptions, severityConfig, statusConfig, priorityConfig } from '@/constants/reports';
import type { ReportFilters, ReportSeverity, PlasticType, FullReportStatus, CleanupPriority } from '@/types/report';
import { cn } from '@/lib/utils';

interface MapFilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ReportFilters;
  setSearch: (s: string) => void;
  toggleFilter: <K extends keyof ReportFilters>(key: K, value: any) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterChip({ label, active, onClick, colorClass }: { label: string; active: boolean; onClick: () => void; colorClass?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all',
        active
          ? `${colorClass || 'bg-primary/10 border-primary/30 text-primary'}`
          : 'bg-muted/40 border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      {label}
    </button>
  );
}

export function MapFilterSidebar({
  isOpen,
  onClose,
  filters,
  setSearch,
  toggleFilter,
  clearFilters,
  hasActiveFilters,
}: MapFilterSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-4 left-4 z-[400] w-80 max-h-[calc(100vh-120px)] flex flex-col glass rounded-2xl shadow-xl overflow-hidden pointer-events-auto"
        >
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/50">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Map Filters</h2>
            </div>
            <div className="flex items-center gap-1">
              {hasActiveFilters && (
                <Button variant="ghost" size="xs" onClick={clearFilters} className="text-xs text-destructive hover:text-destructive h-7">
                  Clear
                </Button>
              )}
              <Button variant="ghost" size="icon-xs" onClick={onClose}>
                <X className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search city, area, ID..."
                value={filters.search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl"
              />
            </div>

            {/* Severity */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Severity</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(severityConfig) as ReportSeverity[]).map((s) => (
                  <FilterChip
                    key={s}
                    label={severityConfig[s].label}
                    active={filters.severity.includes(s)}
                    onClick={() => toggleFilter('severity', s)}
                    colorClass={filters.severity.includes(s) ? `${severityConfig[s].bg} ${severityConfig[s].color}` : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Plastic Type */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Plastic Type</p>
              <div className="flex flex-wrap gap-1.5">
                {plasticTypeOptions.map((p) => (
                  <FilterChip
                    key={p.value}
                    label={p.label}
                    active={filters.plasticType.includes(p.value)}
                    onClick={() => toggleFilter('plasticType', p.value)}
                  />
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Status</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(statusConfig) as FullReportStatus[]).map((s) => (
                  <FilterChip
                    key={s}
                    label={statusConfig[s].label}
                    active={filters.status.includes(s)}
                    onClick={() => toggleFilter('status', s)}
                    colorClass={filters.status.includes(s) ? `${statusConfig[s].bg} ${statusConfig[s].color}` : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Cleanup Priority */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Priority</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(priorityConfig) as CleanupPriority[]).map((p) => (
                  <FilterChip
                    key={p}
                    label={priorityConfig[p].label}
                    active={filters.cleanupPriority.includes(p)}
                    onClick={() => toggleFilter('cleanupPriority', p)}
                    colorClass={filters.cleanupPriority.includes(p) ? `${priorityConfig[p].bg} ${priorityConfig[p].color}` : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Date Range</p>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => toggleFilter('dateFrom', e.target.value)}
                  className="text-[11px] rounded-lg h-8"
                  placeholder="From"
                />
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => toggleFilter('dateTo', e.target.value)}
                  className="text-[11px] rounded-lg h-8"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
