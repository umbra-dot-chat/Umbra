# Umbra UI Components Guide

This guide outlines the UI components needed to build a complete Umbra messaging app frontend. The umbra-core library provides all the backend functionality through FFI bindings.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND APP                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │   Screens   │  │ Components  │  │   Services  │                 │
│  │             │  │             │  │             │                 │
│  │ - Onboard   │  │ - Messages  │  │ - Core API  │                 │
│  │ - Chat      │  │ - Contacts  │  │ - Storage   │                 │
│  │ - Profile   │  │ - QR/Share  │  │ - Events    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
│                           │                                         │
│                           ▼                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              Platform Bindings                               │   │
│  │  iOS: Swift + C FFI  │  Android: Kotlin + JNI  │  Web: WASM │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                           │                                         │
└───────────────────────────┼─────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       UMBRA CORE                                     │
│  Identity │ Friends │ Messaging │ Network │ Storage                 │
└─────────────────────────────────────────────────────────────────────┘
```

## Required Screens

### 1. Onboarding Flow

#### 1.1 Welcome Screen
- App logo and branding
- "Create New Identity" button
- "Restore from Recovery Phrase" button
- Brief description of the app

#### 1.2 Create Identity Screen
- Display name input field (required)
- "Create" button
- Loading indicator during creation

**Core API:**
```typescript
const result = umbra_identity_create(displayName);
// Returns: { did: string, recovery_phrase: string }
```

#### 1.3 Recovery Phrase Display Screen
- Display 24-word recovery phrase in a secure format
- "I've written it down" checkbox
- Copy to clipboard option (with warning)
- Continue button (disabled until checkbox checked)

**Security Note:** Never store recovery phrase. Show only once.

#### 1.4 Restore Identity Screen
- 24-word input (auto-complete word suggestions)
- Display name input
- "Restore" button
- Validation feedback

**Core API:**
```typescript
const did = umbra_identity_restore(recoveryPhrase, displayName);
```

---

### 2. Main App Navigation

#### 2.1 Tab Bar / Bottom Navigation
- **Chats** - Conversation list
- **Contacts** - Friends list
- **Profile** - User profile and settings

---

### 3. Chats Screen

#### 3.1 Conversation List
Components needed:
- **ConversationListItem**
  - Friend avatar (or initials)
  - Friend display name
  - Last message preview (truncated)
  - Timestamp (relative: "2m ago", "Yesterday")
  - Unread badge
  - Online indicator

- **Search bar** for filtering conversations
- **New chat** FAB or header button
- **Empty state** for no conversations

**Core API:**
```typescript
const conversations = umbra_messaging_get_conversations();
const friends = umbra_friends_list();
```

#### 3.2 Chat Screen (Conversation Detail)
Components needed:
- **Header**
  - Back button
  - Friend avatar + name
  - Online status indicator
  - Options menu (view profile, block, delete)

- **MessageList** (virtualized for performance)
  - **MessageBubble** component
    - Text content
    - Timestamp
    - Read/Delivered/Sent status
    - Sender alignment (left/right)
  - Date separators
  - Typing indicator (future)

- **MessageInput**
  - Text input field
  - Send button
  - Attachment button (future: images, files)
  - Emoji picker (optional)

**Core API:**
```typescript
const messages = umbra_messaging_get_messages(conversationId, limit, beforeId);
const result = umbra_messaging_send_text(recipientDid, text);
```

---

### 4. Contacts Screen

#### 4.1 Friends List
Components needed:
- **FriendListItem**
  - Avatar
  - Display name
  - Nickname (if set)
  - Online indicator
  - Tap to open chat

- **Section headers** (Online / Offline)
- **Search bar**
- **Add friend** button
- **Empty state** for no friends

**Core API:**
```typescript
const friends = umbra_friends_list();
```

#### 4.2 Friend Requests
Components needed:
- **FriendRequestCard**
  - Sender info (DID, display name if available)
  - Optional message
  - Accept button (green)
  - Reject button (red)
  - Timestamp

- **Tabs or segmented control:** "Received" | "Sent"

**Core API:**
```typescript
const requests = umbra_friends_pending_requests();
umbra_friends_accept_request(requestId);
umbra_friends_reject_request(requestId);
```

#### 4.3 Add Friend Screen
Components needed:
- **QR Code Scanner** (to scan friend's code)
- **QR Code Display** (your connection info)
- **Manual DID Input** field
- **Optional message** for request
- **Send Request** button

**Core API:**
```typescript
const connectionInfo = umbra_discovery_get_connection_info();
// Returns: { link, base64, json, did, peer_id, addresses, display_name }

umbra_discovery_connect_with_info(scannedInfo);
umbra_friends_send_request(did, message);
```

---

### 5. Profile Screen

#### 5.1 My Profile
Components needed:
- **Avatar** (large, editable)
- **Display Name** (editable)
- **Bio/Status** (editable)
- **DID** (copyable, truncated display)
- **Share Profile** button (generates QR/link)

**Core API:**
```typescript
const profile = umbra_identity_get_profile();
umbra_identity_update_profile({ display_name, bio, avatar_url });
```

#### 5.2 Settings
Components needed:
- **Network Status** indicator
  - Connected peers count
  - Bootstrap status
- **Privacy settings** (future)
- **Notifications settings** (future)
- **Storage management** (future)
- **About** (version info)
- **Logout / Delete Account** (destructive)

**Core API:**
```typescript
const status = umbra_network_status();
const version = umbra_version();
```

---

### 6. Sharing / QR Components

#### 6.1 QR Code Display
- Generate QR from `connection_info.base64`
- Shareable link option
- Copy link button

#### 6.2 QR Code Scanner
- Camera permission handling
- QR recognition
- Parse and validate connection info
- Error handling for invalid codes

---

## Reusable Components

### Avatars
```typescript
interface AvatarProps {
  url?: string;
  name: string;  // For initials fallback
  size: 'small' | 'medium' | 'large';
  online?: boolean;
}
```

### Message Bubbles
```typescript
interface MessageBubbleProps {
  content: string;
  timestamp: number;
  isMine: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read';
}
```

### Empty States
- No conversations
- No friends
- No messages in chat
- No friend requests

### Loading States
- Full screen spinner (initialization)
- Skeleton loaders (lists)
- Inline spinners (buttons)

### Error States
- Network error
- Invalid recovery phrase
- Failed to connect
- Message send failed

---

## State Management

### Required State
```typescript
interface AppState {
  // Auth
  isInitialized: boolean;
  identity: {
    did: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
  } | null;

  // Network
  networkStatus: {
    isRunning: boolean;
    peerId: string;
    connectedPeers: number;
    listenAddresses: string[];
  };

  // Friends
  friends: Friend[];
  friendRequests: FriendRequest[];

  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;  // conversationId -> messages
}
```

### Event Handling
Subscribe to network events for real-time updates:
```typescript
// Events to handle:
// - PeerConnected / PeerDisconnected
// - MessageReceived
// - FriendRequestReceived
// - ConnectionStatusChanged
```

---

## Platform-Specific Notes

### iOS (Swift/SwiftUI)
- Use `umbra_core.h` C header for FFI
- Bridge with Swift using `@_silgen_name`
- Consider using Swift Package for distribution

### Android (Kotlin)
- Use JNI bindings directly
- Add `UmbraCore.kt` wrapper class
- Load native library: `System.loadLibrary("umbra_core")`

### Web (TypeScript/React)
- Import WASM module
- Use `umbra_wasm_*` functions
- Handle async initialization

---

## Security Considerations

1. **Recovery Phrase** - Never store, show only during creation
2. **Biometric Auth** - Consider for unlocking app (platform native)
3. **Screen Recording** - Warn when sensitive data shown
4. **Clipboard** - Clear after copying DIDs/phrases
5. **Local Notifications** - Don't include message content

---

## Accessibility

- Screen reader support for all components
- Sufficient color contrast
- Touch targets minimum 44x44pt
- Keyboard navigation (web)
- Dynamic type support (iOS)

---

## Recommended Tech Stack

### Mobile
- **iOS:** SwiftUI + Combine
- **Android:** Jetpack Compose + Kotlin Coroutines

### Web
- **Framework:** React or SvelteKit
- **State:** Zustand or Redux Toolkit
- **Styling:** Tailwind CSS

### Cross-Platform
- **React Native** with native modules for FFI
- **Flutter** with FFI plugin
