'use client';

import { use, useState } from 'react';
import { getReportById } from '@/mock/reports';
import { EmptyState } from '@/components/shared/EmptyState';
import { ReportDetailHeader } from '@/features/reports/ReportDetailHeader';
import { ReportDetailInfo } from '@/features/reports/ReportDetailInfo';
import { ReportStatusTimeline } from '@/features/reports/ReportStatusTimeline';
import { ReportComments } from '@/features/reports/ReportComments';
import { ReportImageViewer } from '@/features/reports/ReportImageViewer';
import { Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const report = getReportById(id);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  if (!report) {
    return (
      <div className="max-w-[1600px] mx-auto pt-10">
        <EmptyState title="Report Not Found" description={`We couldn't find a report with ID ${id}.`} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      <ReportDetailHeader report={report} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="xl:col-span-2 space-y-6">
          {/* Main Image Banner */}
          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative h-64 sm:h-80 w-full glass rounded-2xl overflow-hidden group flex items-center justify-center bg-muted/20"
          >
            <img 
              src={report.imageUrl} 
              alt={report.plasticTypeLabel} 
              className="max-h-full max-w-full object-contain p-8 drop-shadow-xl" 
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
               <Button variant="secondary" className="gap-2 shadow-lg" onClick={() => setIsViewerOpen(true)}>
                  <Maximize2 className="size-4" />
                  View Full Image
               </Button>
            </div>
          </motion.div>

          <ReportDetailInfo report={report} />
        </div>

        {/* Right Column - Timeline & Comments */}
        <div className="flex flex-col gap-6">
          <ReportStatusTimeline report={report} />
          <ReportComments comments={report.comments} />
        </div>
      </div>

      <ReportImageViewer 
        imageUrl={report.imageUrl} 
        isOpen={isViewerOpen} 
        onClose={() => setIsViewerOpen(false)} 
      />
    </div>
  );
}
