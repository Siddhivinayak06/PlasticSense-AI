import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

interface HotspotFiltersProps {
  onSearch: (term: string) => void;
  onFilterChange: (filters: any) => void;
}

const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['pending', 'in-progress', 'resolved', 'verified'];

export const HotspotFilters = ({ onSearch, onFilterChange }: HotspotFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{priority: string[], status: string[]}>({
    priority: [],
    status: [],
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const toggleFilter = (type: 'priority' | 'status', value: string) => {
    const current = activeFilters[type];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    
    const newFilters = { ...activeFilters, [type]: updated };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({ priority: [], status: [] });
    onFilterChange({ priority: [], status: [] });
    setSearchTerm('');
    onSearch('');
  };

  const hasActiveFilters = activeFilters.priority.length > 0 || activeFilters.status.length > 0 || searchTerm.length > 0;

  return (
    <div className="mb-6 glass rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or area..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-9 bg-muted/40 border-border/60 focus-visible:ring-primary/30 rounded-xl"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-start sm:items-center">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground mr-2 hidden sm:block" />
            {PRIORITIES.map(p => (
              <Badge
                key={p}
                variant={activeFilters.priority.includes(p) ? 'default' : 'outline'}
                className={`cursor-pointer capitalize text-xs px-2.5 py-0.5 rounded-full ${activeFilters.priority.includes(p) ? '' : 'hover:bg-muted/60 text-muted-foreground'}`}
                onClick={() => toggleFilter('priority', p)}
              >
                {p}
              </Badge>
            ))}
            <div className="w-px h-4 bg-border/50 mx-2 hidden sm:block" />
            {STATUSES.map(s => (
              <Badge
                key={s}
                variant={activeFilters.status.includes(s) ? 'default' : 'outline'}
                className={`cursor-pointer capitalize text-xs px-2.5 py-0.5 rounded-full ${activeFilters.status.includes(s) ? '' : 'hover:bg-muted/60 text-muted-foreground'}`}
                onClick={() => toggleFilter('status', s)}
              >
                {s.replace('-', ' ')}
              </Badge>
            ))}
          </div>
          
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground shrink-0 px-2 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
