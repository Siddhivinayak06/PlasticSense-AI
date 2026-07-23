'use client';

import { Filter } from 'lucide-react';

export function AnalyticsFilters() {
  return (
    <div className="glass p-3 rounded-2xl flex flex-col md:flex-row items-center gap-4">
      <div className="flex items-center gap-2 mr-4 text-muted-foreground hidden lg:flex">
        <Filter className="size-4" />
        <span className="text-sm font-medium">Filters:</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
        <select className="h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="last30">Last 30 Days</option>
          <option value="last90">Last 90 Days</option>
          <option value="thisYear">This Year</option>
          <option value="allTime">All Time</option>
        </select>
        
        <select className="h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">All Regions</option>
          <option value="mumbai">Mumbai Coast</option>
          <option value="chennai">Chennai Beach</option>
          <option value="kochi">Kochi Estuary</option>
        </select>
        
        <select className="h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">All Plastic Types</option>
          <option value="pet">PET Bottles</option>
          <option value="bags">Plastic Bags</option>
          <option value="nets">Ghost Nets</option>
        </select>

        <select className="h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    </div>
  );
}
