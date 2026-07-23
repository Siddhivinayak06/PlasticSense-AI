'use client';

import { motion } from 'framer-motion';
import { recentActivities } from '@/mock';

export function ActivityTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Latest actions and updates</p>
      </div>

      <div className="p-5">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/60" />

          <div className="space-y-5">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.08 }}
                  className="relative flex gap-3 group"
                >
                  {/* Icon dot */}
                  <div className="relative z-10 flex size-[30px] shrink-0 items-center justify-center rounded-full bg-background border border-border/60 group-hover:border-primary/30 transition-colors">
                    <Icon className={`size-3.5 ${activity.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-foreground leading-relaxed">{activity.description}</p>
                    <span className="text-[11px] text-muted-foreground/70 mt-1 block">
                      {activity.timestamp}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
