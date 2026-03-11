# Domain: Wisp UI Kit

Wisp is Umbra's design system. It lives in the monorepo at `packages/umbra-uikit/`. ALL UI in Umbra is built exclusively with Wisp components.

## Location

```
packages/umbra-uikit/
├── packages/
│   ├── core/           → @coexist/wisp-core (tokens, themes, styles, types)
│   ├── react-native/   → @coexist/wisp-react-native (ALL UI components)
│   └── react/          → @coexist/wisp-react (web-only React version)
├── .storybook/         → Component stories
├── docs/               → Design system documentation
├── stories/            → Component showcases
├── tests/              → Test suite
├── website/            → Design system website
└── scripts/            → Build scripts
```

## Import Pattern

```typescript
import { Button, Text, Input, useTheme } from '@coexist/wisp-react-native';
```

Never import from internal paths. Always use the barrel export.

## Component Catalog

### Primitives (38 components) — `primitives/`

**Input controls:** Button, Input, TextArea, Toggle, Checkbox, Radio, Slider, NumberInput, PinInput, Stepper, ColorPicker, TagInput

**Display:** Text, Badge, Avatar, Chip, Tag, Icon, Indicator, Progress, CircularProgress, Spinner, Skeleton, Rating, Meter, Kbd, Beacon, NotificationBadge, ReadReceipt, CallTimer

**Visual effects:** GradientText, GradientBorder, AnimatedCounter, AuraBurst, ColorSwatch, Toast, Alert

**Media:** WispImage (Image)

### Layouts (21 components) — `layouts/`

Box, Stack, HStack, VStack, Card, Center, Separator, Spacer, Container, ScrollArea, AspectRatio, Grid, FormField, Breadcrumb, ListItem, EmptyState, Sidebar, Collapse, Overlay, Sticky, Floating, AnchoredPopover

### Composed Components (150+ components) — `components/`

**Chat:** ChatBubble, MessageGroup, MessageInput, MessageActionBar, MessageContextMenu, MessageList, MessageSearch, TypingIndicator, ConversationListItem, ConversationView, ConversationList, ChannelList, ChannelHeader, ThreadPanel, ThreadIndicator, ThreadListView, ThreadFollowButton, MemberList, MemberSearchFilter, MemberStatusDisplay, MemberStatusPicker, UserProfileCard, UserMiniCard, UserSearchResult, UserPicker, EmojiPicker, EmojiReactionsOverlay, EmojiManagementPanel, GifPicker, StickerPicker, StickerManagementPanel, VoiceRecorder, PinnedMessages, SearchInput, MentionAutocomplete, CombinedPicker, FormatToolbar, CodeBlock, LinkPreviewCard, NewMessageDivider, SystemMessageRenderer

**Navigation:** Navbar, Sidebar, Tabs, Sheet, Dialog, DropdownMenu, Popover, Tooltip, CommandPalette (Command), SegmentedControl, Pagination, Breadcrumb, ProgressSteps

**Call/Voice:** ActiveCallPanel, CallControls, CallHistoryItem, CallMiniWindow, CallNotification, CallPipWidget, CallStatsOverlay, DevicePicker, GroupCallPanel, VideoGrid, VideoTile, VideoEffectsPanel, ScreenSharePicker, QualitySelector, RecordingIndicator, VoiceChannelPanel, AudioWaveform, PingMeter

**Social:** FriendListItem, FriendRequestItem, FriendSection, AddFriendInput, OnlineStatusIndicator, SocialButton, InviteManager

**Files:** FileCard, FileChannelView, FileContextMenu, FileDetailPanel, FileTransferList, FileTransferProgress, FileTypeAllowlistSettings, FileUploadDialog, FileUploadZone, FileUploader, FolderCard, SharedFolderCard, AttachmentPreview

**Community:** CommunitySidebar, CommunityCreateDialog, ChannelPermissionEditor, PermissionCalculator, PermissionManager, RoleBadge, RoleCreateDialog, RoleHierarchyDisplay, RoleManagementPanel, VanityUrlSettings

**Moderation:** ModerationDashboard, AutoModSettings, TimeoutDialog, ActiveTimeoutsBadge, SlowModeCountdown, WarningDialog, WarningHistoryPanel, ConflictResolutionDialog

**Notifications:** NotificationDrawer, NotificationGroup, NotificationItem, NotificationSettingsPanel, Banner

**Data/Visualization:** DataTable, Table, TreeView, Accordion, Carousel, Timeline, RadarChart, Sparkline, StatCard, ActivityCircles, ActivityFeed, StorageUsageMeter, StorageUsageViz, SyncStatusIndicator

**Settings/Admin:** ThemeEditor, ThemePreview, BrandingSettingsPage, LocalePicker, WebhookCreateDialog, WebhookDetailPage, WebhookManagementPanel, WebhookMessagePreview

**Infrastructure:** BoostNodeDashboard, NodeDetailPanel, NodePairingFlow, NodeRegistrationWizard

**Gamification:** AchievementCard, AchievementUnlock, QuestTracker

**Utility:** ButtonGroup, Calendar, CheckboxGroup, Combobox, CopyButton, DatePicker, DateRangePicker, Select, SwitchGroup, TextEffectPicker, TextEffectWrapper, TimePicker, Toast, ToastProvider, Toolbar, QrCode, E2EEKeyExchangeUI, WarningDialog

## Color Tokens

Access via `const { colors } = useTheme();`

```
colors.background.{canvas, sunken, surface, raised, overlay}
colors.text.{primary, secondary, muted, inverse, link, onRaised}
colors.border.{subtle, strong, focus, active}
colors.accent.{primary, primaryHover, primaryActive, secondary, highlight}
colors.status.{success, warning, danger, info}
colors.status.{successSurface, warningSurface, dangerSurface, infoSurface}
colors.status.{successBorder, warningBorder, dangerBorder, infoBorder}
colors.brand.{primary, hover, active, surface, border, text}
colors.data.{blue, violet, amber, emerald, cyan}
```

## Spacing Scale

All spacing uses multiples of 4: `4, 8, 12, 16, 24, 32, 48`

No arbitrary pixel values. Use Wisp spacing props (padding, margin, gap) or the Box/Stack gap prop.

## Adding to Wisp vs. Using Existing Components

**Use existing Wisp components** for ALL standard UI patterns. Before building anything custom, search the catalog above.

**Add to Wisp** (`packages/umbra-uikit/packages/react-native/src/`) when:
- A genuinely new UI pattern is needed that doesn't exist
- The component is reusable across multiple screens
- It follows the Wisp design system (uses tokens, theming, etc.)

**Never create app-level custom components** for things Wisp already provides. If Wisp's version doesn't quite fit, extend or compose Wisp components — don't recreate them.

## Anti-Patterns (NEVER DO THESE)

1. `StyleSheet.create()` — Use Wisp component props instead
2. Inline style objects with hardcoded colors — Use `useTheme()` tokens
3. Custom `<button>` or `<TouchableOpacity>` — Use Wisp `<Button>`
4. Custom text input wrappers — Use Wisp `<Input>` or `<TextArea>`
5. Manual `<View>` + padding for layout — Use `<Box>`, `<Stack>`, `<Card>`
6. Custom toggle/switch — Use Wisp `<Toggle>`
7. Custom avatar — Use Wisp `<Avatar>` or `<AvatarGroup>`
8. Custom modal/dialog — Use Wisp `<Dialog>` or `<Sheet>`
9. Custom dropdown — Use Wisp `<DropdownMenu>` or `<Select>`
10. Custom tabs — Use Wisp `<Tabs>` or `<SegmentedControl>`
11. Hardcoded hex/rgb colors — Use theme color tokens
12. `fontSize: 14` or similar — Use Wisp `<Text>` size props
