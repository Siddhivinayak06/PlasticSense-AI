import type {
  Report,
  PlasticType,
  ReportSeverity,
  FullReportStatus,
  CleanupPriority,
  StatusHistoryEntry,
  ReportComment,
} from '@/types/report';

// ─── Seed data ──────────────────────────────────────────────────

const cities = [
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, addresses: ['Juhu Beach Road', 'Versova Seafront', 'Dadar Chowpatty'] },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707, addresses: ['Marina Beach Rd', 'Elliot Beach Lane', 'Besant Nagar'] },
  { name: 'Goa', lat: 15.2993, lng: 74.124, addresses: ['Baga Beach Strip', 'Calangute Main Rd', 'Anjuna Flea Market'] },
  { name: 'Kochi', lat: 9.9312, lng: 76.2673, addresses: ['Fort Kochi Beach', 'Cherai Beach Rd', 'Marine Drive'] },
  { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, addresses: ['Ramakrishna Beach', 'Rushikonda Beach', 'RK Beach Road'] },
  { name: 'Puducherry', lat: 11.9416, lng: 79.8083, addresses: ['Promenade Beach', 'Paradise Beach', 'Auroville Beach'] },
  { name: 'Mangalore', lat: 12.9141, lng: 74.856, addresses: ['Panambur Beach', 'Tannirbhavi Beach', 'Surathkal Beach'] },
  { name: 'Thiruvananthapuram', lat: 8.5241, lng: 76.9366, addresses: ['Kovalam Beach Rd', 'Shangumugham Beach', 'Varkala Cliff'] },
  { name: 'Puri', lat: 19.7983, lng: 85.8249, addresses: ['Grand Road', 'Marine Drive Puri', 'Swargadwar Beach'] },
  { name: 'Ratnagiri', lat: 16.994, lng: 73.3, addresses: ['Ganpatipule Beach', 'Mandvi Beach', 'Bhatye Beach Rd'] },
];

const plasticTypes: { type: PlasticType; label: string }[] = [
  { type: 'bottle', label: 'PET Bottles' },
  { type: 'bag', label: 'Plastic Bags' },
  { type: 'wrapper', label: 'Food Wrappers' },
  { type: 'styrofoam', label: 'Styrofoam' },
  { type: 'multilayer', label: 'Multilayer Plastic' },
  { type: 'other', label: 'Other Plastics' },
];

const severities: ReportSeverity[] = ['low', 'medium', 'high', 'critical'];
const statuses: FullReportStatus[] = ['pending', 'verified', 'assigned', 'in-progress', 'resolved', 'rejected'];
const priorities: CleanupPriority[] = ['low', 'medium', 'high', 'urgent'];
const teams = ['Alpha Cleanup Crew', 'Beach Guardians', 'Ocean Warriors', 'Green Patrol', 'EcoForce Team', 'Coastal Defenders', 'Tide Turners', '—'];
const waterBodies = ['Arabian Sea', 'Bay of Bengal', 'Indian Ocean', 'Mandovi River', 'Periyar River', 'Zuari River', 'Chilika Lake', 'Vembanad Lake', '—'];
const disposalMethods = ['Recycling Center', 'Waste-to-Energy Plant', 'Specialized Plastic Processor', 'Municipal Waste Collection', 'NGO Partner Pickup', 'Chemical Recycling Facility'];

const commentUsers = [
  { user: 'Priya Sharma', avatar: '', role: 'Field Inspector' },
  { user: 'Rahul Patel', avatar: '', role: 'Team Lead' },
  { user: 'Anita Desai', avatar: '', role: 'Environmental Officer' },
  { user: 'Vikram Singh', avatar: '', role: 'AI Analyst' },
  { user: 'Meera Nair', avatar: '', role: 'Cleanup Coordinator' },
];

const commentTemplates = [
  'Confirmed plastic waste accumulation at this location. Recommend immediate cleanup.',
  'AI detection verified. Confidence score aligns with field observations.',
  'Assigned cleanup crew has been notified. ETA 48 hours.',
  'Water quality samples collected from nearby water body.',
  'Cleanup in progress. Approximately 60% complete.',
  'Additional waste discovered adjacent to reported area.',
  'Local volunteers have been coordinated for support.',
  'Post-cleanup verification scheduled for next week.',
];

// ─── Deterministic seeded random ────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ─── Generate status history ────────────────────────────────────

function generateStatusHistory(
  status: FullReportStatus,
  reportedDate: string,
  rand: () => number,
): StatusHistoryEntry[] {
  const allStages: { status: FullReportStatus; note: string }[] = [
    { status: 'pending', note: 'Report submitted via mobile app' },
    { status: 'verified', note: 'AI detection verified by field inspector' },
    { status: 'assigned', note: 'Cleanup crew assigned to location' },
    { status: 'in-progress', note: 'Cleanup operation started' },
    { status: 'resolved', note: 'Cleanup completed and verified' },
  ];

  const rejectedEntry = { status: 'rejected' as FullReportStatus, note: 'Report flagged as duplicate or invalid' };

  const statusIndex = allStages.findIndex((s) => s.status === status);
  let history: StatusHistoryEntry[];

  if (status === 'rejected') {
    const rejIdx = Math.min(Math.floor(rand() * 2) + 1, 2);
    history = allStages.slice(0, rejIdx).map((s, i) => ({
      id: `sh-${i}`,
      status: s.status,
      timestamp: offsetDate(reportedDate, i),
      note: s.note,
      user: commentUsers[Math.floor(rand() * commentUsers.length)].user,
    }));
    history.push({
      id: `sh-${history.length}`,
      status: 'rejected',
      timestamp: offsetDate(reportedDate, history.length),
      note: rejectedEntry.note,
      user: commentUsers[Math.floor(rand() * commentUsers.length)].user,
    });
  } else {
    const end = statusIndex >= 0 ? statusIndex + 1 : 1;
    history = allStages.slice(0, end).map((s, i) => ({
      id: `sh-${i}`,
      status: s.status,
      timestamp: offsetDate(reportedDate, i),
      note: s.note,
      user: commentUsers[Math.floor(rand() * commentUsers.length)].user,
    }));
  }

  return history;
}

function offsetDate(base: string, daysAfter: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + daysAfter);
  return d.toISOString();
}

// ─── Generate comments ──────────────────────────────────────────

function generateComments(rand: () => number, count: number): ReportComment[] {
  const comments: ReportComment[] = [];
  for (let i = 0; i < count; i++) {
    const cu = commentUsers[Math.floor(rand() * commentUsers.length)];
    comments.push({
      id: `c-${i}`,
      user: cu.user,
      avatar: cu.avatar,
      role: cu.role,
      content: commentTemplates[Math.floor(rand() * commentTemplates.length)],
      timestamp: `${Math.floor(rand() * 12) + 1} hours ago`,
    });
  }
  return comments;
}

// ─── Generate 50 reports ────────────────────────────────────────

function generateReports(): Report[] {
  const reports: Report[] = [];
  const rand = seededRandom(42);

  for (let i = 0; i < 50; i++) {
    const city = cities[Math.floor(rand() * cities.length)];
    const plastic = plasticTypes[Math.floor(rand() * plasticTypes.length)];
    const severity = severities[Math.floor(rand() * severities.length)];
    const status = statuses[Math.floor(rand() * statuses.length)];
    const priority = priorities[Math.floor(rand() * priorities.length)];

    const dayOffset = Math.floor(rand() * 60);
    const date = new Date(2026, 6, 14);
    date.setDate(date.getDate() - dayOffset);
    const reportedDate = date.toISOString().split('T')[0];

    const latOffset = (rand() - 0.5) * 0.08;
    const lngOffset = (rand() - 0.5) * 0.08;

    reports.push({
      id: `RPT-2026-${String(i + 1).padStart(3, '0')}`,
      imageUrl: `/placeholder-${plastic.type === 'bottle' ? 'bottle' : plastic.type === 'bag' ? 'bag' : 'wrapper'}.svg`,
      plasticType: plastic.type,
      plasticTypeLabel: plastic.label,
      confidence: Math.floor(rand() * 39) + 61, // 61-99
      detectedObjects: Math.floor(rand() * 44) + 1, // 1-44
      severity,
      cleanupPriority: priority,
      status,
      reportedDate,
      lat: parseFloat((city.lat + latOffset).toFixed(4)),
      lng: parseFloat((city.lng + lngOffset).toFixed(4)),
      city: city.name,
      address: city.addresses[Math.floor(rand() * city.addresses.length)],
      assignedTeam: status === 'pending' ? '—' : teams[Math.floor(rand() * (teams.length - 1))],
      description: `${plastic.label} contamination detected at ${city.addresses[Math.floor(rand() * city.addresses.length)]}, ${city.name}. AI model identified ${severity} severity waste accumulation requiring ${priority} priority cleanup.`,
      nearbyWaterBody: waterBodies[Math.floor(rand() * waterBodies.length)],
      disposalMethod: disposalMethods[Math.floor(rand() * disposalMethods.length)],
      statusHistory: generateStatusHistory(status, reportedDate, rand),
      comments: generateComments(rand, Math.floor(rand() * 3) + 1),
    });
  }

  return reports;
}

export const mockFullReports: Report[] = generateReports();

export function getReportById(id: string): Report | undefined {
  return mockFullReports.find((r) => r.id === id);
}
