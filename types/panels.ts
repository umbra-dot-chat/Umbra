/**
 * Panel type definitions and layout constants.
 *
 * These were previously co-located with mock data. Now they live here
 * as proper shared types / constants consumed by hooks and components.
 */

/** Which right-side panel is currently open, or null if none. */
export type RightPanel = 'members' | 'pins' | 'thread' | 'search' | null;

/** Width (in dp) of the right-side panel drawer. */
export const PANEL_WIDTH = 280;
