# Community Invite & Onboarding Flow

## Overview

Make community invites work end-to-end on **desktop (Tauri)** and **mobile (React Native/Expo)**. Currently, the entire backend is implemented (DB schema, Rust handlers, TypeScript service, hooks, UI management panel) but there is no way to actually *use* an invite link — clicking one does nothing because there is no route, no deep link handler, and no join-via-code UI.

## Current State

### What Works
- **Invite CRUD**: Create, list, delete invites via `CommunitySettingsDialog > Invites` tab
- **Backend**: `community_invite_create`, `community_invite_use`, `community_invite_list`, `community_invite_delete`, `community_invite_set_vanity` — all fully implemented in Rust dispatcher + WASM + RN backend + Tauri backend
- **Hook**: `useCommunityInvites(communityId)` with real-time event updates
- **Invite Panel**: `CommunityInvitePanel` wraps Wisp `InviteManager` with copy-to-clipboard
- **Vanity URLs**: Custom invite codes supported

### What's Broken/Missing
1. **Wrong domain**: Wisp `InviteManager` defaults `baseUrl` to `https://umbra.app/invite/` — should be `https://umbra.chat/invite/`
2. **No invite route**: No `app/invite/[code].tsx` page exists — invite URLs lead nowhere
3. **No deep link handler**: `app/_layout.tsx` has no `Linking` listener for `umbra://invite/CODE`
4. **No join-via-code UI**: No modal/page for an authenticated user to paste/receive an invite code and join
5. **No pending invite persistence**: Unauthenticated users who click an invite link lose the code during auth
6. **No invite preview API**: Can't show community name/icon before joining (community data is local-only)
7. **Tauri protocol handler**: Desktop has no `umbra://` protocol registration

### Key Architecture Constraint

Community and invite data is stored **locally per-user**. When User A creates a community and an invite, that data lives only in User A's DB. User B doesn't have it. The `use_invite(code)` function does a local DB lookup — so **the invite record must already exist in the joiner's local DB** for `use_invite` to work.

This means the MVP invite flow requires the **community owner to relay the invite data** to the invitee alongside the code. Two approaches:

- **Option A (MVP)**: The invite code is sent alongside community metadata via relay message. When the invitee opens the link, the app first stores the relayed community + invite data, then calls `use_invite`.
- **Option B (Future)**: A relay HTTP endpoint resolves invite codes server-side, returning community preview data.

For this plan, we use **Option A** for the same-app flow (paste code / click link while app is running) and defer Option B to a future phase.

---

## Implementation Plan

### Phase 1: Fix Base URL + Pass `baseUrl` Prop

**Goal**: Generated invite URLs use `umbra.chat` instead of `umbra.app`

#### Task 1.1 — Update Wisp `InviteManager` default

**File**: `node_modules/@coexist/wisp-react-native/src/components/invite-manager/InviteManager.tsx`

Change the default prop:
```typescript
// From:
baseUrl = 'https://umbra.app/invite/',
// To:
baseUrl = 'https://umbra.chat/invite/',
```

> **Note**: This is a Wisp package change. Publish a new Wisp version, or apply via patch-package.

#### Task 1.2 — Pass `baseUrl` from `CommunityInvitePanel`

**File**: `components/community/CommunityInvitePanel.tsx`

Add explicit `baseUrl` prop to avoid depending on the Wisp default:
```typescript
const INVITE_BASE_URL = 'https://umbra.chat/invite/';

return (
  <InviteManager
    invites={links}
    baseUrl={INVITE_BASE_URL}
    // ... existing props
  />
);
```

**Acceptance**: Copying an invite URL produces `https://umbra.chat/invite/abc12def`.

---

### Phase 2: Join-via-Code UI (In-App)

**Goal**: Let users paste an invite code to join a community without needing deep links

This is the simplest path to a working invite system. Before deep links, users can share codes in chat and paste them.

#### Task 2.1 — Create `JoinCommunityModal` component

**File**: `components/community/JoinCommunityModal.tsx` (NEW)

A modal dialog with:
- Text input for paste-an-invite-code
- "Join" button that calls `service.useCommunityInvite(code, identity.did, displayName)`
- Loading state while joining
- Error states: invalid code, expired, max uses reached, already member, community not found
- Success: navigates to the community page

```typescript
interface JoinCommunityModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-filled invite code (from deep link or paste) */
  initialCode?: string;
}
```

**Error handling for "community not found" (the local-DB constraint)**:
When `use_invite` fails because the community/invite data doesn't exist locally, show a message like:
> "This invite couldn't be resolved. Ask the community owner to send you a direct invitation from within the app."

This is the MVP fallback. In Phase 5, we add relay-based invite resolution.

#### Task 2.2 — Add "Join Community" button to community list

**File**: `components/sidebar/CommunitySidebar.tsx` (or wherever the community list is rendered)

Add a `+` / "Join" button at the bottom of the community list that opens `JoinCommunityModal`.

**Acceptance**: User pastes an invite code → joins the community → navigated to community page.

---

### Phase 3: Invite Route + Deep Linking

**Goal**: Handle `umbra://invite/CODE` and `https://umbra.chat/invite/CODE` URLs

#### Task 3.1 — Create invite route page

**File**: `app/invite/[code].tsx` (NEW)

```typescript
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { JoinCommunityModal } from '@/components/community/JoinCommunityModal';

export default function InvitePage() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  if (!isAuthenticated) {
    // Will be handled by AuthGate redirect + pending invite (Phase 4)
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <JoinCommunityModal
        open
        initialCode={code}
        onClose={() => router.replace('/(main)')}
      />
    </View>
  );
}
```

#### Task 3.2 — Add deep link handling to root layout

**File**: `app/_layout.tsx`

Add Linking listener in `AuthGate` (or a new `DeepLinkHandler` component):

```typescript
import * as Linking from 'expo-linking';

// Inside AuthGate:
useEffect(() => {
  const handleUrl = ({ url }: { url: string }) => {
    const parsed = Linking.parse(url);
    // Handle: umbra://invite/CODE or https://umbra.chat/invite/CODE
    if (parsed.path?.startsWith('invite/')) {
      const code = parsed.path.replace('invite/', '');
      if (code) router.push(`/invite/${code}`);
    }
  };

  // Handle URL that launched the app
  Linking.getInitialURL().then((url) => {
    if (url) handleUrl({ url });
  });

  // Handle URLs while app is running
  const sub = Linking.addEventListener('url', handleUrl);
  return () => sub.remove();
}, []);
```

#### Task 3.3 — Configure Tauri deep link protocol

**File**: `src-tauri/tauri.conf.json`

Add deep link plugin configuration:
```json
{
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["umbra"]
      }
    }
  }
}
```

**File**: `src-tauri/Cargo.toml` — Add `tauri-plugin-deep-link`

**File**: `src-tauri/src/lib.rs` — Register the plugin and forward URLs to the webview

#### Task 3.4 — Configure iOS universal links (mobile)

**File**: `app.json`

Add associated domains for iOS:
```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:umbra.chat"]
    }
  }
}
```

**Server-side**: Deploy `/.well-known/apple-app-site-association` on `umbra.chat`:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.anonymous.Umbra",
      "paths": ["/invite/*"]
    }]
  }
}
```

**Acceptance**: Clicking `umbra://invite/abc12def` opens the app → shows `JoinCommunityModal` with code pre-filled → joining works.

---

### Phase 4: Pending Invite (Auth Flow Persistence)

**Goal**: If an unauthenticated user clicks an invite link, preserve the code through signup

#### Task 4.1 — Create `usePendingInvite` hook

**File**: `hooks/usePendingInvite.ts` (NEW)

```typescript
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const PENDING_INVITE_KEY = '@umbra/pending_invite';

export function usePendingInvite() {
  const [pendingCode, setPendingCodeState] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const code = localStorage.getItem(PENDING_INVITE_KEY);
      setPendingCodeState(code);
      setIsLoaded(true);
    } else {
      AsyncStorage.getItem(PENDING_INVITE_KEY)
        .then((code) => setPendingCodeState(code))
        .finally(() => setIsLoaded(true));
    }
  }, []);

  const setPendingCode = useCallback(async (code: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(PENDING_INVITE_KEY, code);
    } else {
      await AsyncStorage.setItem(PENDING_INVITE_KEY, code);
    }
    setPendingCodeState(code);
  }, []);

  const consumePendingCode = useCallback(async (): Promise<string | null> => {
    const code = pendingCode;
    if (Platform.OS === 'web') {
      localStorage.removeItem(PENDING_INVITE_KEY);
    } else {
      await AsyncStorage.removeItem(PENDING_INVITE_KEY);
    }
    setPendingCodeState(null);
    return code;
  }, [pendingCode]);

  return { pendingCode, isLoaded, setPendingCode, consumePendingCode };
}
```

#### Task 4.2 — Wire pending invite into `AuthGate`

**File**: `app/_layout.tsx`

In AuthGate, after authentication completes + WASM is ready, check for pending invite:

```typescript
const { pendingCode, isLoaded: inviteLoaded, consumePendingCode } = usePendingInvite();

useEffect(() => {
  if (!isAuthenticated || !isReady || !inviteLoaded || !pendingCode) return;
  consumePendingCode().then((code) => {
    if (code) router.push(`/invite/${code}`);
  });
}, [isAuthenticated, isReady, inviteLoaded, pendingCode]);
```

#### Task 4.3 — Store pending invite on unauthenticated deep link

**File**: `app/invite/[code].tsx`

When the invite page loads for an unauthenticated user:
```typescript
useEffect(() => {
  if (!isAuthenticated && code) {
    setPendingCode(code);
    router.replace('/(auth)');
  }
}, [isAuthenticated, code]);
```

**Acceptance**: Unauthenticated user clicks invite link → redirected to auth → creates account → automatically redirected to invite join flow.

---

### Phase 5: Relay-Based Invite Resolution (Future)

**Goal**: Allow users to join communities they don't have locally via relay lookup

This phase is needed for the invite system to work fully — without it, `use_invite` fails if the community data isn't already in the joiner's local DB.

#### Task 5.1 — Add `invite_preview` dispatcher method

**Files**:
- `packages/umbra-core/src/community/invites.rs` — Add `get_invite_preview()` method
- `packages/umbra-core/src/ffi/dispatch_community.rs` — Add `community_invite_preview` match arm
- `packages/umbra-core/src/ffi/dispatcher.rs` — Add route
- `packages/umbra-core/src/ffi/wasm.rs` — Add WASM binding
- `packages/umbra-wasm/rn-backend.ts` — Add RN backend binding
- `packages/umbra-wasm/tauri-backend.ts` — Add Tauri backend binding
- `packages/umbra-service/src/community.ts` — Add `getInvitePreview()` TS function

The preview returns: `{ community_id, community_name, community_icon, member_count, already_member }`.

This works when the community data exists locally. For non-local communities, returns an error that the UI handles gracefully.

#### Task 5.2 — Add relay invite resolution endpoint

The relay server needs a new endpoint that community owners can register their invites with, allowing remote preview/resolution. This requires:

1. Community owners push invite metadata to relay when creating invites
2. Relay stores: `{ code, community_name, community_icon, member_count, owner_did }`
3. `GET /api/invite/:code` returns preview data
4. `POST /api/invite/:code/use` forwards join request to community owner via relay

This is a significant server-side addition and should be planned separately.

#### Task 5.3 — Relay-based community data sync on invite use

When a user successfully uses an invite via relay, the community owner needs to:
1. Send the full community structure (spaces, categories, channels, roles) to the new member
2. The new member's client stores this data locally
3. Then the member can interact with the community

---

### Phase 6: In-Chat Link Preview (Optional Enhancement)

**Goal**: Show rich invite previews when invite URLs are sent in DMs or community channels

#### Task 6.1 — Create `InviteLinkPreview` component

**File**: `components/chat/InviteLinkPreview.tsx` (NEW)

Detects `umbra.chat/invite/CODE` URLs in messages and renders a card with community info + Join button.

#### Task 6.2 — Integrate with message rendering

Wrap message content rendering to detect and render invite link previews inline.

---

## File Summary

### New Files (Phases 1–4)
| File | Phase | Description |
|------|-------|-------------|
| `components/community/JoinCommunityModal.tsx` | 2 | Paste-code-to-join modal |
| `app/invite/[code].tsx` | 3 | Deep link route handler |
| `hooks/usePendingInvite.ts` | 4 | Auth flow invite persistence |

### Modified Files (Phases 1–4)
| File | Phase | Changes |
|------|-------|---------|
| `components/community/CommunityInvitePanel.tsx` | 1 | Add `baseUrl` prop |
| Wisp `InviteManager.tsx` (via patch) | 1 | Fix default domain |
| Community sidebar component | 2 | Add "Join" button |
| `app/_layout.tsx` | 3, 4 | Deep link handler + pending invite consumption |
| `src-tauri/tauri.conf.json` | 3 | Protocol handler config |
| `src-tauri/Cargo.toml` | 3 | Deep link plugin dependency |
| `src-tauri/src/lib.rs` | 3 | Register deep link plugin |
| `app.json` | 3 | iOS associated domains |

---

## Testing Checklist

### Phase 1 — Domain Fix
- [ ] Copying an invite URL produces `https://umbra.chat/invite/CODE`
- [ ] Vanity URL displays use `umbra.chat/c/` prefix

### Phase 2 — Join via Code
- [ ] Open "Join Community" modal from community list
- [ ] Paste valid invite code → join succeeds → navigated to community
- [ ] Invalid code → shows "invite not found" error
- [ ] Expired code → shows "invite expired" error
- [ ] Max uses reached → shows appropriate error
- [ ] Already a member → shows "already a member" message

### Phase 3 — Deep Linking
- [ ] `umbra://invite/CODE` opens app and shows join modal (mobile)
- [ ] Desktop protocol handler opens join flow
- [ ] Web URL `https://umbra.chat/invite/CODE` routes correctly

### Phase 4 — Pending Invite
- [ ] Unauthenticated click → stored → auth → auto-redirected to join
- [ ] Pending invite cleared after consumption
- [ ] Stale pending invites don't interfere

---

## Security Considerations

1. **Rate limit invite usage**: Prevent brute-force code enumeration
2. **Validate server-side**: Expiry and max-uses checked in Rust, not just UI
3. **Ban check**: `join_community` already checks ban list
4. **Pending invite TTL**: Clear stale pending invites after 1 hour
5. **Invite code entropy**: 8 chars from 36-char alphabet = ~41 bits — acceptable for non-security-critical codes
