'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDetections } from '@/services/detection';
import { fetchAssignments } from '@/services/assignments';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Flame, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { springSmooth, microInteractions } from '@/lib/motion';

const CATEGORY_ICONS = {
  critical: AlertTriangle,
  warning: Flame,
  success: ShieldCheck,
  info: Info,
};

const CATEGORY_COLORS = {
  critical: 'text-red-500 bg-red-500/10 border-red-500/20',
  warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  success: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  info: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
};

interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'critical' | 'warning' | 'info' | 'success';
  at: string;
  read: boolean;
  actionHref?: string;
}

const SEEN_KEY = 'wastesense.notifications.seenAt';
const READ_KEY = 'wastesense.notifications.read';

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(iso).toLocaleDateString();
}

/** Activity feed built from real recent analyses and assignment updates. */
export function NotificationPanel() {
  const { isNotificationOpen, toggleNotification, closeNotification } = useAppStore();
  // Lazy initialisers: on the server (and first paint) there are no notifications
  // yet, so reading localStorage here cannot cause a hydration mismatch.
  const [seenAt, setSeenAt] = useState<number>(() => loadJSON<number>(SEEN_KEY, 0));
  const [readIds, setReadIds] = useState<string[]>(() => loadJSON<string[]>(READ_KEY, []));

  const detections = useQuery({ queryKey: ['detections', 'feed'], queryFn: () => fetchDetections(1, 8), refetchInterval: 60_000 });
  const assignments = useQuery({ queryKey: ['assignments'], queryFn: () => fetchAssignments(), refetchInterval: 60_000 });

  const notifications: AppNotification[] = useMemo(() => {
    const items: Omit<AppNotification, 'read'>[] = [];
    for (const d of detections.data?.data ?? []) {
      const level = String(d.risk?.level ?? '').toLowerCase();
      if (d.detection_status === 'failed') {
        items.push({ id: `det-${d.id}`, title: 'Analysis failed', message: d.failure_reason ?? 'The model could not process an uploaded image.', category: 'warning', at: d.created_at, actionHref: `/history/${d.id}` });
      } else if (d.detection_status === 'completed') {
        items.push({
          id: `det-${d.id}`,
          title: level === 'critical' || level === 'high' ? `${level === 'critical' ? 'Critical' : 'High'}-risk report analysed` : 'Report analysed',
          message: `${d.items.length} objects detected${d.risk ? `, risk ${Math.round(d.risk.score)}/100` : ''}${d.latitude == null ? ' · no location' : ''}.`,
          category: level === 'critical' ? 'critical' : level === 'high' ? 'warning' : 'info',
          at: d.created_at,
          actionHref: `/history/${d.id}`,
        });
      }
    }
    for (const a of assignments.data ?? []) {
      const verifiedOutcome = a.status === 'verified' || a.status === 'rejected';
      items.push({
        id: `asg-${a.id}-${a.status}`,
        title: a.status === 'verified' ? 'Cleanup verified' : a.status === 'rejected' ? 'Cleanup verification failed' : `Assignment ${a.status.replace('_', ' ')}`,
        message: `${a.title}${a.ngo_team_name ? ` · ${a.ngo_team_name}` : ''}${verifiedOutcome && a.waste_reduction_percent != null ? ` · ${a.waste_reduction_percent}% reduction` : ''}`,
        category: a.status === 'verified' ? 'success' : a.status === 'rejected' ? 'warning' : 'info',
        at: a.updated_at,
        actionHref: `/assignments/${a.id}`,
      });
    }
    return items
      .sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime())
      .slice(0, 12)
      .map((n) => ({ ...n, read: new Date(n.at).getTime() <= seenAt || readIds.includes(n.id) }));
  }, [detections.data, assignments.data, seenAt, readIds]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    const now = Date.now();
    setSeenAt(now);
    setReadIds([]);
    try {
      localStorage.setItem(SEEN_KEY, JSON.stringify(now));
      localStorage.removeItem(READ_KEY);
    } catch { /* storage unavailable: state still updates for this session */ }
  };

  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id].slice(-100);
      try { localStorage.setItem(READ_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleNotification}
        className="relative size-9 rounded-xl border border-transparent hover:border-border/60 hover:bg-muted/60 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <motion.div
          whileHover={microInteractions.iconRotate}
          whileTap={microInteractions.tapScale}
          className="flex items-center justify-center size-full"
        >
          <Bell className="size-4" />
        </motion.div>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground shadow-xs"
          >
            {unreadCount}
          </motion.span>
        )}
      </Button>

      <AnimatePresence>
        {isNotificationOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-background/20 backdrop-blur-2xs"
              onClick={closeNotification}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={springSmooth}
              className="absolute right-0 top-full mt-2 w-[min(380px,calc(100vw-2rem))] glass rounded-3xl border border-border/60 shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div>
                  <h3 className="text-sm font-semibold text-foreground tracking-tight">Recent Activity</h3>
                  <p className="text-[11px] text-muted-foreground">
                    {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All alerts reviewed'}
                  </p>
                </div>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={markAllAsRead}
                    className="gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <CheckCheck className="size-3.5" />
                    Mark all read
                  </Button>
                )}
              </div>

              {/* Notifications list */}
              <div className="max-h-[420px] overflow-y-auto custom-scrollbar divide-y divide-border/30">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Bell className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      {detections.isError ? 'Could not reach the API' : 'No activity yet'}
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = CATEGORY_ICONS[notif.category];
                    const colorCls = CATEGORY_COLORS[notif.category];

                    const content = (
                      <div
                        key={notif.id}
                        onClick={() => markAsRead(notif.id)}
                        className={cn(
                          'flex gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors cursor-pointer border-l-3',
                          notif.read
                            ? 'border-transparent'
                            : notif.category === 'critical'
                              ? 'border-red-500 bg-red-500/5'
                              : 'border-primary bg-primary/5'
                        )}
                      >
                        <div
                          className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-xl border',
                            colorCls
                          )}
                        >
                          <Icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-xs sm:text-sm leading-snug',
                              notif.read ? 'text-muted-foreground' : 'text-foreground font-semibold'
                            )}
                          >
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <span className="text-[10px] text-muted-foreground/60 mt-1 block font-medium">
                            {relativeTime(notif.at)}
                          </span>
                        </div>
                        {!notif.read && (
                          <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5 shadow-2xs" />
                        )}
                      </div>
                    );

                    if (notif.actionHref) {
                      return (
                        <Link key={notif.id} href={notif.actionHref} onClick={closeNotification}>
                          {content}
                        </Link>
                      );
                    }
                    return content;
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
