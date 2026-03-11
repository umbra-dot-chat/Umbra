/**
 * @module @wisp/ui/layouts
 * @description Layout primitives and containers for the Wisp design system.
 */

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

export { Stack, HStack, VStack } from './stack';
export type { StackProps, StackDirection, StackGap, StackAlign, StackJustify } from './stack';
export { stackDirections, stackAligns, stackJustifys } from './stack';

// ---------------------------------------------------------------------------
// Box
// ---------------------------------------------------------------------------

export { Box } from './box';
export type { BoxProps, ThemeSpacingKey, ThemeRadiiKey, BoxDisplay, BoxPosition } from './box';
export { spacingKeys, radiiKeys } from './box';

// ---------------------------------------------------------------------------
// Center
// ---------------------------------------------------------------------------

export { Center } from './center';
export type { CenterProps } from './center';

// ---------------------------------------------------------------------------
// Spacer
// ---------------------------------------------------------------------------

export { Spacer } from './spacer';
export type { SpacerProps, SpacerSize } from './spacer';
export { spacerSizes } from './spacer';

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export { Container } from './container';
export type { ContainerProps, ContainerSize } from './container';
export { containerSizes, containerSizeMap } from './container';

// ---------------------------------------------------------------------------
// ScrollArea
// ---------------------------------------------------------------------------

export { ScrollArea } from './scroll-area';
export type { ScrollAreaProps, ScrollAreaDirection, ScrollbarWidth } from './scroll-area';
export { scrollAreaDirections, scrollbarWidths } from './scroll-area';

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

export { Grid, GridItem } from './grid';
export type { GridProps, GridItemProps, GridGap, GridColumns, GridRows, GridAlignItems, GridJustifyItems, GridAlignContent, GridJustifyContent } from './grid';
export { gridAlignItems, gridJustifyItems, gridAlignContents, gridJustifyContents } from './grid';

// ---------------------------------------------------------------------------
// Collapse
// ---------------------------------------------------------------------------

export { Collapse } from './collapse';
export type { CollapseProps, CollapseDuration } from './collapse';
export { collapseDurations, collapseDurationMap } from './collapse';

// ---------------------------------------------------------------------------
// Sticky
// ---------------------------------------------------------------------------

export { Sticky } from './sticky';
export type { StickyProps, StickyEdge } from './sticky';
export { stickyEdges } from './sticky';

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export { Overlay } from './overlay';
export type { OverlayProps, OverlayBackdrop } from './overlay';
export { overlayBackdrops } from './overlay';

// ---------------------------------------------------------------------------
// Floating
// ---------------------------------------------------------------------------

export { Floating } from './floating';
export { useFloating } from './floating';
export type { FloatingProps, FloatingPlacement, FloatingAlign, FloatingStrategy, FloatingPosition, UseFloatingOptions } from './floating';
export { floatingPlacements, floatingAligns, floatingStrategies } from './floating';

// ---------------------------------------------------------------------------
// AspectRatio
// ---------------------------------------------------------------------------

export { AspectRatio } from './aspect-ratio';
export type { AspectRatioProps } from './aspect-ratio';

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

export { Card } from './card';
export type { CardProps, CardVariant, CardPadding, CardRadius } from './card';
export { cardVariants, cardPaddings, cardRadii, cardPaddingMap, cardRadiusMap } from './card';

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

export { Separator } from './separator';
export type { SeparatorProps, SeparatorOrientation, SeparatorVariant, SeparatorSpacing } from './separator';
export { separatorOrientations, separatorVariants, separatorSpacings, separatorSpacingMap } from './separator';

// ---------------------------------------------------------------------------
// FormField
// ---------------------------------------------------------------------------

export { FormField } from './form-field';
export type { FormFieldProps, FormFieldSize, FormFieldOrientation, FormFieldSizeConfig } from './form-field';
export { formFieldSizes, formFieldOrientations, formFieldSizeMap } from './form-field';

// ---------------------------------------------------------------------------
// Breadcrumb
// ---------------------------------------------------------------------------

export { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator } from './breadcrumb';
export type { BreadcrumbProps, BreadcrumbItemProps, BreadcrumbSeparatorProps, BreadcrumbSize, BreadcrumbSizeConfig } from './breadcrumb';
export { breadcrumbSizes, breadcrumbSizeMap } from './breadcrumb';

// ---------------------------------------------------------------------------
// ListItem
// ---------------------------------------------------------------------------

export { ListItem } from './list-item';
export type { ListItemProps, ListItemSize, ListItemSizeConfig } from './list-item';
export { listItemSizes, listItemSizeMap } from './list-item';

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

export { EmptyState } from './empty-state';
export type { EmptyStateProps, EmptyStateSize, EmptyStateSizeConfig } from './empty-state';
export { emptyStateSizes, emptyStateSizeMap } from './empty-state';

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export { Sidebar, SidebarSection, SidebarItem } from './sidebar';
export type { SidebarProps, SidebarSectionProps, SidebarItemProps, SidebarContextValue, SidebarWidth, SidebarPosition } from './sidebar';
export { sidebarWidths, sidebarWidthMap, sidebarPositions } from './sidebar';
