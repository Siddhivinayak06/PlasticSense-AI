'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Calendar } from 'lucide-react';

export function WelcomeCard() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const formattedDate = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center justify-between gap-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
          <Leaf className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {greeting}, Admin 👋
          </h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <Calendar className="size-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-4">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Platform Status</p>
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500 inline-block" />
            Operational
          </p>
        </div>
      </div>
    </motion.div>
  );
}
