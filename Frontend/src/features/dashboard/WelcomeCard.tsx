'use client';

import { motion } from 'framer-motion';
import { Calendar, Activity, ShieldCheck, Sparkles } from 'lucide-react';
import { cardEntrance, microInteractions } from '@/lib/motion';

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
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-3xl glass border border-slate-200/70 dark:border-slate-800/70 bg-gradient-to-br from-white/90 via-slate-50/70 to-slate-100/50 dark:from-slate-900/90 dark:via-slate-900/75 dark:to-slate-950/60 p-6 sm:p-8 lg:p-10 shadow-sm"
    >
      {/* Decorative ambient background light */}
      <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 dark:bg-primary/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 size-60 rounded-full bg-cyan-500/10 dark:bg-cyan-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          {/* Status pill badge */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs font-semibold mb-4 sm:mb-6 border border-primary/20"
          >
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
            </span>
            <span>Neural Watchtower · System Online</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-3"
          >
            {greeting},{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-500 to-cyan-500">
              Admin
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="text-muted-foreground text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed max-w-xl font-normal"
          >
            WasteSense dual-model AI is actively mapping plastic accumulation zones, classifying polymer streams, and dispatching remediation missions.
          </motion.p>

          {/* Interactive Status Chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25 }}
            className="flex flex-wrap items-center gap-3 sm:gap-4"
          >
            <motion.div
              whileHover={microInteractions.hoverSubtleLift}
              whileTap={microInteractions.tapSubtleScale}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 px-3.5 py-2 rounded-xl shadow-xs"
            >
              <Calendar className="size-4 text-primary" />
              <span>{formattedDate}</span>
            </motion.div>

            <motion.div
              whileHover={microInteractions.hoverSubtleLift}
              whileTap={microInteractions.tapSubtleScale}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 px-3.5 py-2 rounded-xl shadow-xs"
            >
              <Activity className="size-4 text-emerald-500" />
              <span>Real-Time Hotspots Monitored</span>
            </motion.div>

            <motion.div
              whileHover={microInteractions.hoverSubtleLift}
              whileTap={microInteractions.tapSubtleScale}
              className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 px-3.5 py-2 rounded-xl shadow-xs"
            >
              <ShieldCheck className="size-4 text-blue-500" />
              <span>Supabase Connection Active</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
