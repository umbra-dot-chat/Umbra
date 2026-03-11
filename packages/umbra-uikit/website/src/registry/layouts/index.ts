import type { ComponentEntry } from '../types';
import { stackEntry } from './stack';
import { boxEntry } from './box';
import { gridEntry } from './grid';
import { spacerEntry } from './spacer';
import { centerEntry } from './center';
import { containerEntry } from './container';
import { scrollAreaEntry } from './scroll-area';
import { stickyEntry } from './sticky';
import { overlayEntry } from './overlay';
import { floatingEntry } from './floating';
import { collapseEntry } from './collapse';
import { cardEntry } from './card';
import { separatorEntry } from './separator';
import { aspectRatioEntry } from './aspect-ratio';
import { formFieldEntry } from './form-field';
import { breadcrumbEntry } from './breadcrumb';
import { listItemEntry } from './list-item';
import { emptyStateEntry } from './empty-state';
import { sidebarEntry } from './sidebar';

export const layoutEntries: ComponentEntry[] = [
  stackEntry,
  boxEntry,
  gridEntry,
  spacerEntry,
  centerEntry,
  containerEntry,
  scrollAreaEntry,
  stickyEntry,
  overlayEntry,
  floatingEntry,
  collapseEntry,
  cardEntry,
  separatorEntry,
  aspectRatioEntry,
  formFieldEntry,
  breadcrumbEntry,
  listItemEntry,
  emptyStateEntry,
  sidebarEntry,
];
