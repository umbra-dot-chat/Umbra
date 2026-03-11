// Wave 1: Simple Layouts
export { Banner } from './banner';
export type { BannerProps } from './banner';
export { ButtonGroup } from './button-group';
export type { ButtonGroupProps } from './button-group';
export { Toolbar, ToolbarGroup, ToolbarSeparator } from './toolbar';
export type { ToolbarProps, ToolbarGroupProps, ToolbarSeparatorProps } from './toolbar';
export { SwitchGroup } from './switch-group';
export type { SwitchGroupProps } from './switch-group';
export { CheckboxGroup } from './checkbox-group';
export type { CheckboxGroupProps } from './checkbox-group';

// Wave 2: Navigation & Display
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion';
export type { AccordionProps, AccordionItemProps, AccordionTriggerProps, AccordionContentProps } from './accordion';
export { Tabs, TabList, Tab, TabPanel } from './tabs';
export type { TabsProps, TabListProps, TabProps, TabPanelProps } from './tabs';
export { SegmentedControl } from './segmented-control';
export type { SegmentedControlProps } from './segmented-control';
export { Pagination } from './pagination';
export type { PaginationProps } from './pagination';
export { Timeline } from './timeline';
export type { TimelineProps, TimelineItem } from './timeline';
export { ActivityFeed } from './activity-feed';
export type { ActivityFeedProps, ActivityFeedItem } from './activity-feed';
export { ProgressSteps } from './progress-steps';
export type { ProgressStepsProps, ProgressStep } from './progress-steps';
export { TreeView } from './tree-view';
export type { TreeViewProps, TreeNode } from './tree-view';

// Wave 3: Overlays & Modals
export { Dialog } from './dialog';
export type { DialogProps } from './dialog';
export { Sheet } from './sheet';
export type { SheetProps } from './sheet';
export { Popover, PopoverTrigger, PopoverContent } from './popover';
export type { PopoverProps, PopoverTriggerProps, PopoverContentProps } from './popover';
export { Tooltip } from './tooltip';
export type { TooltipProps } from './tooltip';
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from './dropdown-menu';
export type { DropdownMenuProps, DropdownMenuTriggerProps, DropdownMenuContentProps, DropdownMenuItemProps, DropdownMenuSeparatorProps } from './dropdown-menu';

// Wave 4: Data Entry
export { Select } from './select';
export type { SelectProps, SelectOption } from './select';
export { Combobox } from './combobox';
export type { ComboboxProps } from './combobox';
export { LocalePicker, DEFAULT_LOCALE_OPTIONS } from './locale-picker';
export type { LocalePickerProps, LocaleOption } from './locale-picker';

// Wave 5: Tables
export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell } from './table';
export type { TableProps, TableHeaderProps, TableBodyProps, TableFooterProps, TableRowProps, TableHeadProps, TableCellProps } from './table';
export { DataTable } from './data-table';
export type { DataTableProps, DataTableColumn, SortState } from './data-table';

// Wave 6: Date/Time & Carousel
export { Calendar } from './calendar';
export type { CalendarProps } from './calendar';
export { DatePicker } from './date-picker';
export type { DatePickerProps } from './date-picker';
export { TimePicker } from './time-picker';
export type { TimePickerProps } from './time-picker';
export { DateRangePicker } from './date-range-picker';
export type { DateRangePickerProps, DateRange } from './date-range-picker';
export { Carousel } from './carousel';
export type { CarouselProps } from './carousel';

// Wave 7: Utilities
export { SocialButton } from './social-button';
export type { SocialButtonProps } from './social-button';
export { CopyButton } from './copy-button';
export type { CopyButtonProps } from './copy-button';
export { PingMeter } from './ping-meter';
export type { PingMeterProps } from './ping-meter';
export { Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandSeparator, CommandEmpty } from './command';
export type { CommandProps, CommandInputProps, CommandListProps, CommandGroupProps, CommandItemProps, CommandSeparatorProps, CommandEmptyProps } from './command';
export { FileUploader } from './file-uploader';
export type { FileUploaderProps } from './file-uploader';

// Wave 8: Chat
export { ChatBubble, StatusIcon } from './chat-bubble';
export type { ChatBubbleProps } from './chat-bubble';
export { MessageGroup } from './message-group';
export type { MessageGroupProps } from './message-group';
export { NewMessageDivider } from './new-message-divider';
export type { NewMessageDividerProps } from './new-message-divider';
export { TypingIndicator } from './typing-indicator';
export type { TypingIndicatorProps } from './typing-indicator';

// Wave 9: Charts
export { ActivityCircles } from './activity-circles';
export type { ActivityCirclesProps } from './activity-circles';
export { RadarChart } from './radar-chart';
export type { RadarChartProps } from './radar-chart';

// Wave 10: QR
export { QRCode } from './qr-code';
export type { QRCodeProps } from './qr-code';

// Wave 11: Parity catch-up
export { AvatarGroup } from './avatar-group';
export type { AvatarGroupProps } from './avatar-group';
export { Navbar, NavbarBrand, NavbarContent, NavbarItem } from './navbar';
export type { NavbarProps, NavbarBrandProps, NavbarContentProps, NavbarItemProps } from './navbar';
export { SearchInput } from './search-input';
export type { SearchInputProps } from './search-input';
export { MessageList } from './message-list';
export type { MessageListProps, MessageListItem, MessageListEntry, DaySeparator, NewMessageMarker } from './message-list';
export { MessageInput } from './message-input';
export type { MessageInputProps } from './message-input';
export { VoiceRecorder } from './voice-recorder';
export type { VoiceRecorderProps } from './voice-recorder';
export { StatCard } from './stat-card';
export type { StatCardProps } from './stat-card';
export { EmojiPicker } from './emoji-picker';
export type { EmojiPickerProps } from './emoji-picker';
export { Sparkline } from './sparkline';
export type { SparklineProps } from './sparkline';
export { AudioWaveform } from './audio-waveform';
export type { AudioWaveformProps } from './audio-waveform';
export { CodeBlock } from './code-block';
export type { CodeBlockProps } from './code-block';
export { AchievementCard } from './achievement-card';
export type { AchievementCardProps } from './achievement-card';
export { QuestTracker } from './quest-tracker';
export type { QuestTrackerProps } from './quest-tracker';
export { AchievementUnlock } from './achievement-unlock';
export type { AchievementUnlockProps } from './achievement-unlock';
export { ToastProvider, useToast } from './toast-provider';
export type { ToastProviderProps } from './toast-provider';

// ThemeEditor
export { ThemeEditor, ThemeEditorField } from './theme-editor';
export type { ThemeEditorProps } from './theme-editor';

// ConversationList
export { ConversationList } from './conversation-list';
export type { ConversationListProps } from './conversation-list';

// ConversationListItem
export { ConversationListItem } from './conversation-list-item';
export type { ConversationListItemProps } from './conversation-list-item';

// LinkPreviewCard
export { LinkPreviewCard } from './link-preview-card';
export type { LinkPreviewCardProps } from './link-preview-card';

// MessageActionBar
export { MessageActionBar } from './message-action-bar';
export type { MessageActionBarProps, MessageAction } from './message-action-bar';

// MentionAutocomplete
export { MentionAutocomplete } from './mention-autocomplete';
export type { MentionAutocompleteProps, MentionUser } from './mention-autocomplete';

// ThreadPanel
export { ThreadPanel } from './thread-panel';
export type { ThreadPanelProps, ThreadMessage } from './thread-panel';

// PinnedMessages
export { PinnedMessages } from './pinned-messages';
export type { PinnedMessagesProps, PinnedMessage } from './pinned-messages';

// FormatToolbar
export { FormatToolbar } from './format-toolbar';
export type { FormatToolbarProps } from './format-toolbar';

// UserProfileCard
export { UserProfileCard } from './user-profile-card';
export type { UserProfileCardProps, ProfileRole, ProfileAction, UserStatus } from './user-profile-card';

// MemberList
export { MemberList } from './member-list';
export type { MemberListProps, MemberListSection, MemberListMember } from './member-list';

// ChannelList
export { ChannelList } from './channel-list';
export type { ChannelListProps, ChannelCategory, ChannelItem, ChannelType } from './channel-list';

// ChannelHeader
export { ChannelHeader } from './channel-header';
export type { ChannelHeaderProps, ChannelHeaderType, ChannelHeaderAction } from './channel-header';

// MessageSearch
export { MessageSearch } from './message-search';
export type { MessageSearchProps } from './message-search';
export type { SearchResult, SearchFilter, SearchFilterType } from './message-search';

// AttachmentPreview
export { AttachmentPreview } from './attachment-preview';
export type { AttachmentPreviewProps } from './attachment-preview/AttachmentPreview';
export type { Attachment, AttachmentFileType } from './attachment-preview';

// Wave 15: Audio & Video
export { CallControls } from './call-controls';
export type { CallControlsProps } from './call-controls';
export { CallMiniWindow } from './call-mini-window';
export type { CallMiniWindowProps, SnapPosition } from './call-mini-window';
export { VoiceChannelPanel } from './voice-channel-panel';
export type { VoiceChannelPanelProps } from './voice-channel-panel';

// CallNotification
export { CallNotification } from './call-notification';
export type { CallNotificationProps } from './call-notification';

// Wave 18: Video Calling
export { VideoTile } from './video-tile';
export type { VideoTileProps } from './video-tile';
export { QualitySelector } from './quality-selector';
export type { QualitySelectorProps } from './quality-selector';
export { DevicePicker } from './device-picker';
export type { DevicePickerProps } from './device-picker';
export { ActiveCallPanel } from './active-call-panel';
export type { ActiveCallPanelProps } from './active-call-panel';
export { CallStatsOverlay } from './call-stats-overlay';
export type { CallStatsOverlayProps } from './call-stats-overlay';

// Wave 19: Group Calling
export { VideoGrid } from './video-grid';
export type { VideoGridProps } from './video-grid';
export { GroupCallPanel } from './group-call-panel';
export type { GroupCallPanelProps } from './group-call-panel';

// Wave 20: Advanced Call Features
export { VideoEffectsPanel } from './video-effects-panel';
export type { VideoEffectsPanelProps } from './video-effects-panel';
export { EmojiReactionsOverlay } from './emoji-reactions-overlay';
export type { EmojiReactionsOverlayProps } from './emoji-reactions-overlay';
export { CallPipWidget } from './call-pip-widget';
export type { CallPipWidgetProps } from './call-pip-widget';
export { CallHistoryItem } from './call-history-item';
export type { CallHistoryItemProps } from './call-history-item';

// Wave 16: Roles & Permissions
export { RoleBadge } from './role-badge';
export type { RoleBadgeProps } from './role-badge';
export { PermissionManager } from './permission-manager';
export type { PermissionManagerProps, Permission, PermissionState } from './permission-manager';
export { RoleCreateDialog } from './role-create-dialog';
export type { RoleCreateDialogProps, RoleCreateData, RolePermissionCategory } from './role-create-dialog';
export { PermissionCalculator } from './permission-calculator';
export type { PermissionCalculatorProps, ComputedPermission } from './permission-calculator';

// Wave 17: Social / Friends
export { FriendListItem } from './friend-list-item';
export type { FriendListItemProps, FriendAction, FriendStatus } from './friend-list-item';
export { FriendRequestItem } from './friend-request-item';
export type { FriendRequestItemProps, FriendRequestType } from './friend-request-item';
export { FriendSection } from './friend-section';
export type { FriendSectionProps } from './friend-section';
export { UserSearchResult } from './user-search-result';
export type { UserSearchResultProps, UserSearchRequestState } from './user-search-result';
export { UserMiniCard } from './user-mini-card';
export type { UserMiniCardProps, UserMiniCardAction, UserMiniCardStatus } from './user-mini-card';
export { AddFriendInput } from './add-friend-input';
export type { AddFriendInputProps, AddFriendFeedbackState } from './add-friend-input';
export { UserPicker } from './user-picker';
export type { UserPickerProps, UserPickerUser, UserPickerStatus } from './user-picker';

// Community / Threads
export { ThreadIndicator } from './thread-indicator';
export type { ThreadIndicatorProps } from './thread-indicator';
export { ThreadListView } from './thread-list-view';
export type { ThreadListViewProps, ThreadListItem } from './thread-list-view';
export { ThreadFollowButton } from './thread-follow-button';
export type { ThreadFollowButtonProps } from './thread-follow-button';

// Community
export { CommunityCreateDialog } from './community-create-dialog';
export type { CommunityCreateDialogProps, CommunityCreateData } from './community-create-dialog';

// CommunitySidebar
export { CommunitySidebar } from './community-sidebar';
export type { CommunitySidebarProps } from './community-sidebar';
export type { CommunitySpace, CommunityInfo } from './community-sidebar';

// InviteManager
export { InviteManager } from './invite-manager';
export type { InviteManagerProps, InviteLink, InviteCreateOptions } from './invite-manager';

// RoleManagementPanel
export { RoleManagementPanel } from './role-management-panel';
export type { RoleManagementPanelProps, ManagedRole, RolePermissionItem, RoleEditorTab, RoleMember } from './role-management-panel';

// ScreenSharePicker
export { ScreenSharePicker } from './screen-share-picker';
export type { ScreenSharePickerProps } from './screen-share-picker';

// RecordingIndicator
export { RecordingIndicator } from './recording-indicator';
export type { RecordingIndicatorProps } from './recording-indicator';

// E2EEKeyExchangeUI
export { E2EEKeyExchangeUI } from './e2ee-key-exchange-ui';
export type { E2EEKeyExchangeUIProps } from './e2ee-key-exchange-ui';

// ConversationView
export { ConversationView } from './conversation-view';
export type { ConversationViewProps } from './conversation-view';

// File Management
export { FolderCard } from './folder-card';
export type { FolderCardProps } from './folder-card';

export { FileCard } from './file-card';
export type { FileCardProps } from './file-card';

export { FileContextMenu, FolderContextMenu } from './file-context-menu';
export type { FileContextMenuProps, FolderContextMenuProps } from './file-context-menu';

export { FileUploadZone } from './file-upload-zone';
export type { FileUploadZoneProps } from './file-upload-zone';

export { FileDetailPanel } from './file-detail-panel';
export type { FileDetailPanelProps } from './file-detail-panel';

export { FileChannelView } from './file-channel-view';
export type { FileChannelViewProps } from './file-channel-view';

export { FileTransferProgress } from './file-transfer-progress';
export type { FileTransferProgressProps, TransferState, TransferStep } from './file-transfer-progress';

export { FileTransferList } from './file-transfer-list';
export type { FileTransferListProps } from './file-transfer-list';

export { SharedFolderCard } from './shared-folder-card';
export type { SharedFolderCardProps, SharedFolderMember, FolderSyncStatus } from './shared-folder-card';

export { SyncStatusIndicator } from './sync-status-indicator';
export type { SyncStatusIndicatorProps } from './sync-status-indicator';

export { StorageUsageMeter } from './storage-usage-meter';
export type { StorageUsageMeterProps, StorageSegment } from './storage-usage-meter';

export { ConflictResolutionDialog } from './conflict-resolution-dialog';
export type { ConflictResolutionDialogProps, ConflictVersion } from './conflict-resolution-dialog';

export { FileTypeAllowlistSettings } from './file-type-allowlist-settings';
export type { FileTypeAllowlistSettingsProps, FileTypePreset } from './file-type-allowlist-settings';

