# Plan: Detox E2E Testing for iOS

## Summary

Add comprehensive Detox E2E tests for iOS that match the existing 70 Playwright web spec files. Tests use two simulators (iPhone 17 Pro + iPhone 17 Pro Max) for real two-user flows, centralized testIDs with dot notation, and run against the production relay.

## Architecture Decisions (from Q&A)

| Decision | Choice |
|----------|--------|
| Framework | Detox (Wix) |
| Scope | Match all 70 existing web E2E specs |
| Test IDs | Checklist T-IDs as journey-based flows |
| Multi-user | Two simulators, same bundle ID |
| Simulators | iPhone 17 Pro + iPhone 17 Pro Max |
| Build config | Release (pre-built binary) |
| Test data | Fresh state each run |
| Location | `__tests__/e2e-ios/` |
| Config | `.detoxrc.js` at project root |
| Runner | jest-circus |
| Timeouts | Conservative (30s launch, 15s nav, 10s interaction) |
| testID style | Dot notation (auth.create.button) |
| testID scope | Aggressive (~100+ testIDs) + accessibility labels |
| testID source | Centralized constants file |
| testID rollout | All upfront in this implementation |
| Shared layer | `__tests__/shared/` (constants, timeouts, fixtures) |
| Navigation | UI taps (realistic) |
| Wisp components | Component-level testIDs only |
| Suite structure | 4 suites: Auth, Social, Community, Settings |
| Relay | Production (relay.umbra.chat), wait for connection |
| Artifacts | Screenshots + Detox timeline on failure |
| Reports | Jest default + timeline |
| Scripts | `detox:*` pattern |
| Smoke test | Yes, `detox:smoke` |
| CI | Local only for now |
| PIN input | Tap visible cells + typeText |
| Seed phrase | Paste full phrase into first input |
| Build system | Pre-built binary (npx expo run:ios) |

---

## Step 1: Create Shared Test Constants (`__tests__/shared/`)

### `__tests__/shared/test-ids.ts`
Centralized TEST_IDS object with dot notation. Both Detox and Playwright tests import from here. Components also import to avoid string duplication.

Organized by checklist section:
- `AUTH.*` — auth screen, create flow, import flow
- `NAV.*` — navigation rail, sidebar, search
- `FRIENDS.*` — friends page, tabs, request flow
- `MESSAGING.*` — chat header, input, bubbles, actions
- `GROUPS.*` — create, invite, messaging
- `SETTINGS.*` — all settings panels
- `PIN.*` — pin input, cells, lock screen
- `COMMUNITY.*` — channels, spaces, members
- `COMMON.*` — shared elements (loading, empty states)

### `__tests__/shared/timeouts.ts`
```ts
export const TIMEOUTS = {
  APP_LAUNCH: 30000,
  CORE_INIT: 30000,
  NAVIGATION: 15000,
  INTERACTION: 10000,
  NETWORK_CONNECT: 20000,
  RELAY_SETTLE: 12000,
  UI_SETTLE: 3000,
};
```

### `__tests__/shared/fixtures.ts`
Test fixture data: known test seed phrases, display names, PINs, etc.

---

## Step 2: Add ~100+ testIDs to Components

Add `testID` and `accessibilityLabel` to every interactive element across auth, navigation, messaging, friends, groups, settings, and community components. Each testID uses dot notation and is imported from `__tests__/shared/test-ids.ts`.

### Files to modify (by suite):

**Auth Suite (~25 testIDs):**
- `app/(auth)/index.tsx` — auth screen buttons, blob background
- `src/components/auth/CreateWalletFlow.tsx` — all 6 step inputs/buttons
- `src/components/auth/ImportWalletFlow.tsx` — import inputs/buttons
- `src/components/auth/GrowablePinInput.tsx` — hidden input, cells
- `src/components/auth/PinSetupStep.tsx` — setup/confirm/skip
- `src/components/auth/PinLockScreen.tsx` — lock screen input
- `src/components/auth/SeedPhraseGrid.tsx` — word cells, copy button

**Navigation Suite (~20 testIDs):**
- `src/components/navigation/NavigationRail.tsx` — home, files, community, settings, avatar
- `src/components/sidebar/ChatSidebar.tsx` — search, friends button, new chat button
- `src/components/navigation/AccountSwitcher.tsx` — account list, add account
- `app/(main)/index.tsx` — empty state, chat page container

**Social Suite (~25 testIDs):**
- `src/components/friends/FriendsPage.tsx` — tabs, add friend input, friend cards
- `src/components/chat/ChatArea.tsx` — message list, input area, send button
- `src/components/chat/ChatHeader.tsx` — name, status, action buttons
- `src/components/chat/ChatBubble.tsx` — message content, actions
- `src/components/chat/MessageInput.tsx` — text input, emoji button, attach button
- `src/components/groups/CreateGroupDialog.tsx` — name, description, member picker

**Settings Suite (~20 testIDs):**
- `src/components/modals/SettingsDialog.tsx` — section nav items, all toggle/input elements
- `src/components/modals/PluginMarketplace.tsx` — tabs, search, install buttons

**Community Suite (~15 testIDs):**
- Community sidebar, channel list, voice channel, member panel elements

---

## Step 3: Configure Detox (`.detoxrc.js`)

```js
module.exports = {
  testRunner: {
    args: {
      config: '__tests__/e2e-ios/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/Umbra.app',
      build: 'echo "Using pre-built binary. Run detox:build first."',
    },
  },
  devices: {
    'iphone17pro': {
      type: 'ios.simulator',
      device: { type: 'iPhone 17 Pro' },
    },
    'iphone17promax': {
      type: 'ios.simulator',
      device: { type: 'iPhone 17 Pro Max' },
    },
  },
  configurations: {
    'ios.release': {
      device: 'iphone17pro',
      app: 'ios.release',
    },
    'ios.release.userB': {
      device: 'iphone17promax',
      app: 'ios.release',
    },
  },
  artifacts: {
    rootDir: '__tests__/e2e-ios/artifacts/',
    plugins: {
      screenshot: {
        shouldTakeAutomaticSnapshots: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      timeline: 'enabled',
    },
  },
  behavior: {
    init: {
      expireAfter: 120000,
    },
    launchApp: 'manual',
    cleanup: {
      shutdownDevice: false,
    },
  },
};
```

### `__tests__/e2e-ios/jest.config.js`
```js
module.exports = {
  rootDir: '../..',
  testMatch: ['<rootDir>/__tests__/e2e-ios/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

---

## Step 4: Create Test Helpers (`__tests__/e2e-ios/helpers/`)

### `helpers/app.ts` — App lifecycle
- `launchApp()` — launch with clean state, wait for core init
- `waitForAuthScreen()` — wait for auth screen with 30s timeout
- `waitForMainScreen()` — wait for main screen loaded
- `waitForRelayConnection()` — wait for network connected indicator

### `helpers/auth.ts` — Account management
- `createAccount(name, options?)` — full account creation flow
- `createAccountWithPin(name, pin)` — creation with PIN setup
- `importAccount(seedPhrase, name)` — import flow
- `enterPin(pin)` — tap cells + type PIN digits
- `skipPin()` — tap "Skip for now"

### `helpers/navigation.ts` — Navigation
- `navigateToFriends()` — tap friends button
- `navigateToSettings()` — tap settings
- `navigateToFiles()` — tap files nav
- `navigateHome()` — tap home nav
- `openConversation(name)` — tap conversation in sidebar

### `helpers/messaging.ts` — Chat interactions
- `sendMessage(text)` — type + send
- `waitForMessage(text)` — wait for message to appear
- `longPressMessage(text)` — trigger context menu

---

## Step 5: Create Test Files (mirroring 70 Playwright specs)

### Auth Suite (`__tests__/e2e-ios/auth/`)
Mirrors `__tests__/e2e/identity/` — 7 spec files → 7 Detox test files:
- `account-creation.test.ts` (T1.1.*)
- `account-import.test.ts` (T1.2.*)
- `pin-lock.test.ts` (T1.3.*)
- `multi-account.test.ts` (T1.4.*)
- `loading-splash.test.ts` (T1.5.*)
- `logout.test.ts` (T1.6.*)
- `discovery.test.ts` (T1.7.*)

Plus Navigation — 10 spec files → 10 Detox test files:
- `nav-rail.test.ts` (T2.1.*)
- `sidebar.test.ts` (T2.2.*)
- `sidebar-search.test.ts` (T2.3.*)
- `new-chat-menu.test.ts` (T2.4.*)
- `new-dm-dialog.test.ts` (T2.5.*)
- `sidebar-resize.test.ts` (T2.6.*)
- `mobile-layout.test.ts` (T2.7.*)
- `group-invites.test.ts` (T2.8.*)
- `command-palette.test.ts` (T13.*)
- `help-guide.test.ts` (T15.*)

### Social Suite (`__tests__/e2e-ios/social/`)
Mirrors `__tests__/e2e/friends/` (8) + `messaging/` (15) + `groups/` (6) = 29 spec files:

**Friends (8):**
- `friends-page.test.ts`, `pending-tab.test.ts`, `online-tab.test.ts`, `blocked-tab.test.ts`
- `friend-request-flow.test.ts` (TWO-USER), `friend-actions.test.ts`, `friend-validation.test.ts`, `discovery.test.ts`

**Messaging (15):**
- `chat-header.test.ts`, `sending-messages.test.ts`, `receiving-messages.test.ts` (TWO-USER)
- `message-input.test.ts`, `emoji-picker.test.ts`, `message-actions.test.ts`
- `edit-delete-reply.test.ts`, `reactions-threads.test.ts`, `typing-receipts.test.ts` (TWO-USER)
- `display-modes.test.ts`, `message-types.test.ts`, `stickers-and-mentions.test.ts`
- `file-attachments.test.ts`, `edge-cases.test.ts`, `decrypt-errors.test.ts`

**Groups (6):**
- `create-group.test.ts`, `group-invitations.test.ts` (TWO-USER)
- `group-messaging.test.ts` (TWO-USER), `group-header.test.ts`
- `group-members.test.ts`, `group-file-attachments.test.ts`

### Community Suite (`__tests__/e2e-ios/community/`)
New tests for TESTING_CHECKLIST sections 6-7 (not yet in web E2E). Initially stub files.

### Settings Suite (`__tests__/e2e-ios/settings/`)
Mirrors `__tests__/e2e/settings/` — 18 spec files:
- `settings-navigation.test.ts`, `account-section.test.ts`, `profile-section.test.ts`
- `appearance-section.test.ts`, `messaging-section.test.ts`, `notifications-section.test.ts`
- `sounds-section.test.ts`, `privacy-section.test.ts`, `audio-video-section.test.ts`
- `network-section.test.ts`, `data-section.test.ts`, `plugins-section.test.ts`
- `shortcuts-section.test.ts`, `about-section.test.ts`, `account-backup.test.ts`
- `key-rotation.test.ts`, `multi-instance.test.ts`, `identity-card.test.ts`

### Smoke Test (`__tests__/e2e-ios/smoke.test.ts`)
Create account → verify main screen loads. ~30 seconds. Run after every build.

---

## Step 6: Add npm Scripts to `package.json`

```json
"detox:build": "./scripts/build-mobile.sh ios-sim && npx expo prebuild --clean && LANG=en_US.UTF-8 npx expo run:ios --configuration Release --no-install",
"detox:test": "detox test --configuration ios.release",
"detox:test:auth": "detox test --configuration ios.release __tests__/e2e-ios/auth/",
"detox:test:social": "detox test --configuration ios.release __tests__/e2e-ios/social/",
"detox:test:community": "detox test --configuration ios.release __tests__/e2e-ios/community/",
"detox:test:settings": "detox test --configuration ios.release __tests__/e2e-ios/settings/",
"detox:smoke": "detox test --configuration ios.release __tests__/e2e-ios/smoke.test.ts"
```

---

## Step 7: Create iPhone 17 Pro Max Simulator

```bash
xcrun simctl create "iPhone 17 Pro Max" "com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro-Max" "com.apple.CoreSimulator.SimRuntime.iOS-26-2"
```

---

## File Structure

```
.detoxrc.js                              # Detox configuration
__tests__/
  shared/
    test-ids.ts                          # Centralized TEST_IDS constant
    timeouts.ts                          # Shared timeout values
    fixtures.ts                          # Test fixture data
  e2e-ios/
    jest.config.js                       # Detox Jest config
    artifacts/                           # Screenshots + timeline (gitignored)
    helpers/
      app.ts                             # App lifecycle helpers
      auth.ts                            # Account creation/import helpers
      navigation.ts                      # Navigation helpers
      messaging.ts                       # Chat interaction helpers
    smoke.test.ts                        # Quick smoke test
    auth/
      account-creation.test.ts           # 7 files mirroring web identity/
      account-import.test.ts
      pin-lock.test.ts
      multi-account.test.ts
      loading-splash.test.ts
      logout.test.ts
      discovery.test.ts
      nav-rail.test.ts                   # 10 files mirroring web navigation/
      sidebar.test.ts
      sidebar-search.test.ts
      new-chat-menu.test.ts
      new-dm-dialog.test.ts
      sidebar-resize.test.ts
      mobile-layout.test.ts
      group-invites.test.ts
      command-palette.test.ts
      help-guide.test.ts
    social/
      friends-page.test.ts              # 8 files mirroring web friends/
      pending-tab.test.ts
      online-tab.test.ts
      blocked-tab.test.ts
      friend-request-flow.test.ts
      friend-actions.test.ts
      friend-validation.test.ts
      discovery.test.ts
      chat-header.test.ts               # 15 files mirroring web messaging/
      sending-messages.test.ts
      receiving-messages.test.ts
      message-input.test.ts
      emoji-picker.test.ts
      message-actions.test.ts
      edit-delete-reply.test.ts
      reactions-threads.test.ts
      typing-receipts.test.ts
      display-modes.test.ts
      message-types.test.ts
      stickers-and-mentions.test.ts
      file-attachments.test.ts
      edge-cases.test.ts
      decrypt-errors.test.ts
      create-group.test.ts              # 6 files mirroring web groups/
      group-invitations.test.ts
      group-messaging.test.ts
      group-header.test.ts
      group-members.test.ts
      group-file-attachments.test.ts
    community/                           # New (section 6-7 stubs)
      (stub files for future)
    settings/
      settings-navigation.test.ts        # 18 files mirroring web settings/
      account-section.test.ts
      profile-section.test.ts
      appearance-section.test.ts
      messaging-section.test.ts
      notifications-section.test.ts
      sounds-section.test.ts
      privacy-section.test.ts
      audio-video-section.test.ts
      network-section.test.ts
      data-section.test.ts
      plugins-section.test.ts
      shortcuts-section.test.ts
      about-section.test.ts
      account-backup.test.ts
      key-rotation.test.ts
      multi-instance.test.ts
      identity-card.test.ts
```

## Implementation Order

1. Create `__tests__/shared/` with test-ids.ts, timeouts.ts, fixtures.ts
2. Add ~100+ testIDs + accessibilityLabels to components (all upfront)
3. Create `.detoxrc.js` and `__tests__/e2e-ios/jest.config.js`
4. Create iPhone 17 Pro Max simulator
5. Create test helpers in `__tests__/e2e-ios/helpers/`
6. Create `smoke.test.ts` and verify it runs end-to-end
7. Create auth suite test files (17 files)
8. Create social suite test files (29 files)
9. Create settings suite test files (18 files)
10. Create community suite stubs
11. Add npm scripts to package.json
12. Run full suite and fix any issues

## Files Modified (~30 component files for testIDs)
## Files Created (~75 new test/config files)
## Dependencies Added: detox, @types/detox, jest-circus (already installed)
