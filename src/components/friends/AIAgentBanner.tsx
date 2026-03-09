/**
 * AIAgentBanner — Promotional card for AI agent bots on the Umbra network.
 *
 * Shows available AI agents (Ghost) with "Add" or "Message" buttons
 * depending on whether the user is already friends with them.
 * Displayed at the top of the All Friends tab.
 */

import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import {
  Text, Button, Card, GradientBorder, Avatar, HStack, VStack,
  useTheme,
} from '@coexist/wisp-react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { AI_AGENTS, type AIAgentConfig } from '@/config/network';
import { MessageIcon } from '@/components/ui';

// ─── Icons ──────────────────────────────────────────────────────────────────

function BotIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 8V4H8" />
      <Path d="M2 14h2" />
      <Path d="M20 14h2" />
      <Path d="M15 13a3 3 0 1 0-6 0" />
      <Path d="M6 9a6 6 0 0 1 12 0v5a6 6 0 0 1-12 0Z" />
    </Svg>
  );
}

function SparklesIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <Path d="M5 3v4" />
      <Path d="M19 17v4" />
      <Path d="M3 5h4" />
      <Path d="M17 19h4" />
    </Svg>
  );
}

function XCloseIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6L6 18" />
      <Path d="M6 6l12 12" />
    </Svg>
  );
}

function UserPlusIcon({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx={8.5} cy={7} r={4} />
      <Path d="M20 8v6" />
      <Path d="M23 11h-6" />
    </Svg>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AIAgentBannerProps {
  /** Set of DIDs the user is already friends with */
  friendDids: Set<string>;
  /** Set of DIDs the user has pending outgoing requests to */
  pendingDids: Set<string>;
  /** Called when user wants to add an agent as a friend */
  onAddAgent: (did: string) => void;
  /** Called when user wants to message an existing agent friend */
  onMessageAgent: (did: string) => void;
  /** Whether an add action is in progress (DID being added) */
  addingDid?: string | null;
  /** Called when user dismisses the banner */
  onDismiss?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AIAgentBanner({
  friendDids,
  pendingDids,
  onAddAgent,
  onMessageAgent,
  addingDid,
  onDismiss,
}: AIAgentBannerProps) {
  const { theme } = useTheme();
  const tc = theme.colors;

  // Only show agents that have DIDs configured
  const availableAgents = AI_AGENTS.filter((a) => a.did.length > 0);

  if (availableAgents.length === 0) return null;

  return (
    <GradientBorder radius={12} width={1} style={{ marginBottom: 16 }}>
      <Card variant="filled" padding="md" style={{ borderRadius: 12 }}>
        {/* Header */}
        <HStack style={{ alignItems: 'center', marginBottom: 10, gap: 8 }}>
          <SparklesIcon size={16} color={tc.accent.primary ?? '#6366f1'} />
          <Text size="sm" weight="bold" style={{ flex: 1 }}>
            AI Agents
          </Text>
          {onDismiss && (
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 2 })}
              accessibilityLabel="Dismiss AI agents banner"
              accessibilityRole="button"
            >
              <XCloseIcon size={14} color={tc.text.muted} />
            </Pressable>
          )}
        </HStack>

        <Text size="xs" color="muted" style={{ marginBottom: 12 }}>
          Chat with AI companions powered by local LLMs. They can answer questions about Umbra, set reminders, translate, and more.
        </Text>

        {/* Agent rows */}
        {availableAgents.map((agent) => (
          <AIAgentRow
            key={agent.did}
            agent={agent}
            isFriend={friendDids.has(agent.did)}
            isPending={pendingDids.has(agent.did)}
            isAdding={addingDid === agent.did}
            onAdd={() => onAddAgent(agent.did)}
            onMessage={() => onMessageAgent(agent.did)}
          />
        ))}
      </Card>
    </GradientBorder>
  );
}

// ─── Agent Row ──────────────────────────────────────────────────────────────

function AIAgentRow({
  agent,
  isFriend,
  isPending,
  isAdding,
  onAdd,
  onMessage,
}: {
  agent: AIAgentConfig;
  isFriend: boolean;
  isPending: boolean;
  isAdding: boolean;
  onAdd: () => void;
  onMessage: () => void;
}) {
  const { theme } = useTheme();
  const tc = theme.colors;

  return (
    <HStack
      style={{
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
        paddingHorizontal: 4,
      }}
    >
      {/* Bot Avatar */}
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: `${tc.accent.primary ?? '#6366f1'}18`,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BotIcon size={20} color={tc.accent.primary ?? '#6366f1'} />
      </View>

      {/* Info */}
      <VStack style={{ flex: 1, gap: 1 }}>
        <HStack style={{ alignItems: 'center', gap: 6 }}>
          <Text size="sm" weight="medium">
            {agent.displayName}
          </Text>
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 1,
              borderRadius: 4,
              backgroundColor: `${tc.accent.primary ?? '#6366f1'}18`,
            }}
          >
            <Text size="xs" weight="medium" style={{ color: tc.accent.primary ?? '#6366f1' }}>
              AI
            </Text>
          </View>
        </HStack>
        <Text size="xs" style={{ color: tc.text.muted }}>
          {agent.description}
        </Text>
      </VStack>

      {/* Action button */}
      {isFriend ? (
        <Button
          variant="secondary"
          size="xs"
          onPress={onMessage}
          iconLeft={<MessageIcon size={12} color={tc.text.primary} />}
        >
          Message
        </Button>
      ) : isPending ? (
        <Button variant="secondary" size="xs" disabled>
          Pending
        </Button>
      ) : (
        <Button
          variant="primary"
          size="xs"
          onPress={onAdd}
          disabled={isAdding}
          iconLeft={<UserPlusIcon size={12} color="#fff" />}
        >
          {isAdding ? 'Adding...' : 'Add'}
        </Button>
      )}
    </HStack>
  );
}

AIAgentBanner.displayName = 'AIAgentBanner';
