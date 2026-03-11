import type { ComponentEntry } from '../types';
import { commandEntry } from './command';
import { comboboxEntry } from './combobox';
import { selectEntry } from './select';
import { segmentedControlEntry } from './segmented-control';
import { switchGroupEntry } from './switch-group';
import { checkboxGroupEntry } from './checkbox-group';
import { dropdownMenuEntry } from './dropdown-menu';
import { popoverEntry } from './popover';
import { tooltipEntry } from './tooltip';
import { tabsEntry } from './tabs';
import { accordionEntry } from './accordion';
import { progressStepsEntry } from './progress-steps';
import { timelineEntry } from './timeline';
import { tableEntry } from './table';
import { dataTableEntry } from './data-table';
import { paginationEntry } from './pagination';
import { treeViewEntry } from './tree-view';
import { dialogEntry } from './dialog';
import { sheetEntry } from './sheet';
import { buttonGroupEntry } from './button-group';
import { socialButtonEntry } from './social-button';
import { copyButtonEntry } from './copy-button';
import { toolbarEntry } from './toolbar';
import { bannerEntry } from './banner';
import { activityFeedEntry } from './activity-feed';
import { fileUploaderEntry } from './file-uploader';
import { calendarEntry } from './calendar';
import { datePickerEntry } from './date-picker';
import { timePickerEntry } from './time-picker';
import { dateRangePickerEntry } from './date-range-picker';
import { localePickerEntry } from './locale-picker';
import { carouselEntry } from './carousel';
import { pingMeterEntry } from './ping-meter';
import { avatarGroupEntry } from './avatar-group';
import { searchInputEntry } from './search-input';
import { navbarEntry } from './navbar';
import { contextMenuEntry } from './context-menu';
import { toastProviderEntry } from './toast-provider';
import { chatBubbleEntry } from './chat-bubble';
import { messageGroupEntry } from './message-group';
import { newMessageDividerEntry } from './new-message-divider';
import { typingIndicatorEntry } from './typing-indicator';
import { activityCirclesEntry } from './activity-circles';
import { radarChartEntry } from './radar-chart';
import { qrCodeEntry } from './qr-code';
import { coachmarkEntry } from './coachmark';
import { spotlightTourEntry } from './spotlight-tour';
import { achievementCardEntry } from './achievement-card';
import { questTrackerEntry } from './quest-tracker';
import { achievementUnlockEntry } from './achievement-unlock';

import { mediaPlayerEntry } from './media-player';
import { audioWaveformEntry } from './audio-waveform';
import { reactionBarEntry } from './reaction-bar';
import { messageInputEntry } from './message-input';
import { voiceRecorderEntry } from './voice-recorder';
import { emojiPickerEntry } from './emoji-picker';
import { themeEditorEntry } from './theme-editor';
import { conversationListItemEntry } from './conversation-list-item';
import { linkPreviewCardEntry } from './link-preview-card';
import { messageActionBarEntry } from './message-action-bar';
import { mentionAutocompleteEntry } from './mention-autocomplete';
import { threadPanelEntry } from './thread-panel';
import { pinnedMessagesEntry } from './pinned-messages';
import { formatToolbarEntry } from './format-toolbar';
import { userProfileCardEntry } from './user-profile-card';
import { memberListEntry } from './member-list';
import { channelListEntry } from './channel-list';
import { messageSearchEntry } from './message-search';
import { attachmentPreviewEntry } from './attachment-preview';

import { callControlsEntry } from './call-controls';
import { callMiniWindowEntry } from './call-mini-window';
import { voiceChannelPanelEntry } from './voice-channel-panel';
import { groupCallPanelEntry } from './group-call-panel';
import { roleBadgeEntry } from './role-badge';
import { permissionManagerEntry } from './permission-manager';

import { friendListItemEntry } from './friend-list-item';
import { friendRequestItemEntry } from './friend-request-item';
import { userSearchResultEntry } from './user-search-result';
import { friendSectionEntry } from './friend-section';
import { userMiniCardEntry } from './user-mini-card';
import { addFriendInputEntry } from './add-friend-input';

// Community
import { communityCreateDialogEntry } from './community-create-dialog';
import { communitySidebarEntry } from './community-sidebar';
import { channelHeaderEntry } from './channel-header';
import { inviteManagerEntry } from './invite-manager';
import { roleManagementPanelEntry } from './role-management-panel';
import { e2eeKeyExchangeUIEntry } from './e2ee-key-exchange-ui';
import { conversationViewEntry } from './conversation-view';

// File Management
import { folderCardEntry } from './folder-card';

// Notifications
import { notificationItemEntry } from './notification-item';
import { notificationGroupEntry } from './notification-group';
import { notificationDrawerEntry } from './notification-drawer';
import { notificationBellEntry } from './notification-bell';

export const componentEntries: ComponentEntry[] = [
  commandEntry,
  comboboxEntry,
  selectEntry,
  segmentedControlEntry,
  switchGroupEntry,
  checkboxGroupEntry,
  dropdownMenuEntry,
  popoverEntry,
  tooltipEntry,
  tabsEntry,
  accordionEntry,
  progressStepsEntry,
  timelineEntry,
  tableEntry,
  dataTableEntry,
  paginationEntry,
  treeViewEntry,
  dialogEntry,
  sheetEntry,
  buttonGroupEntry,
  socialButtonEntry,
  copyButtonEntry,
  toolbarEntry,
  bannerEntry,
  activityFeedEntry,
  fileUploaderEntry,
  calendarEntry,
  datePickerEntry,
  timePickerEntry,
  dateRangePickerEntry,
  localePickerEntry,
  carouselEntry,
  pingMeterEntry,
  avatarGroupEntry,
  searchInputEntry,
  navbarEntry,
  contextMenuEntry,
  toastProviderEntry,
  chatBubbleEntry,
  messageGroupEntry,
  newMessageDividerEntry,
  typingIndicatorEntry,
  activityCirclesEntry,
  radarChartEntry,
  qrCodeEntry,
  coachmarkEntry,
  spotlightTourEntry,
  achievementCardEntry,
  questTrackerEntry,
  achievementUnlockEntry,

  mediaPlayerEntry,
  audioWaveformEntry,
  reactionBarEntry,
  messageInputEntry,
  voiceRecorderEntry,
  emojiPickerEntry,
  themeEditorEntry,
  conversationListItemEntry,
  linkPreviewCardEntry,
  messageActionBarEntry,
  mentionAutocompleteEntry,
  threadPanelEntry,
  pinnedMessagesEntry,
  formatToolbarEntry,
  userProfileCardEntry,
  memberListEntry,
  channelListEntry,
  messageSearchEntry,
  attachmentPreviewEntry,

  // Wave 15 — Audio & Video
  callControlsEntry,
  callMiniWindowEntry,
  voiceChannelPanelEntry,
  groupCallPanelEntry,

  // Wave 16 — Roles & Permissions
  roleBadgeEntry,
  permissionManagerEntry,

  // Wave 17 — Social / Friends
  friendListItemEntry,
  friendRequestItemEntry,
  userSearchResultEntry,
  friendSectionEntry,
  userMiniCardEntry,
  addFriendInputEntry,

  // Wave 18 — Community
  communityCreateDialogEntry,
  communitySidebarEntry,
  channelHeaderEntry,
  inviteManagerEntry,
  roleManagementPanelEntry,
  e2eeKeyExchangeUIEntry,
  conversationViewEntry,

  // File Management
  folderCardEntry,

  // Notifications
  notificationBellEntry,
  notificationItemEntry,
  notificationGroupEntry,
  notificationDrawerEntry,
];
