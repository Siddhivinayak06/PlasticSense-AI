'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Leaf, PanelLeftClose, PanelLeft, GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sidebarMenuGroups, APP_VERSION, TEAM_NAME } from '@/constants/navigation';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { useSidebar } from '@/hooks/useSidebar';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { isCollapsed, toggleCollapse } = useSidebar();
  const { isActive } = useActiveRoute();

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full glass border-r border-border/50 sidebar-transition overflow-hidden shrink-0',
        isCollapsed ? 'w-[var(--sidebar-collapsed-width)]' : 'w-[var(--sidebar-width)]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-border/50 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <Leaf className="size-4 text-primary" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-sm font-bold text-foreground whitespace-nowrap overflow-hidden"
            >
              PlasticSense AI
            </motion.span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleCollapse}
          className="shrink-0 text-muted-foreground hover:text-foreground"
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
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
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
                      'group relative flex items-center rounded-xl text-sm font-medium transition-all',
                      isCollapsed
                        ? 'justify-center px-0 py-2.5'
                        : 'gap-3 px-3 py-2.5',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-primary/10"
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      />
                    )}
                    <Icon className="size-4 shrink-0 relative z-10" />
                    {!isCollapsed && (
                      <>
                        <span className="relative z-10">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto relative z-10 flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                            {item.badge}
                          </span>
                        )}
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
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground" title="GitHub">
              <GitFork className="size-3.5" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground">
              <span>{TEAM_NAME}</span>
              <span>{APP_VERSION}</span>
            </div>
            <Button variant="ghost" size="xs" className="mt-2 w-full justify-start gap-2 text-muted-foreground">
              <GitFork className="size-3" />
              <span>GitHub</span>
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
