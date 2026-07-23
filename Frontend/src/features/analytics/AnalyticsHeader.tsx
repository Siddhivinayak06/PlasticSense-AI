'use client';

import { Download, Printer, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AnalyticsHeaderProps {
  title: string;
  description: string;
}

export function AnalyticsHeader({ title, description }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => alert('UI Only: PDF Download triggered')}>
          <Download className="size-3.5" />
          Export PDF
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => alert('UI Only: CSV Download triggered')}>
          <Download className="size-3.5" />
          Export CSV
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => alert('UI Only: Print Dialog triggered')}>
          <Printer className="size-3.5" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => alert('UI Only: Share Dialog triggered')}>
          <Share2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
