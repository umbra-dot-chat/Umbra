/**
 * @wisp-ui/react-native
 *
 * React Native adapter for the Wisp design system.
 * Provides primitives, layout components, and the WispProvider for theme management.
 */

// ---------------------------------------------------------------------------
// Providers & Hooks
// ---------------------------------------------------------------------------
export { WispProvider } from './providers';
export type { WispProviderProps, WispThemeContextValue } from './providers';
export { WispThemeContext } from './providers';
export { useTheme, useThemeColors } from './providers';
export type { UseThemeReturn } from './providers';
export { useMotion, MotionProvider } from './providers';
export type { MotionPreferences, MotionCategory, MotionContextValue } from './providers';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------
export {
  Text, Badge, Button, Input, Toggle,
  Spinner, Progress, Checkbox, Radio, RadioGroup,
  Slider, TextArea, NumberInput, PinInput, Stepper,
  Toast, ColorSwatch, Meter, Kbd, Icon,
  Avatar, Chip, Tag, Indicator,
  Alert, Skeleton, Rating, CircularProgress,
  TagInput, ColorPicker,
  NotificationBadge, ReadReceipt, WispImage, Beacon,
  CallTimer, GradientText, GradientBorder, AnimatedCounter, AuraBurst,
} from './primitives';
export type {
  TextProps, BadgeProps, ButtonProps, InputProps, ToggleProps,
  SpinnerProps, ProgressProps, CheckboxProps, RadioProps, RadioGroupProps,
  SliderProps, TextAreaProps, NumberInputProps, PinInputProps, StepperProps,
  ToastProps, ColorSwatchProps, MeterProps, KbdProps, IconProps,
  AvatarProps, ChipProps, TagProps, IndicatorProps,
  AlertProps, SkeletonProps, RatingProps, CircularProgressProps,
  TagInputProps, ColorPickerProps,
  NotificationBadgeProps, ReadReceiptProps, WispImageProps, BeaconProps,
  CallTimerProps, GradientTextProps, GradientBorderProps, AnimatedCounterProps, AuraBurstProps,
} from './primitives';

// ---------------------------------------------------------------------------
// Layouts
// ---------------------------------------------------------------------------
export {
  Stack, HStack, VStack, Box, Card, Center, Separator, Spacer, Container, ScrollArea,
  AspectRatio, Grid, GridItem, FormField,
  Breadcrumb, BreadcrumbItem, BreadcrumbSeparator,
  ListItem, EmptyState,
  Sidebar, SidebarSection, SidebarItem,
  Collapse, Overlay, Sticky,
  Floating, AnchoredPopover,
} from './layouts';
export type {
  StackProps,
  StackDirection,
  StackGap,
  StackAlign,
  StackJustify,
  BoxProps,
  SpacingToken,
  RadiusToken,
  CardProps,
  CardVariant,
  CardPadding,
  CardRadius,
  CenterProps,
  SeparatorProps,
  SeparatorOrientation,
  SeparatorVariant,
  SeparatorSpacing,
  SpacerProps,
  SpacerSize,
  ContainerProps,
  ContainerSize,
  ScrollAreaProps,
  ScrollAreaDirection,
  AspectRatioProps,
  GridProps,
  GridItemProps,
  FormFieldProps,
  FormFieldOrientation,
  BreadcrumbProps,
  BreadcrumbItemProps,
  BreadcrumbSeparatorProps,
  ListItemProps,
  EmptyStateProps,
  SidebarProps,
  SidebarSectionProps,
  SidebarItemProps,
  CollapseProps,
  OverlayProps,
  StickyProps,
  FloatingProps,
  AnchoredPopoverProps,
} from './layouts';

// ---------------------------------------------------------------------------
// Components (Compound)
// ---------------------------------------------------------------------------
export {
  // Wave 1: Simple Layouts
  Banner, ButtonGroup, Toolbar, ToolbarGroup, ToolbarSeparator,
  SwitchGroup, CheckboxGroup,
  // Wave 2: Navigation & Display
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  Tabs, TabList, Tab, TabPanel,
  SegmentedControl, Pagination, Timeline, ActivityFeed,
  ProgressSteps, TreeView,
  // Wave 3: Overlays & Modals
  Dialog, Sheet, Popover, PopoverTrigger, PopoverContent,
  Tooltip, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
  // Wave 4: Data Entry
  Select, Combobox, LocalePicker, DEFAULT_LOCALE_OPTIONS,
  // Wave 5: Tables
  Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell,
  DataTable,
  // Wave 6: Date/Time & Carousel
  Calendar, DatePicker, TimePicker, DateRangePicker, Carousel,
  // Wave 7: Utilities
  SocialButton, CopyButton, PingMeter,
  Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandSeparator, CommandEmpty,
  FileUploader,
  // Wave 8: Chat
  ChatBubble, StatusIcon, MessageGroup, NewMessageDivider, TypingIndicator,
  // Wave 9: Charts
  ActivityCircles, RadarChart,
  // Wave 10: QR
  QRCode,
  // Wave 11: Parity catch-up
  AvatarGroup,
  Navbar, NavbarBrand, NavbarContent, NavbarItem,
  SearchInput, MessageInput, VoiceRecorder, StatCard, EmojiPicker,
  Sparkline, AudioWaveform, CodeBlock,
  AchievementCard, QuestTracker, AchievementUnlock,
  ToastProvider, useToast,
  ThemeEditor, ThemeEditorField,
  // AttachmentPreview
  AttachmentPreview,
  // LinkPreviewCard
  LinkPreviewCard,
  // Wave 12: Chat extended
  ConversationList, ConversationListItem, MessageList, MemberList, PinnedMessages, UserProfileCard,
  ChannelList,
  ChannelHeader,
  // Wave 13: Thread & Actions
  ThreadPanel, MessageActionBar,
  // Wave 14: MessageSearch
  MessageSearch,
  // MentionAutocomplete
  MentionAutocomplete,
  // Wave 15: Audio & Video
  CallControls, CallMiniWindow, VoiceChannelPanel,
  CallNotification,
  // Wave 18: Video Calling
  VideoTile, QualitySelector, DevicePicker, ActiveCallPanel, CallStatsOverlay,
  // Wave 19: Group Calling
  VideoGrid, GroupCallPanel,
  // Wave 20: Advanced Call Features
  VideoEffectsPanel, EmojiReactionsOverlay, CallPipWidget, CallHistoryItem,
  // Wave 16: Roles & Permissions
  RoleBadge, PermissionManager,
  // Wave 17: Social / Friends
  FriendListItem, FriendRequestItem, FriendSection,
  UserSearchResult, UserMiniCard, AddFriendInput, UserPicker,
  // Community / Threads
  ThreadIndicator, ThreadListView, ThreadFollowButton,
  // Community
  CommunityCreateDialog,
  CommunitySidebar,
  InviteManager,
  // RoleManagementPanel
  RoleManagementPanel,
  // ScreenSharePicker & RecordingIndicator
  ScreenSharePicker, RecordingIndicator,
  // File Sharing — new components
  FileTransferProgress, FileTransferList, SharedFolderCard,
  SyncStatusIndicator, StorageUsageMeter,
  ConflictResolutionDialog, FileTypeAllowlistSettings,
  // FormatToolbar
  FormatToolbar,
} from './components';
export type {
  // Wave 1
  BannerProps, ButtonGroupProps,
  ToolbarProps, ToolbarGroupProps, ToolbarSeparatorProps,
  SwitchGroupProps, CheckboxGroupProps,
  // Wave 2
  AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps,
  TabsProps, TabListProps, TabProps, TabPanelProps,
  SegmentedControlProps, PaginationProps,
  TimelineProps, TimelineItem,
  ActivityFeedProps, ActivityFeedItem,
  ProgressStepsProps, ProgressStep,
  TreeViewProps, TreeNode,
  // Wave 3
  DialogProps, SheetProps,
  PopoverProps, PopoverTriggerProps, PopoverContentProps,
  TooltipProps,
  DropdownMenuProps, DropdownMenuTriggerProps, DropdownMenuContentProps,
  DropdownMenuItemProps, DropdownMenuSeparatorProps,
  // Wave 4
  SelectProps, SelectOption,
  ComboboxProps, LocalePickerProps, LocaleOption,
  // Wave 5
  TableProps, TableHeaderProps, TableBodyProps, TableFooterProps,
  TableRowProps, TableHeadProps, TableCellProps,
  DataTableProps, DataTableColumn, SortState,
  // Wave 6
  CalendarProps, DatePickerProps, TimePickerProps,
  DateRangePickerProps, DateRange, CarouselProps,
  // Wave 7
  SocialButtonProps, CopyButtonProps, PingMeterProps,
  CommandProps, CommandInputProps, CommandListProps, CommandGroupProps,
  CommandItemProps, CommandSeparatorProps, CommandEmptyProps,
  FileUploaderProps,
  // Wave 8: Chat
  ChatBubbleProps, MessageGroupProps, NewMessageDividerProps, TypingIndicatorProps,
  // Wave 9: Charts
  ActivityCirclesProps, RadarChartProps,
  // Wave 10: QR
  QRCodeProps,
  // Wave 11: Parity catch-up
  AvatarGroupProps,
  NavbarProps, NavbarBrandProps, NavbarContentProps, NavbarItemProps,
  SearchInputProps, MessageInputProps, VoiceRecorderProps, StatCardProps, EmojiPickerProps,
  SparklineProps, AudioWaveformProps, CodeBlockProps,
  AchievementCardProps, QuestTrackerProps, AchievementUnlockProps,
  ToastProviderProps,
  // AttachmentPreview
  AttachmentPreviewProps,
  Attachment, AttachmentFileType,
  // LinkPreviewCard
  LinkPreviewCardProps,
  // Wave 12: Chat extended
  ConversationListProps, ConversationListItemProps,
  MessageListProps, MessageListItem, MessageListEntry, DaySeparator, NewMessageMarker,
  MemberListProps, MemberListSection, MemberListMember,
  PinnedMessagesProps, PinnedMessage,
  UserProfileCardProps, ProfileRole, ProfileAction,
  ChannelListProps, ChannelCategory, ChannelItem, ChannelType,
  ChannelHeaderProps, ChannelHeaderType, ChannelHeaderAction,
  // Wave 13: Thread & Actions
  ThreadPanelProps, ThreadMessage,
  MessageActionBarProps, MessageAction,
  // Wave 14: MessageSearch
  MessageSearchProps,
  // MentionAutocomplete
  MentionAutocompleteProps, MentionUser,
  // Wave 15: Audio & Video
  CallControlsProps,
  CallMiniWindowProps, SnapPosition,
  VoiceChannelPanelProps,
  CallNotificationProps,
  // Wave 18: Video Calling
  VideoTileProps, QualitySelectorProps, DevicePickerProps,
  ActiveCallPanelProps, CallStatsOverlayProps,
  // Wave 19: Group Calling
  VideoGridProps, GroupCallPanelProps,
  // Wave 20: Advanced Call Features
  VideoEffectsPanelProps, EmojiReactionsOverlayProps, CallPipWidgetProps, CallHistoryItemProps,
  // Wave 16: Roles & Permissions
  RoleBadgeProps,
  PermissionManagerProps, Permission, PermissionState,
  // Wave 17: Social / Friends
  FriendListItemProps, FriendAction, FriendStatus,
  FriendRequestItemProps, FriendRequestType,
  FriendSectionProps,
  UserSearchResultProps, UserSearchRequestState,
  UserMiniCardProps, UserMiniCardAction, UserMiniCardStatus,
  AddFriendInputProps, AddFriendFeedbackState,
  UserPickerProps, UserPickerUser, UserPickerStatus,
  // Community / Threads
  ThreadIndicatorProps,
  ThreadListViewProps, ThreadListItem,
  ThreadFollowButtonProps,
  // Community
  CommunityCreateDialogProps, CommunityCreateData,
  CommunitySidebarProps, CommunitySpace, CommunityInfo,
  InviteManagerProps, InviteLink, InviteCreateOptions,
  // RoleManagementPanel
  RoleManagementPanelProps, ManagedRole, RolePermissionCategory, RolePermissionItem, RoleEditorTab, RoleMember,
  // ScreenSharePicker & RecordingIndicator
  ScreenSharePickerProps,
  RecordingIndicatorProps,
  // File Sharing — new components
  FileTransferProgressProps, TransferState, TransferStep,
  FileTransferListProps,
  SharedFolderCardProps, SharedFolderMember, FolderSyncStatus,
  SyncStatusIndicatorProps,
  StorageUsageMeterProps, StorageSegment,
  ConflictResolutionDialogProps, ConflictVersion,
  FileTypeAllowlistSettingsProps, FileTypePreset,
  // FormatToolbar
  FormatToolbarProps,
} from './components';

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------
export { LoadingContext } from './contexts/LoadingContext';

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export {
  useLoading, useControllable, useFocusVisible,
  useBreakpoint, breakpoints, usePlatform, useId,
} from './hooks';
export type {
  UseControllableConfig, UseFocusVisibleReturn,
  Breakpoint, PlatformType, UsePlatformReturn,
} from './hooks';

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------
export {
  Presence, useAnimatedValue, usePressAnimation,
  useSpring, useTransition, useTextScramble,
} from './animation';
export type {
  PresenceProps, PresenceAnimation,
  AnimatedValueConfig, AnimatedValueResult,
  PressAnimationConfig, PressAnimationResult,
  SpringResult, TransitionPhase, TransitionConfig, TransitionResult,
  TextScrambleOptions, TextScrambleResult,
} from './animation';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
export { stripWebProps, toRNShadow } from './utils';

// Emoji Management Panel
export { EmojiManagementPanel } from './components/emoji-management-panel';
export type { EmojiManagementPanelProps } from './components/emoji-management-panel';
export type { CustomEmoji } from '@coexist/wisp-core/types/EmojiManagementPanel.types';

// Sticker Picker
export { StickerPicker } from './components/sticker-picker';
export type { StickerPickerProps } from './components/sticker-picker';
export type { StickerPickerPack, StickerPickerSize } from '@coexist/wisp-core/types/StickerPicker.types';

// GIF Picker
export { GifPicker } from './components/gif-picker';
export type { GifPickerProps } from './components/gif-picker';
export type { GifItem } from '@coexist/wisp-core/types/GifPicker.types';

// Combined Picker (Emoji + GIFs tabbed)
export { CombinedPicker } from './components/combined-picker';
export type { CombinedPickerProps, CombinedPickerTab } from './components/combined-picker';

// Sticker Management Panel
export { StickerManagementPanel } from './components/sticker-management-panel';
export type { StickerManagementPanelProps } from './components/sticker-management-panel';
export type { Sticker as WispSticker, StickerPack as WispStickerPack } from '@coexist/wisp-core/types/StickerManagementPanel.types';

// Format Toolbar (types re-exported from wisp-core)
export type { FormatAction } from '@coexist/wisp-core/types/FormatToolbar.types';
export { formatActions } from '@coexist/wisp-core/types/FormatToolbar.types';

// Text Effect Picker
export { TextEffectPicker } from './components/text-effect-picker';
export type { TextEffectPickerProps, TextEffectType, TextEffectInfo } from './components/text-effect-picker';
export { textEffects, textEffectInfoMap } from './components/text-effect-picker';

// Text Effect Wrapper (animations)
export { TextEffectWrapper } from './components/text-effect-wrapper';
export type { TextEffectWrapperProps } from './components/text-effect-wrapper';

// Notification system
export { NotificationItem } from './components/notification-item';
export type { NotificationItemProps, NotificationType, NotificationAction } from './components/notification-item';

export { NotificationGroup } from './components/notification-group';
export type { NotificationGroupProps } from './components/notification-group';

export { NotificationDrawer } from './components/notification-drawer';
export type { NotificationDrawerProps, NotificationCategory } from './components/notification-drawer';

// Re-exports added by patch-wisp.sh for deep import compatibility
export { E2EEKeyExchangeUI } from './components/e2ee-key-exchange-ui';
export type { E2EEKeyExchangeUIProps } from './components/e2ee-key-exchange-ui';
export type { SearchResult, SearchFilter, SearchFilterType } from './components/message-search';
