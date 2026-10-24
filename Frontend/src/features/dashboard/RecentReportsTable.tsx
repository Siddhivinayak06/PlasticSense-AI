'use client';

import { motion } from 'framer-motion';
import { Eye, ImageIcon, MapPin, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { fetchDetections, resolveImageUrl } from '@/services/detection';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { cardEntrance, tableRowVariants } from '@/lib/motion';

const statusConfig: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50',
  failed: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200/50 dark:border-red-800/50',
};

export function RecentReportsTable() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['recentDetections'],
    queryFn: () => fetchDetections(1, 5), // Fetch top 5
  });

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      className="glass rounded-3xl overflow-hidden border border-slate-200/70 dark:border-slate-800/70 shadow-sm flex flex-col justify-between"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <FileSpreadsheet className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Recent Field Surveys</h2>
            <p className="text-xs text-muted-foreground">Latest plastic pollution detections ingested into database</p>
          </div>
        </div>
        <Link href="/history">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground group">
            <span>View all</span>
            <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40">
              <TableHead className="w-[110px] text-xs font-semibold">Report ID</TableHead>
              <TableHead className="w-[64px] text-xs font-semibold">Preview</TableHead>
              <TableHead className="text-xs font-semibold">Detections</TableHead>
              <TableHead className="text-xs font-semibold">Dominant Materials</TableHead>
              <TableHead className="hidden md:table-cell text-xs font-semibold">Coordinates</TableHead>
              <TableHead className="text-xs font-semibold">Status</TableHead>
              <TableHead className="hidden lg:table-cell text-xs font-semibold">Ingested</TableHead>
              <TableHead className="w-[50px] text-right text-xs font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx} className="border-b border-border/30">
                  <TableCell>
                    <div className="h-4 w-16 rounded bg-muted/60 skeleton-shimmer" />
                  </TableCell>
                  <TableCell>
                    <div className="size-9 rounded-xl bg-muted/60 skeleton-shimmer" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 rounded bg-muted/60 skeleton-shimmer" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-28 rounded bg-muted/50 skeleton-shimmer" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="h-4 w-24 rounded bg-muted/40 skeleton-shimmer" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-16 rounded-full bg-muted/50 skeleton-shimmer" />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="h-4 w-16 rounded bg-muted/40 skeleton-shimmer" />
                  </TableCell>
                  <TableCell>
                    <div className="size-7 rounded bg-muted/40 skeleton-shimmer" />
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                  No survey detections recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((detection, index) => {
                const objectCount = detection.items.length;

                return (
                  <motion.tr
                    key={detection.id}
                    variants={tableRowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.04 }}
                    onClick={() => router.push(`/history/${detection.id}`)}
                    className="group cursor-pointer hover:bg-muted/40 dark:hover:bg-slate-800/40 border-b border-border/30 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                      #{detection.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="flex size-9 items-center justify-center rounded-xl bg-muted/60 dark:bg-slate-800 overflow-hidden border border-border/50 shadow-2xs">
                        {detection.annotated_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={resolveImageUrl(detection.annotated_image_url)}
                            alt="Survey Preview"
                            className="object-cover size-full group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <ImageIcon className="size-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm text-foreground">
                        {objectCount} item{objectCount !== 1 ? 's' : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 flex-wrap">
                        {detection.summary &&
                          Object.entries(detection.summary)
                            .filter(
                              ([k, v]) =>
                                ![
                                  'total_objects',
                                  'waste_coverage_percent',
                                  'risk_score',
                                  'severity',
                                  'cleanup_priority',
                                  'explanation',
                                  'material_coverage',
                                  'material_counts',
                                ].includes(k) && typeof v === 'number'
                            )
                            .slice(0, 2)
                            .map(([group, count]) => (
                              <span
                                key={group}
                                className="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold border border-border/60 bg-muted/50 dark:bg-slate-800/60 uppercase tracking-wide text-foreground/80"
                              >
                                {group} <span className="ml-1 opacity-60">({count as number})</span>
                              </span>
                            ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center text-xs text-muted-foreground gap-1">
                        <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                        <span className="truncate">
                          {detection.latitude !== null && detection.longitude !== null
                            ? `${detection.latitude.toFixed(3)}, ${detection.longitude.toFixed(3)}`
                            : 'Unknown GPS'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border capitalize',
                          statusConfig[detection.detection_status] || statusConfig.pending
                        )}
                      >
                        {detection.detection_status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(detection.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10 hover:text-primary rounded-lg"
                        aria-label={`View report ${detection.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/history/${detection.id}`);
                        }}
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
