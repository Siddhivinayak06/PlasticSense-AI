export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'critical' | 'warning' | 'info' | 'success';
  type: 'hotspot' | 'cleanup' | 'verification' | 'assignment' | 'system';
  timestamp: string;
  read: boolean;
  actionHref?: string;
}

export const mockNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Critical hotspot detected near Mumbai',
    message: 'New critical pollution hotspot identified at Juhu Beach. 238 waste objects detected across 32 reports.',
    category: 'critical',
    type: 'hotspot',
    timestamp: '5 min ago',
    read: false,
    actionHref: '/hotspots',
  },
  {
    id: 'notif-2',
    title: 'Cleanup assignment accepted',
    message: 'Eco Warriors India has accepted cleanup assignment CLN-2026-0042 at Marina Beach.',
    category: 'success',
    type: 'assignment',
    timestamp: '15 min ago',
    read: false,
    actionHref: '/assignments',
  },
  {
    id: 'notif-3',
    title: 'Cleanup verification required',
    message: 'Green Earth Foundation has submitted after-cleanup evidence for Versova Beach. Awaiting admin verification.',
    category: 'warning',
    type: 'verification',
    timestamp: '1 hour ago',
    read: false,
    actionHref: '/verification',
  },
  {
    id: 'notif-4',
    title: 'Hotspot severity increased',
    message: 'Chennai Coastal Zone severity has increased from High to Critical based on 12 new reports.',
    category: 'critical',
    type: 'hotspot',
    timestamp: '2 hours ago',
    read: false,
    actionHref: '/hotspots',
  },
  {
    id: 'notif-5',
    title: 'Cleanup deadline approaching',
    message: 'Assignment CLN-2026-0028 at Baga Beach is due in 24 hours. Current progress: 45%.',
    category: 'warning',
    type: 'cleanup',
    timestamp: '3 hours ago',
    read: true,
    actionHref: '/assignments',
  },
  {
    id: 'notif-6',
    title: 'Cleanup completed successfully',
    message: 'Ocean Crusaders completed cleanup at Kovalam Beach. 184 waste objects removed.',
    category: 'success',
    type: 'cleanup',
    timestamp: '5 hours ago',
    read: true,
    actionHref: '/assignments',
  },
  {
    id: 'notif-7',
    title: 'New NGO team registered',
    message: 'Tide Turners Alliance has joined the platform with 15 team members.',
    category: 'info',
    type: 'system',
    timestamp: '1 day ago',
    read: true,
    actionHref: '/ngo-teams',
  },
  {
    id: 'notif-8',
    title: 'AI Model updated',
    message: 'PlasticSense AI detection model has been updated to v2.1 with improved accuracy.',
    category: 'info',
    type: 'system',
    timestamp: '2 days ago',
    read: true,
  },
];
