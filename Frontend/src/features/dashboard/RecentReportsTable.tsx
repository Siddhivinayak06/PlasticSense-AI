'use client';

import { motion } from 'framer-motion';
import { Eye, ImageIcon, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

const statusConfig: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  failed: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
};

export function RecentReportsTable() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['recentDetections'],
    queryFn: () => fetchDetections(1, 5), // Fetch top 5
  });
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-base font-semibold text-foreground">Recent Reports</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Latest pollution reports from the field</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[120px]">Report ID</TableHead>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Objects</TableHead>
            <TableHead>Categories</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead className="w-[60px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground mx-auto" />
              </TableCell>
            </TableRow>
          ) : data?.data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                No detections found.
              </TableCell>
            </TableRow>
          ) : (
            data?.data.map((detection) => {
              // Calculate most prominent waste group or total count
              const objectCount = detection.items.length;
              
              return (
                <TableRow key={detection.id} className="group cursor-pointer hover:bg-muted/30" onClick={() => router.push(`/history/${detection.id}`)}>
                  <TableCell className="font-mono text-xs font-medium">
                    {detection.id.split('-')[0]}
                  </TableCell>
                  <TableCell>
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 overflow-hidden">
                      {detection.annotated_image_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={resolveImageUrl(detection.annotated_image_url)} alt="Thumbnail" className="object-cover size-full" />
                      ) : (
                        <ImageIcon className="size-4 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{objectCount} Object{objectCount !== 1 && 's'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* Render top 2 categories */}
                    <div className="flex gap-1 flex-wrap">
                      {detection.summary && Object.entries(detection.summary)
                        .filter(([k]) => k !== 'total_objects')
                        .slice(0, 2)
                        .map(([group, count]) => (
                          <span key={group} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border bg-muted/40 uppercase">
                            {group} <span className="ml-1 opacity-70">({count})</span>
                          </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center text-xs text-muted-foreground gap-1 mt-1">
                      <MapPin className="size-3" />
                      {detection.latitude !== null && detection.longitude !== null 
                        ? `${detection.latitude.toFixed(4)}, ${detection.longitude.toFixed(4)}`
                        : 'Unknown Location'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border capitalize',
                      statusConfig[detection.detection_status] || statusConfig.pending
                    )}>
                      {detection.detection_status}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(detection.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`View report ${detection.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/history/${detection.id}`);
                      }}
                    >
                      <Eye className="size-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </motion.div>
  );
}
