'use client';

import { useState } from 'react';
import { Download, Printer, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { fetchDetections } from '@/services/detection';
import { apiErrorMessage } from '@/lib/api';
import { downloadCsv, REPORT_CSV_HEADER, reportCsvRows } from '@/lib/csv';

interface AnalyticsHeaderProps {
  title: string;
  description: string;
}

export function AnalyticsHeader({ title, description }: AnalyticsHeaderProps) {
  const [exporting, setExporting] = useState(false);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = [];
      for (let page = 1; ; page++) {
        const res = await fetchDetections(page, 100);
        all.push(...res.data);
        if (page >= res.meta.total_pages) break;
      }
      downloadCsv(`wastesense-reports-${new Date().toISOString().slice(0, 10)}.csv`, REPORT_CSV_HEADER, reportCsvRows(all));
      toast.success(`Exported ${all.length} reports`);
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Export failed.'));
    } finally {
      setExporting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not access the clipboard');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-2 print:hidden">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv} disabled={exporting}>
          {exporting ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : <Download className="size-3.5" aria-hidden="true" />}
          Export CSV
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()} title="Print or save as PDF">
          <Printer className="size-3.5" aria-hidden="true" />
          Print / PDF
        </Button>
        <Button variant="outline" size="icon-sm" onClick={copyLink} aria-label="Copy link to this page" title="Copy link">
          <Link2 className="size-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
