/**
 * useConversations — Thin wrapper around ConversationsContext.
 *
 * All conversation fetching, event subscriptions, and debouncing
 * now happen in a single ConversationsProvider instance.
 * This hook just reads from that context.
 *
 * ## Usage
 *
 * ```tsx
 * const { conversations, isLoading, error, refresh } = useConversations();
 * ```
 */

import { useConversationsContext } from '@/contexts/ConversationsContext';
import type { ConversationsContextValue } from '@/contexts/ConversationsContext';

export type UseConversationsResult = ConversationsContextValue;

export function useConversations(): UseConversationsResult {
  return useConversationsContext();
}
