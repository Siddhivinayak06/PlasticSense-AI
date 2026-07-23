import type { LucideIcon } from 'lucide-react';

// ─── Severity & Status Enums ────────────────────────────────────

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export type ReportStatus = 'pending' | 'in-progress' | 'resolved' | 'verified';

export type NotificationCategory = 'info' | 'warning' | 'critical' | 'success';

// ─── Dashboard Stat Card ────────────────────────────────────────

export interface DashboardStat {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  change: number; // percentage change, positive or negative
  trend: 'up' | 'down' | 'neutral';
  color: string; // tailwind color class for the icon bg
  iconColor: string; // tailwind color class for the icon itself
}

// ─── Recent Report ──────────────────────────────────────────────

export interface RecentReport {
  id: string;
  imageUrl: string;
  plasticType: string;
  severity: SeverityLevel;
  location: string;
  status: ReportStatus;
  reportedDate: string;
}

// ─── Activity Timeline ──────────────────────────────────────────

export interface Activity {
  id: string;
  type: 'report' | 'assignment' | 'cleanup' | 'verification';
  description: string;
  timestamp: string;
  icon: LucideIcon;
  color: string;
}

// ─── Notification ───────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: string;
  read: boolean;
}

// ─── Quick Action ───────────────────────────────────────────────

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  iconColor: string;
}

// ─── Sidebar Menu ───────────────────────────────────────────────

export interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  badge?: number;
}

export interface SidebarMenuGroup {
  title: string;
  items: SidebarMenuItem[];
}
