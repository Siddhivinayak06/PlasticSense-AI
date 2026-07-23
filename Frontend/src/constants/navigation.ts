import {
  LayoutDashboard,
  FileText,
  Map,
  BarChart3,
  Flame,
  ClipboardList,
  Users,
  Settings,
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
      {
        id: 'reports',
        label: 'Reports',
        icon: FileText,
        href: '/reports',
        badge: 12,
      },
      {
        id: 'map',
        label: 'Pollution Map',
        icon: Map,
        href: '/map',
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
    title: 'Management',
    items: [
      {
        id: 'hotspots',
        label: 'Hotspots',
        icon: Flame,
        href: '/hotspots',
        badge: 3,
      },
      {
        id: 'assignments',
        label: 'Assignments',
        icon: ClipboardList,
        href: '/assignments',
      },
      {
        id: 'users',
        label: 'Users',
        icon: Users,
        href: '/users',
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        href: '/settings',
      },
    ],
  },
];

export const APP_VERSION = 'v0.1.0';
export const TEAM_NAME = 'PlasticSense Team';
