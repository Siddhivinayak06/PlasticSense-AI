'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, Download, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ReportImageViewerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportImageViewer({ imageUrl, isOpen, onClose }: ReportImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 0.5));
  
  const resetScale = () => {
    setScale(1);
    setIsFullscreen(false);
  };

  const handleClose = () => {
    resetScale();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className={`max-w-5xl w-full p-0 overflow-hidden bg-black/95 border-none shadow-2xl ${isFullscreen ? 'h-screen max-w-full rounded-none' : 'h-[80vh] rounded-2xl'}`}
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        
        {/* Top Controls */}
        <div className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} className="text-white hover:bg-white/20">
              <ZoomOut className="size-4" />
            </Button>
            <span className="text-white text-xs font-mono w-12 text-center">{Math.round(scale * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} className="text-white hover:bg-white/20">
              <ZoomIn className="size-4" />
            </Button>
            <div className="w-px h-4 bg-white/30 mx-2" />
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="text-white hover:bg-white/20">
              <Maximize className="size-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Download className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose} className="text-white hover:bg-white/20">
              <X className="size-5" />
            </Button>
          </div>
        </div>

        {/* Navigation - UI Only placeholder */}
        <div className="absolute top-1/2 left-4 -translate-y-1/2 z-50">
           <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10 bg-black/40 backdrop-blur-sm">
              <ChevronLeft className="size-6" />
           </Button>
        </div>
        <div className="absolute top-1/2 right-4 -translate-y-1/2 z-50">
           <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10 bg-black/40 backdrop-blur-sm">
              <ChevronRight className="size-6" />
           </Button>
        </div>

        {/* Image Area */}
        <div className="relative w-full h-full flex items-center justify-center overflow-auto custom-scrollbar">
          <motion.div
            animate={{ scale }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative flex items-center justify-center min-h-full min-w-full"
          >
             <div className="relative max-w-full max-h-full flex items-center justify-center p-12">
                <img 
                  src={imageUrl} 
                  alt="Report imagery" 
                  className="max-w-full max-h-full object-contain drop-shadow-2xl" 
                  draggable={false}
                />
             </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
