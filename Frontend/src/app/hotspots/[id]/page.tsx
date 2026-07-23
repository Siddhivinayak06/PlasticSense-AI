import { mockHotspots } from '@/mock/hotspots';
import { HotspotDetail } from '@/features/hotspots/HotspotDetail';
import { notFound } from 'next/navigation';

export default async function HotspotDetailPage({ params }: { params: { id: string } }) {
  // Simulate network delay for real feel
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const hotspot = mockHotspots.find(h => h.id === params.id);
  
  if (!hotspot) {
    notFound();
  }

  return <HotspotDetail hotspot={hotspot} />;
}
