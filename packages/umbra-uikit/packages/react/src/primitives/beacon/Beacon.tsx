/**
 * Beacon — A pulsing icon button that opens a popover with help content.
 *
 * @remarks
 * Renders a small circular button (default: info "i" icon) that pulses to
 * draw attention. Clicking the button opens a {@link Popover} with the
 * provided children as content. Supports controlled/uncontrolled open state,
 * configurable placement, and colour variants.
 *
 * @module primitives/beacon
 * @example
 * ```tsx
 * <Beacon variant="info" placement="right">
 *   <p>Click here to get started!</p>
 * </Beacon>
 * ```
 */

import React, { forwardRef, useMemo, useEffect } from 'react';
import type { BeaconProps } from '@coexist/wisp-core/types/Beacon.types';
import { beaconSizeMap } from '@coexist/wisp-core/types/Beacon.types';
import {
  resolveBeaconColor,
  buildBeaconButtonStyle,
  buildBeaconPulseStyle,
} from '@coexist/wisp-core/styles/Beacon.styles';
import { useTheme } from '../../providers';
import { Icon } from '../icon';
import { Popover, PopoverTrigger, PopoverContent } from '../../components/popover';
import { Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// Keyframe injection (singleton)
// ---------------------------------------------------------------------------

let beaconPulseInjected = false;

function injectBeaconPulseKeyframe(color: string) {
  if (beaconPulseInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wisp-beacon-pulse {
      0% { box-shadow: 0 0 0 0px currentColor; }
      70% { box-shadow: 0 0 0 6px transparent; }
      100% { box-shadow: 0 0 0 0px transparent; }
    }
  `;
  document.head.appendChild(style);
  beaconPulseInjected = true;
}

// ---------------------------------------------------------------------------
// Beacon
// ---------------------------------------------------------------------------

/**
 * Beacon — Pulsing help icon that opens a popover on click.
 *
 * @example
 * ```tsx
 * <Beacon variant="info" pulsing>
 *   <p>Helpful tip goes here.</p>
 * </Beacon>
 * ```
 */
export const Beacon = forwardRef<HTMLButtonElement, BeaconProps>(function Beacon(
  {
    children,
    icon: IconComponent,
    pulsing = true,
    placement = 'bottom',
    align = 'center',
    offset = 8,
    size = 'md',
    variant = 'info',
    open,
    onOpenChange,
    className,
    style: userStyle,
    ...rest
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = beaconSizeMap[size];
  const accentColor = useMemo(
    () => resolveBeaconColor(variant, theme),
    [variant, theme],
  );

  // Inject pulse keyframe when pulsing is enabled
  useEffect(() => {
    if (pulsing) injectBeaconPulseKeyframe(accentColor);
  }, [pulsing, accentColor]);

  const buttonStyle = useMemo(
    () => buildBeaconButtonStyle(sizeConfig, accentColor, theme),
    [sizeConfig, accentColor, theme],
  );

  const pulseStyle = useMemo(
    () => (pulsing ? buildBeaconPulseStyle(accentColor) : {}),
    [pulsing, accentColor],
  );

  const ResolvedIcon = IconComponent || Info;

  return (
    <Popover
      placement={placement}
      align={align}
      offset={offset}
      open={open}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger>
        <button
          ref={ref}
          type="button"
          className={className}
          style={{ ...buttonStyle, ...pulseStyle, ...userStyle }}
          aria-label="Help"
          {...rest}
        >
          <Icon icon={ResolvedIcon} size="sm" style={{ color: accentColor }} />
        </button>
      </PopoverTrigger>
      <PopoverContent>{children}</PopoverContent>
    </Popover>
  );
});

Beacon.displayName = 'Beacon';
