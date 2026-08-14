'use client';

import React, { useState } from 'react';
import { Scan, ImageIcon, ZoomIn, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DetectionControls } from './DetectionControls';
import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import type { DetectionItem } from '@/types/detection';

interface ImageComparisonProps {
  originalImage: string;
  annotatedImage?: string; // Static backend image as fallback
  items?: DetectionItem[]; // Detections for interactive overlay
  hoveredItemId?: string | null;
  onItemHover?: (id: string | null) => void;
}

export function ImageComparison({ 
  originalImage, 
  annotatedImage, 
  items = [], 
  hoveredItemId, 
  onItemHover 
}: ImageComparisonProps) {
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  
  // Controls state
  const [showLabels, setShowLabels] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');

  const handleDownload = () => {
    // In a real app this would composite the SVG to canvas and download,
    // or just download the backend annotated image if available.
    const link = document.createElement('a');
    link.href = annotatedImage || originalImage;
    link.download = 'detected-waste.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col gap-6 w-full">
          {/* Original Image */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <ImageIcon className="size-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Original Image</h3>
            </div>
            <div 
              className="group rounded-2xl overflow-hidden border border-border/50 shadow bg-muted/20 relative aspect-video flex items-center justify-center cursor-zoom-in"
              onClick={() => setZoomedImg(originalImage)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={originalImage} alt="Original uploaded image" className="max-h-full max-w-full object-contain transition-transform group-hover:scale-[1.02]" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="size-8 text-white" />
              </div>
            </div>
          </div>

          {/* AI Detection (Interactive or Static) */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Scan className="size-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-foreground">AI Detection</h3>
            </div>
            <div className="rounded-2xl border border-emerald-500/30 shadow bg-emerald-500/5 relative flex flex-col overflow-hidden">
              {/* Interactive Controls */}
              {items.length > 0 && (
                <DetectionControls
                  showLabels={showLabels}
                  setShowLabels={setShowLabels}
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  onFullscreen={() => setZoomedImg('interactive')}
                  onDownload={handleDownload}
                />
              )}
              
              <div 
                className="relative aspect-video flex items-center justify-center group"
                onClick={() => {
                  if (items.length === 0 && annotatedImage) setZoomedImg(annotatedImage);
                  else if (items.length > 0) setZoomedImg('interactive');
                }}
              >
                {items.length > 0 ? (
                  <BoundingBoxOverlay
                    imageUrl={originalImage}
                    items={items}
                    showLabels={showLabels}
                    filterCategory={filterCategory}
                    className="w-full h-full cursor-zoom-in"
                    hoveredItemId={hoveredItemId}
                    onItemHover={onItemHover}
                  />
                ) : (
                  <div className="relative w-full h-full cursor-zoom-in">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={annotatedImage || originalImage} alt="YOLO11 detected output" className="max-h-full max-w-full object-contain mx-auto transition-transform group-hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ZoomIn className="size-8 text-white" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {zoomedImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoomedImg(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4 cursor-zoom-out"
          >
            <button className="absolute top-6 right-6 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-[110]">
              <X className="size-6" />
            </button>
            <div 
              className="relative max-h-[90vh] max-w-[90vw] w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()} 
            >
              {zoomedImg === 'interactive' ? (
                <BoundingBoxOverlay
                  imageUrl={originalImage}
                  items={items}
                  showLabels={showLabels}
                  filterCategory={filterCategory}
                  className="max-h-full max-w-full rounded-xl shadow-2xl"
                  hoveredItemId={hoveredItemId}
                  onItemHover={onItemHover}
                />
              ) : (
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  src={zoomedImg}
                  className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-white/20"
                  alt="Zoomed view"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
