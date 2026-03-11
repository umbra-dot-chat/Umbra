/**
 * @module ProgressSteps
 */
import React, { forwardRef, useMemo } from 'react';
import type { ProgressStepsProps } from '@coexist/wisp-core/types/ProgressSteps.types';
import { progressStepsSizeMap } from '@coexist/wisp-core/types/ProgressSteps.types';
import type { StepStatus } from '@coexist/wisp-core/styles/ProgressSteps.styles';
import {
  buildStepsContainerStyle,
  buildStepWrapperStyle,
  buildStepDotStyle,
  buildConnectorStyle,
  buildStepLabelStyle,
  buildStepDescriptionStyle,
} from '@coexist/wisp-core/styles/ProgressSteps.styles';
import { useTheme } from '../../providers';
import { defaultSpacing } from '@coexist/wisp-core/theme/create-theme';

// Checkmark SVG for completed steps
function CheckIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path
        d="M3.5 8.5L6.5 11.5L12.5 4.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ProgressSteps — Multi-step stepper primitive for the Wisp design system.
 *
 * @remarks
 * Displays a sequence of steps with completed, active, and upcoming states.
 * Supports horizontal and vertical orientations, optional icons, descriptions,
 * and clickable completed steps.
 *
 * @example
 * ```tsx
 * <ProgressSteps
 *   steps={[
 *     { id: 'details', label: 'Details' },
 *     { id: 'payment', label: 'Payment' },
 *     { id: 'confirm', label: 'Confirm' },
 *   ]}
 *   currentStep={1}
 * />
 * ```
 */
export const ProgressSteps = forwardRef<HTMLDivElement, ProgressStepsProps>(function ProgressSteps(
  {
    steps,
    currentStep = 0,
    orientation = 'horizontal',
    size = 'md',
    onStepClick,
    style: userStyle,
    className,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = progressStepsSizeMap[size];

  const containerStyle = useMemo(
    () => buildStepsContainerStyle(orientation),
    [orientation],
  );

  return (
    <div
      ref={ref}
      role="list"
      aria-label="Progress"
      className={className}
      style={{ ...containerStyle, ...userStyle }}
      {...rest}
    >
      {steps.map((step, i) => {
        const status: StepStatus = i < currentStep ? 'completed' : i === currentStep ? 'active' : 'upcoming';
        const isLast = i === steps.length - 1;
        const clickable = status === 'completed' && !!onStepClick;
        const StepIcon = step.icon;

        const wrapperStyle = buildStepWrapperStyle(orientation, isLast);
        const dotStyle = buildStepDotStyle(sizeConfig, status, theme, clickable);
        const labelStyle = buildStepLabelStyle(sizeConfig, status, theme);
        const descStyle = step.description ? buildStepDescriptionStyle(sizeConfig, theme) : undefined;

        const dotContent = status === 'completed'
          ? (StepIcon ? <StepIcon size={sizeConfig.iconSize} color={themeColors.text.inverse} strokeWidth={2} /> : <CheckIcon size={sizeConfig.iconSize} color={themeColors.text.inverse} />)
          : (StepIcon ? <StepIcon size={sizeConfig.iconSize} color="currentColor" strokeWidth={2} /> : <span>{i + 1}</span>);

        if (orientation === 'horizontal') {
          return (
            <div key={step.id} role="listitem" style={wrapperStyle}>
              {/* Connector line (between dots) */}
              {!isLast && (
                <div style={buildConnectorStyle(sizeConfig, orientation, i < currentStep, theme)} />
              )}

              {/* Dot */}
              <div
                style={dotStyle}
                onClick={clickable ? () => onStepClick!(i) : undefined}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={step.label}
              >
                {dotContent}
              </div>

              {/* Label + description */}
              <div style={{ textAlign: 'center', marginTop: sizeConfig.gap, maxWidth: 100 }}>
                <div style={labelStyle}>{step.label}</div>
                {step.description && <div style={descStyle}>{step.description}</div>}
              </div>
            </div>
          );
        }

        // Vertical orientation
        return (
          <div key={step.id} role="listitem" style={wrapperStyle}>
            {/* Dot column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <div
                style={dotStyle}
                onClick={clickable ? () => onStepClick!(i) : undefined}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={step.label}
              >
                {dotContent}
              </div>
              {/* Vertical connector */}
              {!isLast && (
                <div style={buildConnectorStyle(sizeConfig, orientation, i < currentStep, theme)} />
              )}
            </div>

            {/* Label + description */}
            <div style={{ marginLeft: sizeConfig.gap, paddingTop: defaultSpacing.xs }}>
              <div style={labelStyle}>{step.label}</div>
              {step.description && <div style={descStyle}>{step.description}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
});

ProgressSteps.displayName = 'ProgressSteps';
