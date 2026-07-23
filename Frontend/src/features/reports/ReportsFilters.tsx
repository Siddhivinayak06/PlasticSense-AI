'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { plasticTypeOptions, severityConfig, statusConfig, priorityConfig } from '@/constants/reports';
import type { ReportFilters, ReportSeverity, PlasticType, FullReportStatus, CleanupPriority } from '@/types/report';
import { cn } from '@/lib/utils';

interface ReportsFiltersProps {
  filters: ReportFilters;
  hasActiveFilters: boolean;
  onToggleSeverity: (v: ReportSeverity) => void;
  onTogglePlasticType: (v: PlasticType) => void;
  onToggleStatus: (v: FullReportStatus) => void;
  onTogglePriority: (v: CleanupPriority) => void;
  onSetDateFrom: (v: string) => void;
  onSetDateTo: (v: string) => void;
  onSetLocation: (v: string) => void;
  onClear: () => void;
}

function FilterChip({
  label,
  active,
  onClick,
  colorClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  colorClass?: string;
}) {
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

export function ReportsFilters({
  filters,
  hasActiveFilters,
  onToggleSeverity,
  onTogglePlasticType,
  onToggleStatus,
  onTogglePriority,
  onSetDateFrom,
  onSetDateTo,
  onSetLocation,
  onClear,
}: ReportsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Toggle Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {filters.severity.length + filters.plasticType.length + filters.status.length + filters.cleanupPriority.length +
                (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0) + (filters.location ? 1 : 0)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-destructive hover:text-destructive"
            >
              <X className="size-3 mr-1" />
              Clear all
            </Button>
          )}
          {isOpen ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Filter Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 py-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {/* Severity */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Severity</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(severityConfig) as ReportSeverity[]).map((s) => (
                    <FilterChip
                      key={s}
                      label={severityConfig[s].label}
                      active={filters.severity.includes(s)}
                      onClick={() => onToggleSeverity(s)}
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
                      onClick={() => onTogglePlasticType(p.value)}
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
                      onClick={() => onToggleStatus(s)}
                      colorClass={filters.status.includes(s) ? `${statusConfig[s].bg} ${statusConfig[s].color}` : undefined}
                    />
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Cleanup Priority</p>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(priorityConfig) as CleanupPriority[]).map((p) => (
                    <FilterChip
                      key={p}
                      label={priorityConfig[p].label}
                      active={filters.cleanupPriority.includes(p)}
                      onClick={() => onTogglePriority(p)}
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
                    onChange={(e) => onSetDateFrom(e.target.value)}
                    className="text-xs rounded-lg"
                    placeholder="From"
                  />
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => onSetDateTo(e.target.value)}
                    className="text-xs rounded-lg"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Location</p>
                <Input
                  type="text"
                  placeholder="Search city or address..."
                  value={filters.location}
                  onChange={(e) => onSetLocation(e.target.value)}
                  className="text-xs rounded-lg"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
