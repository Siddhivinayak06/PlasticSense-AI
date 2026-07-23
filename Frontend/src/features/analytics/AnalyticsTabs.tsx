'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, TrendingUp, Box, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { name: 'Overview', href: '/analytics', icon: LayoutDashboard },
  { name: 'Trends Analysis', href: '/analytics/trends', icon: TrendingUp },
  { name: 'Plastic Insights', href: '/analytics/plastics', icon: Box },
  { name: 'Performance', href: '/analytics/performance', icon: Activity },
];

export function AnalyticsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex overflow-x-auto custom-scrollbar border-b border-border/50">
      <div className="flex space-x-6 min-w-max px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'group relative flex items-center gap-2 py-3 px-1 text-sm font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className={cn("size-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {tab.name}
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
