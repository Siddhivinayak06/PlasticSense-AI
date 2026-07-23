import { CleanupAssignment, AssignmentStatus, Volunteer, Team, TaskItem, TimelineEvent } from '@/types/assignment';
import { mockHotspots } from './hotspots';
import { Priority } from '@/types/hotspot';

const NGOS = [
  'Ocean Crusaders', 'Beach Please', 'Green Waves', 'Coastal Care', 'Blue Ocean Society',
  'Eco Warriors', 'Save Our Shores', 'Marine Protectors', 'Clean Coast Init', 'Plastic Free Seas'
];

const VOLUNTEER_NAMES = [
  'Aarav Patel', 'Diya Sharma', 'Vihaan Singh', 'Ananya Gupta', 'Aditya Kumar',
  'Kavya Reddy', 'Arjun Verma', 'Saanvi Desai', 'Sai Joshi', 'Isha Mehta'
];

const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate 50 volunteers
const mockVolunteers: Volunteer[] = Array.from({ length: 50 }).map((_, i) => ({
  id: `VOL-${i + 1}`,
  name: `${getRandom(VOLUNTEER_NAMES)} ${i + 1}`,
  role: i % 5 === 0 ? 'leader' : 'member',
}));

// Generate 10 Teams
const mockTeams: Team[] = Array.from({ length: 10 }).map((_, i) => {
  const teamVols = mockVolunteers.slice(i * 5, (i + 1) * 5);
  return {
    id: `TEAM-${i + 1}`,
    name: `Team ${String.fromCharCode(65 + i)}`,
    ngo: NGOS[i],
    volunteers: teamVols,
  };
});

const DEFAULT_CHECKLIST: Omit<TaskItem, 'completed'>[] = [
  { id: 't1', label: 'Wear Gloves' },
  { id: 't2', label: 'Carry Collection Bags' },
  { id: 't3', label: 'Separate Plastic' },
  { id: 't4', label: 'Capture Before Photo' },
  { id: 't5', label: 'Capture After Photo' },
  { id: 't6', label: 'Dispose Properly' },
  { id: 't7', label: 'Mark Cleanup Complete' },
];

export const mockAssignments: CleanupAssignment[] = Array.from({ length: 105 }).map((_, index) => {
  const hotspot = getRandom(mockHotspots);
  const team = getRandom(mockTeams);
  const status = getRandom(['pending', 'assigned', 'in-progress', 'completed', 'verified', 'closed'] as AssignmentStatus[]);
  
  const progress = status === 'completed' || status === 'verified' || status === 'closed' ? 100 :
                   status === 'in-progress' ? getRandomInt(10, 90) : 0;

  const checklist: TaskItem[] = DEFAULT_CHECKLIST.map(item => ({
    ...item,
    completed: progress === 100 ? true : Math.random() > 0.5,
  }));

  const timeline: TimelineEvent[] = [
    { id: 'tl1', stage: 'reported', label: 'Reported', date: '2026-07-01T10:00:00Z', completed: true },
    { id: 'tl2', stage: 'verified', label: 'Verified', date: '2026-07-02T10:00:00Z', completed: true },
    { id: 'tl3', stage: 'assigned', label: 'Assigned', date: '2026-07-03T10:00:00Z', completed: status !== 'pending' },
    { id: 'tl4', stage: 'accepted', label: 'Team Accepted', date: '2026-07-04T10:00:00Z', completed: ['in-progress', 'completed', 'verified', 'closed'].includes(status) },
    { id: 'tl5', stage: 'started', label: 'Cleanup Started', date: '2026-07-05T10:00:00Z', completed: ['in-progress', 'completed', 'verified', 'closed'].includes(status) },
    { id: 'tl6', stage: 'completed', label: 'Cleanup Completed', date: '2026-07-06T10:00:00Z', completed: ['completed', 'verified', 'closed'].includes(status) },
    { id: 'tl7', stage: 'inspection', label: 'Inspection', date: '2026-07-07T10:00:00Z', completed: ['verified', 'closed'].includes(status) },
    { id: 'tl8', stage: 'closed', label: 'Closed', date: '2026-07-08T10:00:00Z', completed: status === 'closed' },
  ];

  return {
    id: `CLN-2026-${String(index + 1).padStart(4, '0')}`,
    hotspotId: hotspot.id,
    hotspotName: hotspot.name,
    assignedNgo: team.ngo,
    team: team,
    assignedDate: new Date(Date.now() - getRandomInt(2, 10) * 86400000).toISOString(),
    scheduledDate: new Date(Date.now() + getRandomInt(-5, 5) * 86400000).toISOString(),
    status,
    priority: hotspot.priority,
    progress,
    equipmentChecklist: checklist,
    timeline,
    estimatedDurationHours: getRandomInt(2, 8),
    supervisorNotes: 'Ensure safety protocols are strictly followed near the rocky areas.',
  };
});
