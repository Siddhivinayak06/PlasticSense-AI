'use client';

import { FlaskConical } from 'lucide-react';

interface PrototypeBannerProps {
  /** What specifically is not real, e.g. "cleanup performance history". */
  feature: string;
  /** Optional note on what would be required to make it real. */
  requirement?: string;
}

/**
 * Marks a screen whose figures are illustrative sample data, not live records.
 *
 * Several analytics and workflow screens were built against mock fixtures before
 * the matching backend endpoints existed. Rather than deleting that design work or
 * leaving it looking authoritative, each such screen carries this banner so an
 * operator can never mistake sample numbers for live municipal data.
 */
export function PrototypeBanner({ feature, requirement }: PrototypeBannerProps) {
  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-3 rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm dark:border-amber-500/40 dark:bg-amber-950/40"
    >
      <FlaskConical
        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="font-semibold text-amber-900 dark:text-amber-200">
          Prototype &mdash; sample data, not live records
        </p>
        <p className="text-amber-800/90 dark:text-amber-200/80">
          The {feature} shown here is illustrative sample data used to design this
          screen. It does not reflect detections stored in this system.
          {requirement ? ` ${requirement}` : ''}
        </p>
      </div>
    </div>
  );
}

export default PrototypeBanner;
