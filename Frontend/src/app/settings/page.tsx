'use client';

import { useQuery } from '@tanstack/react-query';
import { Database, Cpu, Server, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { fetchHealth, fetchModelInfo } from '@/services/analytics';
import { getBaseUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/shared/PageLoader';
import { QueryError } from '@/components/shared/QueryError';
import { cn } from '@/lib/utils';

function Row({ label, value, ok }: { label: string; value: React.ReactNode; ok?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-border/40 last:border-0 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('font-medium text-right break-all', ok === false && 'text-amber-600 dark:text-amber-400')}>{value}</dd>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof Server; title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-3">
        <Icon className="size-4 text-primary" aria-hidden="true" /> {title}
      </h2>
      <dl>{children}</dl>
    </section>
  );
}

export default function SystemStatusPage() {
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth });
  const model = useQuery({ queryKey: ['model-info'], queryFn: fetchModelInfo, staleTime: 5 * 60_000 });

  const refresh = () => { health.refetch(); model.refetch(); };
  const h = health.data;
  const db = h?.database;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">System Status</h1>
          <p className="text-muted-foreground mt-1">Live state of the API, database and AI models.</p>
        </div>
        <Button variant="outline" onClick={refresh} className="gap-2" disabled={health.isFetching}>
          <RefreshCw className={cn('size-4', health.isFetching && 'animate-spin')} aria-hidden="true" /> Refresh
        </Button>
      </div>

      {health.isLoading ? (
        <PageLoader label="Checking services…" />
      ) : health.isError || !h ? (
        <QueryError title="API unreachable" onRetry={refresh} />
      ) : (
        <>
          <div
            role="status"
            className={cn(
              'rounded-2xl border px-5 py-4 flex items-center gap-3',
              h.status === 'ok' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5',
            )}
          >
            {h.status === 'ok'
              ? <CheckCircle2 className="size-6 text-emerald-500" aria-hidden="true" />
              : <AlertTriangle className="size-6 text-amber-500" aria-hidden="true" />}
            <div>
              <p className="font-semibold">{h.status === 'ok' ? 'All systems operational' : 'Running in a degraded state'}</p>
              <p className="text-sm text-muted-foreground">
                {h.status === 'ok'
                  ? 'Database connected and model weights present.'
                  : db?.using_fallback
                    ? 'The configured database is unreachable; data is being read from and written to the local SQLite fallback.'
                    : 'Check the database and model sections below.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel icon={Database} title="Database">
              <Row label="Status" value={db?.status ?? '—'} ok={db?.status === 'connected'} />
              <Row label="Provider" value={db?.provider ?? '—'} />
              <Row label="Backend" value={db?.backend ?? '—'} ok={!db?.using_fallback} />
              <Row label="Host" value={db?.host ?? 'local file'} />
              <Row label="Ping latency" value={db?.latency_ms != null ? `${db.latency_ms} ms` : '—'} />
              {db?.using_fallback && <Row label="Fallback reason" value={db.fallback_reason ?? 'unknown'} ok={false} />}
            </Panel>

            <Panel icon={Server} title="API">
              <Row label="Base URL" value={getBaseUrl()} />
              <Row label="Overall" value={h.status} ok={h.status === 'ok'} />
              <Row label="Models loaded in memory" value={h.models.loaded ? 'Yes' : 'Not yet (loads on first analysis)'} />
              <Row label="Detector weights present" value={h.models.detector_weights_present ? 'Yes' : 'Missing'} ok={h.models.detector_weights_present} />
              <Row label="Segmenter weights present" value={h.models.segmenter_weights_present ? 'Yes' : 'Missing'} ok={h.models.segmenter_weights_present} />
            </Panel>
          </div>

          <Panel icon={Cpu} title="AI Models">
            {model.isLoading ? (
              <p className="text-sm text-muted-foreground py-2">Loading model information (first load can take a few seconds)…</p>
            ) : model.isError || !model.data ? (
              <p className="text-sm text-muted-foreground py-2">Model information unavailable.</p>
            ) : (
              <>
                <Row label="Inference device" value={model.data.device} />
                <Row label="Input resolution" value={`${model.data.image_size}px`} />
                <Row label="Detector" value={`${model.data.detector.name} (${model.data.detector.architecture}), ${Object.keys(model.data.detector.classes).length} classes, conf ≥ ${model.data.detector.confidence_threshold}`} />
                <Row label="Segmenter" value={`${model.data.segmenter.name} (${model.data.segmenter.architecture}), ${Object.keys(model.data.segmenter.classes).length} materials, conf ≥ ${model.data.segmenter.confidence_threshold}`} />
                <Row label="Segmenter materials" value={Object.values(model.data.segmenter.classes).join(', ')} />
              </>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
