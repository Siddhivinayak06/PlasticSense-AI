import type {
  PlasticType,
  ReportSeverity,
  FullReportStatus,
  CleanupPriority,
  ReportSortOption,
  StatusStage,
} from '@/types/report';

// ─── Plastic Type Options ───────────────────────────────────────

export const plasticTypeOptions: { value: PlasticType; label: string }[] = [
  { value: 'bottle', label: 'Bottle' },
  { value: 'bag', label: 'Bag' },
  { value: 'wrapper', label: 'Wrapper' },
  { value: 'styrofoam', label: 'Styrofoam' },
  { value: 'multilayer', label: 'Multilayer Plastic' },
  { value: 'other', label: 'Other' },
];

// ─── Severity Config ────────────────────────────────────────────

export const severityConfig: Record<ReportSeverity, { label: string; color: string; bg: string }> = {
  low: {
    label: 'Low',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10 border-amber-200 dark:border-amber-800',
  },
  high: {
    label: 'High',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10 border-orange-200 dark:border-orange-800',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500/10 border-red-200 dark:border-red-800',
  },
};

// ─── Status Config ──────────────────────────────────────────────

export const statusConfig: Record<FullReportStatus, { label: string; color: string; bg: string }> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-500/10 border-amber-200 dark:border-amber-800',
  },
  verified: {
    label: 'Verified',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10 border-blue-200 dark:border-blue-800',
  },
  assigned: {
    label: 'Assigned',
    color: 'text-violet-700 dark:text-violet-300',
    bg: 'bg-violet-500/10 border-violet-200 dark:border-violet-800',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-500/10 border-cyan-200 dark:border-cyan-800',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500/10 border-red-200 dark:border-red-800',
  },
};

// ─── Priority Config ────────────────────────────────────────────

export const priorityConfig: Record<CleanupPriority, { label: string; color: string; bg: string }> = {
  low: {
    label: 'Low',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-500/10 border-slate-200 dark:border-slate-800',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-500/10 border-blue-200 dark:border-blue-800',
  },
  high: {
    label: 'High',
    color: 'text-orange-700 dark:text-orange-300',
    bg: 'bg-orange-500/10 border-orange-200 dark:border-orange-800',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-500/10 border-red-200 dark:border-red-800',
  },
};

// ─── Sort Options ───────────────────────────────────────────────

export const sortOptions: { value: ReportSortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'severity', label: 'Severity' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
];

// ─── Severity / Priority Order ──────────────────────────────────

export const severityOrder: Record<ReportSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const priorityOrder: Record<CleanupPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const statusOrder: Record<FullReportStatus, number> = {
  pending: 1,
  verified: 2,
  assigned: 3,
  'in-progress': 4,
  resolved: 5,
  rejected: 6,
};

// ─── Items Per Page Options ─────────────────────────────────────

export const itemsPerPageOptions = [10, 20, 50];

// ─── Status Timeline Stages ────────────────────────────────────

export const statusStages: StatusStage[] = [
  { status: 'pending', label: 'Report Submitted', description: 'Report submitted via mobile app or web portal' },
  { status: 'verified', label: 'AI Detection Completed', description: 'AI model verified and classified the waste' },
  { status: 'assigned', label: 'Crew Assigned', description: 'Cleanup crew assigned to the location' },
  { status: 'in-progress', label: 'Cleanup Started', description: 'On-site cleanup operation in progress' },
  { status: 'resolved', label: 'Resolved', description: 'Cleanup completed and site verified clean' },
  { status: 'rejected', label: 'Rejected', description: 'Report flagged as duplicate or invalid' },
];
