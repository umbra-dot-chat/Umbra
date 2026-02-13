# Umbra — Development Context

## What is Umbra?
A three-panel chat app built with Expo + Expo Router using @coexist/wisp-react-native exclusively for UI. Mocks every screen a modern chat app needs. Web support via Expo Web.

## Package Scope
Wisp packages published under `@coexist/` scope on npm:
- `@coexist/wisp-core@0.1.0` (0.1.1 pending republish — adds wildcard sub-path exports)
- `@coexist/wisp-react-native@0.1.0` (0.1.1 pending republish — adds ConversationListItem, MemberList, PinnedMessages, UserProfileCard to barrel)
- `@coexist/wisp-react@0.1.0`

Source imports in Wisp were updated from `@wisp-ui/core` → `@coexist/wisp-core` in both react-native and react packages.

## Wisp Patch Script
Since Wisp changes need to sync into Umbra without republishing, a patch script exists:
- `npm run patch` or `./scripts/patch-wisp.sh`
- Copies latest Wisp source from `../Wisp/packages/{core,react-native}` into `node_modules/@coexist/`
- Also runs automatically as a `postinstall` hook
- Run this after ANY change to the Wisp UI kit

## Tech Stack
- Expo SDK 54, React 19, React Native 0.81
- expo-router v6 (file-based routing, typed routes)
- react-native-web for web support
- @coexist/wisp-react-native for ALL UI components (zero custom styling)
- TypeScript strict mode

## Wisp Theme Color Reference
The `useTheme()` hook returns `{ theme, mode, colors, toggleMode, setMode }`. Access colors via `theme.colors` or destructured `colors`:

```
colors.background.canvas    — Root page background
colors.background.sunken    — Recessed areas
colors.background.surface   — Cards, panels
colors.background.raised    — Elevated elements
colors.background.overlay   — Modal scrim

colors.text.primary         — Default body text
colors.text.secondary       — Supporting text
colors.text.muted           — Disabled/placeholder
colors.text.inverse         — Text on opposite-mode surfaces
colors.text.link            — Hyperlinks
colors.text.onRaised        — Text on raised surfaces
colors.text.onRaisedSecondary

colors.border.subtle        — Low-contrast dividers
colors.border.strong        — High-contrast borders
colors.border.focus         — Focus ring
colors.border.active        — Active/pressed state

colors.accent.primary       — Primary action color
colors.accent.primaryHover
colors.accent.primaryActive
colors.accent.secondary     — Secondary action accent
colors.accent.highlight     — Selection highlight

colors.status.success / successSurface / successBorder
colors.status.warning / warningSurface / warningBorder
colors.status.danger  / dangerSurface  / dangerBorder
colors.status.info    / infoSurface    / infoBorder

colors.brand.primary / hover / active / surface / border / text
colors.data.blue / violet / amber / emerald / cyan
colors.palette.[20 decorative colors]
```

## Architecture
- `app/` — Expo Router file-based routes
  - `(tabs)/` — Main tab navigator (Chats, Calls, Status, Settings)
  - `(modals)/` — Modal routes presented over tabs
- `src/features/` — Feature modules (chat, settings, calls, status, contacts)
- `src/data/` — Mock data layer (no backend)
- `src/providers/` — React context providers
- `src/hooks/` — Shared hooks
- `src/layouts/` — Responsive layout components
- `src/types/` — TypeScript type definitions
- `src/constants/` — App constants
- `scripts/` — Build/patch scripts

## Current Progress

### COMPLETED
- [x] Phase 0: Published all 3 Wisp packages to npm under @coexist/ scope
- [x] Phase 1: Created Expo project, installed dependencies, set up folder structure
- [x] Phase 2: Foundation — types, constants, hooks, mock data, providers
- [x] Phase 3: Core chat UI — tab layout, three-panel layout, conversation list, chat view
- [x] Phase 4: Chat features — threads, info, members, pinned, search, profiles (14 modal screens)
- [x] Phase 5: Settings — all 10 settings screens + SettingsSection/SettingsRow components
- [x] Phase 6: Secondary features — contacts, calls, status/stories, new chat/group/channel
- [x] Barrel exports fixed: ConversationListItem, MemberList, PinnedMessages, UserProfileCard added to Wisp barrel
- [x] Patch script: `scripts/patch-wisp.sh` + npm postinstall hook

### IN PROGRESS
- [ ] Phase 7: Fix remaining TS errors (theme color paths, component prop types)
- [ ] Phase 7: Web launch and verification

### Route Files (30+ screens)
**Tabs:** chats/index, chats/[chatId], calls/index, status/index, settings/index, settings/profile, settings/account, settings/privacy, settings/notifications, settings/appearance, settings/data-storage, settings/chat-settings, settings/language, settings/about
**Modals:** new-chat, new-group, new-channel, contact-list, add-contact, invite, chat-info/[chatId], members/[chatId], pinned/[chatId], search, profile/[userId], status-viewer, active-call

### Feature Components
- `src/features/chat/` — SidePanel, ChatHeader, ChatFooter, ChatMessageList, useChat
- `src/features/settings/` — SettingsSection, SettingsRow
- `src/features/calls/` — CallHistoryItem, ActiveCallView
- `src/features/status/` — StatusViewer
- `src/features/contacts/` — ContactItem
- `src/layouts/` — ThreePanelLayout

### Mock Data
- users.ts (20 users + current user)
- conversations.ts (15 conversations)
- messages.ts (4 chat threads with reactions/replies)
- contacts.ts (20 contacts)
- calls.ts (11 call records)
- channels.ts (4 categories, 14 channels)
- statuses.ts (6 status items)

## Wisp Components Available
Chat: ChatBubble, MessageGroup, MessageInput, MessageActionBar, TypingIndicator, NewMessageDivider, ConversationListItem, ChannelList, ThreadPanel, MemberList, UserProfileCard, EmojiPicker, VoiceRecorder, AttachmentPreview, FormatToolbar, PinnedMessages, SearchInput
Navigation: Navbar (NavbarBrand, NavbarContent, NavbarItem), Sidebar (SidebarSection, SidebarItem), Tabs (TabList, Tab, TabPanel), Sheet, Dialog
Primitives: Text, Button, Icon, Badge, Input, Toggle, Avatar, AvatarGroup, Checkbox, Radio, Select, Slider, SegmentedControl
Layout: Box, Stack/HStack/VStack, Card, Container, ScrollArea, Separator, ListItem, FormField, Collapse, Overlay

## Key Design Decisions
- Dark mode default (WispProvider mode="dark")
- Three-panel on desktop (>1024px), two-panel on tablet (768-1024), stack on mobile (<768)
- All UI from Wisp — no StyleSheet.create calls
- Mock data only — ready for real backend swap later
- Feature-based folder structure for modularity
- Patch script syncs local Wisp changes without republishing

## Full Plan File
See: ~/.claude/plans/refactored-orbiting-garden.md
