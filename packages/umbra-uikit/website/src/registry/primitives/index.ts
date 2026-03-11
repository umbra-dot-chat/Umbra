import type { ComponentEntry } from '../types';
import { textEntry } from './text';
import { iconEntry } from './icon';
import { buttonEntry } from './button';
import { inputEntry } from './input';
import { toggleEntry } from './toggle';
import { checkboxEntry } from './checkbox';
import { radioEntry } from './radio';
import { textareaEntry } from './textarea';
import { sliderEntry } from './slider';
import { numberInputEntry } from './number-input';
import { pinInputEntry } from './pin-input';
import { tagInputEntry } from './tag-input';
import { spinnerEntry } from './spinner';
import { kbdEntry } from './kbd';
import { badgeEntry } from './badge';
import { chipEntry } from './chip';
import { tagEntry } from './tag';
import { colorSwatchEntry } from './color-swatch';
import { skeletonEntry } from './skeleton';
import { indicatorEntry } from './indicator';
import { avatarEntry } from './avatar';
import { imageEntry } from './image';
import { alertEntry } from './alert';
import { toastEntry } from './toast';
import { progressEntry } from './progress';
import { circularProgressEntry } from './circular-progress';
import { meterEntry } from './meter';
import { ratingEntry } from './rating';
import { colorPickerEntry } from './color-picker';
import { stepperEntry } from './stepper';
import { notificationBadgeEntry } from './notification-badge';
import { codeBlockEntry } from './code-block';
import { beaconEntry } from './beacon';
import { sparklineEntry } from './sparkline';
import { readReceiptEntry } from './read-receipt';

export const primitiveEntries: ComponentEntry[] = [
  textEntry,
  iconEntry,
  buttonEntry,
  toggleEntry,
  inputEntry,
  textareaEntry,
  checkboxEntry,
  radioEntry,
  sliderEntry,
  numberInputEntry,
  pinInputEntry,
  tagInputEntry,
  badgeEntry,
  chipEntry,
  tagEntry,
  alertEntry,
  progressEntry,
  circularProgressEntry,
  spinnerEntry,
  toastEntry,
  indicatorEntry,
  meterEntry,
  ratingEntry,
  skeletonEntry,
  colorSwatchEntry,
  avatarEntry,
  imageEntry,
  kbdEntry,
  colorPickerEntry,
  stepperEntry,
  notificationBadgeEntry,
  codeBlockEntry,
  beaconEntry,
  sparklineEntry,
  readReceiptEntry,
];
