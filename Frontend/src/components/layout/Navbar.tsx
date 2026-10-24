'use client';

import Link from 'next/link';
import { Menu, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SearchBox } from '@/components/shared/SearchBox';
import { ThemeToggle } from './ThemeToggle';
import { ProfileMenu } from './ProfileMenu';
import { NotificationPanel } from './NotificationPanel';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { useSidebar } from '@/hooks/useSidebar';
import { microInteractions } from '@/lib/motion';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '@/services/analytics';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { data: health, isError: healthError } = useQuery({ queryKey: ['health'], queryFn: fetchHealth, refetchInterval: 30_000 });
  const live = health?.status === 'ok';
  const statusLabel = health ? (live ? 'API online' : 'Degraded') : healthError ? 'API offline' : 'Connecting';
  const { breadcrumbs } = useActiveRoute();
  const { toggleMobile } = useSidebar();

  return (
    <header className="h-16 glass border-b border-slate-200/60 dark:border-slate-800/60 flex items-center px-4 sm:px-6 justify-between gap-4 shrink-0 z-30 transition-colors">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0 rounded-xl"
          onClick={toggleMobile}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="size-3 text-muted-foreground/60 shrink-0" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-foreground truncate">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate font-medium"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}

          <Link href="/settings" aria-label={`System status: ${statusLabel}`}>
          <motion.div
            whileHover={microInteractions.hoverSubtleLift}
            className={cn(
              'ml-4 flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold tracking-wider uppercase shadow-2xs',
              live
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400',
            )}
          >
            <span className="relative flex size-1.5 mr-1.5">
              {live && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
              <span className={cn('relative inline-flex rounded-full size-1.5', live ? 'bg-emerald-500' : 'bg-amber-500')}></span>
            </span>
            {statusLabel}
          </motion.div>
          </Link>
        </nav>
      </div>

      {/* Right: Search + Notifications + Theme + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div className="hidden md:block">
          <SearchBox placeholder="Search reports, hotspots, teams…" />
        </div>
        <NotificationPanel />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
