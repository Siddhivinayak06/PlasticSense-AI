'use client';

import React from 'react';
import { Download, Maximize, EyeOff, Eye, Filter, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DetectionControlsProps {
  showLabels: boolean;
  setShowLabels: (show: boolean) => void;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
  onFullscreen: () => void;
  onDownload: () => void;
}

export function DetectionControls({
  showLabels,
  setShowLabels,
  filterCategory,
  setFilterCategory,
  onFullscreen,
  onDownload,
}: DetectionControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/40 border-b border-border/50 rounded-t-2xl">
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setShowLabels(!showLabels)}
          className={`gap-1.5 text-xs ${showLabels ? 'text-primary' : 'text-muted-foreground'}`}
        >
          {showLabels ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          {showLabels ? 'Hide Labels' : 'Show Labels'}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-7 px-2 gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" />
            Filter: <span className="capitalize text-foreground">{filterCategory}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs">Filter by waste type</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filterCategory === 'all'}
              onCheckedChange={() => setFilterCategory('all')}
              className="text-xs cursor-pointer"
            >
              All Waste
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterCategory === 'plastic'}
              onCheckedChange={() => setFilterCategory('plastic')}
              className="text-xs cursor-pointer"
            >
              Only Plastic
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterCategory === 'glass'}
              onCheckedChange={() => setFilterCategory('glass')}
              className="text-xs cursor-pointer"
            >
              Glass
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filterCategory === 'metal'}
              onCheckedChange={() => setFilterCategory('metal')}
              className="text-xs cursor-pointer"
            >
              Metal
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon-sm" onClick={onFullscreen} title="Fullscreen">
          <Maximize className="size-3.5 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onDownload} title="Download Result">
          <Download className="size-3.5 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
