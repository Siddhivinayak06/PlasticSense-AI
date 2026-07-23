'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, Leaf, GitFork } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { sidebarMenuGroups, APP_VERSION, TEAM_NAME } from '@/constants/navigation';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { useSidebar } from '@/hooks/useSidebar';

export function MobileDrawer() {
  const { isMobileOpen, closeMobile } = useSidebar();
  const { isActive } = useActiveRoute();

  return (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={closeMobile}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 z-50 w-[260px] glass md:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                  <Leaf className="size-4 text-primary" />
                </div>
                <span className="text-sm font-bold text-foreground">PlasticSense AI</span>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={closeMobile}>
                <X className="size-4" />
              </Button>
            </div>

            {/* Menu */}
            <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-6">
              {sidebarMenuGroups.map((group) => (
                <div key={group.title}>
                  <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-border/50 px-4 py-3">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{TEAM_NAME}</span>
                <span>{APP_VERSION}</span>
              </div>
              <Button variant="ghost" size="xs" className="mt-2 w-full justify-start gap-2 text-muted-foreground">
                <GitFork className="size-3" />
                <span>GitHub</span>
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
