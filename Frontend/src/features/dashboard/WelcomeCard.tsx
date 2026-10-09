'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Activity, ShieldCheck } from 'lucide-react';

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
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl glass border border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-br from-slate-100 to-white dark:from-slate-900/90 dark:to-slate-900/40 p-8 sm:p-10"
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 h-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
            </span>
            System Online & Monitoring
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">Admin</span>
          </h1>
          
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed max-w-xl">
            PlasticSense AI is actively scanning global hotspots. All neural networks are operating at peak efficiency. Here is your daily overview.
          </p>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
              <Calendar className="size-4 text-primary" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
              <Activity className="size-4 text-emerald-500" />
              1.2M Scans Today
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
              <ShieldCheck className="size-4 text-blue-500" />
              Secure Connection
            </div>
          </div>
        </div>

        {/* Removed 3D Canvas from here, maintaining the background gradient flow */}
        <div className="absolute right-0 top-0 bottom-0 w-[45%] hidden md:block opacity-30 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
      </div>
    </motion.div>
  );
}
