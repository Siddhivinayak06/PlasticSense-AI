// ─── Detection Item ──────────────────────────────────────────────

export interface DetectionItem {
  id: string;
  class_name: string;
  waste_group: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
}

// ─── Detection Response ──────────────────────────────────────────

export interface SegmentationInfo {
  waste_coverage_percent: number;
  material_coverage: Record<string, number>;
  material_counts: Record<string, number>;
}

export interface Detection {
  id: string;
  image_url: string;
  annotated_image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source?: string | null;
  location_confidence?: number | null;
  /** EXIF capture time (ISO-8601). Distinct from created_at, which is upload time. */
  captured_at?: string | null;
  model_version: string;
  detection_status: 'pending' | 'completed' | 'failed';
  failure_reason: string | null;
  items: DetectionItem[];
  created_at: string;
  processing_time_ms: number | null;
  summary: DetectionSummary | null;
  segmentation?: SegmentationInfo | null;
  features?: DetectionFeatures | null;
  risk?: DetectionRisk | null;
}

/** Scalar summary; per-material counts are added under each waste group name. */
export interface DetectionSummary {
  total_objects?: number;
  waste_coverage_percent?: number;
  risk_score?: number;
  severity?: string;
  cleanup_priority?: string;
  explanation?: string;
  [group: string]: string | number | undefined;
}

export interface DetectionFeatures {
  waste_coverage_percent?: number;
  material_coverage?: Record<string, number>;
  material_counts?: Record<string, number>;
  [key: string]: unknown;
}

/** Risk assessment as embedded in a detection response. */
export interface DetectionRisk {
  id: string;
  score: number;
  level: string;
  severity?: string;
  cleanup_priority?: string;
  explanation?: string;
  component_scores?: Record<string, number> | null;
  component_weights?: Record<string, number> | null;
  logistics?: Record<string, unknown> | null;
  estimated_density_label?: string | null;
  strategy_breakdown?: RiskBreakdown;
}

// ─── API Envelope ────────────────────────────────────────────────

export interface DetectionEnvelope {
  data: Detection;
  meta: Record<string, unknown> | null;
  error: string | null;
}

export interface MapDetectionEnvelope {
  detections: Detection[];
}

// ─── Risk Assessment ─────────────────────────────────────────────

export interface RiskBreakdown {
  coverage?: number;
  density?: number;
  composition?: number;
  hazard?: number;
  object_count?: number;
  waste_coverage_percent?: number;
  material_coverage?: Record<string, number>;
  material_counts?: Record<string, number>;
  material_proportions?: Record<string, number>;
  hazard_indicators?: Record<string, number | boolean | string>;
  explanation?: string;
  severity?: string;
  cleanup_priority?: string;
  waterbody?: number;
  /** Rule-based logistics guidance produced by the backend risk engine. */
  logistics?: {
    team_size?: string;
    estimated_time?: string;
    suggested_resources?: string;
    target_response_urgency?: string;
  };
  estimated_density_label?: string;
  [key: string]: unknown;
}

export interface RiskAssessment {
  id: string;
  detection_id: string;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  severity?: string;
  cleanup_priority?: string;
  explanation?: string;
  strategy_breakdown: RiskBreakdown;
  computed_at: string;
}

export interface RiskEnvelope {
  data: RiskAssessment;
  meta: Record<string, unknown> | null;
  error: string | null;
}
