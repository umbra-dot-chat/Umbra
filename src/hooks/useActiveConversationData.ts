/**
 * useActiveConversationData — Memoized selector for the active conversation.
 *
 * Reads from ConversationsContext but only triggers re-renders when the
 * ACTIVE conversation's data changes, not when the full conversation list
 * updates. This prevents the render cascade where every incoming message
 * causes ConversationsProvider → ChatPage → ChatArea to re-render.
 */

import { useRef } from 'react';
import { dbg } from '@/utils/debug';
import { useConversationsContext } from '@/contexts/ConversationsContext';
import type { Conversation } from '@umbra/service';

const SRC = 'useActiveConversationData';

interface ActiveConversationData {
  /** The resolved conversation object, or undefined if none exists */
  activeConversation: Conversation | undefined;
  /** The resolved conversation ID (explicit or fallback to first) */
  resolvedConversationId: string | null;
  /** Whether conversations are still loading */
  isLoading: boolean;
  /** Whether any conversations exist */
  hasConversations: boolean;
}

/**
 * Returns memoized data about the active conversation.
 *
 * Only re-renders the consuming component when:
 * - The resolved conversation ID changes
 * - The active conversation's lastMessageAt or unreadCount changes
 * - Loading state changes
 * - The conversation count goes from 0 to >0 or vice versa
 *
 * Does NOT re-render when other conversations in the list update.
 */
export function useActiveConversationData(activeConversationId: string | null): ActiveConversationData {
  const { conversations, isLoading } = useConversationsContext();

  const resolvedConversationId = activeConversationId ?? conversations[0]?.id ?? null;
  const activeConversation = resolvedConversationId
    ? conversations.find((c) => c.id === resolvedConversationId)
    : undefined;
  const hasConversations = conversations.length > 0;

  // Memoize the result — return the same object reference if nothing
  // the consumer cares about has changed. This prevents parent re-renders
  // from cascading through to ChatArea.
  const prevRef = useRef<ActiveConversationData>({
    activeConversation: undefined,
    resolvedConversationId: null,
    isLoading: true,
    hasConversations: false,
  });

  const prev = prevRef.current;
  if (
    prev.resolvedConversationId === resolvedConversationId &&
    prev.isLoading === isLoading &&
    prev.hasConversations === hasConversations &&
    prev.activeConversation?.lastMessageAt === activeConversation?.lastMessageAt &&
    prev.activeConversation?.unreadCount === activeConversation?.unreadCount &&
    prev.activeConversation?.groupId === activeConversation?.groupId &&
    prev.activeConversation?.friendDid === activeConversation?.friendDid &&
    prev.activeConversation?.type === activeConversation?.type
  ) {
    return prev;
  }

  const next: ActiveConversationData = {
    activeConversation,
    resolvedConversationId,
    isLoading,
    hasConversations,
  };
  prevRef.current = next;
  return next;
}
