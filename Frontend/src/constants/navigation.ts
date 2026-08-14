import {
  LayoutDashboard,
  FileText,
  Map,
  BarChart3,
  Flame,
  ClipboardList,
  Users,
  Settings,
  ScanLine,
  Building2,
  ShieldCheck,
  TrendingUp,
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
        badge: 5,
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
        badge: 8,
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
        badge: 3,
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
    title: 'Administration',
    items: [
      {
        id: 'users',
        label: 'Users',
        icon: Users,
        href: '/users',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/settings',
      },
    ],
  },
];

export const APP_VERSION = 'v0.2.0';
export const TEAM_NAME = 'PlasticSense Team';
