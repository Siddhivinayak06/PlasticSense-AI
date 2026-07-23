import { Hotspot, Priority, HotspotStatus } from '@/types/hotspot';

const CITIES = ['Mumbai', 'Chennai', 'Goa', 'Kochi', 'Visakhapatnam'];
const PLASTIC_TYPES = ['PET Bottles', 'Plastic Bags', 'Food Wrappers', 'Microplastics', 'Fishing Nets', 'Styrofoam'];
const NGOS = ['Ocean Crusaders', 'Beach Please', 'Green Waves', 'Coastal Care', 'Blue Ocean Society'];

// Helper to get a random item
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
// Helper to get multiple random items
const getRandomMultiple = <T>(arr: T[], max: number): T[] => {
  const count = Math.floor(Math.random() * max) + 1;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
// Helper to get a random number between min and max
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const mockHotspots: Hotspot[] = Array.from({ length: 35 }).map((_, index) => {
  const city = getRandom(CITIES);
  const severityScore = getRandomInt(30, 100);
  
  let priority: Priority = 'low';
  if (severityScore > 85) priority = 'critical';
  else if (severityScore > 70) priority = 'high';
  else if (severityScore > 50) priority = 'medium';

  const riskLevel = priority === 'critical' ? 'extreme' : priority === 'high' ? 'high' : priority === 'medium' ? 'moderate' : 'low';
  
  return {
    id: `HS-2026-${String(index + 1).padStart(3, '0')}`,
    name: `${city} Coastal Area ${index + 1}`,
    location: {
      lat: 15.0 + Math.random() * 5,
      lng: 73.0 + Math.random() * 7,
      address: `Near Beach Road, Sector ${getRandomInt(1, 10)}`,
      city: city,
    },
    reportCount: getRandomInt(10, 500),
    severityScore,
    criticalReports: getRandomInt(0, 20),
    plasticTypes: getRandomMultiple(PLASTIC_TYPES, 4),
    priority,
    status: getRandom(['pending', 'in-progress', 'resolved', 'verified'] as HotspotStatus[]),
    lastUpdated: new Date(Date.now() - getRandomInt(0, 10) * 86400000).toISOString(),
    cleanupProgress: getRandomInt(0, 100),
    riskLevel,
    trend: getRandom(['increasing', 'stable', 'decreasing'] as const),
    nearbyWaterBody: `${city} Sea`,
    mostCommonPlastic: getRandom(PLASTIC_TYPES),
    assignedTeam: Math.random() > 0.5 ? getRandom(NGOS) : undefined,
    recommendedAction: 'Dispatch standard cleanup crew and setup waste segregation bins.',
    notes: 'Access via main beach entrance. Heavy machinery might be required for large debris.',
  };
});
