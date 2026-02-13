import React, { useMemo } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '@coexist/wisp-react-native';
import { MemberList } from '@coexist/wisp-react-native/src/components/member-list';
import { PinnedMessages } from '@coexist/wisp-react-native/src/components/pinned-messages';
import { ThreadPanel } from '@coexist/wisp-react-native/src/components/thread-panel';
import { PANEL_WIDTH } from '@/types/panels';
import type { RightPanel as RightPanelType } from '@/types/panels';
import { useFriends } from '@/hooks/useFriends';
import { SearchPanel } from './SearchPanel';

export interface RightPanelProps {
  panelWidth: Animated.Value;
  visiblePanel: RightPanelType;
  togglePanel: (panel: NonNullable<RightPanelType>) => void;
  onMemberClick: (member: any, event: any) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  threadParent: { id: string; sender: string; content: string; timestamp: string } | null;
  threadReplies: { id: string; sender: string; content: string; timestamp: string; isOwn?: boolean }[];
  pinnedMessages?: { id: string; sender: string; content: string; timestamp: string }[];
  onUnpinMessage?: (messageId: string) => void;
  onThreadReply?: (text: string) => void;
}

export function RightPanel({
  panelWidth, visiblePanel, togglePanel,
  onMemberClick, searchQuery, onSearchQueryChange,
  threadParent, threadReplies,
  pinnedMessages, onUnpinMessage, onThreadReply,
}: RightPanelProps) {
  const { theme } = useTheme();
  const { friends } = useFriends();

  // Build member sections from real friends data
  const memberSections = useMemo(() => {
    const online = friends
      .filter((f) => f.online)
      .map((f) => ({ id: f.did, name: f.displayName, status: 'online' as const }));
    const offline = friends
      .filter((f) => !f.online)
      .map((f) => ({ id: f.did, name: f.displayName, status: 'offline' as const }));

    return [
      { id: 'online', label: 'Online', members: online },
      { id: 'offline', label: 'Offline', members: offline, collapsed: true },
    ];
  }, [friends]);

  return (
    <Animated.View style={{ width: panelWidth, overflow: 'hidden' }}>
      <View style={{ width: PANEL_WIDTH, height: '100%' }}>
        {visiblePanel === 'members' && (
          <MemberList
            sections={memberSections}
            title="Members"
            onClose={() => togglePanel('members')}
            onMemberClick={onMemberClick}
          />
        )}
        {visiblePanel === 'pins' && (
          <PinnedMessages
            messages={pinnedMessages || []}
            onClose={() => togglePanel('pins')}
            onMessageClick={() => {}}
            onUnpin={(msg: any) => onUnpinMessage?.(msg.id)}
          />
        )}
        {visiblePanel === 'thread' && threadParent && (
          <ThreadPanel
            parentMessage={threadParent}
            replies={threadReplies}
            replyCount={threadReplies.length}
            onClose={() => togglePanel('thread')}
            onReply={(text: string) => onThreadReply?.(text)}
          />
        )}
        {visiblePanel === 'search' && (
          <SearchPanel
            query={searchQuery}
            onQueryChange={onSearchQueryChange}
            onClose={() => togglePanel('search')}
          />
        )}
      </View>
    </Animated.View>
  );
}
