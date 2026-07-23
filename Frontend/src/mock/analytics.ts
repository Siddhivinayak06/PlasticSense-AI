import { KPI, Insight, TimeSeriesData, PlasticDistributionData, SeverityData, LocationData, CleanupPerformanceData, AIAnalyticsData } from '@/types/analytics';
import { format, subDays, subMonths } from 'date-fns';

const now = new Date();

// ─── MOCK KPIs ─────────────────────────────────────────
export const mockKPIs: KPI[] = [
  {
    id: 'kpi-1', title: 'Total Reports', value: '4,521', trend: 'up', percentageChange: 12.5,
    sparklineData: Array.from({ length: 14 }).map((_, i) => ({ date: `Day ${i}`, value: 10 + Math.random() * 20 }))
  },
  {
    id: 'kpi-2', title: 'Resolved Reports', value: '3,842', trend: 'up', percentageChange: 8.2,
    sparklineData: Array.from({ length: 14 }).map((_, i) => ({ date: `Day ${i}`, value: 5 + Math.random() * 15 }))
  },
  {
    id: 'kpi-3', title: 'Critical Hotspots', value: '47', trend: 'down', percentageChange: -4.1,
    sparklineData: Array.from({ length: 14 }).map((_, i) => ({ date: `Day ${i}`, value: 10 - Math.random() * 5 }))
  },
  {
    id: 'kpi-4', title: 'Avg Response Time', value: '1.8 Days', trend: 'down', percentageChange: -15.4,
    sparklineData: Array.from({ length: 14 }).map((_, i) => ({ date: `Day ${i}`, value: 3 - Math.random() * 1 }))
  },
];

// ─── MOCK TIME SERIES (Last 12 Months) ─────────────────
export const mockTimeSeriesData: TimeSeriesData[] = Array.from({ length: 12 }).map((_, i) => {
  const d = subMonths(now, 11 - i);
  return {
    date: format(d, 'MMM yyyy'),
    total: 300 + Math.floor(Math.random() * 200) + (i * 15),
    resolved: 250 + Math.floor(Math.random() * 180) + (i * 12),
    critical: 50 + Math.floor(Math.random() * 30) - (i * 2),
  };
});

// ─── MOCK DAILY TIME SERIES (Last 30 Days) ─────────────
export const mockDailySeriesData: TimeSeriesData[] = Array.from({ length: 30 }).map((_, i) => {
  const d = subDays(now, 29 - i);
  return {
    date: format(d, 'MMM dd'),
    total: 10 + Math.floor(Math.random() * 15),
    resolved: 8 + Math.floor(Math.random() * 10),
    critical: Math.floor(Math.random() * 5),
  };
});

// ─── MOCK PLASTIC DISTRIBUTION ──────────────────────────
export const mockPlasticDistribution: PlasticDistributionData[] = [
  { name: 'PET Bottles', value: 45, fill: 'var(--color-pet, #06b6d4)' }, // cyan-500
  { name: 'Plastic Bags', value: 25, fill: 'var(--color-bags, #3b82f6)' }, // blue-500
  { name: 'Food Wrappers', value: 15, fill: 'var(--color-wrappers, #f59e0b)' }, // amber-500
  { name: 'Styrofoam', value: 8, fill: 'var(--color-styrofoam, #8b5cf6)' }, // violet-500
  { name: 'Multi-layer', value: 5, fill: 'var(--color-multilayer, #ec4899)' }, // pink-500
  { name: 'Other', value: 2, fill: 'var(--color-other, #64748b)' }, // slate-500
];

// ─── MOCK SEVERITY BY CITY ──────────────────────────────
export const mockSeverityData: SeverityData[] = [
  { name: 'Mumbai', low: 120, medium: 200, high: 150, critical: 80 },
  { name: 'Chennai', low: 90, medium: 150, high: 100, critical: 40 },
  { name: 'Kochi', low: 60, medium: 80, high: 45, critical: 15 },
  { name: 'Goa', low: 150, medium: 110, high: 50, critical: 10 },
  { name: 'Kolkata', low: 80, medium: 130, high: 90, critical: 50 },
];

// ─── MOCK LOCATION ANALYTICS (Radar) ────────────────────
export const mockLocationData: LocationData[] = [
  { city: 'Mumbai', reports: 100, hotspots: 80, avgSeverity: 90, cleanups: 70 },
  { city: 'Chennai', reports: 80, hotspots: 60, avgSeverity: 75, cleanups: 85 },
  { city: 'Kochi', reports: 50, hotspots: 40, avgSeverity: 50, cleanups: 90 },
  { city: 'Goa', reports: 60, hotspots: 30, avgSeverity: 40, cleanups: 95 },
  { city: 'Kolkata', reports: 75, hotspots: 70, avgSeverity: 80, cleanups: 65 },
];

// ─── MOCK CLEANUP PERFORMANCE ───────────────────────────
export const mockCleanupPerformance: CleanupPerformanceData[] = Array.from({ length: 6 }).map((_, i) => {
  const d = subMonths(now, 5 - i);
  return {
    month: format(d, 'MMM'),
    completed: 150 + Math.floor(Math.random() * 50) + (i * 10),
    pending: 50 + Math.floor(Math.random() * 20) - (i * 5),
    efficiency: 75 + Math.floor(Math.random() * 15) + i,
  };
});

// ─── MOCK AI ANALYTICS ──────────────────────────────────
export const mockAIAnalytics: AIAnalyticsData[] = [
  { category: 'PET Bottles', accuracy: 98, confidence: 95 },
  { category: 'Plastic Bags', accuracy: 92, confidence: 88 },
  { category: 'Food Wrappers', accuracy: 89, confidence: 85 },
  { category: 'Styrofoam', accuracy: 85, confidence: 80 },
  { category: 'Multi-layer', accuracy: 82, confidence: 78 },
  { category: 'Ghost Nets', accuracy: 78, confidence: 75 },
];

// ─── MOCK INSIGHTS ──────────────────────────────────────
export const mockInsights: Insight[] = [
  { id: 'ins-1', type: 'positive', message: 'Plastic bottle reports decreased by 18% this month in coastal regions.', timestamp: '2 hours ago' },
  { id: 'ins-2', type: 'alert', message: 'Mumbai Coast is showing a 25% spike in critical severity reports this week.', timestamp: '5 hours ago' },
  { id: 'ins-3', type: 'positive', message: 'Cleanup efficiency improved by 12% across all NGO partners.', timestamp: '1 day ago' },
  { id: 'ins-4', type: 'neutral', message: 'Food wrapper detections have remained stable over the last 30 days.', timestamp: '2 days ago' },
  { id: 'ins-5', type: 'negative', message: 'Response time for critical hotspots in Chennai has increased by 0.5 days.', timestamp: '3 days ago' },
];
