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
    <Card className="mb-6 bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, or area..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 bg-background/50"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-start sm:items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground mr-2 hidden sm:block" />
              {PRIORITIES.map(p => (
                <Badge
                  key={p}
                  variant={activeFilters.priority.includes(p) ? 'default' : 'outline'}
                  className={`cursor-pointer capitalize ${activeFilters.priority.includes(p) ? '' : 'hover:bg-secondary'}`}
                  onClick={() => toggleFilter('priority', p)}
                >
                  {p}
                </Badge>
              ))}
              <div className="w-px h-4 bg-border mx-2 hidden sm:block" />
              {STATUSES.map(s => (
                <Badge
                  key={s}
                  variant={activeFilters.status.includes(s) ? 'default' : 'outline'}
                  className={`cursor-pointer capitalize ${activeFilters.status.includes(s) ? '' : 'hover:bg-secondary'}`}
                  onClick={() => toggleFilter('status', s)}
                >
                  {s.replace('-', ' ')}
                </Badge>
              ))}
            </div>
            
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground shrink-0 px-2 h-8">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
