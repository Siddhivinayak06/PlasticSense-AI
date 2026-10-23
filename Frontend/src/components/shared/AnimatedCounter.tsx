'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (val: number) => string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 800,
  formatter = (v) => Math.round(v).toLocaleString(),
  className = '',
}: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(prefersReducedMotion ? value : 0);
  const startTimestampRef = useRef<number | null>(null);
  const startValRef = useRef<number>(0);
  const targetValRef = useRef<number>(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    startValRef.current = displayValue;
    targetValRef.current = value;
    startTimestampRef.current = null;

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const step = (timestamp: number) => {
      if (!startTimestampRef.current) startTimestampRef.current = timestamp;
      const progress = Math.min((timestamp - startTimestampRef.current) / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = startValRef.current + (targetValRef.current - startValRef.current) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValRef.current);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, prefersReducedMotion]);

  return <span className={`tabular-nums ${className}`}>{formatter(displayValue)}</span>;
}
