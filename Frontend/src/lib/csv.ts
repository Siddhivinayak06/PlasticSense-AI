import type { Detection } from '@/types/detection';

type Cell = string | number | boolean | null | undefined;

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return '';
  let s = String(value);
  // Neutralise spreadsheet formula injection from user-influenced text.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((r) => r.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, header: string[], rows: Cell[][]): void {
  const blob = new Blob(['﻿' + toCsv(header, rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const REPORT_CSV_HEADER = [
  'id', 'uploaded_at', 'captured_at', 'status', 'latitude', 'longitude', 'location_source',
  'objects', 'waste_coverage_percent', 'risk_score', 'risk_level', 'cleanup_priority', 'model_version',
];

export function reportCsvRows(detections: Detection[]): Cell[][] {
  return detections.map((d) => [
    d.id,
    d.created_at,
    d.captured_at ?? '',
    d.detection_status,
    d.latitude,
    d.longitude,
    d.location_source ?? '',
    d.items.length,
    d.segmentation?.waste_coverage_percent ?? '',
    d.risk?.score ?? '',
    d.risk?.level ?? '',
    d.risk?.cleanup_priority ?? '',
    d.model_version,
  ]);
}
