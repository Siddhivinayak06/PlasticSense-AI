import { mockAssignments } from '@/mock/assignments';
import { CleanupDetail } from '@/features/assignments/CleanupDetail';
import { notFound } from 'next/navigation';

export default async function AssignmentDetailPage({ params }: { params: { id: string } }) {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const assignment = mockAssignments.find(a => a.id === params.id);
  
  if (!assignment) {
    notFound();
  }

  return <CleanupDetail assignment={assignment} />;
}
