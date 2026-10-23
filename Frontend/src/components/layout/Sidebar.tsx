'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, PanelLeftClose, PanelLeft, GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sidebarMenuGroups, APP_VERSION, TEAM_NAME } from '@/constants/navigation';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { fetchDashboardSummary, DashboardSummary } from '@/services/analytics';
import { springSmooth, microInteractions } from '@/lib/motion';

export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const { isActive } = useActiveRoute();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    fetchDashboardSummary()
      .then((data) => setSummary(data))
      .catch(console.error);
  }, []);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full glass border-r border-slate-200/60 dark:border-slate-800/60 sidebar-transition overflow-hidden shrink-0 z-20',
        isCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border/50 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden group">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={microInteractions.tapScale}
            className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs"
          >
            <Leaf className="size-4.5" />
          </motion.div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={springSmooth}
                className="text-sm font-extrabold text-foreground tracking-tight whitespace-nowrap overflow-hidden"
              >
                WasteSense <span className="text-primary font-normal">AI</span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapse}
          className="shrink-0 text-muted-foreground hover:text-foreground rounded-lg"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-6">
        {sidebarMenuGroups.map((group) => (
          <div key={group.title}>
            {!isCollapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center rounded-xl text-xs sm:text-sm font-medium transition-colors',
                      isCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                      active
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/15 shadow-2xs"
                        transition={springSmooth}
                      />
                    )}
                    <Icon className="size-4 shrink-0 relative z-10 transition-transform group-hover:scale-110" />
                    {!isCollapsed && (
                      <>
                        <span className="relative z-10">{item.label}</span>
                        {(() => {
                          let displayBadge = item.badge;
                          if (summary) {
                            if (item.id === 'hotspots' && summary.critical_hotspots !== undefined) {
                              displayBadge = summary.critical_hotspots;
                            } else if (item.id === 'assignments' && summary.pending_cleanups !== undefined) {
                              displayBadge = summary.pending_cleanups;
                            } else if (item.id === 'verification' && summary.completed_cleanups !== undefined) {
                              displayBadge = summary.completed_cleanups - (summary.verified_cleanups || 0);
                            }
                          }
                          return displayBadge ? (
                            <motion.span
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              className="ml-auto relative z-10 flex size-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary border border-primary/20"
                            >
                              {displayBadge}
                            </motion.span>
                          ) : null;
                        })()}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 px-3 py-3 shrink-0">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground" title="WasteSense AI">
              <GitFork className="size-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-2 text-[10px] font-medium text-muted-foreground/75">
              <span>{TEAM_NAME}</span>
              <span className="font-mono">{APP_VERSION}</span>
            </div>
            <Button
              variant="ghost"
              size="xs"
              className="mt-2 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground rounded-lg"
            >
              <GitFork className="size-3.5" />
              <span>Version Dashboard</span>
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
