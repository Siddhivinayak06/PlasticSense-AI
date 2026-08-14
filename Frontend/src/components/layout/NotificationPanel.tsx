'use client';

import { useState } from 'react';
import { Bell, CheckCheck, Flame, ClipboardList, ShieldCheck, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store';
import { mockNotifications, type AppNotification } from '@/mock/notifications';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const CATEGORY_ICONS = {
  critical: AlertTriangle,
  warning: Flame,
  success: ShieldCheck,
  info: Info,
};

const CATEGORY_COLORS = {
  critical: 'text-red-500 bg-red-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  success: 'text-emerald-500 bg-emerald-500/10',
  info: 'text-blue-500 bg-blue-500/10',
};

export function NotificationPanel() {
  const { isNotificationOpen, toggleNotification, closeNotification } = useAppStore();
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleNotification}
        className="relative"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </Button>

      {isNotificationOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={closeNotification} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-[380px] glass rounded-2xl border border-border/50 shadow-xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                <p className="text-[11px] text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={markAllAsRead}
                  className="gap-1.5 text-xs text-muted-foreground"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </Button>
              )}
            </div>

            {/* Notifications list */}
            <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
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
                        'flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer border-l-2',
                        notif.read
                          ? 'border-transparent'
                          : notif.category === 'critical'
                            ? 'border-red-500 bg-red-500/5'
                            : 'border-primary bg-primary/5',
                      )}
                    >
                      <div className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', colorCls)}>
                        <Icon className="size-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-sm leading-snug',
                          notif.read ? 'text-muted-foreground' : 'text-foreground font-medium',
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                        <span className="text-[10px] text-muted-foreground/60 mt-1 block">{notif.timestamp}</span>
                      </div>
                      {!notif.read && (
                        <div className="size-2 rounded-full bg-primary shrink-0 mt-1.5" />
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
          </div>
        </>
      )}
    </div>
  );
}
