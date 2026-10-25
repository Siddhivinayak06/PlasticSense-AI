import {
  LayoutDashboard,
  FileText,
  Map,
  BarChart3,
  Flame,
  ClipboardList,
  Settings,
  ScanLine,
  Building2,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { SidebarMenuGroup } from '@/types/dashboard';

export const sidebarMenuGroups: SidebarMenuGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/dashboard',
      },
    ],
  },
  {
    title: 'AI & Monitoring',
    items: [
      {
        id: 'detect',
        label: 'Waste Detection',
        icon: ScanLine,
        href: '/detect',
      },
      {
        id: 'history',
        label: 'Reports',
        icon: FileText,
        href: '/history',
      },
      {
        id: 'map',
        label: 'Pollution Map',
        icon: Map,
        href: '/map',
      },
      {
        id: 'hotspots',
        label: 'Hotspots',
        icon: Flame,
        href: '/hotspots',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        href: '/analytics',
      },
    ],
  },
  {
    title: 'Cleanup Operations',
    items: [
      {
        id: 'assignments',
        label: 'Cleanup Assignments',
        icon: ClipboardList,
        href: '/assignments',
      },
      {
        id: 'ngo-teams',
        label: 'NGO Teams',
        icon: Building2,
        href: '/ngo-teams',
      },
      {
        id: 'verification',
        label: 'Verification',
        icon: ShieldCheck,
        href: '/verification',
      },
      {
        id: 'impact',
        label: 'Impact',
        icon: TrendingUp,
        href: '/impact',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        id: 'settings',
        label: 'System Status',
        icon: Settings,
        href: '/settings',
      },
      {
        id: 'users',
        label: 'User & Roles',
        icon: Users,
        href: '/users',
      },
    ],
  },
];

export const APP_VERSION = 'v0.2.0';
export const TEAM_NAME = 'WasteSense Team';
