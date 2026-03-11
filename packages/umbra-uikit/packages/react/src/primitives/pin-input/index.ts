/**
 * @module primitives/pin-input
 * @description Public API for the Wisp PinInput primitive — single-character
 * input cells for verification codes, OTPs, and PINs.
 */

export { PinInput } from './PinInput';
export type {
  PinInputProps,
  PinInputSize,
  PinInputType,
  PinInputSizeConfig,
} from '@coexist/wisp-core/types/PinInput.types';
export { pinInputSizes, pinInputTypes, pinInputSizeMap } from '@coexist/wisp-core/types/PinInput.types';
