import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import { View, Text as RNText, Pressable } from 'react-native';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';
import type { RatingSize } from '@coexist/wisp-core/types/Rating.types';
import { ratingSizeMap } from '@coexist/wisp-core/types/Rating.types';
import { defaultSpacing, defaultTypography } from '@coexist/wisp-core/theme/create-theme';
import { useTheme } from '../../providers';

export interface RatingProps {
  value?: number;
  defaultValue?: number;
  max?: number;
  allowHalf?: boolean;
  onChange?: (value: number) => void;
  size?: RatingSize;
  readOnly?: boolean;
  disabled?: boolean;
  showValue?: boolean;
  style?: object;
}

const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function StarIcon({
  size,
  fillPercent,
  activeColor,
  inactiveColor,
}: {
  size: number;
  fillPercent: number;
  activeColor: string;
  inactiveColor: string;
}) {
  if (fillPercent <= 0) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={STAR_PATH} fill={inactiveColor} />
      </Svg>
    );
  }

  if (fillPercent >= 1) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path d={STAR_PATH} fill={activeColor} />
      </Svg>
    );
  }

  const clipId = `star-clip-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id={clipId}>
          <Rect x="0" y="0" width={String(24 * fillPercent)} height="24" />
        </ClipPath>
      </Defs>
      <Path d={STAR_PATH} fill={inactiveColor} />
      <Path d={STAR_PATH} fill={activeColor} clipPath={`url(#${clipId})`} />
    </Svg>
  );
}

export const Rating = forwardRef<View, RatingProps>(function Rating(
  {
    value: controlledValue,
    defaultValue = 0,
    max = 5,
    allowHalf = false,
    onChange,
    size = 'md',
    readOnly = false,
    disabled = false,
    showValue = false,
    style: userStyle,
  },
  ref,
) {
  const { theme } = useTheme();
  const themeColors = theme.colors;
  const sizeConfig = ratingSizeMap[size];

  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = isControlled ? controlledValue : internalValue;

  const isInteractive = !disabled && !readOnly;

  const handleStarPress = useCallback(
    (starIndex: number) => {
      if (!isInteractive) return;
      const newValue = starIndex + 1;
      if (!isControlled) setInternalValue(newValue);
      onChange?.(newValue);
    },
    [isInteractive, isControlled, onChange],
  );

  const stars = [];
  for (let i = 0; i < max; i++) {
    let fillPercent: number;
    if (currentValue >= i + 1) {
      fillPercent = 1;
    } else if (currentValue > i) {
      fillPercent = currentValue - i;
    } else {
      fillPercent = 0;
    }

    const star = (
      <StarIcon
        size={sizeConfig.starSize}
        fillPercent={fillPercent}
        activeColor={themeColors.accent.primary}
        inactiveColor={themeColors.border.subtle}
      />
    );

    if (isInteractive) {
      stars.push(
        <Pressable key={i} onPress={() => handleStarPress(i)}>
          {star}
        </Pressable>,
      );
    } else {
      stars.push(
        <View key={i}>{star}</View>,
      );
    }
  }

  return (
    <View
      ref={ref}
      accessibilityLabel={`Rating: ${currentValue} out of ${max}`}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: sizeConfig.gap,
          opacity: disabled ? 0.5 : 1,
        },
        userStyle,
      ]}
    >
      {stars}
      {showValue && (
        <RNText
          style={{
            fontSize: sizeConfig.fontSize,
            fontWeight: defaultTypography.weights.medium,
            color: themeColors.text.secondary,
            marginLeft: defaultSpacing.xs,
          }}
        >
          {currentValue}
        </RNText>
      )}
    </View>
  );
});

Rating.displayName = 'Rating';
