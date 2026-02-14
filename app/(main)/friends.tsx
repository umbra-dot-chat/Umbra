import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Tabs, TabList, Tab, TabPanel,
  Text,
  useTheme,
  Avatar,
} from '@coexist/wisp-react-native';
import {
  FriendListItem,
  FriendRequestItem,
  FriendSection,
  AddFriendInput,
} from '@/components/friends/FriendComponents';
import { useRouter } from 'expo-router';
import { UsersIcon, MessageIcon, MoreIcon, UserXIcon, UserCheckIcon } from '@/components/icons';
import { useFriends } from '@/hooks/useFriends';
import { ProfileCard } from '@/components/friends/ProfileCard';
import { HelpIndicator } from '@/components/ui/HelpIndicator';
import { HelpText, HelpHighlight, HelpListItem } from '@/components/ui/HelpContent';
import type { Friend, FriendRequest } from '@umbra/service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type FriendStatus = 'online' | 'idle' | 'dnd' | 'offline';

function getFriendStatus(friend: Friend): FriendStatus {
  return friend.online ? 'online' : 'offline';
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

  const [activeTab, setActiveTab] = useState('all');
  const [addFriendValue, setAddFriendValue] = useState('');
  const [addFriendFeedback, setAddFriendFeedback] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

  // Group friends by status
  const onlineFriends = friends.filter((f) => f.online);
  const offlineFriends = friends.filter((f) => !f.online);

  const iconColor = theme.colors.text.secondary;

  // ------ Handlers ------

  const handleAcceptRequest = async (id: string) => {
    await acceptRequest(id);
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
      avatar={<Avatar name={friend.displayName} size="md" status={toAvatarStatus(getFriendStatus(friend))} />}
      status={getFriendStatus(friend)}
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
      avatar={<Avatar name={req.fromDisplayName || 'Unknown'} size="md" />}
      type="incoming"
      timestamp={formatRelativeTime(req.createdAt)}
      onAccept={() => handleAcceptRequest(req.id)}
      onDecline={() => handleDeclineRequest(req.id)}
      flat
    />
  );

  const renderOutgoingRequest = (req: FriendRequest) => (
    <FriendRequestItem
      key={req.id}
      name={req.fromDisplayName || req.toDid.slice(0, 20) + '...'}
      username={req.toDid.slice(0, 20) + '...'}
      avatar={<Avatar name={req.fromDisplayName || 'Unknown'} size="md" />}
      type="outgoing"
      timestamp={formatRelativeTime(req.createdAt)}
      onCancel={() => handleCancelRequest(req.id)}
      flat
    />
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas, alignItems: 'center', justifyContent: 'center' }}>
        <Text size="sm" style={{ color: theme.colors.text.muted }}>Loading friends...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.canvas }}>
      <Tabs value={activeTab} onChange={setActiveTab}>
        {/* Header bar with title + tabs */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.subtle,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 24, paddingBottom: 12 }}>
            <UsersIcon size={20} color={theme.colors.text.primary} />
            <Text size="lg" weight="bold">Friends</Text>
          </View>

          <TabList style={{ marginBottom: -1 }}>
            <Tab value="all">All</Tab>
            <Tab value="online">Online</Tab>
            <Tab value="pending">
              {incomingRequests.length > 0 ? `Pending (${incomingRequests.length})` : 'Pending'}
            </Tab>
            <Tab value="blocked">Blocked</Tab>
          </TabList>
        </View>

        {/* ─── All Friends ─── */}
        <TabPanel value="all">
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <ProfileCard style={{ marginBottom: 12 }} />
            <View style={{ marginBottom: 16 }}>
              <AddFriendInput
                value={addFriendValue}
                onValueChange={setAddFriendValue}
                onSubmit={handleAddFriend}
                feedbackState={addFriendFeedback.state}
                feedbackMessage={addFriendFeedback.message}
                placeholder="Add friend by DID (did:key:z6Mk...)"
              />
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
        <TabPanel value="online">
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
        <TabPanel value="pending">
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <ProfileCard style={{ marginBottom: 12 }} />
            <AddFriendInput
              value={addFriendValue}
              onValueChange={setAddFriendValue}
              onSubmit={handleAddFriend}
              feedbackState={addFriendFeedback.state}
              feedbackMessage={addFriendFeedback.message}
              placeholder="Add friend by DID (did:key:z6Mk...)"
              style={{ marginBottom: 16 }}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
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
            </View>
            <FriendSection
              title="Incoming"
              count={incomingRequests.length}
              emptyMessage="No incoming requests."
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
        <TabPanel value="blocked">
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <FriendSection
              title="Blocked Users"
              count={0}
              emptyMessage="No blocked users."
            />
          </ScrollView>
        </TabPanel>
      </Tabs>
    </View>
  );
}
