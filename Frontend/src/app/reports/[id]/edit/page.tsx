'use client';

import { use } from 'react';
import { getReportById } from '@/mock/reports';
import { CreateReportForm } from '@/features/reports/CreateReportForm';
import { EmptyState } from '@/components/shared/EmptyState';

export default function EditReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const report = getReportById(id);

  if (!report) {
    return (
      <div className="max-w-[1600px] mx-auto pt-10">
        <EmptyState title="Report Not Found" description={`We couldn't find a report with ID ${id}.`} />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <CreateReportForm initialData={report} isEditing />
    </div>
  );
}
