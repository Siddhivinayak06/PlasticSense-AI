'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { DetectionItem } from '@/types/detection';

interface BoundingBoxOverlayProps {
  imageUrl: string;
  items: DetectionItem[];
  showLabels: boolean;
  filterCategory: string; // 'all', 'plastic', etc.
  className?: string;
  onItemHover?: (id: string | null) => void;
  hoveredItemId?: string | null;
}

const CATEGORY_COLORS: Record<string, { stroke: string; fill: string; text: string }> = {
  plastic: { stroke: '#0ea5e9', fill: 'rgba(14, 165, 233, 0.2)', text: '#0ea5e9' },
  glass: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.2)', text: '#10b981' },
  metal: { stroke: '#64748b', fill: 'rgba(100, 116, 139, 0.2)', text: '#64748b' },
  paper: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b' },
  cardboard: { stroke: '#f97316', fill: 'rgba(249, 115, 22, 0.2)', text: '#f97316' },
  default: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
};

export function BoundingBoxOverlay({
  imageUrl,
  items,
  showLabels,
  filterCategory,
  className,
  onItemHover,
  hoveredItemId,
}: BoundingBoxOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [isLoaded, setIsLoaded] = useState(false);

  // Filter items
  const visibleItems = items.filter((item) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'plastic' && item.waste_group.toLowerCase() === 'plastic') return true;
    if (filterCategory === 'other' && item.waste_group.toLowerCase() !== 'plastic') return true;
    return item.waste_group.toLowerCase() === filterCategory.toLowerCase();
  });

  useEffect(() => {
    const updateScale = () => {
      if (imageRef.current && isLoaded) {
        // Original image natural size vs rendered size
        const { naturalWidth, naturalHeight, width, height } = imageRef.current;
        if (naturalWidth > 0 && naturalHeight > 0) {
          setScale({
            x: width / naturalWidth,
            y: height / naturalHeight,
          });
        }
      }
    };

    window.addEventListener('resize', updateScale);
    updateScale(); // Initial update

    // Also update on a slight delay to catch late layout shifts
    const timer = setTimeout(updateScale, 100);
    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timer);
    };
  }, [isLoaded, className]); // Re-run if container class changes (like fullscreen)

  return (
    <div ref={containerRef} className={`relative select-none ${className || ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Analyzed"
        className="w-full h-auto block object-contain max-h-full"
        onLoad={() => {
          setIsLoaded(true);
          // Trigger a resize event to ensure scale is updated
          window.dispatchEvent(new Event('resize'));
        }}
        draggable={false}
      />

      {isLoaded && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto"
          style={{ zIndex: 10 }}
        >
          {visibleItems.map((item) => {
            if (item.bbox_w === 0 || item.bbox_h === 0) return null;

            // Calculate scaled coordinates based on natural image size
            // The item coordinates are assumed to be relative to the original image dimensions.
            const x = item.bbox_x * scale.x;
            const y = item.bbox_y * scale.y;
            const w = item.bbox_w * scale.x;
            const h = item.bbox_h * scale.y;

            const group = item.waste_group.toLowerCase();
            const colors = CATEGORY_COLORS[group] || CATEGORY_COLORS.default;
            const isHovered = hoveredItemId === item.id || hoveredItemId === item.class_name;
            
            // Adjust styling based on hover state
            const strokeWidth = isHovered ? 3 : 2;
            const strokeOpacity = isHovered ? 1 : 0.8;
            const fillOpacity = isHovered ? 0.3 : 0.1;

            return (
              <g
                key={item.id}
                onMouseEnter={() => onItemHover?.(item.id)}
                onMouseLeave={() => onItemHover?.(null)}
                style={{ cursor: 'pointer' }}
                className="transition-all duration-200"
              >
                {/* Highlight box */}
                <rect
                  x={x}
                  y={y}
                  width={Math.max(0, w)}
                  height={Math.max(0, h)}
                  stroke={colors.stroke}
                  strokeWidth={strokeWidth}
                  strokeOpacity={strokeOpacity}
                  fill={colors.stroke}
                  fillOpacity={fillOpacity}
                  rx={4}
                  className="transition-all duration-200"
                />

                {/* Label */}
                {showLabels && (
                  <g className="transition-opacity duration-200" style={{ opacity: isHovered ? 1 : 0.9 }}>
                    <rect
                      x={x}
                      y={Math.max(0, y - 24)}
                      height={24}
                      width={100} // Approximate width, could be calculated based on text
                      fill={colors.stroke}
                      rx={4}
                      className="pointer-events-none"
                    />
                    <text
                      x={x + 6}
                      y={Math.max(0, y - 24) + 16}
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      fontFamily="system-ui, sans-serif"
                      className="pointer-events-none drop-shadow-sm capitalize"
                    >
                      {item.class_name.replace(/_/g, ' ')} {Math.round(item.confidence * 100)}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
