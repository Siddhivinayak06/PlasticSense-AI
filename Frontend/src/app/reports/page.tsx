'use client';

import { useState } from 'react';
import { useReportFilters } from '@/hooks/useReportFilters';
import { ReportsHeader } from '@/features/reports/ReportsHeader';
import { ReportsSearch } from '@/features/reports/ReportsSearch';
import { ReportsFilters } from '@/features/reports/ReportsFilters';
import { ReportsSortSelect } from '@/features/reports/ReportsSortSelect';
import { ReportsTableView } from '@/features/reports/ReportsTableView';
import { ReportsCardView } from '@/features/reports/ReportsCardView';
import { ReportsPagination } from '@/features/reports/ReportsPagination';
import { EmptyState } from '@/components/shared/EmptyState';
import type { ReportViewMode } from '@/types/report';

export default function ReportsListPage() {
  const [viewMode, setViewMode] = useState<ReportViewMode>('table');
  
  const {
    reports,
    totalCount,
    filters,
    setSearch,
    toggleSeverity,
    togglePlasticType,
    toggleStatus,
    togglePriority,
    setDateFrom,
    setDateTo,
    setLocation,
    clearFilters,
    hasActiveFilters,
    sort,
    setSort,
    page,
    setPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage,
  } = useReportFilters();

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <ReportsHeader 
        totalCount={totalCount} 
        viewMode={viewMode} 
        onViewModeChange={setViewMode} 
      />

      <div className="flex flex-col md:flex-row items-center gap-4 justify-between glass p-3 rounded-2xl">
        <ReportsSearch value={filters.search} onChange={setSearch} />
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="h-8 w-px bg-border/60 hidden md:block" />
           <ReportsSortSelect value={sort} onChange={setSort} />
        </div>
      </div>

      <ReportsFilters 
        filters={filters}
        hasActiveFilters={hasActiveFilters}
        onToggleSeverity={toggleSeverity}
        onTogglePlasticType={togglePlasticType}
        onToggleStatus={toggleStatus}
        onTogglePriority={togglePriority}
        onSetDateFrom={setDateFrom}
        onSetDateTo={setDateTo}
        onSetLocation={setLocation}
        onClear={clearFilters}
      />

      {reports.length > 0 ? (
        <>
          {viewMode === 'table' ? (
            <ReportsTableView reports={reports} />
          ) : (
            <ReportsCardView reports={reports} />
          )}

          <div className="pt-4 border-t border-border/50">
            <ReportsPagination
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={setPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </>
      ) : (
        <EmptyState 
          title="No reports found" 
          description={hasActiveFilters ? "Try adjusting your filters or search query." : "There are no reports available."} 
        />
      )}
    </div>
  );
}