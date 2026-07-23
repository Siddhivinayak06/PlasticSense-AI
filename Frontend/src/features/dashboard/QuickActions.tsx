'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { quickActions } from '@/mock';
import { cn } from '@/lib/utils';

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Common tasks at your fingertips</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.06 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <Link
                href={action.href}
                className="group glass rounded-2xl p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow h-full"
              >
                <div className={cn('flex size-10 items-center justify-center rounded-xl', action.color)}>
                  <Icon className={cn('size-5', action.iconColor)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all mt-auto" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
