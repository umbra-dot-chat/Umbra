import React, { useMemo } from 'react';
import { Animated, View } from 'react-native';
import { useTheme, MemberList, PinnedMessages, ThreadPanel } from '@coexist/wisp-react-native';
import type { RightPanel as RightPanelType } from '@/types/panels';
import { PANEL_WIDTH } from '@/types/panels';
import { useFriends } from '@/hooks/useFriends';
import { useNetwork } from '@/hooks/useNetwork';
import { SearchPanel } from './SearchPanel';
import { DmSharedFilesPanel } from '@/components/chat/DmSharedFilesPanel';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AnimatedPresence } from '@/components/ui/AnimatedPresence';

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
  /** Active conversation ID for search */
  conversationId?: string | null;
  /** Callback when a search result is clicked */
  onSearchResultClick?: (messageId: string) => void;
  /** Create a shared folder for the current DM conversation */
  onCreateFolder?: () => void;
  /** Upload/attach a file to the current DM conversation */
  onUploadFile?: () => void;
  /** Actual content width of the panel (for resizable panels) */
  panelContentWidth?: number;
}

export function RightPanel({
  panelWidth, visiblePanel, togglePanel,
  onMemberClick, searchQuery, onSearchQueryChange,
  threadParent, threadReplies,
  pinnedMessages, onUnpinMessage, onThreadReply,
  conversationId, onSearchResultClick,
  onCreateFolder, onUploadFile, panelContentWidth,
}: RightPanelProps) {
  const { theme } = useTheme();
  const { friends } = useFriends();
  const { onlineDids } = useNetwork();
  const isMobile = useIsMobile();

  // Build member sections from real friends data, enriched with relay presence
  const memberSections = useMemo(() => {
    const online = friends
      .filter((f) => onlineDids.has(f.did))
      .map((f) => ({ id: f.did, name: f.displayName, status: 'online' as const }));
    const offline = friends
      .filter((f) => !onlineDids.has(f.did))
      .map((f) => ({ id: f.did, name: f.displayName, status: 'offline' as const }));

    return [
      { id: 'online', label: 'Online', members: online },
      { id: 'offline', label: 'Offline', members: offline, collapsed: true },
    ];
  }, [friends, onlineDids]);

  const panelContent = (
    <>
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
          conversationId={conversationId}
          onResultClick={onSearchResultClick}
        />
      )}
      {visiblePanel === 'files' && conversationId && (
        <DmSharedFilesPanel
          conversationId={conversationId}
          onClose={() => togglePanel('files')}
          onCreateFolder={onCreateFolder}
          onUploadFile={onUploadFile}
        />
      )}
    </>
  );

  // Mobile: full-screen overlay with slide-in animation
  if (isMobile) {
    return (
      <AnimatedPresence
        visible={!!visiblePanel}
        preset="slideLeft"
        slideDistance={40}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.background.canvas,
          zIndex: 50,
        }}
      >
        {panelContent}
      </AnimatedPresence>
    );
  }

  // Desktop: animated side panel
  return (
    <Animated.View style={{ width: panelWidth, overflow: 'hidden' }}>
      <View style={{ width: panelContentWidth ?? PANEL_WIDTH, height: '100%', borderLeftWidth: 1, borderLeftColor: theme.colors.border.subtle }}>
        {panelContent}
      </View>
    </Animated.View>
  );
}
