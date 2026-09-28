'use client';

import React from 'react';
import { Download, Maximize, EyeOff, Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DetectionControlsProps {
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  /** Unique waste groups present in the current detection results */
  availableCategories?: string[];
  onFullscreen: () => void;
  onDownload: () => void;
}

/** Human-readable label for a waste group key */
function groupLabel(group: string): string {
  return group.charAt(0).toUpperCase() + group.slice(1);
}

export function DetectionControls({
  showLabels,
  setShowLabels,
  filterCategory,
  setFilterCategory,
  availableCategories = [],
  onFullscreen,
  onDownload,
}: DetectionControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/40 border-b border-border/50 rounded-t-2xl">
      <div className="flex items-center gap-1.5">
        {/* Toggle labels */}
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setShowLabels(!showLabels)}
          className={`gap-1.5 text-xs ${showLabels ? 'text-primary' : 'text-muted-foreground'}`}
        >
          {showLabels ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          {showLabels ? 'Hide Labels' : 'Show Labels'}
        </Button>

        {/* Filter dropdown — only shows categories present in this detection */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-7 px-2 gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            Filter:{' '}
            <span className="capitalize text-foreground ml-0.5">
              {filterCategory === 'all' ? 'All' : groupLabel(filterCategory)}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b border-border/50 mb-1">
              Filter by waste type
            </div>

            {/* "All" option always present */}
            <DropdownMenuCheckboxItem
              checked={filterCategory === 'all'}
              onCheckedChange={() => setFilterCategory('all')}
              className="text-xs cursor-pointer"
            >
              All Waste
            </DropdownMenuCheckboxItem>

            {/* One entry per unique waste group found in this detection */}
            {availableCategories.map((cat) => (
              <DropdownMenuCheckboxItem
                key={cat}
                checked={filterCategory === cat}
                onCheckedChange={() => setFilterCategory(cat)}
                className="text-xs cursor-pointer capitalize"
              >
                {groupLabel(cat)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Fullscreen — uses browser Fullscreen API */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onFullscreen}
          title="Fullscreen"
        >
          <Maximize className="size-3.5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDownload}
          title="Download Result"
        >
          <Download className="size-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
