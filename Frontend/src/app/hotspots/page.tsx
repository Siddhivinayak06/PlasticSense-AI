'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHotspots, toHotspot } from '@/services/hotspots';
import { DataNote, QueryError } from '@/components/shared/QueryError';
import type { Hotspot } from '@/types/hotspot';
import { HotspotCard } from '@/features/hotspots/HotspotCard';
import { HotspotFilters } from '@/features/hotspots/HotspotFilters';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Flame, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HotspotsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{priority: string[], status: string[]}>({
    priority: [],
    status: [],
  });
  const [sortBy, setSortBy] = useState<'severity' | 'newest' | 'reports'>('severity');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['hotspots'],
    queryFn: fetchHotspots,
  });

  const realHotspots: Hotspot[] = useMemo(() => (data?.hotspots ?? []).map(toHotspot), [data]);

  const filteredHotspots = useMemo(() => {
    return realHotspots.filter(hotspot => {
      const matchesSearch = searchTerm === '' ||
        hotspot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotspot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotspot.location.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = filters.priority.length === 0 || (hotspot.priority !== null && filters.priority.includes(hotspot.priority));
      const matchesStatus = filters.status.length === 0 || filters.status.includes(hotspot.status);

      return matchesSearch && matchesPriority && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'severity') return (b.severityScore ?? -1) - (a.severityScore ?? -1);
      if (sortBy === 'reports') return b.reportCount - a.reportCount;
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });
  }, [realHotspots, searchTerm, filters, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flame className="w-8 h-8 text-orange-500" />
            Hotspot Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Geolocated reports grouped into observed clusters (within 2.5 km of each other).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            aria-pressed={sortBy === 'severity'}
            variant={sortBy === 'severity' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('severity')}
          >
            Highest Severity
          </Button>
          <Button
            aria-pressed={sortBy === 'reports'}
            variant={sortBy === 'reports' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('reports')}
          >
            Most Reports
          </Button>
          <Button
            aria-pressed={sortBy === 'newest'}
            variant={sortBy === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('newest')}
          >
            Newest
          </Button>
        </div>
      </div>

      <HotspotFilters onSearch={setSearchTerm} onFilterChange={setFilters} />

      {data && (
        <DataNote>
          {data.total_hotspots} cluster{data.total_hotspots === 1 ? '' : 's'} from reports with GPS coordinates. Status reflects linked
          cleanup assignments. These describe where waste has been reported; they are not a forecast.
        </DataNote>
      )}

      {isError ? (
        <QueryError onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-border/50 bg-muted/20">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredHotspots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredHotspots.map((hotspot, index) => (
              <HotspotCard key={hotspot.id} hotspot={hotspot} index={index} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No hotspots found</h3>
          <p className="text-muted-foreground max-w-md">
            {realHotspots.length === 0
              ? 'No geolocated reports yet. Hotspots appear once analysed images include GPS (EXIF, overlay, or manual coordinates).'
              : 'No hotspots match the current filters. Try adjusting your search or clearing the filters.'}
          </p>
          <Button variant="outline" className="mt-6" onClick={() => {
            setSearchTerm('');
            setFilters({priority: [], status: []});
          }}>
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}