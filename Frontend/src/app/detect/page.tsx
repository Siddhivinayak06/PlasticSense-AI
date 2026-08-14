'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  ImageIcon,
  MapPin,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Scan,
  ShieldAlert,
  Zap,
  Layers,
  Droplets,
  Info,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitDetection, fetchRiskAssessment, resolveImageUrl } from '@/services/detection';
import type { Detection, RiskAssessment } from '@/types/detection';
import exifr from 'exifr';
import { cn } from '@/lib/utils';
import { ImageComparison } from '@/components/shared/ImageComparison';
import { DetectionCard } from '@/components/shared/DetectionCard';
import { CleanupRecommendation } from '@/features/dashboard/CleanupRecommendation';

// ─── Helpers ────────────────────────────────────────────────────

const RISK_CONFIG = {
  low: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', bar: 'bg-emerald-500', label: 'Low Risk' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', bar: 'bg-amber-500', label: 'Medium Risk' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30', bar: 'bg-orange-500', label: 'High Risk' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', bar: 'bg-red-500', label: 'Critical Risk' },
};

// ─── Sub-components ─────────────────────────────────────────────

function UploadZone({
  onFile,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  fileInputRef,
}: {
  onFile: (f: File) => void;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer select-none',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border/60 bg-muted/30 hover:border-primary/50 hover:bg-primary/5',
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        className={cn(
          'flex size-20 items-center justify-center rounded-2xl transition-all',
          isDragging ? 'bg-primary/20' : 'bg-primary/10',
        )}
      >
        <Upload className={cn('size-9 transition-colors', isDragging ? 'text-primary' : 'text-primary/60')} />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-base font-semibold text-foreground">Drop your image here</p>
        <p className="text-sm text-muted-foreground">
          or <span className="text-primary font-medium underline underline-offset-2">browse files</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">Supports JPG, PNG, WEBP · Max 10 MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </motion.div>
  );
}

function ImagePreview({
  preview,
  file,
  onRemove,
}: {
  preview: string;
  file: File;
  onRemove: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-2xl overflow-hidden border border-border/50 shadow-lg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-white/90 truncate max-w-[220px]">{file.name}</p>
          <p className="text-[10px] text-white/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="flex size-7 items-center justify-center rounded-full bg-black/50 text-white/80 hover:bg-black/70 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function DetectionResults({
  detection,
  risk,
  imageUrl,
  file,
}: {
  detection: Detection;
  risk: RiskAssessment | null;
  imageUrl: string;
  file?: File;
}) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const riskCfg = risk ? RISK_CONFIG[risk.level] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Status banner */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <CheckCircle className="size-4.5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Detection Complete</p>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{detection.items.length}</span> waste object{detection.items.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-muted-foreground">
            {detection.model_version} • {detection.processing_time_ms || 0} ms
          </span>
        </div>
      </div>

      {/* Detected image comparison */}
      <div className="py-2">
        <ImageComparison 
          originalImage={imageUrl} 
          annotatedImage={resolveImageUrl(detection.annotated_image_url) || imageUrl} 
          items={detection.items}
          hoveredItemId={hoveredItemId}
          onItemHover={setHoveredItemId}
        />
      </div>

      {/* Detected objects & Waste Summary */}
      {detection.items.length > 0 ? (
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Waste Summary</h3>
            </div>
          </div>
          
          <div className="pt-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Waste Composition</h4>
            <div className="space-y-2.5">
              {detection.summary && Object.entries(detection.summary)
                .filter(([k]) => k !== 'total_objects')
                .sort(([, a], [, b]) => b - a)
                .map(([group, count]) => {
                  const percentage = Math.round((count / detection.items.length) * 100);
                  return (
                    <div key={group} className="flex items-center gap-3">
                      <div className="w-24 truncate text-[11px] font-medium text-foreground">{group}</div>
                      <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-1000" 
                          style={{ width: `${percentage}%` }} 
                        />
                      </div>
                      <div className="w-12 text-right text-[11px] font-semibold text-muted-foreground">{percentage}%</div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scan className="size-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Detected Objects</h3>
              </div>
              <span className="text-[10px] text-muted-foreground">{detection.items.length} total</span>
            </div>
            
            {/* Grouped item list */}
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(
                detection.items.reduce((acc, item) => {
                  if (!acc[item.class_name]) {
                    acc[item.class_name] = { count: 0, items: [], group: item.waste_group };
                  }
                  acc[item.class_name].count += 1;
                  acc[item.class_name].items.push(item);
                  return acc;
                }, {} as Record<string, { count: number; items: DetectionItem[]; group: string }>)
              )
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([className, data]) => {
                const groupColors: Record<string, string> = {
                  plastic: 'border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400',
                  glass: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
                  metal: 'border-slate-500/30 bg-slate-500/5 text-slate-600 dark:text-slate-400',
                  paper: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400',
                  cardboard: 'border-orange-500/30 bg-orange-500/5 text-orange-600 dark:text-orange-400',
                };
                const groupClass = groupColors[data.group.toLowerCase()] || 'border-border/50 bg-muted/20 text-muted-foreground';
                const avgConfidence = data.items.reduce((sum, i) => sum + i.confidence, 0) / data.count;

                return (
                  <div 
                    key={className}
                    className={`flex items-center justify-between rounded-lg border p-2.5 transition-colors ${groupClass} ${hoveredItemId === className ? 'border-primary shadow-sm' : ''}`}
                    onMouseEnter={() => setHoveredItemId(className)}
                    onMouseLeave={() => setHoveredItemId(null)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground capitalize">
                          {className.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] font-bold opacity-70 uppercase tracking-wider">
                          {data.group || 'UNKNOWN'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold">{data.count} objects</span>
                        <span className="text-[10px] opacity-70">{Math.round(avgConfidence * 100)}% avg conf</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 border border-border/50 px-4 py-3">
          <Info className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">No waste objects detected. Try another image or a clearer view of the waste.</p>
        </div>
      )}

      {/* Image Metadata */}
      <div className="glass rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Info className="size-4 text-primary" />
          Image Information
        </h3>
        <div className="grid grid-cols-2 gap-y-3 text-xs">
          {file && (
            <>
              <div className="text-muted-foreground">Filename:</div>
              <div className="font-medium truncate" title={file.name}>{file.name}</div>
              <div className="text-muted-foreground">File Size:</div>
              <div className="font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </>
          )}
          <div className="text-muted-foreground">Location:</div>
          <div className="font-medium">
            {detection.latitude !== null && detection.longitude !== null ? (
              <div className="space-y-1.5">
                {detection.location_source === 'image_exif' ? (
                  <div className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                    <MapPin className="size-3" /> Image GPS
                  </div>
                ) : detection.location_source === 'image_overlay_ocr' ? (
                  <div className="inline-flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                    <MapPin className="size-3" /> GPS Overlay
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold text-[10px]">
                    <MapPin className="size-3" /> Device GPS
                  </div>
                )}
                <div className="font-mono text-[11px] text-foreground">
                  {detection.latitude.toFixed(6)}, {detection.longitude.toFixed(6)}
                </div>
                <div className="pt-1">
                  <a href={`/map?lat=${detection.latitude}&lng=${detection.longitude}`} className="text-primary hover:underline text-[10px] inline-flex items-center gap-1">
                    View on Pollution Map &rarr;
                  </a>
                </div>
              </div>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted/50 border px-2 py-0.5 rounded-full font-semibold text-[10px]">
                <MapPin className="size-3" /> No GPS
              </span>
            )}
          </div>
          <div className="text-muted-foreground">Detection Time:</div>
          <div className="font-medium">{new Date(detection.created_at).toLocaleString()}</div>
        </div>
      </div>

      {/* Risk Assessment / Cleanup Recommendation */}
      {risk && (
        <div className="pt-2">
          <CleanupRecommendation risk={risk} wasteCount={detection.items.length} />
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

type UploadState = 'idle' | 'detecting' | 'done' | 'error';

export default function DetectPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [exifStatus, setExifStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');

  const [state, setState] = useState<UploadState>('idle');
  const [detection, setDetection] = useState<Detection | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setState('idle');
    setDetection(null);
    setRisk(null);
    setErrorMsg('');
    setExifStatus('loading');
    
    try {
      const gps = await exifr.gps(f);
      if (gps && typeof gps.latitude === 'number' && typeof gps.longitude === 'number') {
        setLatitude(gps.latitude.toFixed(6));
        setLongitude(gps.longitude.toFixed(6));
        setExifStatus('found');
      } else {
        setExifStatus('not_found');
      }
    } catch (e) {
      setExifStatus('not_found');
    }
  }, []);

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setState('idle');
    setDetection(null);
    setRisk(null);
    setExifStatus('idle');
    setLatitude('');
    setLongitude('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setUseCurrentLocation(true);
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
    );
  };

  const handleSubmit = async () => {
    if (!file) return;

    const lat = latitude ? parseFloat(latitude) : null;
    const lng = longitude ? parseFloat(longitude) : null;
    
    if ((lat !== null && isNaN(lat)) || (lng !== null && isNaN(lng))) {
      setErrorMsg('Please enter valid GPS coordinates or leave them empty.');
      return;
    }
    if (lat !== null && (lat < -90 || lat > 90)) {
      setErrorMsg('Latitude out of range.');
      return;
    }
    if (lng !== null && (lng < -180 || lng > 180)) {
      setErrorMsg('Longitude out of range.');
      return;
    }

    setState('detecting');
    setErrorMsg('');
    setDetection(null);
    setRisk(null);

    try {
      const det = await submitDetection(file, lat, lng);
      setDetection(det);

      if (det.detection_status === 'completed' && det.items.length > 0) {
        try {
          const riskEnvelope = await fetchRiskAssessment(det.id);
          setRisk(riskEnvelope.data);
        } catch {
          // risk is optional — continue without it
        }
      }
      setState('done');
    } catch (err: any) {
      let msg = 'Detection failed. Make sure the backend is running on port 8000.';
      if (err?.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string'
          ? err.response.data.detail
          : JSON.stringify(err.response.data.detail);
      } else if (err?.message) {
        msg = err.message;
      }
      setErrorMsg(msg);
      setState('error');
    }

  };

  const resetAll = () => {
    setFile(null);
    setPreview(null);
    setDetection(null);
    setRisk(null);
    setExifStatus('idle');
    setLatitude('');
    setLongitude('');
  };

  const canSubmit = !!file && state !== 'detecting';

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">Waste Detection</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Upload a geotagged image to detect and classify waste using AI.
          </p>
        </div>
        
        {/* System Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
          <div className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">AI System Online</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Upload panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass rounded-2xl p-6 space-y-5"
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4.5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Image Upload</h2>
          </div>

          {/* Upload zone / preview */}
          {!file ? (
            <UploadZone
              onFile={handleFile}
              isDragging={isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              fileInputRef={fileInputRef}
            />
          ) : (
            <ImagePreview preview={preview!} file={file} onRemove={handleRemove} />
          )}

          {/* GPS Coordinates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">GPS Coordinates</span>
                <span className="text-xs text-muted-foreground font-normal ml-1">(Optional)</span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={getLocation}
                disabled={locationLoading}
                className="gap-1.5 text-xs text-primary"
                id="use-current-location-btn"
              >
                {locationLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MapPin className="size-3.5" />
                )}
                Use my location
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="latitude-input" className="text-xs text-muted-foreground font-medium">
                  Latitude
                </label>
                <input
                  id="latitude-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 12.9716"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="longitude-input" className="text-xs text-muted-foreground font-medium">
                  Longitude
                </label>
                <input
                  id="longitude-input"
                  type="number"
                  step="any"
                  placeholder="e.g. 77.5946"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
            </div>

            {useCurrentLocation ? (
              <p className="text-[11px] text-amber-500 flex items-center gap-1">
                <MapPin className="size-3" /> 📍 Device GPS Selected
              </p>
            ) : exifStatus === 'loading' ? (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" /> Checking image for EXIF GPS...
              </p>
            ) : exifStatus === 'found' ? (
              <p className="text-[11px] text-emerald-500 flex items-center gap-1">
                <MapPin className="size-3" /> 📍 Image GPS metadata found
              </p>
            ) : exifStatus === 'not_found' ? (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Info className="size-3" /> No EXIF GPS found. The AI will attempt to read GPS overlays, or you can use your device location.
              </p>
            ) : null}
          </div>

          <Button
            id="run-detection-btn"
            className="w-full gap-2"
            size="default"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {state === 'detecting' ? (
              <span className="flex flex-col items-center gap-1 py-1">
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Processing...
                </span>
              </span>
            ) : (
              <>
                <Scan className="size-4" />
                Run Detection
              </>
            )}
          </Button>

          {/* Error message */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3"
              >
                <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Right: Results panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="glass rounded-2xl p-6 min-h-[420px] flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4.5 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Detection Results</h2>
            </div>
            {state === 'done' && (
              <Button variant="ghost" size="xs" onClick={resetAll} className="gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="size-3.5" />
                New scan
              </Button>
            )}
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              {state === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center"
                >
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
                    <Scan className="size-8 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No scan yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Upload an image and enter coordinates to start
                    </p>
                  </div>
                </motion.div>
              )}

              {state === 'detecting' && (
                <motion.div
                  key="detecting"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-6 py-16"
                >
                  <div className="relative flex size-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                    <Scan className="size-8 text-primary" />
                  </div>
                  <div className="text-center space-y-1.5 flex flex-col items-center">
                    <p className="text-sm font-semibold text-foreground animate-pulse">Uploading image...</p>
                    <p className="text-sm font-semibold text-foreground animate-pulse delay-100">Extracting location...</p>
                    <p className="text-sm font-semibold text-foreground animate-pulse delay-200">Analyzing waste...</p>
                    <p className="text-sm font-semibold text-primary animate-pulse delay-300">Running YOLO11...</p>
                    <p className="text-xs text-muted-foreground mt-2">Generating detection results...</p>
                  </div>
                </motion.div>
              )}

              {state === 'error' && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 py-16 text-center"
                >
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10">
                    <AlertTriangle className="size-8 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-destructive">Detection Failed</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">{errorMsg}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={resetAll} className="gap-1.5">
                    <RefreshCw className="size-3.5" /> Try again
                  </Button>
                </motion.div>
              )}

              {state === 'done' && detection && (
                <DetectionResults
                  detection={detection}
                  risk={risk}
                  imageUrl={resolveImageUrl(detection.image_url)}
                  file={file!}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
