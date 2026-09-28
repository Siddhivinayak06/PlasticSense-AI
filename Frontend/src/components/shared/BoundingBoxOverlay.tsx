'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DetectionItem } from '@/types/detection';

interface BoundingBoxOverlayProps {
  imageUrl: string;
  items: DetectionItem[];
  showLabels: boolean;
  filterCategory: string;
  className?: string;
  onItemHover?: (id: string | null) => void;
  hoveredItemId?: string | null;
}

const CATEGORY_COLORS: Record<string, { stroke: string; fill: string }> = {
  plastic:   { stroke: '#2563EB', fill: 'rgba(37,  99, 235, 0.12)' },
  glass:     { stroke: '#FFFFFF', fill: 'rgba(255,255,255, 0.10)' },
  metal:     { stroke: '#06B6D4', fill: 'rgba(6,  182, 212, 0.12)' },
  paper:     { stroke: '#F59E0B', fill: 'rgba(245,158,  11, 0.12)' },
  cardboard: { stroke: '#F97316', fill: 'rgba(249,115,  22, 0.12)' },
  hazardous: { stroke: '#EF4444', fill: 'rgba(239, 68,  68, 0.12)' },
  other:     { stroke: '#A855F7', fill: 'rgba(168, 85, 247, 0.12)' },
  default:   { stroke: '#EF4444', fill: 'rgba(239, 68,  68, 0.12)' },
};

const CHAR_PX   = 7.8;
const LABEL_H   = 22;
const LABEL_PAD = 6;

function formatLabel(className: string, confidence: number): string {
  const name = className.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return `${name} ${confidence.toFixed(2)}`;
}

interface ImageLayout {
  /** Offset of the actual image content from the container top-left (px) */
  offsetX: number;
  offsetY: number;
  /** Rendered size of the image content (px) */
  renderedW: number;
  renderedH: number;
  /** Scale from natural image pixels to rendered pixels */
  scaleX: number;
  scaleY: number;
}

/**
 * Replicates what CSS `object-contain` does:
 * fits the image inside the container while preserving aspect ratio,
 * centering it both horizontally and vertically.
 */
function computeObjectContainLayout(
  containerW: number,
  containerH: number,
  naturalW: number,
  naturalH: number,
): ImageLayout {
  if (containerW === 0 || containerH === 0 || naturalW === 0 || naturalH === 0) {
    return { offsetX: 0, offsetY: 0, renderedW: containerW, renderedH: containerH, scaleX: 1, scaleY: 1 };
  }

  const containerAspect = containerW / containerH;
  const imageAspect     = naturalW   / naturalH;

  let renderedW: number;
  let renderedH: number;

  if (imageAspect > containerAspect) {
    // Image is wider than container → constrained by container width
    renderedW = containerW;
    renderedH = containerW / imageAspect;
  } else {
    // Image is taller (or same) → constrained by container height
    renderedH = containerH;
    renderedW = containerH * imageAspect;
  }

  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;

  return {
    offsetX,
    offsetY,
    renderedW,
    renderedH,
    scaleX: renderedW / naturalW,
    scaleY: renderedH / naturalH,
  };
}

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
  const imageRef     = useRef<HTMLImageElement>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [layout, setLayout]     = useState<ImageLayout | null>(null);

  // Filter by category
  const visibleItems = items.filter((item) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'other') return item.waste_group.toLowerCase() !== 'plastic';
    return item.waste_group.toLowerCase() === filterCategory.toLowerCase();
  });

  /** Measure the container and compute where object-contain places the image */
  const measure = useCallback(() => {
    const img       = imageRef.current;
    const container = containerRef.current;
    if (!img || !container || !isLoaded) return;
    if (img.naturalWidth === 0 || img.naturalHeight === 0) return;

    // Use clientWidth/clientHeight — these give the inner CSS box dimensions,
    // which is what the image is rendered into, without any transform effects.
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    const result = computeObjectContainLayout(
      containerW,
      containerH,
      img.naturalWidth,
      img.naturalHeight,
    );

    setLayout(result);
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    // ResizeObserver on the container fires whenever it changes size
    // (window resize, panel resize, fullscreen enter/exit, etc.)
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    if (containerRef.current) ro.observe(containerRef.current);

    // Fullscreen transition may not always trigger ResizeObserver immediately
    const onFSChange = () => requestAnimationFrame(measure);
    document.addEventListener('fullscreenchange', onFSChange);

    measure(); // initial layout

    return () => {
      ro.disconnect();
      document.removeEventListener('fullscreenchange', onFSChange);
    };
  }, [isLoaded, measure]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden ${className ?? ''}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* The image fills the container; CSS object-contain handles letterboxing */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Analyzed"
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        onLoad={() => {
          setIsLoaded(true);
          requestAnimationFrame(measure);
        }}
        draggable={false}
      />

      {/*
        SVG is positioned to match EXACTLY the rendered image content area,
        not the container. This is key — with object-contain the image may be
        letterboxed, so the SVG must be offset and sized to the actual image area.
      */}
      {isLoaded && layout && (
        <svg
          style={{
            position:      'absolute',
            left:          layout.offsetX,
            top:           layout.offsetY,
            width:         layout.renderedW,
            height:        layout.renderedH,
            overflow:      'visible',
            zIndex:        10,
            pointerEvents: 'auto',
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {visibleItems.map((item) => {
            if (!item.bbox_w || !item.bbox_h) return null;

            // Coordinates in natural image pixels → scale to rendered image pixels
            const x = item.bbox_x * layout.scaleX;
            const y = item.bbox_y * layout.scaleY;
            const w = item.bbox_w * layout.scaleX;
            const h = item.bbox_h * layout.scaleY;

            const group   = item.waste_group.toLowerCase();
            const colors  = CATEGORY_COLORS[group] ?? CATEGORY_COLORS.default;
            const isHovered = hoveredItemId === item.id || hoveredItemId === item.class_name;

            const STROKE = isHovered ? 3 : 2;
            const label  = formatLabel(item.class_name, item.confidence);
            const labelW = label.length * CHAR_PX + LABEL_PAD * 2;
            const badgeY = y >= LABEL_H ? y - LABEL_H : y;
            const textY  = badgeY + LABEL_H - 6;

            return (
              <g
                key={item.id}
                onMouseEnter={() => onItemHover?.(item.id)}
                onMouseLeave={() => onItemHover?.(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hover tint fill */}
                {isHovered && (
                  <rect
                    x={x} y={y}
                    width={Math.max(0, w)} height={Math.max(0, h)}
                    fill={colors.fill}
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Bounding box border — no fill */}
                <rect
                  x={x} y={y}
                  width={Math.max(0, w)} height={Math.max(0, h)}
                  stroke={colors.stroke}
                  strokeWidth={STROKE}
                  fill="none"
                />

                {/* Label badge */}
                {showLabels && (
                  <>
                    <rect
                      x={x} y={badgeY}
                      width={labelW} height={LABEL_H}
                      fill={colors.stroke}
                      style={{ pointerEvents: 'none' }}
                    />
                    <text
                      x={x + LABEL_PAD} y={textY}
                      fill={group === 'glass' ? '#000000' : '#ffffff'}
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="Arial, Helvetica, sans-serif"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {label}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
