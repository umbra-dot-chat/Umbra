import React, { useState, useCallback, useRef, useMemo } from 'react';
import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Tabs, TabList, Tab, TabPanel,
  Text,
  Button,
  Card,
  GradientBorder,
  useTheme,
  Avatar,
  Input,
  SegmentedControl,
  Spinner,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  Box,
  ScrollArea,
} from '@coexist/wisp-react-native';
import {
  FriendListItem,
  FriendRequestItem,
  FriendSection,
} from '@/components/friends/FriendComponents';
import { AIAgentBanner } from '@/components/friends/AIAgentBanner';
import { useRouter } from 'expo-router';
import { UsersIcon, MessageIcon, MoreIcon, UserCheckIcon, QrCodeIcon, GlobeIcon, UserPlusIcon, BlockIcon } from '@/components/ui';
import { useFriends } from '@/hooks/useFriends';
import { useConversations } from '@/hooks/useConversations';
import { useActiveConversation } from '@/contexts/ActiveConversationContext';

import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
import { FriendSuggestionCard } from '@/components/discovery/FriendSuggestionCard';
import { QRCardDialog, parseScannedQR } from '@/components/ui/QRCardDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { InputDialog } from '@/components/ui/InputDialog';
import { searchByUsername, searchUsernames, lookupUsername, createDmConversation } from '@umbra/service';
import type { Friend, FriendRequest, DiscoverySearchResult, UsernameSearchResult } from '@umbra/service';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { MobileBackButton } from '@/components/ui/MobileBackButton';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNetwork } from '@/hooks/useNetwork';
import { TEST_IDS } from '@/constants/test-ids';
import { dbg } from '@/utils/debug';

// ---------------------------------------------------------------------------
// Search Platform Selector
// ---------------------------------------------------------------------------

type SearchPlatform = 'umbra' | 'discord' | 'github' | 'steam' | 'bluesky';

// SEARCH_PLATFORM_OPTIONS built inside FriendsPage with t() for i18n

/** Human-readable platform names for UI text. */
const PLATFORM_LABELS: Record<Exclude<SearchPlatform, 'umbra'>, string> = {
  discord: 'Discord',
  github: 'GitHub',
  steam: 'Steam',
  bluesky: 'Bluesky',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type FriendStatus = 'online' | 'idle' | 'dnd' | 'offline';

function getFriendStatus(friend: Friend, onlineDids?: Set<string>): FriendStatus {
  return (onlineDids ? onlineDids.has(friend.did) : friend.online) ? 'online' : 'offline';
}

/** Map app-level status to Wisp Avatar status values. */
function toAvatarStatus(status: FriendStatus): 'online' | 'offline' | 'busy' | 'away' {
  switch (status) {
    case 'online': return 'online';
    case 'idle': return 'away';
    case 'dnd': return 'busy';
    default: return 'offline';
  }
}

function formatRelativeTime(timestamp: number, tc: (key: string, options?: Record<string, unknown>) => string): string {
  // Handle timestamps in seconds (Unix) vs milliseconds
  // If timestamp is less than year 2000 in ms, it's probably in seconds
  const timestampMs = timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diff = now - timestampMs;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return tc('justNow');
  if (mins < 60) return tc('minutesAgoLong', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return tc('hoursAgoLong', { count: hours });
  const days = Math.floor(hours / 24);
  if (days === 1) return tc('dayAgo');
  return tc('daysAgoLong', { count: days });
}

// ---------------------------------------------------------------------------
// Friends Page
// ---------------------------------------------------------------------------

export default function FriendsPage() {
  if (__DEV__) dbg.trackRender('FriendsPage');
  const { t } = useTranslation('friends');
  const { t: tc } = useTranslation('common');
  const { theme } = useTheme();
  const router = useRouter();
  const { identity } = useAuth();
  const { playSound } = useSound();
  const isMobile = useIsMobile();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    blockedUsers,
    isLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    unblockUser,
  } = useFriends();
  const { conversations } = useConversations();
  const { setActiveId } = useActiveConversation();
  const { onlineDids } = useNetwork();

  const searchPlatformOptions = useMemo(() => [
    { value: 'umbra', label: t('searchUmbra') },
    { value: 'discord', label: t('searchDiscord') },
    { value: 'github', label: t('searchGithub') },
    { value: 'steam', label: t('searchSteam') },
    { value: 'bluesky', label: t('searchBluesky') },
  ], [t]);

  // AI Agent banner dismissal
  const [agentBannerDismissed, setAgentBannerDismissed] = useState(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('ghost_banner_dismissed') === '1';
      }
    } catch {}
    return false;
  });

  const handleDismissAgentBanner = useCallback(() => {
    setAgentBannerDismissed(true);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('ghost_banner_dismissed', '1');
      }
    } catch {}
  }, []);

  const [activeTab, setActiveTab] = useState('all');
  const [qrCardOpen, setQrCardOpen] = useState(false);
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    playSound('tab_switch');
  }, [playSound]);
  const [addFriendFeedback, setAddFriendFeedback] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

  // Context menu + dialog state
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuFriend, setContextMenuFriend] = useState<Friend | null>(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [blockReasonOpen, setBlockReasonOpen] = useState(false);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Map friendDid → conversationId for quick DM navigation
  const friendDmMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of conversations) {
      if (c.type === 'dm' && c.friendDid) {
        map[c.friendDid] = c.id;
      }
    }
    return map;
  }, [conversations]);

  // Platform search state (generic for all platforms)
  const [searchPlatform, setSearchPlatform] = useState<SearchPlatform>('umbra');
  const [platformQuery, setPlatformQuery] = useState('');
  const [platformResults, setPlatformResults] = useState<DiscoverySearchResult[]>([]);
  const [platformSearching, setPlatformSearching] = useState(false);
  const [platformSearchError, setPlatformSearchError] = useState<string | null>(null);
  const [addingDid, setAddingDid] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Username search state (for Umbra platform)
  const [usernameQuery, setUsernameQuery] = useState('');
  const [usernameResults, setUsernameResults] = useState<UsernameSearchResult[]>([]);
  const [usernameSearching, setUsernameSearching] = useState(false);
  const [usernameSearchError, setUsernameSearchError] = useState<string | null>(null);
  const usernameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAllUsernameResults, setShowAllUsernameResults] = useState(false);
  const [showAllPlatformResults, setShowAllPlatformResults] = useState(false);

  // Reset search state when switching platforms
  const handlePlatformChange = useCallback((platform: string) => {
    setSearchPlatform(platform as SearchPlatform);
    setPlatformQuery('');
    setPlatformResults([]);
    setPlatformSearchError(null);
    setPlatformSearching(false);
    setShowAllPlatformResults(false);
    setUsernameQuery('');
    setUsernameResults([]);
    setUsernameSearchError(null);
    setUsernameSearching(false);
    setShowAllUsernameResults(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }
  }, []);

  // Debounced platform search
  const handlePlatformSearch = useCallback((query: string) => {
    setPlatformQuery(query);
    setPlatformSearchError(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setPlatformResults([]);
      setPlatformSearching(false);
      return;
    }

    setPlatformSearching(true);
    setShowAllPlatformResults(false);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // searchPlatform is guaranteed not to be 'umbra' here (guarded in JSX)
        const results = await searchByUsername(searchPlatform as Exclude<SearchPlatform, 'umbra'>, query);
        setPlatformResults(results);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        setPlatformSearchError(msg);
        setPlatformResults([]);
      } finally {
        setPlatformSearching(false);
      }
    }, 400);
  }, [searchPlatform]);

  // Debounced username search (for Umbra platform) — also detects DID input
  const handleUsernameSearch = useCallback((query: string) => {
    setUsernameQuery(query);
    setUsernameSearchError(null);

    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    const trimmed = query.trim();

    // Auto-detect DID: if user pastes a did:key:... string, show it directly as a result
    if (trimmed.startsWith('did:key:')) {
      setUsernameSearching(false);
      if (trimmed.startsWith('did:key:z6Mk') && trimmed.length >= 48) {
        setUsernameResults([{ did: trimmed, username: trimmed.slice(0, 24) + '...' }]);
      } else {
        setUsernameResults([]);
        setUsernameSearchError('Please enter a valid DID (did:key:z6Mk...)');
      }
      return;
    }

    if (query.length < 2) {
      setUsernameResults([]);
      setUsernameSearching(false);
      return;
    }

    setUsernameSearching(true);
    setShowAllUsernameResults(false);
    usernameTimeoutRef.current = setTimeout(async () => {
      try {
        // Auto-detect: if query contains '#', try exact lookup first
        if (query.includes('#')) {
          const result = await lookupUsername(query);
          if (result.found && result.did && result.username) {
            setUsernameResults([{ did: result.did, username: result.username }]);
            setUsernameSearching(false);
            return;
          }
        }

        // Partial name search (strip '#' and anything after)
        const nameQuery = query.includes('#') ? query.split('#')[0] : query;
        if (nameQuery.length < 2) {
          setUsernameResults([]);
          setUsernameSearching(false);
          return;
        }

        const results = await searchUsernames(nameQuery);
        setUsernameResults(results);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        setUsernameSearchError(msg);
        setUsernameResults([]);
      } finally {
        setUsernameSearching(false);
      }
    }, 400);
  }, []);

  // Send friend request from platform search result
  const handleAddFromSearch = useCallback(async (did: string) => {
    setAddingDid(did);
    try {
      await sendRequest(did);
      // Remove from results to indicate success
      setPlatformResults((prev) => prev.filter((r) => r.did !== did));
      setUsernameResults((prev) => prev.filter((r) => r.did !== did));
      playSound('friend_request');
      setAddFriendFeedback({
        state: 'success',
        message: 'Friend request sent!',
      });
      setTimeout(() => setAddFriendFeedback({ state: 'idle' }), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send request';
      playSound('error');
      setAddFriendFeedback({ state: 'error', message: msg });
      setTimeout(() => setAddFriendFeedback({ state: 'idle' }), 3000);
    } finally {
      setAddingDid(null);
    }
  }, [sendRequest, playSound]);

  // Group friends by status (enriched with relay presence data)
  const onlineFriends = friends.filter((f) => onlineDids.has(f.did));
  const offlineFriends = friends.filter((f) => !onlineDids.has(f.did));

  // Sets for AI Agent banner
  const friendDids = useMemo(() => new Set(friends.map((f) => f.did)), [friends]);
  const pendingOutgoingDids = useMemo(
    () => new Set(outgoingRequests.map((r) => r.toDid)),
    [outgoingRequests],
  );

  const iconColor = theme.colors.text.secondary;

  // ------ Handlers ------

  const handleAcceptRequest = async (id: string) => {
    await acceptRequest(id);
    playSound('friend_accept');
  };

  const handleDeclineRequest = async (id: string) => {
    await rejectRequest(id);
  };

  const handleCancelRequest = async (id: string) => {
    // Cancel is the same as reject for outgoing requests
    await rejectRequest(id);
  };

  const handleUnblock = async (did: string) => {
    await unblockUser(did);
  };

  // ------ Navigation to DM ------

  const handleMessageFriend = useCallback(async (friendDid: string) => {
    let convoId = friendDmMap[friendDid];
    if (!convoId) {
      // Create a DM conversation if one doesn't exist yet
      try {
        convoId = await createDmConversation(friendDid);
      } catch {
        // Fallback: navigate to chat home
        router.push('/');
        return;
      }
    }
    setActiveId(convoId);
    router.push('/');
  }, [friendDmMap, setActiveId, router]);

  // ------ Context menu handlers ------

  const handleOpenContextMenu = useCallback((friend: Friend, event: any) => {
    // Get anchor position from the press event target
    const target = event?.currentTarget || event?.target;
    if (target?.measureInWindow) {
      target.measureInWindow((x: number, y: number, width: number, height: number) => {
        setContextMenuAnchor({ x, y, width, height });
        setContextMenuFriend(friend);
        setContextMenuOpen(true);
      });
    } else {
      // Fallback: open without anchor
      setContextMenuFriend(friend);
      setContextMenuOpen(true);
    }
  }, []);

  const handleRemoveFriend = useCallback(async () => {
    if (!contextMenuFriend) return;
    setActionSubmitting(true);
    try {
      await removeFriend(contextMenuFriend.did);
      setConfirmRemoveOpen(false);
      setContextMenuFriend(null);
    } finally {
      setActionSubmitting(false);
    }
  }, [contextMenuFriend, removeFriend]);

  const handleBlockFriend = useCallback(async () => {
    if (!contextMenuFriend) return;
    // Close block confirm, open reason input
    setConfirmBlockOpen(false);
    setBlockReasonOpen(true);
  }, [contextMenuFriend]);

  const handleBlockWithReason = useCallback(async (reason: string) => {
    if (!contextMenuFriend) return;
    setActionSubmitting(true);
    try {
      await blockUser(contextMenuFriend.did, reason || undefined);
      setBlockReasonOpen(false);
      setContextMenuFriend(null);
    } finally {
      setActionSubmitting(false);
    }
  }, [contextMenuFriend, blockUser]);

  // ------ Actions for friend items ------

  const friendActions = (friend: Friend) => [
    {
      id: 'message',
      label: t('message'),
      icon: <MessageIcon size={20} color={iconColor} />,
      onPress: () => handleMessageFriend(friend.did),
    },
    {
      id: 'more',
      label: 'More',
      icon: <MoreIcon size={20} color={iconColor} />,
      onPress: (event: any) => handleOpenContextMenu(friend, event),
    },
  ];

  // ------ Render helpers ------

  const renderFriendItem = (friend: Friend) => (
    <FriendListItem
      key={friend.did}
      name={friend.displayName}
      username={friend.did.slice(0, 20) + '...'}
      avatar={<Avatar name={friend.displayName} src={friend.avatar} size="md" status={toAvatarStatus(getFriendStatus(friend, onlineDids))} />}
      status={getFriendStatus(friend, onlineDids)}
      statusText={friend.status}
      actions={friendActions(friend)}
      flat
    />
  );

  const renderIncomingRequest = (req: FriendRequest) => (
    <FriendRequestItem
      key={req.id}
      name={req.fromDisplayName || req.fromDid.slice(0, 20) + '...'}
      username={req.fromDid.slice(0, 20) + '...'}
      avatar={<Avatar name={req.fromDisplayName || 'Unknown'} src={req.fromAvatar} size="md" />}
      type="incoming"
      timestamp={formatRelativeTime(req.createdAt, tc)}
      onAccept={() => handleAcceptRequest(req.id)}
      onDecline={() => handleDeclineRequest(req.id)}
      flat
    />
  );

  const renderOutgoingRequest = (req: FriendRequest) => {
    // For outgoing requests, fromDisplayName is OUR name (the sender).
    // Show the recipient's DID since we don't have their display name.
    const recipientLabel = req.toDid.slice(0, 20) + '...';
    return (
      <FriendRequestItem
        key={req.id}
        name={recipientLabel}
        username={req.toDid.slice(0, 20) + '...'}
        avatar={<Avatar name={recipientLabel} size="md" />}
        type="outgoing"
        timestamp={formatRelativeTime(req.createdAt, tc)}
        onCancel={() => handleCancelRequest(req.id)}
        flat
      />
    );
  };

  if (isLoading) {
    return (
      <Box style={{ flex: 1, backgroundColor: theme.colors.background.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <Text size="sm" style={{ color: theme.colors.text.muted }}>{t('loadingFriends')}</Text>
      </Box>
    );
  }

  return (
    <Box testID={TEST_IDS.FRIENDS.PAGE} style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <Tabs value={activeTab} onChange={handleTabChange} style={{ flex: 1 }}>
        {/* Header bar with title + tabs */}
        <Box
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 0,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.subtle,
          }}
        >
          <Box style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: isMobile ? 4 : 24 }}>
            <MobileBackButton onPress={() => router.back()} label="Back to conversations" />
            {!isMobile && (
              <>
                <UsersIcon size={20} color={theme.colors.text.primary} />
                <Text size="lg" weight="bold">{t('title')}</Text>
              </>
            )}
          </Box>

          <TabList indicatorGradient style={{ borderBottomWidth: 0 }}>
            <Tab
              value="all"
              testID={TEST_IDS.FRIENDS.TAB_ALL}
              icon={<UsersIcon size={18} color={activeTab === 'all' ? theme.colors.text.primary : theme.colors.text.secondary} />}
            >
              {isMobile && activeTab !== 'all' ? null : t('tabAll')}
            </Tab>
            <Tab
              value="online"
              testID={TEST_IDS.FRIENDS.TAB_ONLINE}
              icon={<GlobeIcon size={18} color={activeTab === 'online' ? theme.colors.text.primary : theme.colors.text.secondary} />}
            >
              {isMobile && activeTab !== 'online' ? null : t('tabOnline')}
            </Tab>
            <Tab
              value="pending"
              testID={TEST_IDS.FRIENDS.TAB_PENDING}
              badge={incomingRequests.length > 0 ? incomingRequests.length : undefined}
              icon={<UserPlusIcon size={18} color={activeTab === 'pending' ? theme.colors.text.primary : theme.colors.text.secondary} />}
            >
              {isMobile && activeTab !== 'pending' ? null : t('tabPending')}
            </Tab>
            <Tab
              value="blocked"
              testID={TEST_IDS.FRIENDS.TAB_BLOCKED}
              icon={<BlockIcon size={18} color={activeTab === 'blocked' ? theme.colors.text.primary : theme.colors.text.secondary} />}
            >
              {isMobile && activeTab !== 'blocked' ? null : t('tabBlocked')}
            </Tab>
          </TabList>

          <Box style={{ flex: 1 }} />

          <Button
            variant="tertiary"
            size="sm"
            onPress={() => setQrCardOpen(true)}
            iconLeft={<QrCodeIcon size={20} color={theme.colors.text.secondary} />}
            accessibilityLabel={t('openQrCode')}
          />

        </Box>

        {/* ─── All Friends ─── */}
        <TabPanel value="all" style={{ flex: 1 }}>
          <ScrollArea style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">

            {/* AI Agent Banner */}
            {!agentBannerDismissed && (
              <AIAgentBanner
                friendDids={friendDids}
                pendingDids={pendingOutgoingDids}
                onAddAgent={handleAddFromSearch}
                onMessageAgent={handleMessageFriend}
                addingDid={addingDid}
                onDismiss={handleDismissAgentBanner}
              />
            )}

            <Box style={{ marginBottom: 16 }}>
              {/* Platform selector */}
              <Box style={{ marginBottom: 10 }}>
                <Text size="xs" color="tertiary" style={{ marginBottom: 6 }}>Search on</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <SegmentedControl
                    options={searchPlatformOptions}
                    value={searchPlatform}
                    onChange={handlePlatformChange}
                    size="sm"
                  />
                </ScrollView>
              </Box>

              {/* Umbra: Username + DID search */}
              {searchPlatform === 'umbra' && (
                <Box>
                  <Input
                    value={usernameQuery}
                    onChangeText={handleUsernameSearch}
                    placeholder="Search by username, tag, or DID"
                    size="md"
                    fullWidth
                    autoCapitalize="none"
                    autoCorrect={false}
                    gradientBorder
                    testID={TEST_IDS.FRIENDS.ADD_INPUT}
                  />

                  {/* Search results / feedback */}
                  {usernameSearching && (
                    <Box style={{ alignItems: 'center', paddingVertical: 12 }}>
                      <Spinner size="sm" />
                    </Box>
                  )}

                  {usernameSearchError && (
                    <Text size="xs" style={{ color: theme.colors.status.danger, marginTop: 8 }}>
                      {usernameSearchError}
                    </Text>
                  )}

                  {!usernameSearching && usernameQuery.length >= 2 && usernameResults.length === 0 && !usernameSearchError && !usernameQuery.trim().startsWith('did:') && (
                    <Text size="sm" color="muted" style={{ textAlign: 'center', paddingVertical: 12 }}>
                      No users found matching "{usernameQuery}"
                    </Text>
                  )}

                  {usernameResults.length > 0 && (() => {
                    const visible = showAllUsernameResults ? usernameResults : usernameResults.slice(0, 5);
                    const hasMore = usernameResults.length > 5 && !showAllUsernameResults;
                    return (
                      <GradientBorder radius={12} width={1} style={{ marginTop: 10 }}>
                        <Card variant="filled" padding="sm" style={{ borderRadius: 12 }}>
                          {visible.map((result) => (
                            <FriendSuggestionCard
                              key={result.did}
                              umbraDid={result.did}
                              platform="umbra"
                              platformUsername={result.username}
                              onAddFriend={() => handleAddFromSearch(result.did)}
                              onDismiss={() => setUsernameResults((prev) => prev.filter((r) => r.did !== result.did))}
                              adding={addingDid === result.did}
                            />
                          ))}
                          {hasMore && (
                            <Button variant="tertiary" size="xs" onPress={() => setShowAllUsernameResults(true)} style={{ alignSelf: 'center' }}>
                              Show all {usernameResults.length} results
                            </Button>
                          )}
                        </Card>
                      </GradientBorder>
                    );
                  })()}

                  {addFriendFeedback.state !== 'idle' && addFriendFeedback.message && (
                    <Text
                      size="xs"
                      testID={TEST_IDS.FRIENDS.ADD_FEEDBACK}
                      style={{
                        marginTop: 8,
                        color: addFriendFeedback.state === 'success'
                          ? theme.colors.status.success
                          : addFriendFeedback.state === 'error'
                            ? theme.colors.status.danger
                            : theme.colors.text.muted,
                      }}
                    >
                      {addFriendFeedback.message}
                    </Text>
                  )}
                </Box>
              )}

              {/* Platform username search */}
              {searchPlatform !== 'umbra' && (
                <Box>
                  <Input
                    value={platformQuery}
                    onChangeText={handlePlatformSearch}
                    placeholder={`Search by ${PLATFORM_LABELS[searchPlatform]} username...`}
                    size="md"
                    fullWidth
                    autoCapitalize="none"
                    autoCorrect={false}
                    gradientBorder
                  />

                  {/* Search results */}
                  {platformSearching && (
                    <Box style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <Spinner size="sm" />
                    </Box>
                  )}

                  {platformSearchError && (
                    <Text size="xs" style={{ color: theme.colors.status.danger, marginTop: 8 }}>
                      {platformSearchError}
                    </Text>
                  )}

                  {!platformSearching && platformQuery.length >= 2 && platformResults.length === 0 && !platformSearchError && (
                    <Text size="sm" color="muted" style={{ textAlign: 'center', paddingVertical: 16 }}>
                      No Umbra users found with that {PLATFORM_LABELS[searchPlatform]} username
                    </Text>
                  )}

                  {platformResults.length > 0 && (() => {
                    const visible = showAllPlatformResults ? platformResults : platformResults.slice(0, 5);
                    const hasMore = platformResults.length > 5 && !showAllPlatformResults;
                    return (
                      <GradientBorder radius={12} width={1} style={{ marginTop: 10 }}>
                        <Card variant="filled" padding="sm" style={{ borderRadius: 12 }}>
                          {visible.map((result) => (
                            <FriendSuggestionCard
                              key={result.did}
                              umbraDid={result.did}
                              platform={searchPlatform}
                              platformUsername={result.username}
                              onAddFriend={() => handleAddFromSearch(result.did)}
                              onDismiss={() => setPlatformResults((prev) => prev.filter((r) => r.did !== result.did))}
                              adding={addingDid === result.did}
                            />
                          ))}
                          {hasMore && (
                            <Button variant="tertiary" size="xs" onPress={() => setShowAllPlatformResults(true)} style={{ alignSelf: 'center' }}>
                              Show all {platformResults.length} results
                            </Button>
                          )}
                        </Card>
                      </GradientBorder>
                    );
                  })()}

                  {/* Feedback message for add actions */}
                  {addFriendFeedback.state !== 'idle' && addFriendFeedback.message && (
                    <Text
                      size="xs"
                      testID={TEST_IDS.FRIENDS.ADD_FEEDBACK}
                      style={{
                        marginTop: 8,
                        color: addFriendFeedback.state === 'success'
                          ? theme.colors.status.success
                          : addFriendFeedback.state === 'error'
                            ? theme.colors.status.danger
                            : theme.colors.text.muted,
                      }}
                    >
                      {addFriendFeedback.message}
                    </Text>
                  )}
                </Box>
              )}
            </Box>

            {friends.length === 0 ? (
              <FriendSection
                title={t('allFriends')}
                count={0}
                emptyMessage="No friends yet. Add someone by their DID to get started!"
              />
            ) : (
              <>
                <FriendSection title={t('onlineFriends')} count={onlineFriends.length}>
                  {onlineFriends.map(renderFriendItem)}
                </FriendSection>

                <FriendSection title="Offline" count={offlineFriends.length} defaultCollapsed>
                  {offlineFriends.map(renderFriendItem)}
                </FriendSection>
              </>
            )}
          </ScrollArea>
        </TabPanel>

        {/* ─── Online ─── */}
        <TabPanel value="online" style={{ flex: 1 }}>
          <ScrollArea style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {onlineFriends.length > 0 ? (
              <FriendSection title={t('onlineFriends')} count={onlineFriends.length}>
                {onlineFriends.map(renderFriendItem)}
              </FriendSection>
            ) : (
              <FriendSection
                title={t('onlineFriends')}
                count={0}
                emptyMessage="No friends online right now."
              />
            )}
          </ScrollArea>
        </TabPanel>

        {/* ─── Pending ─── */}
        <TabPanel value="pending" style={{ flex: 1 }}>
          <ScrollArea style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <FriendSection
              title="Incoming"
              count={incomingRequests.length}
              emptyMessage="No incoming requests."
              headerRight={
                <HelpIndicator
                  id="pending-requests"
                  title="Friend Requests"
                  priority={30}
                  size={14}
                >
                  <HelpText>
                    Incoming requests are from people who want to connect with you. You can accept or decline each one.
                  </HelpText>
                  <HelpHighlight icon={<UserCheckIcon size={22} color={theme.colors.accent.primary} />}>
                    Accepting a request creates an encrypted conversation between you and your new friend.
                  </HelpHighlight>
                  <HelpListItem>Outgoing requests are ones you've sent to others</HelpListItem>
                  <HelpListItem>Requests include the sender's public keys for verification</HelpListItem>
                </HelpIndicator>
              }
            >
              {incomingRequests.map(renderIncomingRequest)}
            </FriendSection>

            <FriendSection
              title="Outgoing"
              count={outgoingRequests.length}
              emptyMessage="No outgoing requests."
            >
              {outgoingRequests.map(renderOutgoingRequest)}
            </FriendSection>
          </ScrollArea>
        </TabPanel>

        {/* ─── Blocked ─── */}
        <TabPanel value="blocked" style={{ flex: 1 }}>
          <ScrollArea style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <FriendSection
              title={t('blockedUsers')}
              count={blockedUsers.length}
              emptyMessage="No blocked users."
            >
              {blockedUsers.map((blocked) => (
                <FriendListItem
                  key={blocked.did}
                  name={blocked.did.slice(0, 24) + '...'}
                  username={blocked.reason ? `Reason: ${blocked.reason}` : formatRelativeTime(blocked.blockedAt, tc)}
                  avatar={<Avatar name={blocked.did.slice(8, 12)} size="md" />}
                  status="offline"
                  actions={[
                    {
                      id: 'unblock',
                      label: 'Unblock',
                      onPress: () => handleUnblock(blocked.did),
                    },
                  ]}
                  flat
                />
              ))}
            </FriendSection>
          </ScrollArea>
        </TabPanel>
      </Tabs>

      <QRCardDialog
        open={qrCardOpen}
        onClose={() => setQrCardOpen(false)}
        mode="profile"
        value={identity?.did ?? ''}
        label={identity?.displayName}
        title="My QR Code"
        onScanned={(data) => {
          setQrCardOpen(false);
          const parsed = parseScannedQR(data);
          if (parsed?.type === 'did') {
            handleAddFromSearch(parsed.value);
          }
        }}
      />

      {/* Friend context menu (More button) */}
      <DropdownMenu
        open={contextMenuOpen}
        onOpenChange={(open) => {
          setContextMenuOpen(open);
        }}
        anchorLayout={contextMenuAnchor}
      >
        <DropdownMenuContent>
          <DropdownMenuItem
            onSelect={() => {
              setContextMenuOpen(false);
              if (contextMenuFriend) handleMessageFriend(contextMenuFriend.did);
            }}
          >
            {t('message')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              setContextMenuOpen(false);
              setConfirmRemoveOpen(true);
            }}
          >
            {t('removeFriend')}
          </DropdownMenuItem>
          <DropdownMenuItem
            danger
            onSelect={() => {
              setContextMenuOpen(false);
              setConfirmBlockOpen(true);
            }}
          >
            Block User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Remove friend confirmation */}
      <ConfirmDialog
        open={confirmRemoveOpen}
        onClose={() => { setConfirmRemoveOpen(false); setContextMenuFriend(null); }}
        title="Remove Friend"
        message={`Are you sure you want to remove ${contextMenuFriend?.displayName ?? 'this user'} from your friends? You will no longer be able to message them.`}
        confirmLabel="Remove"
        onConfirm={handleRemoveFriend}
        submitting={actionSubmitting}
      />

      {/* Block user confirmation */}
      <ConfirmDialog
        open={confirmBlockOpen}
        onClose={() => { setConfirmBlockOpen(false); setContextMenuFriend(null); }}
        title="Block User"
        message={`Are you sure you want to block ${contextMenuFriend?.displayName ?? 'this user'}? They will not be able to send you messages or friend requests.`}
        confirmLabel="Block"
        onConfirm={handleBlockFriend}
        submitting={actionSubmitting}
      />

      {/* Block reason input */}
      <InputDialog
        open={blockReasonOpen}
        onClose={() => { setBlockReasonOpen(false); setContextMenuFriend(null); }}
        title="Block Reason (Optional)"
        label="Why are you blocking this user?"
        placeholder="Spam, harassment, etc."
        submitLabel="Block"
        onSubmit={handleBlockWithReason}
        submitting={actionSubmitting}
        minLength={0}
        maxLength={200}
      />
    </Box>
  );
}
