'use client';

import { useState, useMemo } from 'react';
import { mockHotspots } from '@/mock/hotspots';
import { HotspotCard } from '@/features/hotspots/HotspotCard';
import { HotspotFilters } from '@/features/hotspots/HotspotFilters';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Flame, ListFilter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HotspotsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{priority: string[], status: string[]}>({
    priority: [],
    status: [],
  });
  const [sortBy, setSortBy] = useState<'severity' | 'newest' | 'reports'>('severity');

  const filteredHotspots = useMemo(() => {
    return mockHotspots.filter(hotspot => {
      const matchesSearch = searchTerm === '' || 
        hotspot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotspot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotspot.location.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPriority = filters.priority.length === 0 || filters.priority.includes(hotspot.priority);
      const matchesStatus = filters.status.length === 0 || filters.status.includes(hotspot.status);

      return matchesSearch && matchesPriority && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'severity') return b.severityScore - a.severityScore;
      if (sortBy === 'reports') return b.reportCount - a.reportCount;
      // newest based on ID or date
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });
  }, [searchTerm, filters, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Flame className="w-8 h-8 text-orange-500" />
            Hotspot Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor, prioritize, and manage pollution hotspots across regions.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant={sortBy === 'severity' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSortBy('severity')}
          >
            Highest Severity
          </Button>
          <Button 
            variant={sortBy === 'reports' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setSortBy('reports')}
          >
            Most Reports
          </Button>
        </div>
      </div>

      <HotspotFilters onSearch={setSearchTerm} onFilterChange={setFilters} />

      {filteredHotspots.length > 0 ? (
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
            We couldn't find any hotspots matching your current filters. Try adjusting your search or clearing the filters.
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