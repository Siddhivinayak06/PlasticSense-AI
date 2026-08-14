'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDetections, resolveImageUrl } from '@/services/detection';
import { Loader2, Calendar, MapPin, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function HistoryPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  
  const { data, isLoading } = useQuery({
    queryKey: ['detections', page],
    queryFn: () => fetchDetections(page, 20),
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Detection History</h1>
          <p className="text-muted-foreground text-sm mt-1">Review past waste detections and classifications.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search detections..." className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data?.data.map((detection) => (
            <div key={detection.id} className="glass rounded-2xl overflow-hidden group border border-border/50 hover:border-primary/50 transition-colors cursor-pointer flex flex-col" onClick={() => router.push(`/history/${detection.id}`)}>
              <div className="aspect-[4/3] bg-muted/30 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={resolveImageUrl(detection.annotated_image_url || detection.image_url)} 
                  alt="Detection thumbnail" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border bg-background/80 text-foreground backdrop-blur-md">
                    {detection.items.length} Objects
                  </span>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-xs font-mono text-muted-foreground truncate w-24">
                    {detection.id.split('-')[0]}
                  </div>
                  <div className="flex items-center text-[10px] text-muted-foreground gap-1">
                    <Calendar className="size-3" />
                    {formatDistanceToNow(new Date(detection.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="flex gap-1 flex-wrap mb-4">
                  {detection.summary && Object.entries(detection.summary)
                    .filter(([k]) => k !== 'total_objects')
                    .map(([group, count]) => (
                      <span key={group} className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[9px] font-medium bg-muted uppercase border border-border/50">
                        {group} <span className="ml-1 opacity-60">({count})</span>
                      </span>
                  ))}
                </div>

                <div className="mt-auto pt-3 border-t border-border/50 flex justify-between items-center">
                  <div className="flex items-center text-xs text-muted-foreground gap-1">
                    <MapPin className="size-3" />
                    {detection.latitude !== null && detection.longitude !== null 
                      ? `${detection.latitude.toFixed(4)}, ${detection.longitude.toFixed(4)}`
                      : 'Unknown Location'}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 group-hover:bg-primary/10 group-hover:text-primary">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {data && data.meta.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <div className="flex items-center px-4 text-sm font-medium">Page {page} of {data.meta.total_pages}</div>
          <Button variant="outline" disabled={page >= data.meta.total_pages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
