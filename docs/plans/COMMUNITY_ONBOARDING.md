# Community Invite & Onboarding Flow

## Overview

Implement a complete community invite system that allows users to share invite links that work seamlessly across platforms. When a user clicks an invite link, they are taken through a smooth onboarding flow that handles both authenticated and unauthenticated states.

## Current Issues

1. **Wrong Domain**: Invite URLs use `umbra.app` instead of `umbra.chat`
   - Hardcoded in Wisp `InviteManager.tsx` (line 253): `baseUrl = 'https://umbra.app/invite/'`
   - Hardcoded in Wisp `VanityURLSettings.tsx`: `umbra.app/c/`

2. **No Deep Link Handler**: No route exists to handle `/invite/[code]` URLs
   - App scheme `umbra://` is configured but not used for invites
   - No web URL handler for `umbra.chat/invite/[code]`

3. **No Auth State Persistence**: Unauthenticated users lose the invite context during signup
   - No mechanism to store pending invite code
   - No redirect back to invite after account creation

4. **No In-Chat Link Preview**: Community invite links appear as plain text
   - No rich preview card with community info
   - No inline "Join" button

## Implementation Plan

### Phase 1: Fix Domain & Base URL

**Goal**: Change all invite URLs to use `umbra.chat`

#### 1.1 Update Wisp InviteManager Component

**File**: `node_modules/@coexist/wisp-react-native/src/components/invite-manager/InviteManager.tsx`

```typescript
// Change line 253 from:
baseUrl = 'https://umbra.app/invite/',

// To:
baseUrl = 'https://umbra.chat/invite/',
```

#### 1.2 Update Wisp VanityURLSettings Component

**File**: `node_modules/@coexist/wisp-react-native/src/components/vanity-url-settings/VanityURLSettings.tsx`

Update the default vanity URL base from `umbra.app/c/` to `umbra.chat/c/`.

#### 1.3 Pass baseUrl from CommunityInvitePanel

**File**: `components/community/CommunityInvitePanel.tsx`

```typescript
const INVITE_BASE_URL = 'https://umbra.chat/invite/';
const VANITY_BASE_URL = 'umbra.chat/c/';

// In the component:
return (
  <InviteManager
    invites={links}
    baseUrl={INVITE_BASE_URL}
    // ... other props
  />
);
```

---

### Phase 2: Create Invite Route & Deep Linking

**Goal**: Handle invite URLs and route users appropriately

#### 2.1 Create Invite Page Route

**File**: `app/invite/[code].tsx` (NEW)

```typescript
/**
 * Community Invite Handler
 *
 * Routes:
 * - Web: https://umbra.chat/invite/[code]
 * - Deep link: umbra://invite/[code]
 *
 * Flow:
 * 1. Parse invite code from URL
 * 2. Fetch invite/community info from backend
 * 3. If authenticated: show accept modal
 * 4. If unauthenticated: store code, redirect to auth
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { InviteAcceptModal } from '@/components/community/InviteAcceptModal';
import { usePendingInvite } from '@/hooks/usePendingInvite';

export default function InvitePage() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { isAuthenticated } = useAuth();
  const { setPendingInvite } = usePendingInvite();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!code) return;

    if (isAuthenticated) {
      // Show acceptance modal
      setShowModal(true);
    } else {
      // Store invite code and redirect to auth
      setPendingInvite(code);
      router.replace('/(auth)');
    }
  }, [code, isAuthenticated]);

  if (!isAuthenticated) {
    return null; // Redirecting to auth
  }

  return (
    <View style={{ flex: 1 }}>
      <InviteAcceptModal
        open={showModal}
        inviteCode={code}
        onClose={() => {
          setShowModal(false);
          router.replace('/(main)');
        }}
        onAccepted={(communityId) => {
          router.replace(`/(main)/community/${communityId}`);
        }}
      />
    </View>
  );
}
```

#### 2.2 Configure Web URL Handling

**File**: `app.json`

```json
{
  "expo": {
    "scheme": "umbra",
    "web": {
      "bundler": "metro",
      "output": "static"
    },
    "plugins": [
      "expo-router",
      [
        "expo-linking",
        {
          "origin": "https://umbra.chat"
        }
      ]
    ]
  }
}
```

#### 2.3 Add Linking Configuration

**File**: `app/_layout.tsx`

```typescript
import * as Linking from 'expo-linking';

// In RootLayout:
useEffect(() => {
  // Handle initial URL (app opened via link)
  Linking.getInitialURL().then((url) => {
    if (url) handleDeepLink(url);
  });

  // Handle URL while app is open
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url);
  });

  return () => subscription.remove();
}, []);

function handleDeepLink(url: string) {
  const parsed = Linking.parse(url);
  if (parsed.path?.startsWith('invite/')) {
    const code = parsed.path.replace('invite/', '');
    router.push(`/invite/${code}`);
  }
}
```

---

### Phase 3: Pending Invite State Management

**Goal**: Persist invite code through auth flow

#### 3.1 Create Pending Invite Hook

**File**: `hooks/usePendingInvite.ts` (NEW)

```typescript
/**
 * Manages pending invite state across auth flow.
 *
 * When an unauthenticated user clicks an invite link:
 * 1. Store the invite code in AsyncStorage
 * 2. Redirect to auth
 * 3. After auth completes, retrieve and clear the code
 * 4. Auto-join the community
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INVITE_KEY = '@umbra/pending_invite';

export interface PendingInvite {
  code: string;
  timestamp: number;
}

export function usePendingInvite() {
  const [pendingInvite, setPendingInviteState] = useState<PendingInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load on mount
  useEffect(() => {
    AsyncStorage.getItem(PENDING_INVITE_KEY)
      .then((value) => {
        if (value) {
          const parsed = JSON.parse(value) as PendingInvite;
          // Expire after 1 hour
          if (Date.now() - parsed.timestamp < 3600000) {
            setPendingInviteState(parsed);
          } else {
            AsyncStorage.removeItem(PENDING_INVITE_KEY);
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setPendingInvite = useCallback(async (code: string) => {
    const invite: PendingInvite = { code, timestamp: Date.now() };
    await AsyncStorage.setItem(PENDING_INVITE_KEY, JSON.stringify(invite));
    setPendingInviteState(invite);
  }, []);

  const clearPendingInvite = useCallback(async () => {
    await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    setPendingInviteState(null);
  }, []);

  const consumePendingInvite = useCallback(async (): Promise<string | null> => {
    if (!pendingInvite) return null;
    const code = pendingInvite.code;
    await clearPendingInvite();
    return code;
  }, [pendingInvite, clearPendingInvite]);

  return {
    pendingInvite,
    isLoading,
    setPendingInvite,
    clearPendingInvite,
    consumePendingInvite,
  };
}
```

#### 3.2 Handle Pending Invite After Auth

**File**: `app/_layout.tsx` (modify AuthGate)

```typescript
function AuthGate() {
  const { isAuthenticated } = useAuth();
  const { pendingInvite, consumePendingInvite, isLoading: inviteLoading } = usePendingInvite();
  const router = useRouter();

  // After authentication, check for pending invite
  useEffect(() => {
    if (!isAuthenticated || inviteLoading) return;

    if (pendingInvite) {
      consumePendingInvite().then((code) => {
        if (code) {
          router.push(`/invite/${code}`);
        }
      });
    }
  }, [isAuthenticated, inviteLoading, pendingInvite]);

  // ... rest of AuthGate
}
```

---

### Phase 4: Invite Accept Modal

**Goal**: Show a modal for authenticated users to accept invites

#### 4.1 Create InviteAcceptModal Component

**File**: `components/community/InviteAcceptModal.tsx` (NEW)

```typescript
/**
 * Modal shown when an authenticated user opens an invite link.
 *
 * Displays:
 * - Community name and icon
 * - Member count
 * - Invite creator info
 * - Accept/Decline buttons
 */

import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { Dialog, Text, Button, VStack, HStack, Avatar } from '@coexist/wisp-react-native';
import { UmbraService } from '@umbra/service';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityInvites } from '@/hooks/useCommunityInvites';

interface InviteInfo {
  communityId: string;
  communityName: string;
  communityIcon?: string;
  memberCount: number;
  creatorNickname?: string;
  alreadyMember: boolean;
}

interface InviteAcceptModalProps {
  open: boolean;
  inviteCode: string;
  onClose: () => void;
  onAccepted: (communityId: string) => void;
}

export function InviteAcceptModal({
  open,
  inviteCode,
  onClose,
  onAccepted,
}: InviteAcceptModalProps) {
  const { identity } = useAuth();
  const { useInvite } = useCommunityInvites(null);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch invite info on mount
  useEffect(() => {
    if (!open || !inviteCode) return;

    setIsLoading(true);
    setError(null);

    // TODO: Add API to fetch invite preview info
    // For now, we'll try to use the invite directly
    UmbraService.getInvitePreview(inviteCode)
      .then((info) => {
        setInviteInfo(info);
      })
      .catch((err) => {
        setError(err.message || 'Invalid or expired invite');
      })
      .finally(() => setIsLoading(false));
  }, [open, inviteCode]);

  const handleAccept = async () => {
    if (!identity?.did || !inviteCode) return;

    setIsAccepting(true);
    setError(null);

    try {
      const communityId = await useInvite(inviteCode);
      if (communityId) {
        onAccepted(communityId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join community');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Content>
        <VStack gap="lg" style={{ alignItems: 'center', padding: 24 }}>
          {isLoading ? (
            <Text>Loading invite...</Text>
          ) : error ? (
            <>
              <Text color="error">{error}</Text>
              <Button variant="secondary" onPress={onClose}>
                Close
              </Button>
            </>
          ) : inviteInfo?.alreadyMember ? (
            <>
              <Avatar
                src={inviteInfo.communityIcon}
                name={inviteInfo.communityName}
                size="xl"
              />
              <Text size="xl" weight="bold">
                {inviteInfo.communityName}
              </Text>
              <Text color="secondary">
                You're already a member of this community
              </Text>
              <Button
                variant="primary"
                onPress={() => onAccepted(inviteInfo.communityId)}
              >
                Go to Community
              </Button>
            </>
          ) : (
            <>
              <Avatar
                src={inviteInfo?.communityIcon}
                name={inviteInfo?.communityName}
                size="xl"
              />
              <Text size="xl" weight="bold">
                {inviteInfo?.communityName}
              </Text>
              <Text color="secondary">
                {inviteInfo?.memberCount} members
              </Text>
              {inviteInfo?.creatorNickname && (
                <Text size="sm" color="muted">
                  Invited by {inviteInfo.creatorNickname}
                </Text>
              )}
              <HStack gap="md" style={{ marginTop: 16 }}>
                <Button
                  variant="secondary"
                  onPress={onClose}
                  disabled={isAccepting}
                >
                  Decline
                </Button>
                <Button
                  variant="primary"
                  onPress={handleAccept}
                  loading={isAccepting}
                >
                  Accept Invite
                </Button>
              </HStack>
            </>
          )}
        </VStack>
      </Dialog.Content>
    </Dialog>
  );
}
```

#### 4.2 Add Invite Preview API

**File**: `packages/umbra-service/src/community.ts`

```typescript
/**
 * Get preview information for an invite code without using it.
 */
export async function getInvitePreview(code: string): Promise<{
  communityId: string;
  communityName: string;
  communityIcon?: string;
  memberCount: number;
  creatorNickname?: string;
  alreadyMember: boolean;
}> {
  const result = await communityModule.getInvitePreview(code);
  return result;
}
```

**File**: `packages/umbra-core/src/community/invites.rs`

```rust
/// Get preview information for an invite without consuming it.
pub fn get_invite_preview(
    &self,
    code: &str,
    viewer_did: Option<&str>,
) -> Result<InvitePreview> {
    let invite = self.db().get_community_invite_by_code(code)?
        .ok_or(Error::InviteNotFound)?;

    // Check expiration
    if let Some(expires_at) = invite.expires_at {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        if now > expires_at {
            return Err(Error::InviteExpired);
        }
    }

    // Check max uses
    if let Some(max_uses) = invite.max_uses {
        if invite.use_count >= max_uses {
            return Err(Error::InviteMaxUsesReached);
        }
    }

    let community = self.db().get_community(&invite.community_id)?
        .ok_or(Error::CommunityNotFound)?;

    let member_count = self.db().get_community_member_count(&invite.community_id)?;

    let already_member = viewer_did
        .map(|did| self.db().is_community_member(&invite.community_id, did).unwrap_or(false))
        .unwrap_or(false);

    let creator = self.db().get_community_member(&invite.community_id, &invite.creator_did)?;

    Ok(InvitePreview {
        community_id: invite.community_id,
        community_name: community.name,
        community_icon: community.icon,
        member_count,
        creator_nickname: creator.map(|m| m.nickname),
        already_member,
    })
}
```

---

### Phase 5: In-Chat Invite Link Preview

**Goal**: Render rich previews for invite links in conversations

#### 5.1 Create InviteLinkPreview Component

**File**: `components/chat/InviteLinkPreview.tsx` (NEW)

```typescript
/**
 * Rich preview card for community invite links in chat.
 *
 * Detects umbra.chat/invite/[code] URLs and renders:
 * - Community avatar and name
 * - Member count
 * - Join button (or "Joined" badge if already member)
 */

import React, { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text, Avatar, Button, Card, HStack, Badge } from '@coexist/wisp-react-native';
import { UmbraService } from '@umbra/service';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityInvites } from '@/hooks/useCommunityInvites';
import { useRouter } from 'expo-router';

interface InviteLinkPreviewProps {
  url: string;
}

const INVITE_URL_REGEX = /^https?:\/\/umbra\.chat\/invite\/([a-zA-Z0-9]+)$/;

export function InviteLinkPreview({ url }: InviteLinkPreviewProps) {
  const match = url.match(INVITE_URL_REGEX);
  const code = match?.[1];
  const { identity } = useAuth();
  const { useInvite } = useCommunityInvites(null);
  const router = useRouter();

  const [preview, setPreview] = useState<{
    communityId: string;
    communityName: string;
    communityIcon?: string;
    memberCount: number;
    alreadyMember: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    setIsLoading(true);
    UmbraService.getInvitePreview(code)
      .then(setPreview)
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [code]);

  if (!code) return null;

  const handleJoin = async () => {
    if (!identity?.did) return;

    setIsJoining(true);
    try {
      const communityId = await useInvite(code);
      if (communityId) {
        router.push(`/(main)/community/${communityId}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleGoToCommunity = () => {
    if (preview?.communityId) {
      router.push(`/(main)/community/${preview.communityId}`);
    }
  };

  if (isLoading) {
    return (
      <Card variant="outlined" padding="md" style={{ marginTop: 8 }}>
        <Text color="muted">Loading invite preview...</Text>
      </Card>
    );
  }

  if (error || !preview) {
    return (
      <Card variant="outlined" padding="md" style={{ marginTop: 8 }}>
        <Text color="error">{error || 'Invalid invite'}</Text>
      </Card>
    );
  }

  return (
    <Card variant="outlined" padding="md" style={{ marginTop: 8 }}>
      <Pressable onPress={preview.alreadyMember ? handleGoToCommunity : undefined}>
        <HStack gap="md" style={{ alignItems: 'center' }}>
          <Avatar
            src={preview.communityIcon}
            name={preview.communityName}
            size="md"
          />
          <View style={{ flex: 1 }}>
            <Text weight="semibold">{preview.communityName}</Text>
            <Text size="sm" color="secondary">
              {preview.memberCount} members
            </Text>
          </View>
          {preview.alreadyMember ? (
            <Badge variant="success" size="sm">Joined</Badge>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onPress={handleJoin}
              loading={isJoining}
            >
              Join
            </Button>
          )}
        </HStack>
      </Pressable>
    </Card>
  );
}

/**
 * Check if a URL is an Umbra invite link.
 */
export function isInviteLink(url: string): boolean {
  return INVITE_URL_REGEX.test(url);
}
```

#### 5.2 Integrate into Message Rendering

The Wisp `ChatBubble` component handles message rendering. We need to either:

**Option A**: Extend ChatBubble to detect and render invite links
**Option B**: Post-process messages to extract and render previews

**Recommended**: Option B - Create a wrapper that detects links

**File**: `components/chat/MessageWithPreviews.tsx` (NEW)

```typescript
/**
 * Wrapper around chat messages that detects and renders link previews.
 */

import React, { useMemo } from 'react';
import { View } from 'react-native';
import { InviteLinkPreview, isInviteLink } from './InviteLinkPreview';

interface MessageWithPreviewsProps {
  content: string;
  children: React.ReactNode;
}

const URL_REGEX = /https?:\/\/[^\s<]+/g;

export function MessageWithPreviews({ content, children }: MessageWithPreviewsProps) {
  const inviteLinks = useMemo(() => {
    const urls = content.match(URL_REGEX) || [];
    return urls.filter(isInviteLink);
  }, [content]);

  return (
    <View>
      {children}
      {inviteLinks.map((url, i) => (
        <InviteLinkPreview key={`${url}-${i}`} url={url} />
      ))}
    </View>
  );
}
```

---

### Phase 6: Backend Relay Support (Optional)

**Goal**: Allow invite preview fetching without requiring local database

For web-based link previews (Open Graph) and cross-device preview fetching, add relay endpoints.

#### 6.1 Add Invite Preview Endpoint

**File**: `packages/umbra-relay/src/routes/invite.rs` (NEW)

```rust
/// GET /invite/:code/preview
///
/// Returns public preview info for an invite without consuming it.
/// Used for:
/// - Link preview cards in chat
/// - Open Graph meta tags
/// - Pre-auth invite validation
pub async fn get_invite_preview(
    Path(code): Path<String>,
) -> Result<Json<InvitePreviewResponse>, StatusCode> {
    // This would require communities to be synced to relay
    // or a p2p request to the community owner
    //
    // For MVP: Return 501 Not Implemented
    // Full implementation requires community data on relay
    Err(StatusCode::NOT_IMPLEMENTED)
}
```

---

## File Summary

### New Files

| File | Description |
|------|-------------|
| `app/invite/[code].tsx` | Invite route handler |
| `hooks/usePendingInvite.ts` | Pending invite state management |
| `components/community/InviteAcceptModal.tsx` | Accept invite modal |
| `components/chat/InviteLinkPreview.tsx` | In-chat link preview |
| `components/chat/MessageWithPreviews.tsx` | Message wrapper with previews |

### Modified Files

| File | Changes |
|------|---------|
| `components/community/CommunityInvitePanel.tsx` | Pass `baseUrl` prop |
| `app/_layout.tsx` | Add deep link handling, pending invite check |
| `app.json` | Add expo-linking config |
| `packages/umbra-service/src/community.ts` | Add `getInvitePreview()` |
| `packages/umbra-core/src/community/invites.rs` | Add `get_invite_preview()` |
| Wisp `InviteManager.tsx` | Update default `baseUrl` |

### Wisp Package Changes

The following changes need to be made to the Wisp design system:

1. `InviteManager.tsx`: Change default `baseUrl` from `umbra.app` to `umbra.chat`
2. `VanityURLSettings.tsx`: Update vanity URL base domain

---

## User Flow Diagrams

### Authenticated User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User clicks invite link                       │
│              https://umbra.chat/invite/abc123                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    App opens /invite/abc123                      │
│                    Check: isAuthenticated?                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ YES
┌─────────────────────────────────────────────────────────────────┐
│                    Show InviteAcceptModal                        │
│                    - Fetch invite preview                        │
│                    - Display community info                      │
│                    - Accept / Decline buttons                    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│     User clicks         │     │     User clicks         │
│       "Accept"          │     │       "Decline"         │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  Call useCommunityInvite│     │  Close modal            │
│  Navigate to community  │     │  Return to previous     │
└─────────────────────────┘     └─────────────────────────┘
```

### Unauthenticated User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User clicks invite link                       │
│              https://umbra.chat/invite/abc123                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    App opens /invite/abc123                      │
│                    Check: isAuthenticated?                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ NO
┌─────────────────────────────────────────────────────────────────┐
│                    Store invite code                             │
│                    AsyncStorage: @umbra/pending_invite           │
│                    Redirect to /(auth)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Auth Screen                                   │
│                    Create / Import Wallet                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Auth completes                                │
│                    AuthGate detects pendingInvite                │
│                    Consumes and redirects to /invite/abc123      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Show InviteAcceptModal                        │
│                    (Same as authenticated flow)                  │
└─────────────────────────────────────────────────────────────────┘
```

### In-Chat Link Preview

```
┌─────────────────────────────────────────────────────────────────┐
│  Message: "Join our community! https://umbra.chat/invite/xyz"   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MessageWithPreviews                           │
│                    - Detects invite URL                          │
│                    - Renders InviteLinkPreview                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [Avatar]  My Cool Community                    [Join]     │ │
│  │            42 members                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Domain Fix
- [ ] Invite URLs generated use `umbra.chat` domain
- [ ] Vanity URLs use `umbra.chat/c/` format
- [ ] Copied URLs are correct

### Deep Linking
- [ ] Web URL `umbra.chat/invite/[code]` routes correctly
- [ ] Native deep link `umbra://invite/[code]` works
- [ ] Invalid codes show appropriate error

### Auth Flow
- [ ] Unauthenticated user stores pending invite
- [ ] After signup, user is redirected to invite
- [ ] After import, user is redirected to invite
- [ ] Pending invite expires after 1 hour

### Accept Modal
- [ ] Shows community name and icon
- [ ] Shows member count
- [ ] Accept button joins community
- [ ] Decline button closes modal
- [ ] Already member shows "Go to Community"

### Link Preview
- [ ] Invite links in chat show preview card
- [ ] Preview shows community info
- [ ] Join button works from preview
- [ ] "Joined" badge shows for members
- [ ] Multiple invite links in one message work

---

## Security Considerations

1. **Invite Code Validation**: Always validate invite codes on the backend
2. **Rate Limiting**: Prevent invite code enumeration attacks
3. **Expiry Checking**: Server-side expiry validation, not just client
4. **Ban Checking**: Verify user isn't banned before allowing join
5. **Pending Invite TTL**: Expire stored invite codes after 1 hour

---

## Future Enhancements

1. **Open Graph Tags**: Generate meta tags for link previews on social media
2. **QR Codes**: Generate scannable invite QR codes
3. **Invite Analytics**: Track invite usage and conversion rates
4. **Custom Invite Pages**: Branded landing pages for communities
5. **Relay-Based Preview**: Fetch preview from relay for cross-device support
