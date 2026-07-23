'use client';

import { useState, useMemo, useCallback } from 'react';
import { mockFullReports } from '@/mock/reports';
import type {
  Report,
  ReportFilters,
  ReportSortOption,
  ReportSeverity,
  PlasticType,
  FullReportStatus,
  CleanupPriority,
} from '@/types/report';
import { severityOrder, priorityOrder, statusOrder } from '@/constants/reports';

const defaultFilters: ReportFilters = {
  search: '',
  severity: [],
  plasticType: [],
  status: [],
  cleanupPriority: [],
  dateFrom: '',
  dateTo: '',
  location: '',
};

export function useReportFilters() {
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters);
  const [sort, setSort] = useState<ReportSortOption>('newest');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ─── Search ─────────────────────────────────────────────
  const setSearch = useCallback((search: string) => {
    setFilters((f) => ({ ...f, search }));
    setPage(1);
  }, []);

  // ─── Toggle array filter ────────────────────────────────
  const toggleFilter = useCallback(
    <K extends 'severity' | 'plasticType' | 'status' | 'cleanupPriority'>(
      key: K,
      value: ReportFilters[K][number],
    ) => {
      setFilters((f) => {
        const arr = f[key] as string[];
        const next = arr.includes(value as string)
          ? arr.filter((v) => v !== value)
          : [...arr, value as string];
        return { ...f, [key]: next };
      });
      setPage(1);
    },
    [],
  );

  const toggleSeverity = useCallback(
    (v: ReportSeverity) => toggleFilter('severity', v),
    [toggleFilter],
  );
  const togglePlasticType = useCallback(
    (v: PlasticType) => toggleFilter('plasticType', v),
    [toggleFilter],
  );
  const toggleStatus = useCallback(
    (v: FullReportStatus) => toggleFilter('status', v),
    [toggleFilter],
  );
  const togglePriority = useCallback(
    (v: CleanupPriority) => toggleFilter('cleanupPriority', v),
    [toggleFilter],
  );

  // ─── Date / Location ───────────────────────────────────
  const setDateFrom = useCallback((v: string) => {
    setFilters((f) => ({ ...f, dateFrom: v }));
    setPage(1);
  }, []);
  const setDateTo = useCallback((v: string) => {
    setFilters((f) => ({ ...f, dateTo: v }));
    setPage(1);
  }, []);
  const setLocation = useCallback((v: string) => {
    setFilters((f) => ({ ...f, location: v }));
    setPage(1);
  }, []);

  // ─── Clear ──────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.severity.length > 0 ||
      filters.plasticType.length > 0 ||
      filters.status.length > 0 ||
      filters.cleanupPriority.length > 0 ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filters.location !== '',
    [filters],
  );

  // ─── Filter + Sort + Paginate ───────────────────────────
  const filteredReports = useMemo(() => {
    let result = [...mockFullReports];

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.plasticTypeLabel.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q),
      );
    }

    // Severity
    if (filters.severity.length > 0) {
      result = result.filter((r) => filters.severity.includes(r.severity));
    }

    // Plastic type
    if (filters.plasticType.length > 0) {
      result = result.filter((r) => filters.plasticType.includes(r.plasticType));
    }

    // Status
    if (filters.status.length > 0) {
      result = result.filter((r) => filters.status.includes(r.status));
    }

    // Priority
    if (filters.cleanupPriority.length > 0) {
      result = result.filter((r) => filters.cleanupPriority.includes(r.cleanupPriority));
    }

    // Date range
    if (filters.dateFrom) {
      result = result.filter((r) => r.reportedDate >= filters.dateFrom);
    }
    if (filters.dateTo) {
      result = result.filter((r) => r.reportedDate <= filters.dateTo);
    }

    // Location
    if (filters.location) {
      const loc = filters.location.toLowerCase();
      result = result.filter(
        (r) =>
          r.city.toLowerCase().includes(loc) ||
          r.address.toLowerCase().includes(loc),
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.reportedDate.localeCompare(a.reportedDate);
        case 'oldest':
          return a.reportedDate.localeCompare(b.reportedDate);
        case 'severity':
          return severityOrder[b.severity] - severityOrder[a.severity];
        case 'confidence':
          return b.confidence - a.confidence;
        case 'priority':
          return priorityOrder[b.cleanupPriority] - priorityOrder[a.cleanupPriority];
        case 'status':
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return result;
  }, [filters, sort]);

  // ─── Pagination ─────────────────────────────────────────
  const totalCount = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const safePage = Math.min(page, totalPages);

  const paginatedReports = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return filteredReports.slice(start, start + itemsPerPage);
  }, [filteredReports, safePage, itemsPerPage]);

  const changeItemsPerPage = useCallback((n: number) => {
    setItemsPerPage(n);
    setPage(1);
  }, []);

  return {
    // Data
    reports: paginatedReports,
    allFilteredReports: filteredReports,
    totalCount,

    // Filters
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

    // Sort
    sort,
    setSort,

    // Pagination
    page: safePage,
    setPage,
    totalPages,
    itemsPerPage,
    setItemsPerPage: changeItemsPerPage,
  };
}
