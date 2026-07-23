import { Hotspot } from '@/types/hotspot';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, Droplets, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface HotspotCardProps {
  hotspot: Hotspot;
  index?: number;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    case 'high': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'low': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    case 'in-progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    case 'resolved': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'verified': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const HotspotCard = ({ hotspot, index = 0 }: HotspotCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="h-full flex flex-col hover:border-blue-500/50 transition-colors duration-300">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle className="text-lg font-semibold line-clamp-1" title={hotspot.name}>
                {hotspot.name}
              </CardTitle>
              <div className="text-sm text-muted-foreground flex items-center mt-1">
                <MapPin className="w-3 h-3 mr-1" />
                <span className="truncate">{hotspot.location.city}</span>
              </div>
            </div>
            <Badge variant="outline" className={`shrink-0 capitalize ${getPriorityColor(hotspot.priority)}`}>
              {hotspot.priority}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Reports</span>
              <span className="font-semibold">{hotspot.reportCount}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Severity Score</span>
              <span className="font-semibold text-red-500">{hotspot.severityScore}/100</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Cleanup Progress</span>
              <span className="font-medium">{hotspot.cleanupProgress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full ${hotspot.cleanupProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                style={{ width: `${hotspot.cleanupProgress}%` }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {hotspot.plasticTypes.slice(0, 2).map((type, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] py-0">
                {type}
              </Badge>
            ))}
            {hotspot.plasticTypes.length > 2 && (
              <Badge variant="secondary" className="text-[10px] py-0">
                +{hotspot.plasticTypes.length - 2}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between items-center border-t border-border/50 mt-4 px-6 py-4">
          <Badge variant="outline" className={`capitalize border-0 ${getStatusColor(hotspot.status)}`}>
            {hotspot.status.replace('-', ' ')}
          </Badge>
          
          <Link href={`/hotspots/${hotspot.id}`}>
            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-0 h-auto gap-1">
              Quick View
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
