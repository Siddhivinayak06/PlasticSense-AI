import type { Variants, Transition, TargetAndTransition } from 'framer-motion';

/**
 * Standard spring and easing configurations for WasteSense Dashboard v15
 */
export const springGentle: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 26,
};

export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 28,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 450,
  damping: 32,
};

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 20,
};

export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const easeInOutSmooth: [number, number, number, number] = [0.4, 0, 0.2, 1];

/**
 * Staggered container variants for dashboard sections, grids, and lists
 */
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

export const containerStaggerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/**
 * Standard card entrance animation (subtle slide up + fade in + scale)
 */
export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSmooth,
  },
};

/**
 * Minimal fade in
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.35, ease: easeOutExpo },
  },
};

/**
 * Slide up without scale
 */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: easeOutExpo },
  },
};

/**
 * Scale in for badges, modals, and tooltips
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springSmooth,
  },
};

/**
 * Table row entrance for staggered data tables
 */
export const tableRowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: easeOutExpo },
  },
};

/**
 * Interactive micro-interaction presets
 */
export const microInteractions: {
  hoverLift: TargetAndTransition;
  hoverSubtleLift: TargetAndTransition;
  hoverScale: TargetAndTransition;
  tapScale: TargetAndTransition;
  tapSubtleScale: TargetAndTransition;
  iconRotate: TargetAndTransition;
} = {
  hoverLift: {
    y: -3,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  hoverSubtleLift: {
    y: -2,
    transition: { duration: 0.18, ease: 'easeOut' },
  },
  hoverScale: {
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  tapScale: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
  tapSubtleScale: {
    scale: 0.985,
    transition: { duration: 0.08 },
  },
  iconRotate: {
    rotate: 15,
    scale: 1.1,
    transition: springSnappy,
  },
};
