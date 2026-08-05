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
import type { Detection, RiskAssessment, DetectionItem } from '@/types/detection';
import { cn } from '@/lib/utils';

// ─── Helpers ────────────────────────────────────────────────────

const WASTE_LABELS: Record<string, string> = {
  PET_bottle: 'PET Bottle',
  plastic_bag: 'Plastic Bag',
  food_wrapper: 'Food Wrapper',
  styrofoam: 'Styrofoam',
  multilayer: 'Multi-layer Plastic',
  other: 'Other Plastic',
};

const WASTE_COLORS: Record<string, string> = {
  PET_bottle: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
  plastic_bag: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
  food_wrapper: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  styrofoam: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  multilayer: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
  other: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
};

const RISK_CONFIG = {
  low: { color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', bar: 'bg-emerald-500', label: 'Low Risk' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', bar: 'bg-amber-500', label: 'Medium Risk' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30', bar: 'bg-orange-500', label: 'High Risk' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', bar: 'bg-red-500', label: 'Critical Risk' },
};

function formatLabel(waste_type: string) {
  return WASTE_LABELS[waste_type] ?? waste_type;
}

function wasteClass(waste_type: string) {
  return WASTE_COLORS[waste_type] ?? WASTE_COLORS.other;
}

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
        'relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-12 transition-all cursor-pointer select-none',
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
      <img src={preview} alt="Preview" className="w-full max-h-72 object-cover" />
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
}: {
  detection: Detection;
  risk: RiskAssessment | null;
  imageUrl: string;
}) {
  const riskCfg = risk ? RISK_CONFIG[risk.level] : null;

  // Group items by type
  const grouped: Record<string, DetectionItem[]> = {};
  for (const item of detection.items) {
    grouped[item.waste_type] = grouped[item.waste_type] ?? [];
    grouped[item.waste_type].push(item);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Status banner */}
      <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
        <CheckCircle className="size-4.5 text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Detection Complete</p>
          <p className="text-xs text-muted-foreground">
            Found <span className="font-medium text-foreground">{detection.items.length}</span> plastic object{detection.items.length !== 1 ? 's' : ''} ·{' '}
            Model: <span className="font-medium text-foreground">{detection.model_version}</span>
          </p>
        </div>
      </div>

      {/* Detected image */}
      <div className="rounded-2xl overflow-hidden border border-border/50 shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Analysed image" className="w-full max-h-64 object-cover" />
      </div>

      {/* Detected objects */}
      {detection.items.length > 0 ? (
        <div className="glass rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Scan className="size-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Detected Objects</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(grouped).map(([type, items]) => (
              <span
                key={type}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium',
                  wasteClass(type),
                )}
              >
                {formatLabel(type)}
                <span className="ml-1 size-4 flex items-center justify-center rounded-full bg-current/20 text-[10px] font-bold">
                  {items.length}
                </span>
              </span>
            ))}
          </div>

          {/* Item list */}
          <div className="space-y-1.5 mt-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
            {detection.items.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className={cn('rounded-md border px-2 py-0.5 text-[11px] font-medium', wasteClass(item.waste_type))}>
                    {formatLabel(item.waste_type)}
                  </span>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {(item.confidence * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 rounded-xl bg-muted/40 border border-border/50 px-4 py-3">
          <Info className="size-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">No plastic objects detected in this image.</p>
        </div>
      )}

      {/* Risk Assessment */}
      {risk && riskCfg && (
        <div className={cn('glass rounded-2xl p-4 space-y-3 border', riskCfg.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className={cn('size-4', riskCfg.color)} />
              <h3 className="text-sm font-semibold text-foreground">Risk Assessment</h3>
            </div>
            <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full border', riskCfg.bg, riskCfg.color)}>
              {riskCfg.label}
            </span>
          </div>

          {/* Score bar */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Severity Score</span>
              <span className={cn('text-sm font-bold', riskCfg.color)}>{risk.score.toFixed(1)} / 100</span>
            </div>
            <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', riskCfg.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${risk.score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Factor breakdown */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Object Count', value: risk.strategy_breakdown.object_count, icon: Layers },
              { label: 'Density', value: risk.strategy_breakdown.density, icon: BarChart3 },
              { label: 'Hazard', value: risk.strategy_breakdown.hazard, icon: Zap },
              { label: 'Waterbody', value: risk.strategy_breakdown.waterbody, icon: Droplets },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl bg-background/40 px-3 py-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Icon className="size-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
                <p className={cn('text-sm font-bold', riskCfg.color)}>{value.toFixed(1)}</p>
              </div>
            ))}
          </div>
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

  const [state, setState] = useState<UploadState>('idle');
  const [detection, setDetection] = useState<Detection | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setState('idle');
    setDetection(null);
    setRisk(null);
    setErrorMsg('');
  }, []);

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setState('idle');
    setDetection(null);
    setRisk(null);
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

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setErrorMsg('Please enter valid GPS coordinates before scanning.');
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setErrorMsg('Coordinates out of range. Latitude: -90 to 90, Longitude: -180 to 180.');
      return;
    }

    setState('detecting');
    setErrorMsg('');
    setDetection(null);
    setRisk(null);

    try {
      const envelope = await submitDetection(file, lat, lng);
      const det = envelope.data;
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
    setState('idle');
    setErrorMsg('');
  };

  const canSubmit = !!file && latitude !== '' && longitude !== '' && state !== 'detecting';

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Detect Plastic</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload an image to run YOLO-based plastic detection and risk assessment in real time.
        </p>
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

            {useCurrentLocation && (
              <p className="text-[11px] text-emerald-500 flex items-center gap-1">
                <CheckCircle className="size-3" /> Using your current GPS location
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            id="run-detection-btn"
            className="w-full gap-2"
            size="default"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {state === 'detecting' ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Running YOLO Detection…
              </>
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
                  className="flex flex-col items-center justify-center h-full gap-5 py-16"
                >
                  <div className="relative flex size-20 items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
                    <Scan className="size-8 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-foreground">Running YOLO Inference…</p>
                    <p className="text-xs text-muted-foreground">This may take a few seconds on CPU</p>
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
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
