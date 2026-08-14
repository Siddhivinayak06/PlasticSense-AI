'use client';

import Link from 'next/link';
import { Menu, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBox } from '@/components/shared/SearchBox';
import { ThemeToggle } from './ThemeToggle';
import { ProfileMenu } from './ProfileMenu';
import { NotificationPanel } from './NotificationPanel';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { useSidebar } from '@/hooks/useSidebar';

export function Navbar() {
  const { breadcrumbs } = useActiveRoute();
  const { toggleMobile } = useSidebar();

  return (
    <header className="h-16 glass border-b border-border/50 flex items-center px-4 sm:px-6 justify-between gap-4 shrink-0 z-30">
      {/* Left: Mobile menu + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden shrink-0"
          onClick={toggleMobile}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-sm min-w-0">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="size-3 text-muted-foreground shrink-0" />}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground truncate">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
          
          <div className="ml-4 flex items-center px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-600 dark:text-amber-500 tracking-wider uppercase">
            <span className="relative flex size-1.5 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-1.5 bg-amber-500"></span>
            </span>
            Demo Mode
          </div>
        </nav>
      </div>

      {/* Right: Search + Notifications + Theme + Profile */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <div className="hidden md:block">
          <SearchBox placeholder="Search reports..." />
        </div>
        <NotificationPanel />
        <ThemeToggle />
        <ProfileMenu />
      </div>
    </header>
  );
}
