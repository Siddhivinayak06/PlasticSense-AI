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

export function Navbar() {
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

          <motion.div
            whileHover={microInteractions.hoverSubtleLift}
            className="ml-4 flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase shadow-2xs"
          >
            <span className="relative flex size-1.5 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
            </span>
            Neural Live
          </motion.div>
        </nav>
      </div>

      {/* Right: Search + Notifications + Theme + Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div className="hidden md:block">
          <SearchBox placeholder="Search surveys & hotspots..." />
        </div>
        <NotificationPanel />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
