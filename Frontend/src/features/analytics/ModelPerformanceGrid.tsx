'use client';

import { motion } from 'framer-motion';
import { Brain, Cpu, Gauge, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { InsightsData, ModelInfo } from '@/services/analytics';
import { DataNote } from '@/components/shared/QueryError';

interface ModelPerformanceGridProps {
  performance: InsightsData['model_performance'];
  modelInfo?: ModelInfo;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--background))',
  borderColor: 'hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

function StatCard({ icon: Icon, label, value, detail, delay }: {
  icon: typeof Cpu; label: string; value: string; detail: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl p-5"
    >
      <Icon className="size-5 text-primary mb-3" aria-hidden="true" />
      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground break-words">{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{detail}</p>
    </motion.div>
  );
}

export function ModelPerformanceGrid({ performance, modelInfo }: ModelPerformanceGridProps) {
  const total = Object.values(performance.status_counts).reduce((a, b) => a + b, 0);
  const completed = performance.status_counts.completed ?? 0;
  const failed = performance.status_counts.failed ?? 0;
  const pending = performance.status_counts.pending ?? 0;
  const { latency_ms: latency } = performance;
  const confidenceData = performance.confidence_by_group.map((g) => ({
    group: g.waste_group.charAt(0).toUpperCase() + g.waste_group.slice(1),
    'Mean confidence (%)': Math.round(g.avg_confidence * 1000) / 10,
    detections: g.count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Cpu}
          label="Active models"
          value={modelInfo ? `${modelInfo.detector.architecture} + ${modelInfo.segmenter.architecture}` : '—'}
          detail={modelInfo ? `Detector ${Object.keys(modelInfo.detector.classes).length} classes · segmenter ${Object.keys(modelInfo.segmenter.classes).length} materials · ${modelInfo.device}` : 'Model info unavailable'}
          delay={0.05}
        />
        <StatCard
          icon={Brain}
          label="Images processed"
          value={total.toLocaleString()}
          detail={`${completed} completed · ${failed} failed · ${pending} pending`}
          delay={0.1}
        />
        <StatCard
          icon={Gauge}
          label="Inference time (p50 / p95)"
          value={latency.p50 != null ? `${latency.p50} / ${latency.p95} ms` : '—'}
          detail={latency.samples ? `Measured server-side over ${latency.samples} analyses` : 'No timed analyses yet'}
          delay={0.15}
        />
        <StatCard
          icon={MapPin}
          label="Reports with location"
          value={total ? `${performance.with_location} / ${total}` : '—'}
          detail={Object.entries(performance.location_sources).map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join(' · ') || 'No reports yet'}
          delay={0.2}
        />
      </div>

      {pending > 0 && (
        <DataNote>
          {pending} report{pending === 1 ? ' is' : 's are'} still marked <strong>pending</strong>: analysis was interrupted
          before results were saved (for example, the server stopped mid-request). They contain no detections.
        </DataNote>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="xl:col-span-2 glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="size-4 text-primary" aria-hidden="true" />
            Mean model confidence by material
          </h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            The confidence the model reported for its own detections. This is <strong>not accuracy</strong>: {performance.accuracy_note.toLowerCase()}
          </p>
          {confidenceData.length ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confidenceData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} unit="%" />
                  <YAxis type="category" dataKey="group" width={80} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                  <Bar dataKey="Mean confidence (%)" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-12 text-center">No detections stored yet.</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground">Confidence distribution</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Number of stored detections per confidence band.</p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance.confidence_histogram} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="bucket" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                <Bar dataKey="count" name="Detections" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
