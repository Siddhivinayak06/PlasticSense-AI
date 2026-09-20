'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchDetection, resolveImageUrl } from '@/services/detection';
import { Loader2, ArrowLeft, Download, Scan, Info, Calendar, MapPin, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ImageComparison } from '@/components/shared/ImageComparison';
import { DetectionCard } from '@/components/shared/DetectionCard';
import { CleanupRecommendation } from '@/features/dashboard/CleanupRecommendation';
import { SeverityBadge } from '@/components/shared/SeverityBadge';
import { format } from 'date-fns';
import Link from 'next/link';

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

  const coveragePercent = detection.segmentation?.waste_coverage_percent ?? detection.summary?.waste_coverage_percent ?? 0;
  const rawSev = (detection.risk?.level || detection.risk?.severity || detection.summary?.severity || 'low').toLowerCase();
  const severity = rawSev === 'moderate' ? 'medium' : rawSev;
  const riskScore = detection.risk?.score != null ? Math.round(detection.risk.score) : 0;
  const breakdown = detection.risk?.strategy_breakdown || {};
  const hazardIndicators = breakdown.hazard_indicators || {};
  const materialCoverage = detection.segmentation?.material_coverage || breakdown.material_coverage || {};

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/history')}>
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Detection Details</h1>
              <SeverityBadge severity={severity as any} />
            </div>
            <p className="text-muted-foreground text-sm font-mono mt-1">ID: {detection.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/assignments?create_detection_id=${detection.id}`}>
            <Button className="gap-2">
              <PlusCircle className="size-4" />
              Assign Cleanup
            </Button>
          </Link>
          {detection.annotated_image_url && (
            <a href={resolveImageUrl(detection.annotated_image_url)} download target="_blank" rel="noreferrer">
              <Button variant="outline" className="gap-2">
                <Download className="size-4" />
                Download Mask
              </Button>
            </a>
          )}
        </div>
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
              : 'No GPS Metadata'}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {detection.location_source === 'image_exif' ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                EXIF GPS
              </span>
            ) : detection.location_source === 'image_overlay_ocr' ? (
              <span className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                OCR Overlay GPS
              </span>
            ) : detection.location_source === 'user_provided' ? (
              <span className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                User Provided
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/50 border px-2 py-0.5 rounded-full font-semibold">
                Location Unavailable
              </span>
            )}
          </span>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><ShieldAlert className="size-3" /> Risk Assessment</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground">{riskScore}</span>
            <span className="text-xs text-muted-foreground">/100</span>
            <span className="text-xs font-semibold capitalize ml-1">({severity})</span>
          </div>
        </div>
        <div className="glass rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Scan className="size-3" /> Waste Coverage</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-foreground">{coveragePercent}%</span>
            <span className="text-xs text-muted-foreground">surface area</span>
          </div>
        </div>
      </div>

      {/* Image Comparison */}
      <div className="glass rounded-2xl p-4">
        <ImageComparison
          originalImage={resolveImageUrl(detection.image_url)}
          annotatedImage={resolveImageUrl(detection.annotated_image_url || detection.image_url)}
        />
      </div>

      {/* Cleanup Recommendation */}
      {detection.risk && (
        <CleanupRecommendation
          risk={detection.risk as any}
          wasteCount={detection.items.length}
        />
      )}

      {/* Material Coverage & Hazard Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Material Coverage */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Material Surface Coverage
          </h3>
          {Object.keys(materialCoverage).length > 0 ? (
            <div className="space-y-2.5 pt-1">
              {Object.entries(materialCoverage).map(([material, coverage]) => (
                <div key={material} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize font-medium text-foreground">{material}</span>
                    <span className="text-muted-foreground tabular-nums">{Number(coverage).toFixed(2)}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(5, Number(coverage) * 5))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No material segmentation coverage computed.</p>
          )}
        </div>

        {/* Hazard & Density Assessment */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="size-4 text-orange-500" />
            Hazard & Environmental Factors
          </h3>
          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground">Sharp Waste (Metal/Glass)</span>
              <span className={`font-semibold ${hazardIndicators.has_sharp_waste ? 'text-red-500' : 'text-foreground'}`}>
                {hazardIndicators.sharp_waste_count ?? 0} items
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground">Toxic Debris (Cigarettes)</span>
              <span className={`font-semibold ${hazardIndicators.has_cigarette ? 'text-amber-500' : 'text-foreground'}`}>
                {hazardIndicators.cigarette_count ?? 0} items
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground">Plastic Concentration</span>
              <span className="font-semibold text-foreground">
                {hazardIndicators.plastic_dominance_percent ? `${hazardIndicators.plastic_dominance_percent}%` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center p-2 rounded-lg bg-muted/30 border border-border/40">
              <span className="text-muted-foreground">Total Waste Objects Detected</span>
              <span className="font-semibold text-foreground">
                {detection.items.length} objects
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Objects List */}
      <div className="glass rounded-2xl p-4 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Scan className="size-5 text-primary" />
          Detected Objects Breakdown ({detection.items.length})
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
