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
  model_version: string;
  detection_status: 'pending' | 'completed' | 'failed';
  failure_reason: string | null;
  items: DetectionItem[];
  created_at: string;
  processing_time_ms: number | null;
  summary: Record<string, any> | null;
  segmentation?: SegmentationInfo | null;
  features?: Record<string, any> | null;
  risk?: Record<string, any> | null;
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
  hazard_indicators?: Record<string, any>;
  explanation?: string;
  severity?: string;
  cleanup_priority?: string;
  waterbody?: number;
  [key: string]: any;
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
