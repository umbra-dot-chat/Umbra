/**
 * @module ThemeEditorField (React Native)
 * @description Renders a single editable theme token field based on its
 * control type. Maps field descriptors to Wisp RN kit primitives.
 */

import React, { memo, useCallback } from 'react';
import type { ThemeEditorFieldDescriptor } from '@coexist/wisp-core/theme/editor-fields';
import { ColorPicker } from '../../primitives/color-picker';
import { Slider } from '../../primitives/slider';
import { NumberInput } from '../../primitives/number-input';
import { Input } from '../../primitives/input';
import { FormField } from '../../layouts/form-field';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ThemeEditorFieldProps {
  field: ThemeEditorFieldDescriptor;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ThemeEditorField = memo(function ThemeEditorField({
  field,
  value,
  onChange,
}: ThemeEditorFieldProps) {
  const handleTextChange = useCallback(
    (text: string) => {
      onChange(text);
    },
    [onChange],
  );

  let control: React.ReactNode;

  switch (field.control) {
    case 'color':
      control = (
        <ColorPicker
          value={typeof value === 'string' ? value : '#000000'}
          onChange={onChange}
          size="sm"
          showInput
          presets={[]}
        />
      );
      break;

    case 'slider':
      control = (
        <Slider
          value={typeof value === 'number' ? value : 0}
          onChange={onChange}
          min={field.meta?.min ?? 0}
          max={field.meta?.max ?? 100}
          step={field.meta?.step ?? 1}
          showValue
          size="sm"
          formatValue={
            field.meta?.unit
              ? (v: number) => `${v}${field.meta!.unit}`
              : undefined
          }
        />
      );
      break;

    case 'number':
      control = (
        <NumberInput
          value={typeof value === 'number' ? value : 0}
          onChange={onChange}
          min={field.meta?.min}
          max={field.meta?.max}
          step={field.meta?.step ?? 1}
          size="sm"
        />
      );
      break;

    case 'text':
      control = (
        <Input
          value={typeof value === 'string' ? value : ''}
          onChangeText={handleTextChange}
          size="sm"
          placeholder={field.meta?.placeholder}
          fullWidth
        />
      );
      break;
  }

  return (
    <FormField label={field.label} size="sm" orientation="horizontal">
      {control}
    </FormField>
  );
});

ThemeEditorField.displayName = 'ThemeEditorField';
