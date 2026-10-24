import type { Detection } from '@/types/detection';
import type {
  Report,
  ReportSeverity,
  CleanupPriority,
  FullReportStatus,
  PlasticType,
} from '@/types/report';

/**
 * Map a backend Detection onto the UI's Report shape.
 *
 * The Report interface was designed against mock data and contains fields the
 * backend does not produce (assigned team, nearby water body, disposal method,
 * status history, comments, street address). Those are returned EMPTY here rather
 * than filled with plausible-looking values: a municipal tool that invents an
 * assigned team or a nearby water body is worse than one that shows nothing.
 *
 * `UNKNOWN_FIELD` marks every such gap so the UI can render "not available".
 */
export const UNKNOWN_FIELD = '';

const SEVERITY_BY_LEVEL: Record<string, ReportSeverity> = {
  low: 'low',
  medium: 'medium',
  moderate: 'medium',
  high: 'high',
  critical: 'critical',
};

const PRIORITY_BY_LABEL: Record<string, CleanupPriority> = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

/** Infer a coarse item form from the detector's class name. NOT a resin/polymer type. */
function itemFormFromClassName(className: string): PlasticType {
  const c = className.toLowerCase();
  if (c.includes('bottle')) return 'bottle';
  if (c.includes('bag')) return 'bag';
  if (c.includes('wrapper') || c.includes('snack')) return 'wrapper';
  if (c.includes('cup') || c.includes('box') || c.includes('container')) return 'other';
  return 'other';
}

/** Pick the most frequently detected class to characterise the report. */
function dominantClass(detection: Detection): string | null {
  if (!detection.items?.length) return null;
  const counts = new Map<string, number>();
  for (const item of detection.items) {
    counts.set(item.class_name, (counts.get(item.class_name) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function detectionToReport(detection: Detection): Report {
  const risk = detection.risk;
  const features = detection.features ?? {};
  const topClass = dominantClass(detection);

  const avgConfidence = detection.items?.length
    ? detection.items.reduce((sum, i) => sum + i.confidence, 0) / detection.items.length
    : 0;

  const severityRaw = String(risk?.level ?? risk?.severity ?? '').toLowerCase();
  const priorityRaw = String(risk?.cleanup_priority ?? '').toUpperCase();

  return {
    id: detection.id,
    imageUrl: detection.annotated_image_url ?? detection.image_url,
    plasticType: topClass ? itemFormFromClassName(topClass) : 'other',
    plasticTypeLabel: topClass ? topClass.replace(/_/g, ' ') : 'No items detected',
    confidence: Math.round(avgConfidence * 100),
    detectedObjects: detection.items?.length ?? 0,
    severity: SEVERITY_BY_LEVEL[severityRaw] ?? 'low',
    cleanupPriority: PRIORITY_BY_LABEL[priorityRaw] ?? 'low',

    // The backend tracks pipeline state (pending/completed/failed), not an
    // operational review workflow. Everything that has been analysed is 'pending'
    // review; nothing here claims a human has verified or resolved it.
    status: (detection.detection_status === 'completed'
      ? 'pending'
      : 'rejected') as FullReportStatus,

    reportedDate: (detection.captured_at ?? detection.created_at).slice(0, 10),
    lat: detection.latitude ?? 0,
    lng: detection.longitude ?? 0,

    // Not derivable without a reverse-geocoding service, which is not configured.
    city: UNKNOWN_FIELD,
    address: UNKNOWN_FIELD,
    // No assignment workflow links detections to teams yet.
    assignedTeam: UNKNOWN_FIELD,
    description: String(risk?.explanation ?? ''),
    // Would require a hydrology layer; none is integrated.
    nearbyWaterBody: UNKNOWN_FIELD,
    disposalMethod: UNKNOWN_FIELD,
    statusHistory: [],
    comments: [],

    riskScore: typeof risk?.score === 'number' ? risk.score : undefined,
    wasteCoverage:
      typeof features.waste_coverage_percent === 'number'
        ? features.waste_coverage_percent
        : undefined,
    locationSource: detection.location_source ?? undefined,
    materialCounts: (features.material_counts as Record<string, number>) ?? undefined,
  };
}

export function detectionsToReports(detections: Detection[]): Report[] {
  return detections.map(detectionToReport);
}
