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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Equipment & Task Checklist</CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount}/{tasks.length}
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden mt-2">
          <div 
            className={`h-full transition-all duration-500 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map(task => (
          <div 
            key={task.id} 
            className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-md cursor-pointer transition-colors"
            onClick={() => toggleTask(task.id)}
          >
            {task.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <span className={`text-sm ${task.completed ? 'text-muted-foreground line-through' : 'font-medium'}`}>
              {task.label}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
