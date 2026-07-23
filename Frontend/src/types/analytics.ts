export interface KPI {
  id: string;
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'neutral';
  percentageChange: number;
  sparklineData: { date: string; value: number }[];
}

export interface Insight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'alert';
  message: string;
  timestamp: string;
}

export interface TimeSeriesData {
  date: string;
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

export interface LocationData {
  city: string;
  reports: number;
  hotspots: number;
  avgSeverity: number;
  cleanups: number;
}

export interface CleanupPerformanceData {
  month: string;
  completed: number;
  pending: number;
  efficiency: number; // percentage
}

export interface AIAnalyticsData {
  category: string;
  accuracy: number;
  confidence: number;
}
