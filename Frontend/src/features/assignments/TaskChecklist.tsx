'use client';

import { useState } from 'react';
import { TaskItem } from '@/types/assignment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle } from 'lucide-react';

interface TaskChecklistProps {
  tasks: TaskItem[];
}

export const TaskChecklist = ({ tasks: initialTasks }: TaskChecklistProps) => {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = Math.round((completedCount / tasks.length) * 100) || 0;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="pb-3 border-b border-border/50">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            Equipment & Task Checklist
          </h2>
          <span className="text-sm font-bold text-foreground bg-primary/10 px-2.5 py-0.5 rounded-full text-primary">
            {completedCount}/{tasks.length}
          </span>
        </div>
        <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden mt-3">
          <div 
            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="space-y-2 pt-4">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="flex items-center gap-3 p-2.5 hover:bg-muted/30 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-border/50"
            onClick={() => toggleTask(task.id)}
          >
            {task.completed ? (
              <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="size-5 text-muted-foreground/50 shrink-0" />
            )}
            <span className={`text-sm ${task.completed ? 'text-muted-foreground line-through' : 'font-medium text-foreground'}`}>
              {task.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
