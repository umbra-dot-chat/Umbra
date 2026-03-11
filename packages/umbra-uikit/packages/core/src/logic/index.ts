/**
 * Logic -- Headless, framework-agnostic state machines for Wisp components.
 *
 * Every export in this barrel is a **pure function** with zero React or
 * framework dependencies. They encode the state transitions, validations,
 * and calculations that drive each component's behaviour so the same logic
 * can be reused across React, Solid, Vue, Svelte, or vanilla JS.
 *
 * @module logic
 */

// Accordion
export {
  normalizeValue as normalizeAccordionValue,
  isItemOpen as isAccordionItemOpen,
  toggleAccordion,
  formatOnChangeValue as formatAccordionOnChangeValue,
} from './accordion';
export type {
  AccordionType,
  AccordionToggleConfig,
} from './accordion';

// Tabs
export {
  resolveActiveTab,
  isTabActive,
  getTabId,
  getPanelId,
  getNextTabIndex,
  handleTabKeyNavigation,
} from './tabs';
export type {
  TabsOrientation,
  TabsState as TabsLogicState,
  TabNavResult,
} from './tabs';

// Dialog
export {
  shouldDismissOnKey,
  shouldDismissOnOverlayClick,
  nextDialogState,
  getFocusTrapTarget,
} from './dialog';
export type {
  DialogDismissConfig,
  DialogDismissResult,
} from './dialog';

// Dropdown Menu
export {
  toggleDropdown,
  setDropdownOpen,
  handleDropdownKeyNavigation,
  shouldCloseOnOutsideClick as shouldCloseDropdownOnOutsideClick,
} from './dropdown-menu';
export type {
  DropdownMenuState,
  DropdownKeyResult,
} from './dropdown-menu';

// Select
export {
  resolveSelectedValue,
  toggleSelect,
  findSelectedOption,
  getEnabledOptions,
  handleSelectKeyNavigation,
  shouldCloseSelectOnOutsideClick,
} from './select';
export type {
  SelectOption as SelectLogicOption,
  SelectState as SelectLogicState,
  SelectKeyResult,
} from './select';

// Tooltip
export {
  createInitialTooltipState,
  tooltipReducer,
  shouldIgnoreShow,
  shouldDismissTooltip,
} from './tooltip';
export type {
  TooltipPlacement,
  TooltipState as TooltipLogicState,
  TooltipAction,
  TooltipDelayConfig,
} from './tooltip';

// Pagination
export {
  generatePages,
  getPaginationBounds,
  clampPage,
  getNextPage,
  getPreviousPage,
  getFirstPage,
  getLastPage,
} from './pagination';
export type {
  PageItem,
  PaginationConfig,
  PaginationBounds,
} from './pagination';

// Controllable (controlled/uncontrolled pattern)
export {
  isControlled,
  resolveControllable,
  getControllableUpdate,
  detectModeSwitch,
  buildModeSwitchWarning,
} from './controllable';
export type {
  ControllableConfig,
  ControllableResolved,
} from './controllable';
