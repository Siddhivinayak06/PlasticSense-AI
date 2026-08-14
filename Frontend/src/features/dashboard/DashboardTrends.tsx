'use client';

import { TimeSeriesChart } from '@/features/analytics/TimeSeriesChart';
import type { TimeSeriesData } from '@/types/analytics';

// Generate 30 days of realistic mock data
const generateMockTrends = (): TimeSeriesData[] => {
  const data: TimeSeriesData[] = [];
  const today = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // Create realistic looking waves
    const baseValue = Math.floor(Math.random() * 20) + 10;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const weekendMultiplier = isWeekend ? 1.8 : 1;
    
    const total = Math.floor(baseValue * weekendMultiplier);
    const resolved = Math.floor(total * (Math.random() * 0.4 + 0.4)); // 40-80% resolved
    const critical = Math.floor(total * (Math.random() * 0.2)); // 0-20% critical
    
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total,
      resolved,
      critical,
    });
  }
  return data;
};

const mockData = generateMockTrends();

export function DashboardTrends() {
  return (
    <TimeSeriesChart data={mockData} />
  );
}
