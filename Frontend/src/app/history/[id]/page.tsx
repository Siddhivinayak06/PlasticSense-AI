'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDetection, resolveImageUrl } from '@/services/detection';
import { Loader2, ArrowLeft, Download, Scan, Info, Calendar, MapPin } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ImageComparison } from '@/components/shared/ImageComparison';
import { DetectionCard } from '@/components/shared/DetectionCard';
import { format } from 'date-fns';

export default function HistoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { data, isLoading } = useQuery({
    queryKey: ['detection', id],
    queryFn: () => fetchDetection(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const detection = data?.data;

  if (!detection) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <p className="text-muted-foreground">Detection not found.</p>
        <Button onClick={() => router.push('/history')} variant="outline">
          Back to History
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/history')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detection Details</h1>
            <p className="text-muted-foreground text-sm font-mono mt-1">ID: {detection.id}</p>
          </div>
        </div>
        
        {detection.annotated_image_url && (
          <a href={resolveImageUrl(detection.annotated_image_url)} download target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2">
              <Download className="size-4" />
              Download Result
            </Button>
          </a>
        )}
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Detection Time</span>
          <span className="text-sm font-medium">{format(new Date(detection.created_at), 'MMM d, yyyy HH:mm')}</span>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> Location</span>
          <span className="text-sm font-medium text-foreground">
            {detection.latitude !== null && detection.longitude !== null 
              ? `${detection.latitude.toFixed(6)}, ${detection.longitude.toFixed(6)}`
              : 'Unknown Location'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {detection.location_source === 'image_exif' ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                Image GPS
              </span>
            ) : detection.location_source === 'image_overlay_ocr' ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                GPS Overlay
              </span>
            ) : detection.location_source === 'device_gps' ? (
              <span className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                Device GPS
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/50 border px-2 py-0.5 rounded-full font-semibold">
                No GPS
              </span>
            )}
          </span>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Info className="size-3" /> Detection Summary</span>
          <span className="text-sm font-medium">{detection.items.length} detected</span>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Scan className="size-3" /> Processing Time</span>
          <span className="text-sm font-medium capitalize">
            {detection.processing_time_ms ? `${detection.processing_time_ms} ms` : 'N/A'}
          </span>
        </div>
      </div>

      {/* Image Comparison */}
      <div className="glass rounded-2xl p-4">
        <ImageComparison 
          originalImage={resolveImageUrl(detection.image_url)} 
          annotatedImage={resolveImageUrl(detection.annotated_image_url || detection.image_url)} 
        />
      </div>

      {/* Objects List */}
      <div className="glass rounded-2xl p-4 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scan className="size-5 text-primary" />
          Detected Objects Breakdown
        </h3>
        
        {detection.items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {detection.items.map((item, i) => (
              <DetectionCard key={item.id} item={item} index={i + 1} />
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 border border-border/50 px-4 py-3">
            <Info className="size-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">No waste objects detected in this image.</p>
          </div>
        )}
      </div>
    </div>
  );
}
