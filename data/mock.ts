/**
 * @deprecated This file previously held mock/dummy data for UI development.
 *
 * All production code now uses real data from the WASM-backed UmbraService
 * via React hooks (useConversations, useFriends, useMessages, etc.).
 *
 * Types and constants that were here have been moved to `@/types/panels`.
 *
 * This file is kept only so that existing test imports don't break — those
 * tests will be migrated in a follow-up pass.
 */

// Re-export from the canonical location so old test imports still resolve.
export { PANEL_WIDTH } from '@/types/panels';
export type { RightPanel } from '@/types/panels';
export type Member = { id: string; name: string; status: 'online' | 'idle' | 'offline'; roleText?: string };
