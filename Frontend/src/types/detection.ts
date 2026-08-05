// ─── Detection Item ──────────────────────────────────────────────

export interface DetectionItem {
  id: string;
  waste_type: string;
  confidence: number;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
}

// ─── Detection Response ──────────────────────────────────────────

export interface Detection {
  id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  model_version: string;
  detection_status: 'pending' | 'completed' | 'failed';
  failure_reason: string | null;
  items: DetectionItem[];
  created_at: string;
}

// ─── API Envelope ────────────────────────────────────────────────

export interface DetectionEnvelope {
  data: Detection;
  meta: Record<string, unknown> | null;
  error: string | null;
}

// ─── Risk Assessment ─────────────────────────────────────────────

export interface RiskBreakdown {
  object_count: number;
  density: number;
  hazard: number;
  waterbody: number;
}

export interface RiskAssessment {
  id: string;
  detection_id: string;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  strategy_breakdown: RiskBreakdown;
  computed_at: string;
}

export interface RiskEnvelope {
  data: RiskAssessment;
  meta: Record<string, unknown> | null;
  error: string | null;
}
