/**
 * @module EmojiPickerTrigger
 * @description Convenience wrapper that composes a Popover + Button + EmojiPicker.
 * Click the trigger button (or custom children) to open a popover containing
 * the full emoji picker panel.
 */

import React, { forwardRef } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '../popover';
import { Button } from '../../primitives/button';
import { Smile } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import type { EmojiPickerTriggerProps } from '@coexist/wisp-core/types/EmojiPicker.types';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const EmojiPickerTrigger = forwardRef<HTMLDivElement, EmojiPickerTriggerProps>(
  function EmojiPickerTrigger(
    {
      size = 'md',
      pickerProps,
      buttonSize = 'md',
      buttonVariant = 'tertiary',
      placement = 'bottom',
      align = 'start',
      offset,
      icon: CustomIcon,
      children,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const TriggerIcon = CustomIcon ?? Smile;
    const iconPixelSize = buttonSize === 'sm' ? 14 : buttonSize === 'lg' ? 20 : 16;

    const triggerElement = children ? (
      <div>{children}</div>
    ) : (
      <Button size={buttonSize} variant={buttonVariant} shape="rounded">
        {React.createElement(TriggerIcon as React.ComponentType<{ size: number }>, { size: iconPixelSize })}
      </Button>
    );

    return (
      <div ref={ref} className={className} style={{ display: 'inline-flex', ...userStyle }} {...rest}>
        <Popover placement={placement} align={align} offset={offset}>
          <PopoverTrigger>
            {triggerElement}
          </PopoverTrigger>
          <PopoverContent
            style={{
              padding: 0,
              border: 'none',
              background: 'transparent',
              boxShadow: 'none',
              borderRadius: 0,
              overflow: 'visible',
            }}
          >
            <EmojiPicker size={size} {...pickerProps} />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);

EmojiPickerTrigger.displayName = 'EmojiPickerTrigger';
