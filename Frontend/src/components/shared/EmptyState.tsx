
import { FolderX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({ title = 'No results found', description = 'We could not find any data matching your criteria.' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-sm min-h-[300px]">
      <div className="p-4 bg-primary/10 rounded-full mb-4">
        <FolderX className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>
    </div>
  );
}
