# Account Import During Signup

**Status:** Planning
**Priority:** High
**Related:** [DISCORD_PROFILE_IMPORT.md](./migrations/DISCORD_PROFILE_IMPORT.md)

---

## Overview

Allow users to import their profile (username, avatar, status/bio) from Discord, GitHub, and other platforms during the account creation flow. This provides a seamless onboarding experience where users can quickly set up their Umbra profile using existing identity.

---

## User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 0: Create Your Profile                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Import from                                             │ │
│ │                                                         │ │
│ │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐    │ │
│ │  │ Discord │  │ GitHub  │  │ Google  │  │ Twitter │    │ │
│ │  └─────────┘  └─────────┘  └─────────┘  └─────────┘    │ │
│ │                                                         │ │
│ │ or enter manually:                                      │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Display name                                        │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│                              [Continue →]                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
            (If "Import from Discord" selected)
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ [Discord OAuth Page - opens in browser/webview]            │
│                                                             │
│ "Umbra wants to access your account"                        │
│                                                             │
│ This will allow Umbra to:                                   │
│ • Access your username and avatar                           │
│                                                             │
│ [Authorize]  [Cancel]                                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 0: Create Your Profile                                 │
│                                                             │
│ Imported from Discord ✓                    [Change]         │
│                                                             │
│  ┌────────┐  CoolUser                                       │
│  │ avatar │  "Just vibing" (bio)                           │
│  └────────┘                                                 │
│                                                             │
│ ☑ Use as display name                                       │
│ ☑ Use avatar                                                │
│ ☐ Use bio                                                   │
│                                                             │
│ Display name: [CoolUser_________________]                   │
│                                                             │
│                              [Continue →]                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Architecture Decision: Server-Side vs Client-Side OAuth

### Option A: Server-Side (Relay-Based) - Recommended

The OAuth flow is handled by `umbra-relay` which already has Discord/GitHub OAuth infrastructure.

**Pros:**
- Client secrets never exposed to frontend
- Existing OAuth infrastructure can be extended
- Works consistently across web and native
- Server can cache tokens for avatar download

**Cons:**
- Requires relay server to be running
- Additional network hop

**Flow:**
```
Client                    Relay                      Discord
  │                         │                           │
  ├──POST /profile/import/discord/start───────────────►│
  │◄─────────{redirect_url, state}─────────────────────┤
  │                         │                           │
  ├────────────────────────(redirect to Discord)───────►│
  │◄───────────────────────(user authorizes)───────────┤
  │                         │                           │
  ├──GET /profile/import/discord/callback?code=...────►│
  │                         ├──exchange code──────────►│
  │                         │◄─────access_token────────┤
  │                         ├──fetch /users/@me───────►│
  │                         │◄─────user profile────────┤
  │                         ├──download avatar────────►│
  │                         │◄─────avatar data─────────┤
  │◄─────────{profile data with avatar base64}─────────┤
```

### Option B: Client-Side Only

OAuth handled entirely in the client app.

**Pros:**
- No server dependency
- Faster iteration

**Cons:**
- Client secret must be embedded (security risk)
- Harder to handle on native (deep links, state management)
- Can't securely store tokens

**Recommendation:** Use **Option A** (Server-Side) by extending the existing umbra-relay discovery service.

---

## Implementation Plan

### Phase 1: Relay - Profile Import Endpoints

**Location:** `packages/umbra-relay/src/discovery/`

#### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/profile/import/discord/start` | Start Discord OAuth for profile import |
| GET | `/profile/import/discord/callback` | Discord OAuth callback (returns profile JSON) |
| POST | `/profile/import/github/start` | Start GitHub OAuth for profile import |
| GET | `/profile/import/github/callback` | GitHub OAuth callback (returns profile JSON) |

#### Key Difference from Account Linking

The existing `/auth/discord/*` endpoints are for **account linking** (friend discovery):
- Returns HTML success page that auto-closes
- Links account to existing DID
- Stores in discovery index

The new `/profile/import/*` endpoints are for **profile import**:
- Returns JSON with profile data
- Does NOT require a DID (user doesn't have one yet)
- Downloads and includes avatar as base64
- Includes bio/status if available

#### New Types

```rust
// types.rs

/// Profile data imported from an external platform.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportedProfile {
    /// Platform the profile was imported from.
    pub platform: Platform,
    /// Platform user ID.
    pub platform_id: String,
    /// Display name / username.
    pub display_name: String,
    /// Avatar as base64-encoded image data.
    pub avatar_base64: Option<String>,
    /// Avatar MIME type (e.g., "image/png", "image/gif").
    pub avatar_mime: Option<String>,
    /// User bio / status.
    pub bio: Option<String>,
    /// Email (if scope allows).
    pub email: Option<String>,
}

/// Response from profile import callback.
#[derive(Debug, Serialize, Deserialize)]
pub struct ProfileImportResponse {
    pub success: bool,
    pub profile: Option<ImportedProfile>,
    pub error: Option<String>,
}
```

#### Implementation: `profile_import.rs`

```rust
// New file: packages/umbra-relay/src/discovery/profile_import.rs

use axum::{
    extract::{Query, State},
    response::IntoResponse,
    Json,
};
use reqwest::Client;
use serde::Deserialize;
use uuid::Uuid;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

use crate::discovery::{
    config::DISCORD_SCOPES,
    types::{ImportedProfile, ProfileImportResponse, StartAuthResponse},
    DiscoveryConfig, DiscoveryStore, OAuthState, Platform,
};

/// Start profile import OAuth flow (no DID required).
pub async fn start_discord(
    State((store, config)): State<(DiscoveryStore, DiscoveryConfig)>,
) -> impl IntoResponse {
    let (client_id, redirect_uri) = match (
        config.discord_client_id.as_ref(),
        config.discord_profile_import_redirect_uri.as_ref(),
    ) {
        (Some(id), Some(uri)) => (id, uri),
        _ => {
            return Json(serde_json::json!({
                "error": "Discord OAuth not configured"
            }))
            .into_response();
        }
    };

    let nonce = Uuid::new_v4().to_string();

    // Store OAuth state without DID (profile import mode)
    let state = OAuthState {
        did: String::new(), // Empty = profile import mode
        nonce: nonce.clone(),
        platform: Platform::Discord,
        created_at: chrono::Utc::now(),
        profile_import: true, // New flag
    };
    store.store_oauth_state(state);

    let scopes = DISCORD_SCOPES.join("%20");
    let auth_url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&state={}",
        config.discord_auth_url(),
        client_id,
        urlencoding::encode(redirect_uri),
        scopes,
        nonce
    );

    Json(StartAuthResponse {
        redirect_url: auth_url,
        state: nonce,
    })
    .into_response()
}

/// Handle Discord callback for profile import.
pub async fn callback_discord(
    State((store, config)): State<(DiscoveryStore, DiscoveryConfig)>,
    Query(query): Query<CallbackQuery>,
) -> impl IntoResponse {
    // Validate state
    let oauth_state = match store.take_oauth_state(&query.state) {
        Some(s) if s.platform == Platform::Discord && s.profile_import => s,
        _ => {
            return Json(ProfileImportResponse {
                success: false,
                profile: None,
                error: Some("Invalid or expired state".to_string()),
            })
            .into_response();
        }
    };

    // Exchange code for token
    let client = Client::new();
    let token = match exchange_token(&client, &config, &query.code).await {
        Ok(t) => t,
        Err(e) => {
            return Json(ProfileImportResponse {
                success: false,
                profile: None,
                error: Some(e),
            })
            .into_response();
        }
    };

    // Fetch user info
    let user = match fetch_discord_user(&client, &config, &token.access_token).await {
        Ok(u) => u,
        Err(e) => {
            return Json(ProfileImportResponse {
                success: false,
                profile: None,
                error: Some(e),
            })
            .into_response();
        }
    };

    // Download avatar
    let (avatar_base64, avatar_mime) = match download_discord_avatar(&client, &user).await {
        Ok((data, mime)) => (Some(data), Some(mime)),
        Err(_) => (None, None),
    };

    let profile = ImportedProfile {
        platform: Platform::Discord,
        platform_id: user.id.clone(),
        display_name: user.global_name.unwrap_or(user.username),
        avatar_base64,
        avatar_mime,
        bio: user.bio,
        email: user.email,
    };

    Json(ProfileImportResponse {
        success: true,
        profile: Some(profile),
        error: None,
    })
    .into_response()
}

/// Download Discord avatar and return as base64.
async fn download_discord_avatar(
    client: &Client,
    user: &DiscordUser,
) -> Result<(String, String), String> {
    let avatar_url = if let Some(ref hash) = user.avatar {
        let ext = if hash.starts_with("a_") { "gif" } else { "png" };
        format!(
            "https://cdn.discordapp.com/avatars/{}/{}.{}?size=256",
            user.id, hash, ext
        )
    } else {
        // Default avatar
        let index = user.id.parse::<u64>().unwrap_or(0) % 5;
        format!("https://cdn.discordapp.com/embed/avatars/{}.png", index)
    };

    let response = client
        .get(&avatar_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/png")
        .to_string();

    let bytes = response.bytes().await.map_err(|e| e.to_string())?;
    let base64_data = BASE64.encode(&bytes);

    Ok((base64_data, content_type))
}
```

### Phase 2: Service Layer

**Location:** `packages/umbra-service/src/profile-import/`

#### Files

```
packages/umbra-service/src/profile-import/
├── index.ts        # Module exports
├── types.ts        # TypeScript types
├── api.ts          # API calls to relay
└── hooks.ts        # React hooks
```

#### Types

```typescript
// types.ts

export type ImportPlatform = 'discord' | 'github' | 'google' | 'twitter';

export interface ImportedProfile {
  platform: ImportPlatform;
  platformId: string;
  displayName: string;
  avatarBase64?: string;
  avatarMime?: string;
  bio?: string;
  email?: string;
}

export interface ProfileImportState {
  status: 'idle' | 'connecting' | 'fetching' | 'success' | 'error';
  profile: ImportedProfile | null;
  error: string | null;
}
```

#### API

```typescript
// api.ts

const RELAY_URL = process.env.EXPO_PUBLIC_RELAY_URL || 'https://relay.umbra.chat';

export async function startProfileImport(platform: ImportPlatform): Promise<{
  redirectUrl: string;
  state: string;
}> {
  const response = await fetch(`${RELAY_URL}/profile/import/${platform}/start`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Failed to start import: ${response.status}`);
  }

  return response.json();
}

export async function pollProfileImportResult(state: string): Promise<ImportedProfile | null> {
  // For web, this is handled by the callback redirect
  // For native, we poll the result after the OAuth flow completes
  const response = await fetch(`${RELAY_URL}/profile/import/result?state=${state}`);

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.profile;
}
```

#### Hooks

```typescript
// hooks.ts

import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { startProfileImport, pollProfileImportResult } from './api';
import type { ImportedProfile, ImportPlatform, ProfileImportState } from './types';

export function useProfileImport() {
  const [state, setState] = useState<ProfileImportState>({
    status: 'idle',
    profile: null,
    error: null,
  });

  const importFromPlatform = useCallback(async (platform: ImportPlatform) => {
    try {
      setState({ status: 'connecting', profile: null, error: null });

      const { redirectUrl, state: oauthState } = await startProfileImport(platform);

      if (Platform.OS === 'web') {
        // Web: redirect in same window, callback will postMessage back
        window.location.href = redirectUrl;
        return;
      }

      // Native: open in-app browser
      setState({ status: 'fetching', profile: null, error: null });

      const result = await WebBrowser.openAuthSessionAsync(
        redirectUrl,
        Linking.createURL(`/profile-import/${platform}/callback`)
      );

      if (result.type === 'success') {
        // Parse the returned profile from the URL or poll
        const profile = await pollProfileImportResult(oauthState);

        if (profile) {
          setState({ status: 'success', profile, error: null });
        } else {
          setState({ status: 'error', profile: null, error: 'Failed to fetch profile' });
        }
      } else {
        setState({ status: 'idle', profile: null, error: null });
      }
    } catch (error) {
      setState({
        status: 'error',
        profile: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  const clearImport = useCallback(() => {
    setState({ status: 'idle', profile: null, error: null });
  }, []);

  return {
    ...state,
    importFromPlatform,
    clearImport,
  };
}
```

### Phase 3: UI Components

**Location:** `components/auth/`

#### ProfileImportSelector.tsx

```tsx
import React from 'react';
import { View } from 'react-native';
import { Card, Text, Button, HStack, VStack, Avatar, Spinner, Alert } from '@coexist/wisp-react-native';
import { useProfileImport } from '@umbra/service';
import type { ImportPlatform } from '@umbra/service';

interface ProfileImportSelectorProps {
  onProfileImported: (profile: ImportedProfile, options: ImportOptions) => void;
  onSkip: () => void;
}

interface ImportOptions {
  useDisplayName: boolean;
  useAvatar: boolean;
  useBio: boolean;
}

const PLATFORMS: { id: ImportPlatform; name: string; icon: string }[] = [
  { id: 'discord', name: 'Discord', icon: 'discord' },
  { id: 'github', name: 'GitHub', icon: 'github' },
];

export function ProfileImportSelector({ onProfileImported, onSkip }: ProfileImportSelectorProps) {
  const { status, profile, error, importFromPlatform, clearImport } = useProfileImport();
  const [options, setOptions] = React.useState<ImportOptions>({
    useDisplayName: true,
    useAvatar: true,
    useBio: false,
  });

  // Show platform selection
  if (status === 'idle' && !profile) {
    return (
      <VStack gap="md">
        <Text size="sm" style={{ color: '#6b7280' }}>
          Import your profile from
        </Text>
        <HStack gap="sm">
          {PLATFORMS.map((platform) => (
            <Button
              key={platform.id}
              variant="outline"
              onPress={() => importFromPlatform(platform.id)}
            >
              {platform.name}
            </Button>
          ))}
        </HStack>
      </VStack>
    );
  }

  // Show loading
  if (status === 'connecting' || status === 'fetching') {
    return (
      <HStack gap="sm" style={{ alignItems: 'center' }}>
        <Spinner size="sm" />
        <Text size="sm">
          {status === 'connecting' ? 'Connecting...' : 'Fetching profile...'}
        </Text>
      </HStack>
    );
  }

  // Show error
  if (status === 'error') {
    return (
      <VStack gap="sm">
        <Alert variant="danger">{error || 'Import failed'}</Alert>
        <Button variant="ghost" onPress={clearImport}>Try again</Button>
      </VStack>
    );
  }

  // Show imported profile
  if (profile) {
    return (
      <VStack gap="md">
        <Card padding="md">
          <HStack gap="md" style={{ alignItems: 'center' }}>
            {profile.avatarBase64 && (
              <Avatar
                source={{ uri: `data:${profile.avatarMime};base64,${profile.avatarBase64}` }}
                size="lg"
              />
            )}
            <VStack gap="xs">
              <Text weight="semibold">{profile.displayName}</Text>
              {profile.bio && (
                <Text size="sm" style={{ color: '#6b7280' }}>{profile.bio}</Text>
              )}
              <Text size="xs" style={{ color: '#9ca3af' }}>
                from {profile.platform}
              </Text>
            </VStack>
          </HStack>
        </Card>

        <VStack gap="xs">
          <Checkbox
            checked={options.useDisplayName}
            onChange={(v) => setOptions({ ...options, useDisplayName: v })}
            label="Use as display name"
          />
          {profile.avatarBase64 && (
            <Checkbox
              checked={options.useAvatar}
              onChange={(v) => setOptions({ ...options, useAvatar: v })}
              label="Use avatar"
            />
          )}
          {profile.bio && (
            <Checkbox
              checked={options.useBio}
              onChange={(v) => setOptions({ ...options, useBio: v })}
              label="Use bio"
            />
          )}
        </VStack>

        <HStack gap="sm">
          <Button variant="ghost" onPress={clearImport}>Change</Button>
          <Button onPress={() => onProfileImported(profile, options)}>
            Continue
          </Button>
        </HStack>
      </VStack>
    );
  }

  return null;
}
```

### Phase 4: CreateWalletFlow Integration

Modify `components/auth/CreateWalletFlow.tsx` to use the profile import.

```tsx
// In CreateWalletFlow Step 0

const [importedProfile, setImportedProfile] = useState<ImportedProfile | null>(null);
const [importOptions, setImportOptions] = useState<ImportOptions | null>(null);

// When creating identity, use imported profile data
const handleCreateIdentity = async () => {
  const displayName = importOptions?.useDisplayName && importedProfile
    ? importedProfile.displayName
    : manualName;

  const identity = await UmbraService.instance.createIdentity({
    displayName,
    avatar: importOptions?.useAvatar ? importedProfile?.avatarBase64 : undefined,
    bio: importOptions?.useBio ? importedProfile?.bio : undefined,
  });

  // Continue to next step...
};
```

---

## Platform-Specific Notes

### Discord

- **Scopes:** `identify` (provides username, avatar, discriminator, global_name)
- **Avatar URL:** `https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.png?size=256`
- **Default Avatar:** `https://cdn.discordapp.com/embed/avatars/{user_id % 5}.png`
- **Bio:** Not available via OAuth (only visible in user settings)

### GitHub

- **Scopes:** `read:user` (provides login, name, avatar_url, bio)
- **Avatar URL:** Directly available as `avatar_url`
- **Bio:** Available as `bio` field

### Future: Google

- **Scopes:** `profile email`
- **Profile:** Via `https://www.googleapis.com/oauth2/v2/userinfo`

### Future: Twitter/X

- **Scopes:** `users.read tweet.read`
- **Profile:** Via Twitter API v2

---

## Environment Variables

Add to relay `.env`:

```env
# Existing Discord OAuth (for account linking)
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=https://relay.umbra.chat/auth/discord/callback

# Profile import redirect (different callback)
DISCORD_PROFILE_IMPORT_REDIRECT_URI=https://relay.umbra.chat/profile/import/discord/callback

# GitHub
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_REDIRECT_URI=https://relay.umbra.chat/auth/github/callback
GITHUB_PROFILE_IMPORT_REDIRECT_URI=https://relay.umbra.chat/profile/import/github/callback
```

---

## Security Considerations

1. **State Parameter:** Always validate OAuth state to prevent CSRF
2. **No Token Storage:** Tokens are used immediately and discarded
3. **Client Secrets:** Stored only on relay server, never exposed to clients
4. **Rate Limiting:** Limit profile import requests to prevent abuse
5. **Avatar Size Limits:** Cap downloaded avatar size (e.g., 5MB)

---

## Testing Checklist

- [ ] Discord OAuth flow opens correctly
- [ ] Discord callback returns profile JSON
- [ ] Avatar downloads and converts to base64
- [ ] Animated avatars (GIF) handled correctly
- [ ] Default avatars work when no custom avatar
- [ ] GitHub OAuth flow works
- [ ] Profile displayed correctly in UI
- [ ] Options (name/avatar/bio) can be toggled
- [ ] Profile data used in identity creation
- [ ] Native deep link handling works (iOS/Android)
- [ ] Web postMessage callback works
- [ ] Error states handled gracefully
- [ ] Cancel/back navigation works

---

## File Creation Order

1. **Relay:**
   - `src/discovery/profile_import.rs` - New module
   - Update `src/discovery/mod.rs` - Export new module
   - Update `src/discovery/types.rs` - Add ImportedProfile types
   - Update `src/main.rs` - Mount new routes

2. **Service:**
   - `src/profile-import/types.ts`
   - `src/profile-import/api.ts`
   - `src/profile-import/hooks.ts`
   - `src/profile-import/index.ts`
   - Update `src/index.ts` - Export profile-import module

3. **App:**
   - `components/auth/ProfileImportSelector.tsx`
   - Update `components/auth/CreateWalletFlow.tsx`

---

## Dependencies

**Relay (add to Cargo.toml):**
```toml
base64 = "0.21"  # Already likely present
```

**Service (add to package.json):**
```json
{
  "dependencies": {
    "expo-web-browser": "~14.0.0",
    "expo-linking": "~7.0.0"
  }
}
```
