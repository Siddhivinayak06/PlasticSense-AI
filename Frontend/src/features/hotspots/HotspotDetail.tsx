'use client';

import { Hotspot } from '@/types/hotspot';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, AlertTriangle, Droplets, ArrowLeft, Activity, 
  TrendingUp, TrendingDown, Minus, Info, ShieldAlert, FileText 
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface HotspotDetailProps {
  hotspot: Hotspot;
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

const TrendIcon = ({ trend }: { trend: string }) => {
  if (trend === 'increasing') return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (trend === 'decreasing') return <TrendingDown className="w-4 h-4 text-emerald-500" />;
  return <Minus className="w-4 h-4 text-amber-500" />;
};

export const HotspotDetail = ({ hotspot }: HotspotDetailProps) => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4">
          <Link href="/hotspots">
            <Button variant="outline" size="icon" className="w-8 h-8 rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{hotspot.name}</h1>
              <Badge variant="outline" className={`capitalize ${getPriorityColor(hotspot.priority)}`}>
                {hotspot.priority} Priority
              </Badge>
            </div>
            <div className="text-muted-foreground flex items-center gap-2 mt-1">
              <span className="text-sm font-mono">{hotspot.id}</span>
              <span>•</span>
              <div className="flex items-center text-sm">
                <MapPin className="w-3 h-3 mr-1" />
                {hotspot.location.city}, {hotspot.location.address}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {hotspot.status !== 'resolved' && hotspot.status !== 'verified' && (
            <Link href="/assignments">
              <Button>Assign Team</Button>
            </Link>
          )}
          <Button variant="outline">Generate Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content (Left col) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Severity Score</p>
                    <p className="text-3xl font-bold">{hotspot.severityScore}<span className="text-lg text-muted-foreground">/100</span></p>
                  </div>
                  <div className="p-2 bg-red-500/10 rounded-full">
                    <Activity className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Reports</p>
                    <p className="text-3xl font-bold">{hotspot.reportCount}</p>
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-full">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Critical Reports</p>
                    <p className="text-3xl font-bold">{hotspot.criticalReports}</p>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Map Preview</CardTitle>
              <CardDescription>Estimated area of pollution</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mock Map Area */}
              <div className="w-full h-[400px] bg-secondary/50 rounded-xl overflow-hidden relative group border border-border">
                <div className="absolute inset-0 bg-[url('/placeholder-map.png')] bg-cover bg-center opacity-40 dark:opacity-20 group-hover:opacity-50 transition-opacity"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full animate-ping absolute"></div>
                  <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 relative z-10 shadow-lg flex items-center justify-center">
                    <MapPin className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur-md p-3 rounded-lg border border-border/50 text-sm flex justify-between items-center">
                  <div className="font-mono text-xs text-muted-foreground">
                    Lat: {hotspot.location.lat.toFixed(4)}<br/>
                    Lng: {hotspot.location.lng.toFixed(4)}
                  </div>
                  <Button variant="secondary" size="sm">Open in Maps</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar (Right col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hotspot Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Status</h4>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`capitalize border-0 ${getStatusColor(hotspot.status)}`}>
                    {hotspot.status.replace('-', ' ')}
                  </Badge>
                  {hotspot.assignedTeam && (
                    <span className="text-sm">Assigned to: <span className="font-semibold">{hotspot.assignedTeam}</span></span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Cleanup Progress</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-full ${hotspot.cleanupProgress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                      style={{ width: `${hotspot.cleanupProgress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{hotspot.cleanupProgress}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Risk Level</h4>
                  <div className="flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4 text-orange-500" />
                    <span className="capitalize font-medium">{hotspot.riskLevel}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Trend</h4>
                  <div className="flex items-center gap-1">
                    <TrendIcon trend={hotspot.trend} />
                    <span className="capitalize font-medium">{hotspot.trend}</span>
                  </div>
                </div>
              </div>

              {hotspot.nearbyWaterBody && (
                <div className="pt-4 border-t border-border/50">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Nearby Water Body</h4>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">{hotspot.nearbyWaterBody}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border/50">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Found Plastic Types</h4>
                <div className="flex flex-wrap gap-2">
                  {hotspot.plasticTypes.map((type, i) => (
                    <Badge key={i} variant="secondary" className="font-normal">
                      {type}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Most common: <span className="font-semibold">{hotspot.mostCommonPlastic}</span>
                </p>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                Action & Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Recommended Action</h4>
                <p className="text-sm bg-secondary/50 p-3 rounded-md border border-border/50">{hotspot.recommendedAction}</p>
              </div>
              {hotspot.notes && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Field Notes</h4>
                  <p className="text-sm">{hotspot.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};
