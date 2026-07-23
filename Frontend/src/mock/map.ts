import { Report, ReportSeverity, PlasticType, FullReportStatus, CleanupPriority } from '@/types/report';
import { Hotspot } from '@/types/map';
import { severityOrder } from '@/constants/reports';

const indianCities = [
  { city: 'Mumbai', lat: 19.0760, lng: 72.8777, radius: 0.15 },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707, radius: 0.1 },
  { city: 'Kochi', lat: 9.9312, lng: 76.2673, radius: 0.08 },
  { city: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, radius: 0.08 },
  { city: 'Goa', lat: 15.2993, lng: 74.1240, radius: 0.12 },
  { city: 'Puri', lat: 19.8135, lng: 85.8312, radius: 0.05 },
  { city: 'Kolkata', lat: 22.5726, lng: 88.3639, radius: 0.1 },
  { city: 'Mangalore', lat: 12.9141, lng: 74.8560, radius: 0.06 },
  { city: 'Trivandrum', lat: 8.5241, lng: 76.9366, radius: 0.05 },
  { city: 'Surat', lat: 21.1702, lng: 72.8311, radius: 0.07 },
];

const plasticTypes: { val: PlasticType; label: string }[] = [
  { val: 'bottle', label: 'PET Bottles' },
  { val: 'bag', label: 'Plastic Bags' },
  { val: 'wrapper', label: 'Food Wrappers' },
  { val: 'styrofoam', label: 'Styrofoam Pieces' },
  { val: 'multilayer', label: 'Multi-layer Packaging' },
  { val: 'other', label: 'Other/Mixed Debris' },
];

const severities: ReportSeverity[] = ['low', 'medium', 'high', 'critical'];
const statuses: FullReportStatus[] = ['pending', 'verified', 'assigned', 'in-progress', 'resolved', 'rejected'];
const priorities: CleanupPriority[] = ['low', 'medium', 'high', 'urgent'];

// Helper for deterministic random based on seed
function seededRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generate 100 Reports around these cities
export const mockMapReports: Report[] = Array.from({ length: 100 }).map((_, i) => {
  const seed = 5000 + i;
  const cityObj = indianCities[Math.floor(seededRandom(seed) * indianCities.length)];
  
  const ptObj = plasticTypes[Math.floor(seededRandom(seed + 1) * plasticTypes.length)];
  const severity = severities[Math.floor(seededRandom(seed + 2) * severities.length)];
  const status = statuses[Math.floor(seededRandom(seed + 3) * statuses.length)];
  const priority = priorities[Math.floor(seededRandom(seed + 4) * priorities.length)];

  // Random coordinates near city center
  const r = cityObj.radius * Math.sqrt(seededRandom(seed + 5));
  const theta = seededRandom(seed + 6) * 2 * Math.PI;
  const lat = cityObj.lat + r * Math.cos(theta);
  const lng = cityObj.lng + r * Math.sin(theta);

  // Generate date within last 30 days
  const daysAgo = Math.floor(seededRandom(seed + 7) * 30);
  const reportedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: `REP-${Math.floor(seededRandom(seed + 8) * 90000) + 10000}`,
    plasticType: ptObj.val,
    plasticTypeLabel: ptObj.label,
    severity,
    status,
    reportedDate,
    imageUrl: '/placeholder-bottle.svg',
    detectedObjects: Math.floor(seededRandom(seed + 9) * 50) + 5,
    confidence: Math.floor(seededRandom(seed + 10) * 30) + 70, // 70-99
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    city: cityObj.city,
    address: `${['Marine Drive', 'Beach Road', 'Coastal Highway', 'Harbor Point', 'Estuary View'][Math.floor(seededRandom(seed + 11) * 5)]}, ${cityObj.city}`,
    cleanupPriority: priority,
    description: `Accumulation of ${ptObj.label} detected along the shoreline. Requires attention.`,
    nearbyWaterBody: `${cityObj.city} Coast`,
    assignedTeam: status === 'pending' || status === 'verified' || status === 'rejected' ? 'Unassigned' : `Coastal Cleanup Team ${Math.floor(seededRandom(seed + 12) * 5) + 1}`,
    disposalMethod: 'Recycling Facility Processing',
    statusHistory: [
      { id: `hist-${Math.floor(seededRandom(seed + 13) * 1000)}`, status: 'pending', timestamp: new Date(Date.now() - (daysAgo + 1) * 24 * 60 * 60 * 1000).toISOString(), user: 'System', note: 'Reported via automated drone.' }
    ],
    comments: [],
  };
});

// Generate 10 Hotspots centered around our 10 cities
export const mockHotspots: Hotspot[] = indianCities.map((city, i) => {
  const seed = 6000 + i;
  
  // Find reports near this city
  const cityReports = mockMapReports.filter(r => r.city === city.city);
  
  const total = cityReports.length || 5; // fallback if 0
  const critical = cityReports.filter(r => r.severity === 'critical' || r.severity === 'high').length;
  
  // Calculate average severity
  const avgSevScore = cityReports.reduce((acc, r) => acc + severityOrder[r.severity], 0) / total;
  const avgSev: Hotspot['averageSeverity'] = 
    avgSevScore >= 3.5 ? 'critical' : 
    avgSevScore >= 2.5 ? 'high' : 
    avgSevScore >= 1.5 ? 'medium' : 'low';

  const uniquePlastics = Array.from(new Set(cityReports.map(r => r.plasticTypeLabel)));

  return {
    id: `HOT-${100 + i}`,
    name: `${city.city} Coastal Zone`,
    lat: city.lat,
    lng: city.lng,
    radius: 5000 + Math.floor(seededRandom(seed) * 5000), // 5km - 10km radius
    totalReports: total,
    averageSeverity: avgSev,
    criticalReports: critical,
    lastUpdated: new Date(Date.now() - Math.floor(seededRandom(seed+1) * 24) * 60 * 60 * 1000).toISOString(), // within last 24h
    priorityBadge: avgSev === 'critical' || avgSev === 'high' ? 'Urgent Intervention' : 'Monitoring',
    plasticTypes: uniquePlastics.length > 0 ? uniquePlastics.slice(0, 3) : ['PET Bottles', 'Ghost Nets'],
    cleanupProgress: Math.floor(seededRandom(seed+2) * 80) + 10, // 10% - 90%
    assignedTeam: `Task Force ${['Alpha', 'Bravo', 'Charlie'][i % 3]}`,
    trend: avgSevScore > 2.5 ? 'increasing' : avgSevScore < 1.5 ? 'decreasing' : 'stable',
  };
});
