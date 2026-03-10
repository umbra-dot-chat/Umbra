# Domain: Expo Frontend

## Stack

- **Expo SDK 54** with React 19 and React Native 0.81
- **Expo Router v6** — file-based routing
- **@coexist/wisp-react-native** — ALL UI components
- **TypeScript strict mode**
- **Dark mode default**

## Routing

File-based routes in `app/`:

```
app/
├── (tabs)/              # Tab navigator
│   ├── chats/
│   │   ├── index.tsx    # Chat list
│   │   └── [chatId].tsx # Individual chat
│   ├── calls/
│   │   └── index.tsx    # Call history
│   ├── status/
│   │   └── index.tsx    # Status/stories
│   └── settings/
│       ├── index.tsx    # Settings menu
│       ├── profile.tsx  # Profile settings
│       ├── account.tsx  # Account settings
│       └── ...          # 10+ settings screens
└── (modals)/            # Modal routes
    ├── active-call.tsx  # Active call UI
    ├── new-chat.tsx     # New chat dialog
    └── ...              # 13+ modal screens
```

## UI Rules (CRITICAL)

1. **ALL UI uses Wisp components.** No `StyleSheet.create()`. No inline styles. No custom components.
2. **Colors via `useTheme()`:** `const { colors } = useTheme();`
3. **Responsive layout:**
   - Desktop (>1024px): Three-panel layout
   - Tablet (768-1024px): Two-panel
   - Mobile (<768px): Stack navigation

## Wisp Component Categories

**Chat:** ChatBubble, MessageGroup, MessageInput, MessageActionBar, TypingIndicator, ConversationListItem, ChannelList, ThreadPanel, MemberList, UserProfileCard, EmojiPicker, VoiceRecorder, PinnedMessages, SearchInput

**Navigation:** Navbar, Sidebar, Tabs, Sheet, Dialog

**Primitives:** Text, Button, Icon, Badge, Input, Toggle, Avatar, AvatarGroup, Checkbox, Radio, Select, Slider, SegmentedControl

**Layout:** Box, Stack/HStack/VStack, Card, Container, ScrollArea, Separator, ListItem, FormField, Collapse, Overlay

## Color Tokens

Access via `colors` from `useTheme()`:

```
colors.background.{canvas, sunken, surface, raised, overlay}
colors.text.{primary, secondary, muted, inverse, link, onRaised}
colors.border.{subtle, strong, focus, active}
colors.accent.{primary, primaryHover, primaryActive, secondary, highlight}
colors.status.{success, warning, danger, info} + Surface/Border variants
colors.brand.{primary, hover, active, surface, border, text}
colors.data.{blue, violet, amber, emerald, cyan}
```

## State Management

- **React Context** (not Redux): 19 context providers in `src/contexts/`
- **Custom hooks**: 49 hooks in `src/hooks/`
- Always check existing hooks before creating new ones

## Key Contexts

| Context | File | Purpose |
|---------|------|---------|
| CallContext | `src/contexts/CallContext.tsx` | Call lifecycle, WebRTC, stats |
| ChatContext | `src/contexts/ChatContext.tsx` | Message state |
| PluginContext | `src/contexts/PluginContext.tsx` | Plugin lifecycle |
| CommunityContext | `src/contexts/CommunityContext.tsx` | Communities, channels |
| DeveloperSettingsContext | `src/contexts/DeveloperSettingsContext.tsx` | Debug toggles |

## Wisp UI Sync

When the Wisp UI kit is modified locally (at `../Wisp/`):

```bash
npm run patch              # Syncs to node_modules/@coexist/
```

This also runs on `npm install` via postinstall hook.

## Common Tasks

### Adding a New Screen

1. Create route file in `app/(tabs)/` or `app/(modals)/`
2. Use Wisp layout components (Box, Stack, Card)
3. Use Wisp primitives for all UI
4. Add to navigation if needed

### Adding a New Context/Hook

1. Check existing 19 contexts and 49 hooks first
2. Create in `src/contexts/` or `src/hooks/`
3. Wrap in provider at app root if it's a context
