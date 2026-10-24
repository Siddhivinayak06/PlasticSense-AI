export interface KPI {
  id: string;
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  /** Week-over-week change; null when there is not enough history to compare. */
  percentageChange: number | null;
  sparklineData: { date: string; value: number }[];
  hint?: string;
}

export interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'alert';
  message: string;
  timestamp: string;
}

export interface TimeSeriesData {
  date: string;
  /** YYYY-MM-DD; enables monthly aggregation */
  isoDate?: string;
  total: number;
  resolved: number;
  critical: number;
}

export interface PlasticDistributionData {
  name: string;
  value: number;
  fill: string;
}

export interface SeverityData {
  name: string;
  low: number;
  medium: number;
  high: number;
  critical: number;
}

/** One observed cluster (same clustering as the Hotspots page). */
export interface LocationData {
  hotspotId: string;
  name: string;
  reports: number;
  wasteObjects: number;
  /** Null when no member report has a risk assessment. */
  avgRisk: number | null;
  maxRisk: number | null;
  severity: string;
  cleanupsCompleted: number;
}

export interface CleanupPerformanceData {
  month: string;
  created: number;
  completed: number;
  /** completed / created for the month, as a percentage; null when nothing was created. */
  completionRate: number | null;
}
