'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { quickActions } from '@/mock';
import { cn } from '@/lib/utils';
import { cardEntrance, containerVariants, microInteractions } from '@/lib/motion';

export function QuickActions() {
  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <Zap className="size-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground tracking-tight">Quick Operations</h2>
          <p className="text-xs text-muted-foreground">Direct access to core AI workflows and decision pipelines</p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5"
      >
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              variants={cardEntrance}
              transition={{ delay: index * 0.05 }}
              whileHover={microInteractions.hoverLift}
              whileTap={microInteractions.tapScale}
            >
              <Link
                href={action.href}
                className="group glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between h-full gap-3 transition-all relative overflow-hidden"
              >
                {/* Subtle hover gradient illumination */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

                <div className="flex items-center justify-between">
                  <div
                    className={cn(
                      'flex size-11 items-center justify-center rounded-xl shadow-2xs group-hover:scale-110 transition-transform duration-300',
                      action.color
                    )}
                  >
                    <Icon className={cn('size-5', action.iconColor)} />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                    {action.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
