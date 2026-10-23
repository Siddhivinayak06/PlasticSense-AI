'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignments } from '@/services/assignments';
import { CheckCircle2, Clock, ShieldCheck, AlertTriangle, Radio } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';
import { cardEntrance, containerVariants, tableRowVariants, microInteractions } from '@/lib/motion';

export function ActivityTimeline() {
  const { data: assignments } = useQuery({
    queryKey: ['assignments'],
    queryFn: () => fetchAssignments(),
  });

  const activities = useMemo(() => {
    if (!assignments || assignments.length === 0) {
      return [
        {
          id: 'act-1',
          icon: ShieldCheck,
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
          description: 'AI dual-model pipeline initialized and verified',
          timestamp: 'Live Active',
        },
      ];
    }

    return assignments.slice(0, 5).map((a) => {
      let icon = Clock;
      let color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      let desc = `Cleanup scheduled: ${a.title}`;

      if (a.status === 'verified') {
        icon = ShieldCheck;
        color = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
        desc = `AI verified ${a.waste_reduction_percent ?? 100}% reduction: ${a.title}`;
      } else if (a.status === 'completed') {
        icon = CheckCircle2;
        color = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
        desc = `Cleanup completed by ${a.ngo_team_name || 'NGO partner'}: ${a.title}`;
      } else if (a.status === 'in_progress') {
        icon = Clock;
        color = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
        desc = `Team deployed on site: ${a.title} (${a.waste_count} target objects)`;
      } else if (a.priority === 'urgent' || a.priority === 'high') {
        icon = AlertTriangle;
        color = 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        desc = `High-priority operation flagged: ${a.title}`;
      }

      let timeAgo = 'Recently';
      try {
        timeAgo = formatDistanceToNow(new Date(a.updated_at || a.created_at), { addSuffix: true });
      } catch {
        timeAgo = 'Recently';
      }

      return {
        id: a.id,
        icon,
        color,
        description: desc,
        timestamp: timeAgo,
      };
    });
  }, [assignments]);

  return (
    <motion.div
      variants={cardEntrance}
      initial="hidden"
      animate="visible"
      className="glass rounded-3xl overflow-hidden h-full flex flex-col border border-slate-200/70 dark:border-slate-800/70 shadow-sm"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20">
            <Radio className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">Activity Feed</h2>
            <p className="text-xs text-muted-foreground">Real-time actions from deployment ops</p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-center">
        <div className="relative">
          {/* Animated subtle connecting vertical track line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/30 via-border/60 to-transparent" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4 sm:space-y-5"
          >
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.id}
                  variants={tableRowVariants}
                  transition={{ delay: index * 0.06 }}
                  whileHover={microInteractions.hoverSubtleLift}
                  className="relative flex gap-3.5 group cursor-default"
                >
                  {/* Glowing Icon Dot */}
                  <div
                    className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border shadow-2xs group-hover:scale-110 transition-transform ${activity.color}`}
                  >
                    <Icon className="size-3.5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-xs sm:text-sm text-foreground font-medium leading-relaxed group-hover:text-primary transition-colors">
                      {activity.description}
                    </p>
                    <span className="text-[11px] font-medium text-muted-foreground/75 mt-0.5 block">
                      {activity.timestamp}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
