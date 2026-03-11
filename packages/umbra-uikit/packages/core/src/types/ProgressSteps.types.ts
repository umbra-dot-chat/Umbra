/**
 * @module ProgressSteps
 */
import type React from 'react';
import { defaultSpacing } from '../theme/create-theme';

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

/** Available stepper sizes. */
export const progressStepsSizes = ['sm', 'md', 'lg'] as const;

/** Union of valid stepper size values. */
export type ProgressStepsSize = (typeof progressStepsSizes)[number];

/** Dimensional config for a stepper size step. */
export interface ProgressStepsSizeConfig {
  /** Circle/dot diameter in pixels. */
  dotSize: number;
  /** Line thickness in pixels. */
  lineThickness: number;
  /** Label font size in pixels. */
  labelFontSize: number;
  /** Description font size in pixels. */
  descriptionFontSize: number;
  /** Icon size inside the circle. */
  iconSize: number;
  /** Gap between elements. */
  gap: number;
}

/** Size → config lookup. */
export const progressStepsSizeMap: Record<ProgressStepsSize, ProgressStepsSizeConfig> = {
  sm: { dotSize: 24, lineThickness: 2, labelFontSize: 12, descriptionFontSize: 11, iconSize: 14, gap: defaultSpacing.sm },
  md: { dotSize: 32, lineThickness: 2, labelFontSize: 14, descriptionFontSize: 12, iconSize: 16, gap: defaultSpacing.md },
  lg: { dotSize: 40, lineThickness: 2, labelFontSize: 15, descriptionFontSize: 13, iconSize: 20, gap: defaultSpacing.md },
};

// ---------------------------------------------------------------------------
// Orientation
// ---------------------------------------------------------------------------

/** Available stepper orientations. */
export const progressStepsOrientations = ['horizontal', 'vertical'] as const;

/** Union of valid orientation values. */
export type ProgressStepsOrientation = (typeof progressStepsOrientations)[number];

// ---------------------------------------------------------------------------
// Step definition
// ---------------------------------------------------------------------------

/** Describes a single step in the stepper. */
export interface ProgressStep {
  /** Unique identifier for this step. */
  id: string;
  /** Step label text. */
  label: string;
  /** Optional description beneath the label. */
  description?: string;
  /** Optional icon for the step circle. */
  icon?: React.ComponentType<{ size?: number | string; color?: string; strokeWidth?: number }>;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link ProgressSteps} component.
 */
export interface ProgressStepsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Array of step definitions. */
  steps: ProgressStep[];

  /**
   * Index (0-based) of the currently active step.
   * @default 0
   */
  currentStep?: number;

  /**
   * Layout orientation.
   * @default 'horizontal'
   */
  orientation?: ProgressStepsOrientation;

  /**
   * Size preset.
   * @default 'md'
   */
  size?: ProgressStepsSize;

  /** Callback fired when a completed step is clicked. Receives the step index. */
  onStepClick?: (index: number) => void;
}
