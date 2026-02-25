import React, { useState, useCallback, useRef } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import {
  Tabs, TabList, Tab, TabPanel,
  Text,
  useTheme,
  Avatar,
  Input,
  SegmentedControl,
  Spinner,
  AddFriendInput,
} from '@coexist/wisp-react-native';
import {
  FriendListItem,
  FriendRequestItem,
  FriendSection,
} from '@/components/friends/FriendComponents';
import { useRouter } from 'expo-router';
import { UsersIcon, MessageIcon, MoreIcon, UserCheckIcon, QrCodeIcon, GlobeIcon, UserPlusIcon, BlockIcon } from '@/components/icons';
import { useFriends } from '@/hooks/useFriends';
import { ProfileCard } from '@/components/friends/ProfileCard';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
import { FriendSuggestionCard } from '@/components/discovery/FriendSuggestionCard';
import { QRCardDialog, parseScannedQR } from '@/components/qr/QRCardDialog';
import { searchByUsername, searchUsernames, lookupUsername } from '@umbra/service';
import type { Friend, FriendRequest, DiscoverySearchResult, UsernameSearchResult } from '@umbra/service';
import { useAuth } from '@/contexts/AuthContext';
import { useSound } from '@/contexts/SoundContext';
import { MobileBackButton } from '@/components/ui/MobileBackButton';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNetwork } from '@/hooks/useNetwork';

// ---------------------------------------------------------------------------
// Search Platform Selector
// ---------------------------------------------------------------------------

type SearchPlatform = 'umbra' | 'discord' | 'github' | 'steam' | 'bluesky';

const SEARCH_PLATFORM_OPTIONS = [
  { value: 'umbra', label: 'Umbra' },
  { value: 'discord', label: 'Discord' },
  { value: 'github', label: 'GitHub' },
  { value: 'steam', label: 'Steam' },
  { value: 'bluesky', label: 'Bluesky' },
];

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

function formatRelativeTime(timestamp: number): string {
  // Handle timestamps in seconds (Unix) vs milliseconds
  // If timestamp is less than year 2000 in ms, it's probably in seconds
  const timestampMs = timestamp < 1000000000000 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diff = now - timestampMs;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

// ---------------------------------------------------------------------------
// Friends Page
// ---------------------------------------------------------------------------

export default function FriendsPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const { identity } = useAuth();
  const { playSound } = useSound();
  const isMobile = useIsMobile();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    isLoading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    unblockUser,
  } = useFriends();
  const { onlineDids } = useNetwork();

  const [activeTab, setActiveTab] = useState('all');
  const [qrCardOpen, setQrCardOpen] = useState(false);
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    playSound('tab_switch');
  }, [playSound]);
  const [addFriendValue, setAddFriendValue] = useState('');
  const [addFriendFeedback, setAddFriendFeedback] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

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

  // Reset search state when switching platforms
  const handlePlatformChange = useCallback((platform: string) => {
    setSearchPlatform(platform as SearchPlatform);
    setPlatformQuery('');
    setPlatformResults([]);
    setPlatformSearchError(null);
    setPlatformSearching(false);
    setUsernameQuery('');
    setUsernameResults([]);
    setUsernameSearchError(null);
    setUsernameSearching(false);
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

  // Debounced username search (for Umbra platform)
  const handleUsernameSearch = useCallback((query: string) => {
    setUsernameQuery(query);
    setUsernameSearchError(null);

    if (usernameTimeoutRef.current) {
      clearTimeout(usernameTimeoutRef.current);
    }

    if (query.length < 2) {
      setUsernameResults([]);
      setUsernameSearching(false);
      return;
    }

    setUsernameSearching(true);
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

  const handleAddFriend = async (value: string) => {
    if (value.trim().length < 8) {
      setAddFriendFeedback({
        state: 'error',
        message: 'Please enter a valid DID (did:key:z6Mk...).',
      });
      setTimeout(() => setAddFriendFeedback({ state: 'idle' }), 3000);
      return;
    }

    setAddFriendFeedback({ state: 'loading' });

    try {
      const result = await sendRequest(value.trim());
      if (result) {
        setAddFriendFeedback({
          state: 'success',
          message: `Friend request sent!`,
        });
        setAddFriendValue('');
      } else {
        setAddFriendFeedback({
          state: 'error',
          message: 'Failed to send friend request.',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      let userMessage = 'Failed to send friend request.';
      if (msg.includes('No identity loaded')) {
        userMessage = 'Identity not loaded. Please log out and log back in.';
      } else if (msg.includes('Database not initialized')) {
        userMessage = 'App not fully initialized. Please refresh and try again.';
      } else if (msg.length > 0 && msg.length < 120) {
        userMessage = msg;
      }
      setAddFriendFeedback({
        state: 'error',
        message: userMessage,
      });
    }

    setTimeout(() => setAddFriendFeedback({ state: 'idle' }), 3000);
  };

  // ------ Actions for friend items ------

  const friendActions = (_friendDid: string) => [
    {
      id: 'message',
      label: 'Message',
      icon: <MessageIcon size={20} color={iconColor} />,
      onPress: () => {
        // Navigate to chat page — the conversation for this friend
        // will be auto-selected by the chat page
        router.push('/');
      },
    },
    {
      id: 'more',
      label: 'More',
      icon: <MoreIcon size={20} color={iconColor} />,
      onPress: () => {},
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
      actions={friendActions(friend.did)}
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
      timestamp={formatRelativeTime(req.createdAt)}
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
        timestamp={formatRelativeTime(req.createdAt)}
        onCancel={() => handleCancelRequest(req.id)}
        flat
      />
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <Text size="sm" style={{ color: theme.colors.text.muted }}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <Tabs value={activeTab} onChange={handleTabChange} style={{ flex: 1 }}>
        {/* Header bar with title + tabs */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 4,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.subtle,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: isMobile ? 4 : 24 }}>
            <MobileBackButton onPress={() => router.back()} label="Back to conversations" />
            {!isMobile && (
              <>
                <UsersIcon size={20} color={theme.colors.text.primary} />
                <Text size="lg" weight="bold">Friends</Text>
              </>
            )}
          </View>

          <TabList style={{ marginBottom: -1, borderBottomWidth: 0 }}>
            <Tab
              value="all"
              icon={<UsersIcon size={18} color={activeTab === 'all' ? theme.colors.text.primary : theme.colors.text.secondary} />}
            >
              {isMobile && activeTab !== 'all' ? null : 'All'}
            </Tab>
            <Tab
              value="online"
              icon={<GlobeIcon size={18} color={activeTab === 'online' ? theme.colors.text.primary : theme.colors.text.secondary} />}
            >
              {isMobile && activeTab !== 'online' ? null : 'Online'}
            </Tab>
            <Tab
              value="pending"
              badge={incomingRequests.length > 0 ? incomingRequests.length : undefined}
              icon={<UserPlusIcon size={18} color={activeTab === 'pending' ? theme.colors.text.primary : theme.colors.text.secondary} />}
            >
              {isMobile && activeTab !== 'pending' ? null : 'Pending'}
            </Tab>
            <Tab
              value="blocked"
              icon={<BlockIcon size={18} color={activeTab === 'blocked' ? theme.colors.text.primary : theme.colors.text.secondary} />}
            >
              {isMobile && activeTab !== 'blocked' ? null : 'Blocked'}
            </Tab>
          </TabList>

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={() => setQrCardOpen(true)}
            style={{ paddingHorizontal: 8 }}
            hitSlop={6}
          >
            <QrCodeIcon size={20} color={theme.colors.text.secondary} />
          </Pressable>
        </View>

        {/* ─── All Friends ─── */}
        <TabPanel value="all" style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <ProfileCard style={{ marginBottom: 12 }} />
            <View style={{ marginBottom: 16 }}>
              {/* Platform selector */}
              <View style={{ marginBottom: 10 }}>
                <Text size="xs" color="tertiary" style={{ marginBottom: 6 }}>Search on</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <SegmentedControl
                    options={SEARCH_PLATFORM_OPTIONS}
                    value={searchPlatform}
                    onChange={handlePlatformChange}
                    size="sm"
                  />
                </ScrollView>
              </View>

              {/* Umbra: Username search + DID input */}
              {searchPlatform === 'umbra' && (
                <View>
                  {/* Username search */}
                  <Input
                    value={usernameQuery}
                    onChangeText={handleUsernameSearch}
                    placeholder="Search by username (e.g., Matt or Matt#01283)"
                    size="md"
                    fullWidth
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {/* Username search results */}
                  {usernameSearching && (
                    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                      <Spinner size="sm" />
                    </View>
                  )}

                  {usernameSearchError && (
                    <Text size="xs" style={{ color: theme.colors.status.danger, marginTop: 8 }}>
                      {usernameSearchError}
                    </Text>
                  )}

                  {!usernameSearching && usernameQuery.length >= 2 && usernameResults.length === 0 && !usernameSearchError && (
                    <Text size="sm" color="muted" style={{ textAlign: 'center', paddingVertical: 12 }}>
                      No users found matching "{usernameQuery}"
                    </Text>
                  )}

                  {usernameResults.length > 0 && (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {usernameResults.map((result) => (
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
                    </View>
                  )}

                  {/* DID-based add friend (fallback) */}
                  <View style={{ marginTop: 12 }}>
                    <Text size="xs" color="tertiary" style={{ marginBottom: 6 }}>Or add by DID</Text>
                    <AddFriendInput
                      value={addFriendValue}
                      onValueChange={setAddFriendValue}
                      onSubmit={handleAddFriend}
                      feedbackState={addFriendFeedback.state}
                      feedbackMessage={addFriendFeedback.message}
                      placeholder="did:key:z6Mk..."
                    />
                  </View>
                </View>
              )}

              {/* Platform username search */}
              {searchPlatform !== 'umbra' && (
                <View>
                  <Input
                    value={platformQuery}
                    onChangeText={handlePlatformSearch}
                    placeholder={`Search by ${PLATFORM_LABELS[searchPlatform]} username...`}
                    size="md"
                    fullWidth
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {/* Search results */}
                  {platformSearching && (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <Spinner size="sm" />
                    </View>
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

                  {platformResults.length > 0 && (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {platformResults.map((result) => (
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
                    </View>
                  )}

                  {/* Feedback message for add actions */}
                  {addFriendFeedback.state !== 'idle' && addFriendFeedback.message && (
                    <Text
                      size="xs"
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
                </View>
              )}
            </View>

            {friends.length === 0 ? (
              <FriendSection
                title="All Friends"
                count={0}
                emptyMessage="No friends yet. Add someone by their DID to get started!"
              />
            ) : (
              <>
                <FriendSection title="Online" count={onlineFriends.length}>
                  {onlineFriends.map(renderFriendItem)}
                </FriendSection>

                <FriendSection title="Offline" count={offlineFriends.length} defaultCollapsed>
                  {offlineFriends.map(renderFriendItem)}
                </FriendSection>
              </>
            )}
          </ScrollView>
        </TabPanel>

        {/* ─── Online ─── */}
        <TabPanel value="online" style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {onlineFriends.length > 0 ? (
              <FriendSection title="Online" count={onlineFriends.length}>
                {onlineFriends.map(renderFriendItem)}
              </FriendSection>
            ) : (
              <FriendSection
                title="Online"
                count={0}
                emptyMessage="No friends online right now."
              />
            )}
          </ScrollView>
        </TabPanel>

        {/* ─── Pending ─── */}
        <TabPanel value="pending" style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <View style={{ marginBottom: 16 }}>
              {/* Platform selector */}
              <View style={{ marginBottom: 10 }}>
                <Text size="xs" color="tertiary" style={{ marginBottom: 6 }}>Search on</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <SegmentedControl
                    options={SEARCH_PLATFORM_OPTIONS}
                    value={searchPlatform}
                    onChange={handlePlatformChange}
                    size="sm"
                  />
                </ScrollView>
              </View>

              {/* Umbra: Username search + DID input */}
              {searchPlatform === 'umbra' && (
                <View>
                  <Input
                    value={usernameQuery}
                    onChangeText={handleUsernameSearch}
                    placeholder="Search by username (e.g., Matt or Matt#01283)"
                    size="md"
                    fullWidth
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {usernameSearching && (
                    <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                      <Spinner size="sm" />
                    </View>
                  )}

                  {usernameSearchError && (
                    <Text size="xs" style={{ color: theme.colors.status.danger, marginTop: 8 }}>
                      {usernameSearchError}
                    </Text>
                  )}

                  {!usernameSearching && usernameQuery.length >= 2 && usernameResults.length === 0 && !usernameSearchError && (
                    <Text size="sm" color="muted" style={{ textAlign: 'center', paddingVertical: 12 }}>
                      No users found matching "{usernameQuery}"
                    </Text>
                  )}

                  {usernameResults.length > 0 && (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {usernameResults.map((result) => (
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
                    </View>
                  )}

                  <View style={{ marginTop: 12 }}>
                    <Text size="xs" color="tertiary" style={{ marginBottom: 6 }}>Or add by DID</Text>
                    <AddFriendInput
                      value={addFriendValue}
                      onValueChange={setAddFriendValue}
                      onSubmit={handleAddFriend}
                      feedbackState={addFriendFeedback.state}
                      feedbackMessage={addFriendFeedback.message}
                      placeholder="did:key:z6Mk..."
                    />
                  </View>
                </View>
              )}

              {searchPlatform !== 'umbra' && (
                <View>
                  <Input
                    value={platformQuery}
                    onChangeText={handlePlatformSearch}
                    placeholder={`Search by ${PLATFORM_LABELS[searchPlatform]} username...`}
                    size="md"
                    fullWidth
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {platformSearching && (
                    <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                      <Spinner size="sm" />
                    </View>
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

                  {platformResults.length > 0 && (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {platformResults.map((result) => (
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
                    </View>
                  )}
                </View>
              )}
            </View>

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
                  <HelpHighlight icon={<UserCheckIcon size={22} color="#6366f1" />}>
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
          </ScrollView>
        </TabPanel>

        {/* ─── Blocked ─── */}
        <TabPanel value="blocked" style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <FriendSection
              title="Blocked Users"
              count={0}
              emptyMessage="No blocked users."
            />
          </ScrollView>
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
            handleAddFriend(parsed.value);
          }
        }}
      />
    </View>
  );
}
