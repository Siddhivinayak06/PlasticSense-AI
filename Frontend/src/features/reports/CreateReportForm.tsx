'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, X, MapPin, AlertTriangle, Box, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { plasticTypeOptions, severityConfig, priorityConfig } from '@/constants/reports';
import type { Report } from '@/types/report';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface CreateReportFormProps {
  initialData?: Report;
  isEditing?: boolean;
}

export function CreateReportForm({ initialData, isEditing = false }: CreateReportFormProps) {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(initialData?.imageUrl || null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // UI Only - normally handle files here
    setSelectedImage('/placeholder-bottle.svg');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? `Edit Report ${initialData?.id}` : 'Create New Report'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing ? 'Modify the details of an existing pollution report.' : 'Submit a new manual report of plastic pollution.'}
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
           <Button>{isEditing ? 'Save Changes' : 'Submit Report'}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Image Upload */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Report Imagery</h3>
            
            <div 
              className={cn(
                "relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-colors h-56",
                dragActive ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/50 hover:bg-muted/30",
                selectedImage && "border-none p-0 overflow-hidden bg-muted/40"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
               {selectedImage ? (
                 <>
                   <img src={selectedImage} alt="Preview" className="w-full h-full object-contain p-4" />
                   <Button 
                     size="icon-sm" 
                     variant="destructive" 
                     className="absolute top-2 right-2 rounded-full"
                     onClick={() => setSelectedImage(null)}
                   >
                     <X className="size-3.5" />
                   </Button>
                 </>
               ) : (
                 <>
                   <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                     <UploadCloud className="size-6" />
                   </div>
                   <p className="text-sm font-medium text-foreground">Drag & drop image here</p>
                   <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                   <Button variant="outline" size="sm" className="mt-4">Select Image</Button>
                 </>
               )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">
              Supported formats: JPG, PNG, WEBP. Max size 10MB.
            </p>
          </div>
        </div>

        {/* Right Column - Form Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass rounded-2xl p-5">
             <h3 className="text-sm font-semibold text-foreground mb-4">Report Details</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                
                {/* Plastic Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Box className="size-3.5 text-muted-foreground" />
                    Plastic Type
                  </label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={initialData?.plasticType || ''}
                  >
                    <option value="" disabled>Select plastic type...</option>
                    {plasticTypeOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-muted-foreground" />
                    Severity
                  </label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={initialData?.severity || ''}
                  >
                    <option value="" disabled>Select severity...</option>
                    {Object.entries(severityConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Gauge className="size-3.5 text-muted-foreground" />
                    Cleanup Priority
                  </label>
                  <select 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    defaultValue={initialData?.cleanupPriority || ''}
                  >
                    <option value="" disabled>Select priority...</option>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
             </div>

             <div className="mt-5 space-y-2">
               <label className="text-xs font-semibold text-foreground">Description</label>
               <Textarea 
                 placeholder="Provide details about the pollution..." 
                 className="min-h-[100px]"
                 defaultValue={initialData?.description || ''}
               />
             </div>
          </div>

          <div className="glass rounded-2xl p-5">
             <h3 className="text-sm font-semibold text-foreground mb-4">Location</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    City
                  </label>
                  <Input placeholder="Enter city name..." defaultValue={initialData?.city || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    Address / Landmark
                  </label>
                  <Input placeholder="Enter address..." defaultValue={initialData?.address || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Latitude</label>
                  <Input type="number" placeholder="e.g. 19.076" defaultValue={initialData?.lat || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-foreground">Longitude</label>
                  <Input type="number" placeholder="e.g. 72.877" defaultValue={initialData?.lng || ''} />
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
