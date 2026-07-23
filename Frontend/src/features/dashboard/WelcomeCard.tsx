'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Leaf, Calendar } from 'lucide-react';
import { environmentalQuotes } from '@/mock';

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

  const quote = useMemo(() => {
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    );
    return environmentalQuotes[dayOfYear % environmentalQuotes.length];
  }, [now]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl glass p-6 sm:p-8"
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-primary/5 blur-2xl" />
      <div className="absolute -left-4 -bottom-4 size-32 rounded-full bg-secondary/5 blur-2xl" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <Leaf className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                {greeting}, Admin! 👋
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                <Calendar className="size-3.5" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground/80 italic max-w-xl leading-relaxed mt-3">
            {quote}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-2xl font-bold text-primary">92%</span>
            <span className="text-xs text-muted-foreground">Cleanup Rate</span>
          </div>
          <div className="hidden sm:block w-px h-10 bg-border/60" />
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-2xl font-bold text-secondary">1,284</span>
            <span className="text-xs text-muted-foreground">Reports Today</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
