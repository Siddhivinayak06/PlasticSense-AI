export interface NGO {
  id: string;
  name: string;
  city: string;
  state: string;
  teamSize: number;
  activeAssignments: number;
  completedCleanups: number;
  avgCompletionDays: number;
  currentWorkload: 'light' | 'moderate' | 'heavy' | 'overloaded';
  performanceScore: number; // 0-100
  availability: 'available' | 'busy' | 'unavailable';
  specializations: string[];
  contactEmail: string;
  contactPhone: string;
  joinedDate: string;
  totalWasteCollectedKg: number;
  verifiedCleanups: number;
}

const NGO_NAMES = [
  'Green Earth Foundation',
  'Ocean Crusaders',
  'Eco Warriors India',
  'Clean Coast Initiative',
  'Blue Ocean Society',
  'Beach Please Foundation',
  'Marine Protectors',
  'Save Our Shores',
  'Plastic Free Seas',
  'Coastal Defenders',
  'Tide Turners Alliance',
  'Green Waves Foundation',
];

const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Goa', state: 'Goa' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Mangalore', state: 'Karnataka' },
  { city: 'Puri', state: 'Odisha' },
];

const SPECIALIZATIONS = [
  'Beach Cleanup',
  'River Cleanup',
  'Coastal Waste',
  'Plastic Recycling',
  'Microplastic Research',
  'Community Education',
  'Industrial Waste',
  'Water Quality Monitoring',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateMockNGOs(): NGO[] {
  const rand = seededRandom(2026);
  return NGO_NAMES.map((name, i) => {
    const loc = CITIES[i % CITIES.length];
    const completedCleanups = Math.floor(rand() * 80) + 10;
    const totalWaste = completedCleanups * (Math.floor(rand() * 150) + 50);
    const verified = Math.floor(completedCleanups * (0.7 + rand() * 0.25));
    const activeAssignments = Math.floor(rand() * 6) + 1;
    const teamSize = Math.floor(rand() * 25) + 8;
    const perfScore = Math.floor(rand() * 30) + 70;

    const workloads: NGO['currentWorkload'][] = ['light', 'moderate', 'heavy', 'overloaded'];
    const workload = activeAssignments <= 2 ? 'light' : activeAssignments <= 4 ? 'moderate' : activeAssignments <= 5 ? 'heavy' : 'overloaded';

    const specs = SPECIALIZATIONS
      .sort(() => rand() - 0.5)
      .slice(0, Math.floor(rand() * 3) + 2);

    return {
      id: `NGO-${String(i + 1).padStart(3, '0')}`,
      name,
      city: loc.city,
      state: loc.state,
      teamSize,
      activeAssignments,
      completedCleanups,
      avgCompletionDays: parseFloat((rand() * 4 + 1.5).toFixed(1)),
      currentWorkload: workload,
      performanceScore: perfScore,
      availability: activeAssignments <= 3 ? 'available' : activeAssignments <= 5 ? 'busy' : 'unavailable',
      specializations: specs,
      contactEmail: `contact@${name.toLowerCase().replace(/\s+/g, '')}.org`,
      contactPhone: `+91-${Math.floor(rand() * 9000000000 + 1000000000)}`,
      joinedDate: new Date(2024, Math.floor(rand() * 12), Math.floor(rand() * 28) + 1).toISOString(),
      totalWasteCollectedKg: totalWaste,
      verifiedCleanups: verified,
    };
  });
}

export const mockNGOs = generateMockNGOs();
