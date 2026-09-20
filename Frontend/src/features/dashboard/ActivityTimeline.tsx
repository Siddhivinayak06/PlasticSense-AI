'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { fetchAssignments } from '@/services/assignments';
import { CheckCircle2, Clock, ShieldCheck, AlertTriangle, Layers } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useMemo } from 'react';

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
          color: 'text-emerald-500',
          description: 'AI dual-model pipeline initialized and verified',
          timestamp: 'Recently',
        },
      ];
    }

    return assignments.slice(0, 5).map((a) => {
      let icon = Clock;
      let color = 'text-amber-500';
      let desc = `Cleanup scheduled: ${a.title}`;

      if (a.status === 'verified') {
        icon = ShieldCheck;
        color = 'text-emerald-500';
        desc = `AI verified ${a.waste_reduction_percent ?? 100}% reduction: ${a.title}`;
      } else if (a.status === 'completed') {
        icon = CheckCircle2;
        color = 'text-blue-500';
        desc = `Cleanup completed by ${a.ngo_team_name || 'NGO partner'}: ${a.title}`;
      } else if (a.status === 'in_progress') {
        icon = Clock;
        color = 'text-amber-500';
        desc = `Team deployed on site: ${a.title} (${a.waste_count} target objects)`;
      } else if (a.priority === 'urgent' || a.priority === 'high') {
        icon = AlertTriangle;
        color = 'text-orange-500';
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass rounded-2xl overflow-hidden h-full flex flex-col"
    >
      <div className="px-5 py-4 border-b border-border/50">
        <h2 className="text-base font-semibold text-foreground">Recent Activity</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Real-time actions from cleanup operations</p>
      </div>

      <div className="p-5 flex-1">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border/60" />

          <div className="space-y-5">
            {activities.map((activity, index) => {
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
