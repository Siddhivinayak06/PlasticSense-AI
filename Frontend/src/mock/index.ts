import {
  FileText,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  Candy,
  ClipboardCheck,
  ClipboardList,
  CheckCircle2,
  ShieldCheck,
  FilePlus2,
  MapPin,
  BarChart3,
  FileBarChart,
  Users,
  ScanLine,
} from 'lucide-react';
import type {
  DashboardStat,
  RecentReport,
  Activity,
  Notification,
  QuickAction,
} from '@/types/dashboard';

// ─── Dashboard Statistics ───────────────────────────────────────

export const dashboardStats: DashboardStat[] = [
  {
    id: 'total-reports',
    label: 'Total Reports',
    value: 1284,
    icon: FileText,
    change: 12.5,
    trend: 'up',
    color: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'pending-reports',
    label: 'Pending Reports',
    value: 64,
    icon: AlertCircle,
    change: -8.3,
    trend: 'down',
    color: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'resolved-reports',
    label: 'Resolved Reports',
    value: 1089,
    icon: ClipboardCheck,
    change: 15.2,
    trend: 'up',
    color: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'critical-reports',
    label: 'Critical Reports',
    value: 23,
    icon: AlertTriangle,
    change: 4.1,
    trend: 'up',
    color: 'bg-red-500/10 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    id: 'high-severity',
    label: 'High Severity',
    value: 47,
    icon: TrendingUp,
    change: -2.7,
    trend: 'down',
    color: 'bg-orange-500/10 dark:bg-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    id: 'plastic-bottles',
    label: 'Plastic Bottles',
    value: 3842,
    icon: Package,
    change: 9.8,
    trend: 'up',
    color: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    id: 'plastic-bags',
    label: 'Plastic Bags',
    value: 2156,
    icon: ShoppingBag,
    change: -5.4,
    trend: 'down',
    color: 'bg-violet-500/10 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'wrappers',
    label: 'Wrappers',
    value: 1573,
    icon: Candy,
    change: 3.2,
    trend: 'up',
    color: 'bg-pink-500/10 dark:bg-pink-500/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
];

// ─── Recent Reports ─────────────────────────────────────────────

export const recentReports: RecentReport[] = [
  {
    id: 'RPT-2026-001',
    imageUrl: '/placeholder-bottle.svg',
    plasticType: 'PET Bottles',
    severity: 'critical',
    location: 'Juhu Beach, Mumbai',
    status: 'pending',
    reportedDate: '2026-07-14',
  },
  {
    id: 'RPT-2026-002',
    imageUrl: '/placeholder-bag.svg',
    plasticType: 'Plastic Bags',
    severity: 'high',
    location: 'Marina Beach, Chennai',
    status: 'in-progress',
    reportedDate: '2026-07-13',
  },
  {
    id: 'RPT-2026-003',
    imageUrl: '/placeholder-wrapper.svg',
    plasticType: 'Food Wrappers',
    severity: 'medium',
    location: 'Baga Beach, Goa',
    status: 'resolved',
    reportedDate: '2026-07-12',
  },
  {
    id: 'RPT-2026-004',
    imageUrl: '/placeholder-bottle.svg',
    plasticType: 'HDPE Containers',
    severity: 'low',
    location: 'Versova Beach, Mumbai',
    status: 'verified',
    reportedDate: '2026-07-11',
  },
  {
    id: 'RPT-2026-005',
    imageUrl: '/placeholder-bag.svg',
    plasticType: 'Polystyrene',
    severity: 'critical',
    location: 'Kovalam Beach, Kerala',
    status: 'pending',
    reportedDate: '2026-07-10',
  },
  {
    id: 'RPT-2026-006',
    imageUrl: '/placeholder-wrapper.svg',
    plasticType: 'PVC Pipes',
    severity: 'high',
    location: 'Puri Beach, Odisha',
    status: 'in-progress',
    reportedDate: '2026-07-09',
  },
  {
    id: 'RPT-2026-007',
    imageUrl: '/placeholder-bottle.svg',
    plasticType: 'Microplastics',
    severity: 'critical',
    location: 'Elliot Beach, Chennai',
    status: 'pending',
    reportedDate: '2026-07-08',
  },
  {
    id: 'RPT-2026-008',
    imageUrl: '/placeholder-bag.svg',
    plasticType: 'Plastic Bags',
    severity: 'medium',
    location: 'Calangute Beach, Goa',
    status: 'resolved',
    reportedDate: '2026-07-07',
  },
];

// ─── Recent Activities ──────────────────────────────────────────

export const recentActivities: Activity[] = [
  {
    id: 'act-1',
    type: 'report',
    description: 'New pollution report submitted at Juhu Beach, Mumbai',
    timestamp: '2 minutes ago',
    icon: FilePlus2,
    color: 'text-blue-500',
  },
  {
    id: 'act-2',
    type: 'assignment',
    description: 'Cleanup crew assigned to Marina Beach hotspot',
    timestamp: '15 minutes ago',
    icon: ClipboardList,
    color: 'text-amber-500',
  },
  {
    id: 'act-3',
    type: 'cleanup',
    description: 'Beach cleanup completed at Versova Beach — 120kg collected',
    timestamp: '1 hour ago',
    icon: CheckCircle2,
    color: 'text-emerald-500',
  },
  {
    id: 'act-4',
    type: 'verification',
    description: 'Authority verified critical report at Kovalam Beach',
    timestamp: '2 hours ago',
    icon: ShieldCheck,
    color: 'text-violet-500',
  },
  {
    id: 'act-5',
    type: 'report',
    description: 'High-severity microplastic contamination reported at Elliot Beach',
    timestamp: '3 hours ago',
    icon: FilePlus2,
    color: 'text-blue-500',
  },
  {
    id: 'act-6',
    type: 'cleanup',
    description: 'Cleanup completed at Baga Beach — 85kg plastic removed',
    timestamp: '5 hours ago',
    icon: CheckCircle2,
    color: 'text-emerald-500',
  },
];

// ─── Notifications ──────────────────────────────────────────────

export const notifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'Critical Alert',
    message: 'Microplastic levels exceeding safe threshold at Elliot Beach.',
    category: 'critical',
    timestamp: '5 min ago',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Cleanup Completed',
    message: 'Versova Beach cleanup operation completed successfully.',
    category: 'success',
    timestamp: '30 min ago',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'New Assignment',
    message: 'You have been assigned to the Marina Beach cleanup crew.',
    category: 'info',
    timestamp: '1 hour ago',
    read: false,
  },
  {
    id: 'notif-4',
    title: 'Report Warning',
    message: 'Report RPT-2026-005 has been pending for 4 days.',
    category: 'warning',
    timestamp: '2 hours ago',
    read: true,
  },
  {
    id: 'notif-5',
    title: 'System Update',
    message: 'PlasticSense AI model v2.3 deployed with improved detection.',
    category: 'info',
    timestamp: '6 hours ago',
    read: true,
  },
  {
    id: 'notif-6',
    title: 'Hotspot Detected',
    message: 'New pollution hotspot identified near Calangute Beach.',
    category: 'warning',
    timestamp: '1 day ago',
    read: true,
  },
];

// ─── Quick Actions ──────────────────────────────────────────────

export const quickActions: QuickAction[] = [
  {
    id: 'detect-plastic',
    label: 'Detect Plastic',
    description: 'Upload image for AI detection',
    icon: ScanLine,
    href: '/detect',
    color: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary',
  },
  {
    id: 'create-report',
    label: 'Create Report',
    description: 'Submit a new pollution report',
    icon: FilePlus2,
    href: '/reports',
    color: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'view-map',
    label: 'View Map',
    description: 'Explore pollution hotspots',
    icon: MapPin,
    href: '/map',
    color: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'view-analytics',
    label: 'View Analytics',
    description: 'Analyze pollution trends',
    icon: BarChart3,
    href: '/analytics',
    color: 'bg-violet-500/10 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'generate-report',
    label: 'Generate Report',
    description: 'Create summary documents',
    icon: FileBarChart,
    href: '/reports',
    color: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'manage-users',
    label: 'Manage Users',
    description: 'Administer team members',
    icon: Users,
    href: '/users',
    color: 'bg-pink-500/10 dark:bg-pink-500/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
];

// ─── Environmental Quotes ───────────────────────────────────────

export const environmentalQuotes: string[] = [
  '"The greatest threat to our planet is the belief that someone else will save it." — Robert Swan',
  '"We do not inherit the earth from our ancestors, we borrow it from our children." — Native American Proverb',
  '"The Earth does not belong to us: we belong to the Earth." — Marlee Matlin',
  '"In every walk with nature, one receives far more than he seeks." — John Muir',
  '"Act as if what you do makes a difference. It does." — William James',
  '"There is no such thing as \'away\'. When we throw anything away it must go somewhere." — Annie Leonard',
];

// ─── Legacy exports (kept for backward compatibility) ───────────

export const mockReports = recentReports.map((r, i) => ({
  id: i + 1,
  title: `${r.plasticType} at ${r.location}`,
  status: r.status === 'in-progress' ? 'In Progress' : r.status.charAt(0).toUpperCase() + r.status.slice(1),
  date: r.reportedDate,
}));

export const mockUsers = [
  { id: 1, name: 'Admin User', role: 'admin' },
  { id: 2, name: 'Field Worker', role: 'worker' },
];

export const mockAnalytics = {
  totalCollected: '500kg',
  activeHotspots: 12,
};
