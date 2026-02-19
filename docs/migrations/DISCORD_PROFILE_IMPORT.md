# Discord Profile Import — Implementation Specification

**Status:** Ready for Implementation
**Priority:** High (First Migration Feature)
**Estimated Complexity:** Medium

---

## Overview

Enable users to import their Discord profile (avatar, username, bio) into Umbra via OAuth2 or GDPR data package upload.

---

## User Flow

### Flow A: OAuth2 (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│ Settings → Profile → "Import from Discord"                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ "Connect your Discord account to import your profile"       │
│                                                             │
│ We'll import:                                               │
│ • Your avatar                                               │
│ • Your display name                                         │
│ • Your bio (if set)                                         │
│                                                             │
│ We will NOT:                                                │
│ • Store your Discord password                               │
│ • Access your messages                                      │
│ • Post anything to Discord                                  │
│                                                             │
│ [Connect Discord]                                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ [Discord OAuth Page - opens in browser/webview]            │
│                                                             │
│ "Umbra wants to access your account"                        │
│                                                             │
│ This will allow Umbra to:                                   │
│ • Access your username, avatar, and banner                  │
│ • Know what servers you're in                               │
│                                                             │
│ [Authorize]  [Cancel]                                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Importing your profile...                                   │
│                                                             │
│ ✓ Connected to Discord                                      │
│ ✓ Fetched profile data                                      │
│ ● Downloading avatar...                                     │
│                                                             │
│ [━━━━━━━━━━━━━━━░░░░░░░░░░] 65%                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Profile imported!                                           │
│                                                             │
│ ┌─────────┐                                                 │
│ │ [avatar]│  CoolUser#1234                                  │
│ └─────────┘  "Just vibing"                                  │
│                                                             │
│ ☑ Use as Umbra display name                                 │
│ ☑ Use as Umbra avatar                                       │
│ ☐ Use bio                                                   │
│                                                             │
│ [Apply to Profile]  [Cancel]                                │
└─────────────────────────────────────────────────────────────┘
```

### Flow B: Data Package Upload

```
┌─────────────────────────────────────────────────────────────┐
│ Settings → Profile → "Upload Data Package"                  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Upload your Discord Data Package                            │
│                                                             │
│ 1. Go to Discord Settings → Privacy & Safety                │
│ 2. Click "Request all of my Data"                           │
│ 3. Wait for email (up to 30 days)                           │
│ 4. Download and upload the ZIP here                         │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐   │
│ │                                                       │   │
│ │     📁 Drop your Discord data package here            │   │
│ │        or click to browse                             │   │
│ │                                                       │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                             │
│ ⓘ Your data is processed locally. Nothing is uploaded      │
│   to Umbra servers.                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### File Structure

```
packages/umbra-service/src/
├── migrations/
│   ├── index.ts
│   ├── types.ts
│   └── discord/
│       ├── index.ts
│       ├── oauth.ts
│       ├── profile-import.ts
│       └── gdpr-parser.ts

apps/umbra/
├── components/
│   └── settings/
│       ├── ImportFromDiscord.tsx
│       ├── DiscordOAuthButton.tsx
│       └── DataPackageUpload.tsx
├── hooks/
│   └── useDiscordImport.ts
└── app/
    └── (main)/
        └── oauth/
            └── discord/
                └── callback.tsx
```

### Types

```typescript
// packages/umbra-service/src/migrations/types.ts

export interface MigrationSource {
  platform: 'discord' | 'slack' | 'telegram';
  method: 'oauth' | 'data-package' | 'api';
  importedAt: Date;
}

export interface ImportedProfile {
  // Core profile data
  username: string;
  displayName: string;
  avatarUrl?: string;
  avatarBase64?: string;
  bannerUrl?: string;
  bannerBase64?: string;
  bio?: string;

  // Source metadata
  source: MigrationSource;
  sourceUserId: string;

  // Optional additional data
  email?: string;
  connections?: ExternalConnection[];
  guilds?: PartialGuild[];
}

export interface ExternalConnection {
  type: string; // 'twitch', 'youtube', 'spotify', etc.
  name: string;
  id: string;
}

export interface PartialGuild {
  id: string;
  name: string;
  icon?: string;
  owner: boolean;
  permissions: string;
  memberCount?: number;
}

export interface ImportProgress {
  stage: 'connecting' | 'fetching' | 'downloading' | 'processing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  error?: string;
}

export type ImportProgressCallback = (progress: ImportProgress) => void;
```

### Discord OAuth Implementation

```typescript
// packages/umbra-service/src/migrations/discord/oauth.ts

import { Platform } from 'react-native';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export interface DiscordOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  global_name?: string;
  avatar?: string;
  banner?: string;
  accent_color?: number;
  bio?: string;
  email?: string;
  verified?: boolean;
  locale?: string;
  mfa_enabled?: boolean;
  premium_type?: number;
}

// Generate OAuth URL
export function getDiscordOAuthUrl(config: DiscordOAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    prompt: 'consent',
  });

  return `https://discord.com/oauth2/authorize?${params}`;
}

// Exchange code for token
export async function exchangeCodeForToken(
  code: string,
  config: DiscordOAuthConfig
): Promise<DiscordTokenResponse> {
  const response = await fetch(`${DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`);
  }

  return response.json();
}

// Fetch user profile
export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }

  return response.json();
}

// Fetch user guilds
export async function fetchDiscordGuilds(accessToken: string): Promise<PartialGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch guilds: ${response.status}`);
  }

  return response.json();
}

// Fetch user connections
export async function fetchDiscordConnections(accessToken: string): Promise<ExternalConnection[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/connections`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch connections: ${response.status}`);
  }

  return response.json();
}

// Build avatar URL
export function getDiscordAvatarUrl(userId: string, avatarHash?: string, size = 256): string {
  if (!avatarHash) {
    // Default avatar based on discriminator
    const defaultIndex = parseInt(userId) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  }

  const extension = avatarHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${extension}?size=${size}`;
}

// Build banner URL
export function getDiscordBannerUrl(userId: string, bannerHash: string, size = 600): string {
  const extension = bannerHash.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${extension}?size=${size}`;
}
```

### Profile Import Service

```typescript
// packages/umbra-service/src/migrations/discord/profile-import.ts

import {
  DiscordUser,
  fetchDiscordUser,
  fetchDiscordGuilds,
  fetchDiscordConnections,
  getDiscordAvatarUrl,
  getDiscordBannerUrl,
} from './oauth';
import type { ImportedProfile, ImportProgress, ImportProgressCallback } from '../types';

export async function importDiscordProfile(
  accessToken: string,
  onProgress?: ImportProgressCallback
): Promise<ImportedProfile> {
  const progress = (stage: ImportProgress['stage'], progress: number, message: string) => {
    onProgress?.({ stage, progress, message });
  };

  try {
    // Step 1: Fetch user data
    progress('fetching', 10, 'Fetching profile data...');
    const user = await fetchDiscordUser(accessToken);

    // Step 2: Fetch guilds (optional, for future community import)
    progress('fetching', 30, 'Fetching server list...');
    let guilds: PartialGuild[] = [];
    try {
      guilds = await fetchDiscordGuilds(accessToken);
    } catch (e) {
      console.warn('Could not fetch guilds:', e);
    }

    // Step 3: Fetch connections (optional)
    progress('fetching', 40, 'Fetching connections...');
    let connections: ExternalConnection[] = [];
    try {
      connections = await fetchDiscordConnections(accessToken);
    } catch (e) {
      console.warn('Could not fetch connections:', e);
    }

    // Step 4: Download avatar
    progress('downloading', 50, 'Downloading avatar...');
    let avatarBase64: string | undefined;
    const avatarUrl = getDiscordAvatarUrl(user.id, user.avatar);

    try {
      const avatarResponse = await fetch(avatarUrl);
      const avatarBlob = await avatarResponse.blob();
      avatarBase64 = await blobToBase64(avatarBlob);
      progress('downloading', 70, 'Avatar downloaded');
    } catch (e) {
      console.warn('Could not download avatar:', e);
    }

    // Step 5: Download banner (if exists)
    let bannerBase64: string | undefined;
    if (user.banner) {
      progress('downloading', 80, 'Downloading banner...');
      const bannerUrl = getDiscordBannerUrl(user.id, user.banner);

      try {
        const bannerResponse = await fetch(bannerUrl);
        const bannerBlob = await bannerResponse.blob();
        bannerBase64 = await blobToBase64(bannerBlob);
      } catch (e) {
        console.warn('Could not download banner:', e);
      }
    }

    // Step 6: Build imported profile
    progress('processing', 90, 'Processing profile...');

    const importedProfile: ImportedProfile = {
      username: user.username,
      displayName: user.global_name || user.username,
      avatarUrl,
      avatarBase64,
      bannerUrl: user.banner ? getDiscordBannerUrl(user.id, user.banner) : undefined,
      bannerBase64,
      bio: user.bio,
      source: {
        platform: 'discord',
        method: 'oauth',
        importedAt: new Date(),
      },
      sourceUserId: user.id,
      email: user.email,
      connections,
      guilds,
    };

    progress('complete', 100, 'Profile imported successfully!');

    return importedProfile;
  } catch (error) {
    onProgress?.({
      stage: 'error',
      progress: 0,
      message: 'Import failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

// Helper to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
```

### GDPR Package Parser

```typescript
// packages/umbra-service/src/migrations/discord/gdpr-parser.ts

import JSZip from 'jszip';
import type { ImportedProfile, ImportProgress, ImportProgressCallback } from '../types';

export interface DiscordPackageUser {
  id: string;
  username: string;
  discriminator: string;
  email: string;
  phone?: string;
  verified: boolean;
  avatar_hash?: string;
  date_of_birth?: string;
  bio?: string;
}

export interface DiscordPackageFriend {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
  type: number; // 1 = friend, 2 = blocked, etc.
}

export interface DiscordPackageServer {
  id: string;
  name: string;
  icon?: string;
}

export interface ParsedDiscordPackage {
  user: DiscordPackageUser;
  avatar?: Uint8Array;
  friends: DiscordPackageFriend[];
  servers: DiscordPackageServer[];
}

export async function parseDiscordDataPackage(
  file: File,
  onProgress?: ImportProgressCallback
): Promise<ParsedDiscordPackage> {
  const progress = (stage: ImportProgress['stage'], percent: number, message: string) => {
    onProgress?.({ stage, progress: percent, message });
  };

  progress('processing', 5, 'Loading data package...');

  // Load ZIP file
  const zip = await JSZip.loadAsync(file);

  progress('processing', 15, 'Parsing account data...');

  // Parse user.json
  const userJsonFile = zip.file('account/user.json');
  if (!userJsonFile) {
    throw new Error('Invalid Discord data package: missing account/user.json');
  }

  const userJsonStr = await userJsonFile.async('string');
  const userJson = JSON.parse(userJsonStr);

  const user: DiscordPackageUser = {
    id: userJson.id,
    username: userJson.username,
    discriminator: userJson.discriminator,
    email: userJson.email,
    phone: userJson.phone,
    verified: userJson.verified,
    avatar_hash: userJson.avatar_hash,
    bio: userJson.bio,
  };

  progress('processing', 30, 'Loading avatar...');

  // Load avatar
  let avatar: Uint8Array | undefined;
  const avatarFile = zip.file('account/avatar.png') || zip.file('account/avatar.gif');
  if (avatarFile) {
    avatar = await avatarFile.async('uint8array');
  }

  progress('processing', 50, 'Parsing relationships...');

  // Parse relationships
  let friends: DiscordPackageFriend[] = [];
  const relationshipsFile = zip.file('account/relationships.json');
  if (relationshipsFile) {
    const relationshipsStr = await relationshipsFile.async('string');
    const relationships = JSON.parse(relationshipsStr);

    if (Array.isArray(relationships)) {
      friends = relationships
        .filter((r: any) => r.type === 1) // Type 1 = friend
        .map((r: any) => ({
          id: r.id || r.user?.id,
          username: r.username || r.user?.username,
          discriminator: r.discriminator || r.user?.discriminator,
          avatar: r.avatar || r.user?.avatar,
          type: r.type,
        }));
    }
  }

  progress('processing', 70, 'Parsing servers...');

  // Parse servers
  let servers: DiscordPackageServer[] = [];
  const serversFile = zip.file('servers/index.json');
  if (serversFile) {
    const serversStr = await serversFile.async('string');
    const serversJson = JSON.parse(serversStr);

    if (Array.isArray(serversJson)) {
      servers = serversJson.map((s: any) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
      }));
    }
  }

  progress('complete', 100, 'Data package parsed successfully!');

  return { user, avatar, friends, servers };
}

// Convert parsed package to ImportedProfile
export function packageToProfile(parsed: ParsedDiscordPackage): ImportedProfile {
  return {
    username: parsed.user.username,
    displayName: parsed.user.username,
    avatarBase64: parsed.avatar ? uint8ArrayToBase64(parsed.avatar) : undefined,
    bio: parsed.user.bio,
    source: {
      platform: 'discord',
      method: 'data-package',
      importedAt: new Date(),
    },
    sourceUserId: parsed.user.id,
    email: parsed.user.email,
    guilds: parsed.servers.map(s => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      owner: false,
      permissions: '0',
    })),
  };
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
```

### React Hook

```typescript
// apps/umbra/hooks/useDiscordImport.ts

import { useState, useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import {
  getDiscordOAuthUrl,
  exchangeCodeForToken,
  importDiscordProfile,
  parseDiscordDataPackage,
  packageToProfile,
} from '@umbra/service/migrations/discord';
import type { ImportedProfile, ImportProgress } from '@umbra/service/migrations/types';
import { useUmbraService } from './useUmbraService';

// Environment config - would come from .env
const DISCORD_CONFIG = {
  clientId: process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID || '',
  clientSecret: process.env.EXPO_PUBLIC_DISCORD_CLIENT_SECRET || '',
  redirectUri: Platform.select({
    web: `${window.location.origin}/oauth/discord/callback`,
    default: 'umbra://oauth/discord/callback',
  }),
  scopes: ['identify', 'email', 'guilds', 'connections'],
};

export function useDiscordImport() {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [importedProfile, setImportedProfile] = useState<ImportedProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const service = useUmbraService();

  // Start OAuth flow
  const startOAuthFlow = useCallback(async () => {
    try {
      setError(null);
      setProgress({ stage: 'connecting', progress: 0, message: 'Opening Discord...' });

      // Generate state for CSRF protection
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `${Date.now()}-${Math.random()}`
      );

      // Store state for verification
      // In real implementation, store in secure storage

      const authUrl = getDiscordOAuthUrl(DISCORD_CONFIG, state);

      if (Platform.OS === 'web') {
        // Web: open in same window, will redirect back
        window.location.href = authUrl;
      } else {
        // Native: open in-app browser
        const result = await WebBrowser.openAuthSessionAsync(
          authUrl,
          DISCORD_CONFIG.redirectUri
        );

        if (result.type === 'success' && result.url) {
          await handleOAuthCallback(result.url);
        } else {
          setProgress(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start OAuth');
      setProgress(null);
    }
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (callbackUrl: string) => {
    try {
      const url = new URL(callbackUrl);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const errorParam = url.searchParams.get('error');

      if (errorParam) {
        throw new Error(`Discord OAuth error: ${errorParam}`);
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      // TODO: Verify state matches stored state

      setProgress({ stage: 'connecting', progress: 5, message: 'Exchanging token...' });

      // Exchange code for token
      const tokenResponse = await exchangeCodeForToken(code, DISCORD_CONFIG);

      // Import profile
      const profile = await importDiscordProfile(
        tokenResponse.access_token,
        setProgress
      );

      setImportedProfile(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OAuth callback failed');
      setProgress({ stage: 'error', progress: 0, message: 'Import failed', error: String(e) });
    }
  }, []);

  // Handle data package upload
  const handleDataPackageUpload = useCallback(async (file: File) => {
    try {
      setError(null);

      const parsed = await parseDiscordDataPackage(file, setProgress);
      const profile = packageToProfile(parsed);

      setImportedProfile(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse data package');
      setProgress({ stage: 'error', progress: 0, message: 'Parse failed', error: String(e) });
    }
  }, []);

  // Apply imported profile to Umbra
  const applyProfile = useCallback(async (options: {
    useDisplayName: boolean;
    useAvatar: boolean;
    useBio: boolean;
  }) => {
    if (!importedProfile) return;

    try {
      setProgress({ stage: 'processing', progress: 50, message: 'Applying profile...' });

      if (options.useDisplayName) {
        await service.updateProfile({ displayName: importedProfile.displayName });
      }

      if (options.useAvatar && importedProfile.avatarBase64) {
        await service.updateProfileAvatar(importedProfile.avatarBase64);
      }

      if (options.useBio && importedProfile.bio) {
        await service.updateProfile({ bio: importedProfile.bio });
      }

      // Record migration source
      await service.recordMigration(importedProfile.source);

      setProgress({ stage: 'complete', progress: 100, message: 'Profile updated!' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to apply profile');
    }
  }, [importedProfile, service]);

  // Reset state
  const reset = useCallback(() => {
    setProgress(null);
    setImportedProfile(null);
    setError(null);
  }, []);

  return {
    progress,
    importedProfile,
    error,
    startOAuthFlow,
    handleOAuthCallback,
    handleDataPackageUpload,
    applyProfile,
    reset,
  };
}
```

### UI Components

```tsx
// apps/umbra/components/settings/ImportFromDiscord.tsx

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useDiscordImport } from '../../hooks/useDiscordImport';
import { ProgressBar } from '@coexist/wisp-react-native';

export function ImportFromDiscord() {
  const {
    progress,
    importedProfile,
    error,
    startOAuthFlow,
    handleDataPackageUpload,
    applyProfile,
    reset,
  } = useDiscordImport();

  const [options, setOptions] = useState({
    useDisplayName: true,
    useAvatar: true,
    useBio: true,
  });

  // Initial state - show import options
  if (!progress && !importedProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Import from Discord</Text>

        <Text style={styles.description}>
          Import your profile, avatar, and more from Discord.
        </Text>

        <View style={styles.methodContainer}>
          <TouchableOpacity style={styles.methodButton} onPress={startOAuthFlow}>
            <DiscordLogo />
            <Text style={styles.methodTitle}>Connect Discord</Text>
            <Text style={styles.methodDescription}>
              Quick import via Discord login
            </Text>
          </TouchableOpacity>

          <Text style={styles.orText}>or</Text>

          <TouchableOpacity
            style={styles.methodButton}
            onPress={() => {/* Open file picker */}}
          >
            <FileIcon />
            <Text style={styles.methodTitle}>Upload Data Package</Text>
            <Text style={styles.methodDescription}>
              Import from Discord GDPR export
            </Text>
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }

  // Progress state
  if (progress && progress.stage !== 'complete') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Importing from Discord</Text>

        <ProgressBar progress={progress.progress / 100} />

        <Text style={styles.progressText}>{progress.message}</Text>

        {progress.stage === 'error' && (
          <TouchableOpacity style={styles.retryButton} onPress={reset}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Preview imported profile
  if (importedProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Profile Imported!</Text>

        <View style={styles.previewCard}>
          {importedProfile.avatarBase64 && (
            <Image
              source={{ uri: `data:image/png;base64,${importedProfile.avatarBase64}` }}
              style={styles.avatar}
            />
          )}
          <Text style={styles.previewName}>{importedProfile.displayName}</Text>
          {importedProfile.bio && (
            <Text style={styles.previewBio}>{importedProfile.bio}</Text>
          )}
        </View>

        <View style={styles.optionsContainer}>
          <CheckboxRow
            label="Use as Umbra display name"
            checked={options.useDisplayName}
            onToggle={() => setOptions(o => ({ ...o, useDisplayName: !o.useDisplayName }))}
          />
          <CheckboxRow
            label="Use as Umbra avatar"
            checked={options.useAvatar}
            onToggle={() => setOptions(o => ({ ...o, useAvatar: !o.useAvatar }))}
          />
          {importedProfile.bio && (
            <CheckboxRow
              label="Use bio"
              checked={options.useBio}
              onToggle={() => setOptions(o => ({ ...o, useBio: !o.useBio }))}
            />
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={reset}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={() => applyProfile(options)}
          >
            <Text style={styles.applyText}>Apply to Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  methodContainer: {
    gap: 16,
  },
  methodButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  methodDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  orText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 12,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#6b7280',
  },
  previewCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '600',
  },
  previewBio: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cancelText: {
    color: '#6b7280',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  applyText: {
    color: 'white',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  retryText: {
    color: '#6366f1',
    fontWeight: '500',
  },
});
```

---

## Environment Setup

### Discord Developer Application

1. Go to https://discord.com/developers/applications
2. Create New Application: "Umbra Migration"
3. Under OAuth2:
   - Add redirect URI: `umbra://oauth/discord/callback` (mobile)
   - Add redirect URI: `https://umbra.chat/oauth/discord/callback` (web)
4. Copy Client ID and Client Secret

### Environment Variables

```bash
# .env
EXPO_PUBLIC_DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret  # Server-side only
```

---

## Testing Checklist

- [ ] OAuth flow opens Discord auth page
- [ ] Callback handles success and error cases
- [ ] Profile data correctly parsed from API response
- [ ] Avatar downloads and converts to base64
- [ ] Banner downloads if present
- [ ] Guilds list fetched correctly
- [ ] Connections list fetched correctly
- [ ] Progress updates display correctly
- [ ] Error states handled gracefully
- [ ] Profile applied to Umbra profile
- [ ] GDPR package ZIP parsed correctly
- [ ] Works on web, iOS, Android
