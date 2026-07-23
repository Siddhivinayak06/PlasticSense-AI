'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ReportComment } from '@/types/report';

interface ReportCommentsProps {
  comments: ReportComment[];
}

export function ReportComments({ comments }: ReportCommentsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="glass rounded-2xl p-5 flex flex-col h-full"
    >
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Comments & Activity</h3>
        <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary ml-auto">
          {comments.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No comments yet.
          </div>
        ) : (
          comments.map((comment, index) => (
            <motion.div 
              key={comment.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 + (index * 0.1) }}
              className="flex gap-3"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                {comment.user.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 bg-muted/40 p-3 rounded-2xl rounded-tl-none border border-border/50">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{comment.user}</p>
                    <p className="text-[10px] text-muted-foreground mb-1">{comment.role}</p>
                    <p className="text-sm text-foreground/90">{comment.content}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 ml-1">{comment.timestamp}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 relative">
         <Textarea 
           placeholder="Add a comment..."
           className="min-h-[80px] resize-none pr-12 text-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
         />
         <Button size="icon-sm" className="absolute bottom-6 right-2" aria-label="Send comment">
            <Send className="size-3.5" />
         </Button>
      </div>
    </motion.div>
  );
}
