'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Calendar, MapPin, Search, Percent, ScanLine } from 'lucide-react';
import { fetchDetections, resolveImageUrl } from '@/services/detection';
import type { Detection } from '@/types/detection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SeverityBadge, type SeverityLevel } from '@/components/shared/SeverityBadge';
import { SkeletonCard } from '@/components/shared/LoadingSkeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { QueryError } from '@/components/shared/QueryError';

const PAGE_SIZE = 20;
// The API returns at most 100 records per request; search and filters scan that window.
const SEARCH_WINDOW = 100;
const SUMMARY_SCALARS = new Set(['total_objects', 'waste_coverage_percent', 'risk_score', 'severity', 'cleanup_priority', 'explanation']);

type StatusFilter = '' | 'completed' | 'pending' | 'failed' | 'located' | 'unlocated';

function severityOf(d: Detection): SeverityLevel | null {
  const raw = String(d.risk?.level ?? '').toLowerCase();
  const level = raw === 'moderate' ? 'medium' : raw;
  return level === 'low' || level === 'medium' || level === 'high' || level === 'critical' ? level : null;
}

function StatusChip({ d }: { d: Detection }) {
  const sev = severityOf(d);
  if (d.detection_status === 'failed') {
    return <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold border bg-red-500/90 text-white">Analysis failed</span>;
  }
  if (d.detection_status === 'pending') {
    return <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold border bg-background/90 text-muted-foreground">Incomplete</span>;
  }
  return sev
    ? <SeverityBadge severity={sev} size="sm" />
    : <span className="rounded-md px-1.5 py-0.5 text-[10px] font-bold border bg-background/90 text-muted-foreground">Not assessed</span>;
}

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const filtering = search.trim().length > 0 || status !== '';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['detections', filtering ? 'window' : page],
    queryFn: () => (filtering ? fetchDetections(1, SEARCH_WINDOW) : fetchDetections(page, PAGE_SIZE)),
  });

  const visible = useMemo(() => {
    const rows = data?.data ?? [];
    if (!filtering) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((d) => {
      const statusOk =
        !status ||
        (status === 'located' && d.latitude !== null) ||
        (status === 'unlocated' && d.latitude === null) ||
        d.detection_status === status;
      const textOk =
        !q ||
        d.id.toLowerCase().includes(q) ||
        (d.location_source ?? '').toLowerCase().includes(q) ||
        d.items.some((it) => it.class_name.toLowerCase().includes(q) || it.waste_group.toLowerCase().includes(q));
      return statusOk && textOk;
    });
  }, [data, filtering, search, status]);

  const totalItems = data?.meta.total_items ?? 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Every analysed image with its detections and risk assessment{totalItems ? ` · ${totalItems} total` : ''}.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              aria-label="Search reports"
              placeholder="Search by ID, object class or material…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            aria-label="Filter reports"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All reports</option>
            <option value="completed">Analysed</option>
            <option value="pending">Incomplete</option>
            <option value="failed">Failed</option>
            <option value="located">With GPS location</option>
            <option value="unlocated">Without location</option>
          </select>
        </div>
      </div>

      {filtering && data && (
        <p className="text-xs text-muted-foreground" role="status">
          {visible.length} matching report{visible.length === 1 ? '' : 's'}
          {totalItems > SEARCH_WINDOW ? ` among the ${SEARCH_WINDOW} most recent` : ''}.
        </p>
      )}

      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={ScanLine}
            title={filtering ? 'No matching reports' : 'No reports yet'}
            description={filtering ? 'Try a different search or filter.' : 'Analyse your first image to create a report.'}
          />
          {!filtering && (
            <div className="flex justify-center">
              <Link href="/detect"><Button>Detect waste</Button></Link>
            </div>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((detection) => {
            const coverage = detection.segmentation?.waste_coverage_percent ?? detection.summary?.waste_coverage_percent;
            const groups = Object.entries(detection.summary ?? {}).filter(
              ([k, v]) => !SUMMARY_SCALARS.has(k) && typeof v === 'number',
            );
            return (
              <li key={detection.id}>
                <Link
                  href={`/history/${detection.id}`}
                  className="glass rounded-2xl overflow-hidden group border border-border/50 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all flex flex-col h-full hover:shadow-lg"
                >
                  <div className="aspect-[4/3] bg-muted/30 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- served by the API / Supabase Storage */}
                    <img
                      src={resolveImageUrl(detection.annotated_image_url || detection.image_url)}
                      alt={`Report ${detection.id.slice(0, 8)}: ${detection.items.length} detected objects`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      <StatusChip d={detection} />
                      {coverage != null && detection.detection_status === 'completed' && (
                        <span className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold border bg-background/90 text-foreground backdrop-blur-md">
                          <Percent className="size-2.5" aria-hidden="true" />
                          {Number(coverage).toFixed(1)}% area
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border bg-background/80 text-foreground backdrop-blur-md">
                        {detection.items.length} objects
                      </span>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className="text-xs font-mono text-muted-foreground truncate">{detection.id.split('-')[0]}</span>
                      <span className="flex items-center text-[10px] text-muted-foreground gap-1 shrink-0">
                        <Calendar className="size-3" aria-hidden="true" />
                        {formatDistanceToNow(new Date(detection.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="flex gap-1 flex-wrap mb-4">
                      {groups.slice(0, 4).map(([group, count]) => (
                        <span key={group} className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-medium bg-muted uppercase border border-border/50">
                          {group} <span className="ml-1 opacity-60">({count})</span>
                        </span>
                      ))}
                    </div>

                    <div className="mt-auto pt-3 border-t border-border/50 flex justify-between items-center">
                      <span className="flex items-center text-xs text-muted-foreground gap-1 min-w-0">
                        <MapPin className="size-3 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {detection.latitude !== null && detection.longitude !== null
                            ? `${detection.latitude.toFixed(3)}, ${detection.longitude.toFixed(3)}`
                            : 'No location'}
                        </span>
                      </span>
                      <span className="text-xs font-medium text-primary">View →</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!filtering && data && data.meta.total_pages > 1 && (
        <nav aria-label="Pagination" className="flex justify-center gap-2 mt-8">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="flex items-center px-4 text-sm font-medium">Page {page} of {data.meta.total_pages}</span>
          <Button variant="outline" disabled={page >= data.meta.total_pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </nav>
      )}
    </div>
  );
}
