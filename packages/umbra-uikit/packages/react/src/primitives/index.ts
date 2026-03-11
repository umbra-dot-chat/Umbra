/**
 * @module @wisp/ui/primitives
 * @description Core atomic building blocks for the Wisp design system.
 */

// ---------------------------------------------------------------------------
// Shared Tokens
// ---------------------------------------------------------------------------

export { thicknesses, thicknessValues } from '@coexist/wisp-core/tokens/shared';
export type { Thickness } from '@coexist/wisp-core/tokens/shared';

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export { Text } from './text';
export type { TextProps, TextSize, TextWeight, TextColor, TextFamily } from './text';

// ---------------------------------------------------------------------------
// Icon
// ---------------------------------------------------------------------------

export { Icon } from './icon';
export type { IconProps, IconColor, IconSize } from './icon';
export { iconSizeMap } from './icon';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------

export { Button } from './button';
export type { ButtonProps, ButtonVariant, ButtonShape, ButtonSize } from './button';
export { buttonVariants, buttonShapes, buttonSizeMap, shapeRadiusMap } from './button';

// ---------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------

export { Toggle } from './toggle';
export type { ToggleProps, ToggleSize, ToggleSizeConfig } from './toggle';
export { toggleSizes, toggleSizeMap, toggleSlimSizeMap } from './toggle';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export { Input } from './input';
export type { InputProps, InputSize, InputSizeConfig } from './input';
export { inputSizes, inputSizeMap } from './input';

// ---------------------------------------------------------------------------
// TextArea
// ---------------------------------------------------------------------------

export { TextArea } from './textarea';
export type { TextAreaProps, TextAreaSize, TextAreaSizeConfig } from './textarea';
export { textAreaSizes, textAreaSizeMap } from './textarea';

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

export { Checkbox } from './checkbox';
export type { CheckboxProps, CheckboxSize, CheckboxSizeConfig } from './checkbox';
export { checkboxSizes, checkboxSizeMap } from './checkbox';

// ---------------------------------------------------------------------------
// Radio
// ---------------------------------------------------------------------------

export { Radio, RadioGroup } from './radio';
export type { RadioProps, RadioGroupProps, RadioSize, RadioSizeConfig } from './radio';
export { radioSizes, radioSizeMap } from './radio';

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------

export { Spinner } from './spinner';
export type { SpinnerProps, SpinnerSize, SpinnerSizeConfig } from './spinner';
export { spinnerSizes, spinnerSizeMap } from './spinner';

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

export { Slider } from './slider';
export type { SliderProps, SliderSize, SliderSizeConfig } from './slider';
export { sliderSizes, sliderSizeMap } from './slider';

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------

export { Badge } from './badge';
export type { BadgeProps, BadgeSize, BadgeVariant, BadgeShape, BadgeSizeConfig } from './badge';
export { badgeSizes, badgeSizeMap, badgeVariants, badgeShapes } from './badge';

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

export { Chip } from './chip';
export type { ChipProps, ChipSize, ChipColor, ChipVariant, ChipSizeConfig } from './chip';
export { chipSizes, chipSizeMap, chipColors, chipVariants } from './chip';

// ---------------------------------------------------------------------------
// Tag
// ---------------------------------------------------------------------------

export { Tag } from './tag';
export type { TagProps, TagSize, TagSizeConfig } from './tag';
export { tagSizes, tagSizeMap } from './tag';

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------

export { Avatar } from './avatar';
export type { AvatarProps, AvatarSize, AvatarShape, AvatarStatus, AvatarSizeConfig } from './avatar';
export { avatarSizes, avatarShapes, avatarStatuses, avatarSizeMap } from './avatar';

// ---------------------------------------------------------------------------
// Image
// ---------------------------------------------------------------------------

export { Image } from './image';
export type { ImageProps, ImageFit, ImageRadius } from './image';
export { imageFits, imageRadii, imageRadiusMap } from './image';

// ---------------------------------------------------------------------------
// Kbd
// ---------------------------------------------------------------------------

export { Kbd } from './kbd';
export type { KbdProps, KbdSize } from './kbd';
export { kbdSizes } from './kbd';

// ---------------------------------------------------------------------------
// ColorSwatch
// ---------------------------------------------------------------------------

export { ColorSwatch } from './color-swatch';
export type { ColorSwatchProps, ColorSwatchSize, ColorSwatchShape } from './color-swatch';
export { colorSwatchSizes, colorSwatchShapes } from './color-swatch';

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export { Skeleton } from './skeleton';
export type { SkeletonProps, SkeletonVariant, SkeletonAnimation } from './skeleton';
export { skeletonVariants, skeletonAnimations } from './skeleton';

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export { Alert } from './alert';
export type { AlertProps, AlertVariant } from './alert';
export { alertVariants } from './alert';

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export { Progress } from './progress';
export type { ProgressProps, ProgressSize, ProgressSizeConfig } from './progress';
export { progressSizes, progressSizeMap } from './progress';

// ---------------------------------------------------------------------------
// CircularProgress
// ---------------------------------------------------------------------------

export { CircularProgress } from './circular-progress';
export type { CircularProgressProps, CircularProgressSize, CircularProgressVariant, CircularProgressSizeConfig } from './circular-progress';
export { circularProgressSizes, circularProgressVariants, circularProgressSizeMap } from './circular-progress';

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

export { Toast } from './toast';
export type { ToastProps, ToastVariant } from './toast';
export { toastVariants } from './toast';

// ---------------------------------------------------------------------------
// NumberInput
// ---------------------------------------------------------------------------

export { NumberInput } from './number-input';
export type { NumberInputProps, NumberInputSize } from './number-input';
export { numberInputSizes } from './number-input';

// ---------------------------------------------------------------------------
// PinInput
// ---------------------------------------------------------------------------

export { PinInput } from './pin-input';
export type { PinInputProps, PinInputSize, PinInputType, PinInputSizeConfig } from './pin-input';
export { pinInputSizes, pinInputTypes, pinInputSizeMap } from './pin-input';

// ---------------------------------------------------------------------------
// TagInput
// ---------------------------------------------------------------------------

export { TagInput } from './tag-input';
export type { TagInputProps, TagInputSize, TagInputSizeConfig, TagItem } from './tag-input';
export { tagInputSizes, tagInputSizeMap } from './tag-input';

// ---------------------------------------------------------------------------
// Indicator
// ---------------------------------------------------------------------------

export { Indicator } from './indicator';
export type { IndicatorProps, IndicatorVariant, IndicatorState, IndicatorSize, IndicatorSizeConfig } from './indicator';
export { indicatorVariants, indicatorStates, indicatorSizes, indicatorSizeMap } from './indicator';

// ---------------------------------------------------------------------------
// Meter
// ---------------------------------------------------------------------------

export { Meter } from './meter';
export type { MeterProps, MeterSize, MeterSizeConfig, MeterVariant } from './meter';
export { meterSizes, meterSizeMap, meterVariants } from './meter';

// ---------------------------------------------------------------------------
// Rating
// ---------------------------------------------------------------------------

export { Rating } from './rating';
export type { RatingProps, RatingSize, RatingSizeConfig } from './rating';
export { ratingSizes, ratingSizeMap } from './rating';

// ---------------------------------------------------------------------------
// ColorPicker
// ---------------------------------------------------------------------------

export { ColorPicker } from './color-picker';
export type { ColorPickerProps, ColorPickerSize, ColorPickerSizeConfig } from './color-picker';
export { colorPickerSizes, colorPickerSizeMap } from './color-picker';

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

export { Stepper } from './stepper';
export type { StepperProps, StepperSize, StepperSizeConfig } from './stepper';
export { stepperSizes, stepperSizeMap } from './stepper';

// ---------------------------------------------------------------------------
// NotificationBadge
// ---------------------------------------------------------------------------

export { NotificationBadge } from './notification-badge';
export type { NotificationBadgeProps, NotificationBadgeColor } from './notification-badge';
export { notificationBadgeColors } from './notification-badge';

// ---------------------------------------------------------------------------
// CodeBlock
// ---------------------------------------------------------------------------

export { CodeBlock, createShikiHighlighter } from './code-block';
export type { CodeBlockProps, CodeBlockVariant, SyntaxToken, SyntaxHighlighter, ShikiHighlighterOptions, ShikiHighlighterResult } from './code-block';
export { codeBlockVariants } from './code-block';

// ---------------------------------------------------------------------------
// Beacon
// ---------------------------------------------------------------------------

export { Beacon } from './beacon';
export type { BeaconProps, BeaconVariant, BeaconSize, BeaconSizeConfig } from './beacon';
export { beaconVariants, beaconSizes, beaconSizeMap } from './beacon';

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

export { Sparkline } from './sparkline';
export type { SparklineProps, SparklineVariant, SparklineSize, SparklineSizeConfig, SparklineColor } from './sparkline';
export { sparklineVariants, sparklineSizes, sparklineSizeMap, sparklineColors } from './sparkline';

// ---------------------------------------------------------------------------
// ReadReceipt
// ---------------------------------------------------------------------------

export { ReadReceipt } from './read-receipt';
export type { ReadReceiptProps, ReadReceiptStatus, ReadReceiptSize, ReadReceiptSizeConfig } from './read-receipt';
export { readReceiptStatuses, readReceiptSizes, readReceiptSizeMap } from './read-receipt';
