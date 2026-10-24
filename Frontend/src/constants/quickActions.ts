import { ScanLine, FileText, MapPin, BarChart3, ClipboardList, ShieldCheck } from 'lucide-react';
import type { QuickAction } from '@/types/dashboard';

export const quickActions: QuickAction[] = [
  {
    id: 'detect-waste',
    label: 'Detect Waste',
    description: 'Upload an image for AI analysis',
    icon: ScanLine,
    href: '/detect',
    color: 'bg-primary/10 dark:bg-primary/20',
    iconColor: 'text-primary',
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Browse analysed images',
    icon: FileText,
    href: '/history',
    color: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'view-map',
    label: 'Pollution Map',
    description: 'Geolocated reports and hotspots',
    icon: MapPin,
    href: '/map',
    color: 'bg-blue-500/10 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'view-analytics',
    label: 'Analytics',
    description: 'Trends, materials and performance',
    icon: BarChart3,
    href: '/analytics',
    color: 'bg-violet-500/10 dark:bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'assignments',
    label: 'Cleanup Assignments',
    description: 'Plan and track cleanups',
    icon: ClipboardList,
    href: '/assignments',
    color: 'bg-amber-500/10 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'verification',
    label: 'Verify Cleanups',
    description: 'AI before/after comparison',
    icon: ShieldCheck,
    href: '/verification',
    color: 'bg-pink-500/10 dark:bg-pink-500/20',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
];
