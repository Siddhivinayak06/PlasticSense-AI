'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  Layers,
  Info,
  BarChart3,
  RefreshCw,
  Camera,
  Aperture,
  SwitchCamera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { submitDetection, fetchRiskAssessment, resolveImageUrl, fetchSystemHealth, fetchSystemConfig, riskFromDetection, type SystemConfig } from '@/services/detection';
import { apiErrorMessage } from '@/lib/api';
import type { Detection, DetectionItem, RiskAssessment } from '@/types/detection';
import exifr from 'exifr';
import { cn } from '@/lib/utils';
import { ImageComparison } from '@/components/shared/ImageComparison';


const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
const MAX_UPLOAD_MB = 25;
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
        <p className="text-xs text-muted-foreground/60 mt-2">Supports JPG, PNG, WEBP, BMP · Max {MAX_UPLOAD_MB} MB</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
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

// ─── Detect Mode ────────────────────────────────────────────────

type DetectMode = 'upload' | 'camera';

function DirectCameraSnapView({
  onSnap,
}: {
  onSnap: (file: File) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const [cameraState, setCameraState] = useState<'idle' | 'opening' | 'active' | 'error'>('idle');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState('');
  const [captureFlash, setCaptureFlash] = useState(false);

  // Discover all available video input devices
  const refreshDevices = useCallback(async () => {
    try {
      if (navigator.mediaDevices?.enumerateDevices) {
        const devs = await navigator.mediaDevices.enumerateDevices();
        const vDevs = devs.filter((d) => d.kind === 'videoinput');
        setVideoDevices(vDevs);
        return vDevs;
      }
    } catch {
      // ignore
    }
    return [];
  }, []);

  useEffect(() => {
    refreshDevices();
  }, [refreshDevices]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraState('idle');
  }, []);

  const startCamera = useCallback(async (preferredDeviceId?: string) => {
    setCameraState('opening');
    setCameraError('');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }

      const devs = await refreshDevices();
      let stream: MediaStream | null = null;
      let lastErr: unknown = null;

      // Build priority list of device IDs to try:
      // 1. Explicit preferredDeviceId (if user selected one)
      // 2. Devices that mention "Integrated" or "Built-in"
      // 3. Other detected video devices
      const candidateIds: (string | undefined)[] = [];
      if (preferredDeviceId) {
        candidateIds.push(preferredDeviceId);
      }
      // Prioritize integrated camera if not explicitly specified
      const integrated = devs.find((d) => d.label.toLowerCase().includes('integrated') || d.label.toLowerCase().includes('internal'));
      if (integrated && integrated.deviceId !== preferredDeviceId) {
        candidateIds.push(integrated.deviceId);
      }
      for (const d of devs) {
        if (!candidateIds.includes(d.deviceId)) {
          candidateIds.push(d.deviceId);
        }
      }
      if (candidateIds.length === 0) {
        candidateIds.push(undefined);
      }

      // Try each candidate until one connects
      for (const devId of candidateIds) {
        try {
          const constraints: MediaStreamConstraints = {
            video: devId
              ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : true,
            audio: false,
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) {
            if (devId) setSelectedDeviceId(devId);
            break;
          }
        } catch (e) {
          lastErr = e;
        }
      }

      // Final generic fallback
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (e) {
          lastErr = e;
        }
      }

      if (!stream) {
        throw lastErr || new Error('Could not start any video source.');
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      // Refresh devices again so labels become available after permission is granted
      refreshDevices();
      setCameraState('active');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isLocked = msg.includes('Could not start video source') || (err as { name?: string })?.name === 'NotReadableError';

      if (isLocked) {
        setCameraError(
          'Camera is locked: another application (e.g. Microsoft Teams or Zoom) is running, or your laptop camera privacy slider is closed.',
        );
      } else if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setCameraError('Camera permission was denied. Please allow camera access in your browser address bar.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setCameraError('No camera device detected on this computer.');
      } else {
        setCameraError(`Camera error: ${msg}`);
      }
      setCameraState('error');
    }
  }, [refreshDevices]);

  const snapPhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCaptureFlash(true);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const snapFile = new File([blob], `camera_snap_${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      stopCamera();
      onSnap(snapFile);
    }, 'image/jpeg', 0.9);
  }, [onSnap, stopCamera]);

  const switchCamera = useCallback(() => {
    if (videoDevices.length > 1) {
      const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevId = videoDevices[nextIndex].deviceId;
      setSelectedDeviceId(nextDevId);
      startCamera(nextDevId);
    } else {
      startCamera();
    }
  }, [videoDevices, selectedDeviceId, startCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-3"
    >
      <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-black aspect-video flex items-center justify-center">
        {cameraState === 'idle' && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
              <Camera className="size-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Live Camera</p>
              <p className="text-xs text-white/60 mt-0.5">Snap a photo directly with your camera</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId || undefined)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all active:scale-95"
              >
                <Camera className="size-3.5" />
                Open Camera
              </button>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all active:scale-95"
                title="Select a photo from your computer or mobile camera"
              >
                <Upload className="size-3.5" />
                Browse Photo
              </button>
            </div>
          </div>
        )}

        {cameraState === 'opening' && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <Loader2 className="size-8 text-primary animate-spin" />
            <p className="text-sm text-white/80">Connecting camera...</p>
          </div>
        )}

        {cameraState === 'error' && (
          <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              <AlertTriangle className="size-6" />
            </div>
            <p className="text-xs text-red-400 max-w-[280px] leading-relaxed">{cameraError}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startCamera(selectedDeviceId || undefined)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary hover:bg-primary/90 text-white shadow-sm transition-all active:scale-95"
              >
                <RefreshCw className="size-3.5" />
                Retry
              </button>
              <button
                type="button"
                onClick={() => nativeCameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all active:scale-95"
              >
                <Upload className="size-3.5" />
                Browse from Computer
              </button>
            </div>
          </div>
        )}

        {/* Video feed element for viewfinder */}
        <video
          ref={videoRef}
          className={cn('w-full h-full object-cover', cameraState !== 'active' && 'hidden')}
          playsInline
          muted
          autoPlay
        />

        {/* Shutter flash animation */}
        <AnimatePresence>
          {captureFlash && (
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-white z-20 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Viewfinder brackets */}
        {cameraState === 'active' && (
          <div className="absolute inset-4 pointer-events-none">
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-primary/80 rounded-tl" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-primary/80 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-primary/80 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-primary/80 rounded-br" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={nativeCameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSnap(f);
          }}
        />
      </div>

      {/* Camera shutter controls */}
      {cameraState === 'active' && (
        <div className="flex items-center justify-center gap-3 py-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={switchCamera}
            className="rounded-full size-10 border-border/60"
            title="Switch front/back camera"
          >
            <SwitchCamera className="size-4" />
          </Button>

          <Button
            type="button"
            onClick={snapPhoto}
            className="rounded-full px-6 gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 h-11"
          >
            <Aperture className="size-5" />
            <span className="font-semibold text-sm">Snap Photo</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={stopCamera}
            className="rounded-full size-10 border-border/60 text-muted-foreground hover:text-foreground"
            title="Cancel"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}

function DetectionResults({
  detection,
  risk,
  imageUrl,
  file,
  systemConfig,
}: {
  detection: Detection;
  risk: RiskAssessment | null;
  imageUrl: string;
  file?: File;
  systemConfig?: SystemConfig | null;
}) {
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  const riskCfg = risk ? RISK_CONFIG[risk.level] : null;
  const wasteCoverage = detection.segmentation?.waste_coverage_percent ?? (typeof detection.summary?.waste_coverage_percent === 'number' ? detection.summary.waste_coverage_percent : null);
  const materialCoverage = detection.segmentation?.material_coverage ?? (typeof detection.summary?.material_coverage === 'object' ? detection.summary.material_coverage : null);
  const materialCounts = detection.segmentation?.material_counts ?? (typeof detection.summary?.material_counts === 'object' ? detection.summary.material_counts : null);

  const nonGroupKeys = new Set(['total_objects', 'waste_coverage_percent', 'material_coverage', 'material_counts', 'risk_score', 'severity', 'cleanup_priority', 'explanation']);

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
              <span className="font-medium text-foreground">{detection.items.length}</span> fine-grained object{detection.items.length !== 1 ? 's' : ''} detected
              {wasteCoverage !== null && (
                <> · <span className="font-medium text-foreground">{wasteCoverage}%</span> scene waste coverage</>
              )}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-muted-foreground">
            {detection.model_version.split('(')[0].trim()} • {detection.processing_time_ms || 0} ms
          </span>
        </div>
      </div>

      {/* Coverage & Priority KPI Badges */}
      {wasteCoverage !== null && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                Detected Waste Index <span className="font-normal lowercase tracking-normal text-muted-foreground/80">(indicative)</span>
              </p>
              <p className="text-lg font-bold text-primary mt-0.5">{wasteCoverage}%</p>
            </div>
            <Layers className="size-5 text-primary opacity-80" />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Priority Level</p>
              <p className="text-lg font-bold capitalize text-foreground mt-0.5">
                {risk?.cleanup_priority || detection.summary?.cleanup_priority || risk?.level || 'Standard'}
              </p>
            </div>
            <ShieldAlert className="size-5 text-primary opacity-80" />
          </div>
        </div>
      )}

      {/* Advisory Authenticity / AI-generation Screening Callout */}
      {detection.authenticity_screening && detection.authenticity_screening.flag_level !== 'unspecified' && (
        <div className={cn(
          "flex items-start gap-2.5 p-3 rounded-xl border text-xs",
          detection.authenticity_screening.ai_generation_suspected
            ? "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400"
            : "bg-muted/30 border-border/40 text-muted-foreground"
        )}>
          <Info className="size-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold flex items-center gap-1.5">
              <span>Image Screening:</span>
              <span className={cn(
                "px-1.5 py-0.5 rounded font-mono text-[10px] uppercase",
                detection.authenticity_screening.ai_generation_suspected
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              )}>
                {detection.authenticity_screening.ai_generation_suspected ? 'Review Recommended' : 'Consistent with camera capture'}
              </span>
              <span className="font-mono text-[10px] opacity-70">
                (suspicion: {detection.authenticity_screening.suspicion_score})
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-85">
              {detection.authenticity_screening.caveat}
            </p>
          </div>
        </div>
      )}

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
      {(detection.items.length > 0 || (wasteCoverage !== null && wasteCoverage > 0)) ? (
        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Waste Summary</h3>
            </div>
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              {materialCoverage && Object.keys(materialCoverage).length > 0 ? 'Material Composition (Coverage %)' : 'Waste Composition'}
            </h4>
            <div className="space-y-2.5">
              {materialCoverage && Object.keys(materialCoverage).length > 0 ? (
                Object.entries(materialCoverage)
                  .sort(([, a], [, b]) => Number(b) - Number(a))
                  .map(([material, cov]) => {
                    const count = materialCounts?.[material] ?? 0;
                    return (
                      <div key={material} className="flex items-center gap-3">
                        <div className="w-24 truncate text-[11px] font-medium text-foreground capitalize">
                          {material} {count > 0 && <span className="opacity-60 text-[10px]">({count})</span>}
                        </div>
                        <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${Math.min(100, Math.max(5, (Number(cov) / (wasteCoverage || 1)) * 100))}%`,
                              backgroundColor: systemConfig?.waste_groups?.[material.toLowerCase()]?.hex || 'var(--primary)'
                            }}
                          />
                        </div>
                        <div className="w-14 text-right text-[11px] font-semibold text-muted-foreground">{Number(cov).toFixed(2)}%</div>
                      </div>
                    );
                  })
              ) : (
                detection.summary && Object.entries(detection.summary)
                  .filter(([k, v]) => !nonGroupKeys.has(k) && typeof v === 'number')
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([group, count]) => {
                    const numCount = count as number;
                    const total = detection.items.length > 0 ? detection.items.length : 1;
                    const percentage = Math.round((numCount / total) * 100);
                    return (
                      <div key={group} className="flex items-center gap-3">
                        <div className="w-24 truncate text-[11px] font-medium text-foreground capitalize">{group}</div>
                        <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: systemConfig?.waste_groups?.[group.toLowerCase()]?.hex || 'var(--primary)'
                            }}
                          />
                        </div>
                        <div className="w-12 text-right text-[11px] font-semibold text-muted-foreground">{percentage}%</div>
                      </div>
                    );
                  })
              )}
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
              {(
                Object.entries(
                  detection.items.reduce<Record<string, { count: number; items: DetectionItem[]; group: string }>>((acc, item) => {
                    if (!acc[item.class_name]) {
                      acc[item.class_name] = { count: 0, items: [], group: item.waste_group };
                    }
                    acc[item.class_name].count += 1;
                    acc[item.class_name].items.push(item);
                    return acc;
                  }, {})
                ) as [string, { count: number; items: DetectionItem[]; group: string }][]
              )
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([className, data]) => {
                let groupClass = 'border-border/50 bg-muted/20 text-muted-foreground';
                if (systemConfig?.waste_groups?.[data.group.toLowerCase()]) {
                  groupClass = systemConfig.waste_groups[data.group.toLowerCase()].color;
                } else {
                  const groupColors: Record<string, string> = {
                    plastic: 'border-sky-500/30 bg-sky-500/5 text-sky-600 dark:text-sky-400',
                    glass: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
                    metal: 'border-slate-500/30 bg-slate-500/5 text-slate-600 dark:text-slate-400',
                    paper: 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400',
                    cardboard: 'border-orange-500/30 bg-orange-500/5 text-orange-600 dark:text-orange-400',
                  };
                  groupClass = groupColors[data.group.toLowerCase()] || groupClass;
                }
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
  const [mode, setMode] = useState<DetectMode>('upload');
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
  const [systemOnline, setSystemOnline] = useState(true);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    fetchSystemHealth().then((data) => {
      setSystemOnline(data?.status === 'ok');
    }).catch(() => {
      setSystemOnline(false);
    });

    fetchSystemConfig().then((data) => {
      setSystemConfig(data);
    }).catch(() => setSystemConfig(null)); // colours fall back to the theme default
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setErrorMsg(`"${f.name}" is not a supported image. Use JPG, PNG, WEBP or BMP.`);
      setState('error');
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setErrorMsg(`"${f.name}" is ${(f.size / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_UPLOAD_MB} MB.`);
      setState('error');
      return;
    }
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

    if ((lat === null) !== (lng === null)) {
      setErrorMsg('Enter both latitude and longitude, or leave both empty.');
      return;
    }
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

      if (det.risk) {
        setRisk(riskFromDetection(det));
      } else if (det.detection_status === 'completed') {
        try {
          const riskEnvelope = await fetchRiskAssessment(det.id);
          setRisk(riskEnvelope.data);
        } catch {
          // risk is optional — continue without it
        }
      }
      setState('done');

    } catch (err) {
      setErrorMsg(apiErrorMessage(err, 'Detection failed. Please try again.'));
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
    setState('idle');
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
            Upload a geotagged image or stream camera frames to detect and classify waste in real-time.
          </p>
        </div>

        {/* System Status */}
        {systemOnline ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
            <div className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">AI System Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 shrink-0">
            <div className="relative flex size-2">
              <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
            </div>
            <span className="text-xs font-medium text-red-600 dark:text-red-400">AI System Offline</span>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Upload panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass rounded-2xl p-6 space-y-5"
        >
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/40">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/40">
              <button
                type="button"
                onClick={() => {
                  setMode('upload');
                  if (state === 'error') setErrorMsg('');
                }}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  mode === 'upload'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                <Upload className="size-3.5" />
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('camera');
                  if (state === 'error') setErrorMsg('');
                }}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  mode === 'camera'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                <Camera className="size-3.5" />
                Live Camera
              </button>
            </div>
            {mode === 'camera' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                <span className="size-1.5 rounded-full bg-primary" />
                Camera Mode
              </span>
            )}
          </div>

          {/* Mode Body: Upload zone / preview OR DirectCameraSnapView */}
          {!file ? (
            mode === 'upload' ? (
              <UploadZone
                onFile={handleFile}
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                fileInputRef={fileInputRef}
              />
            ) : (
              <DirectCameraSnapView onSnap={handleFile} />
            )
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
                  systemConfig={systemConfig}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
