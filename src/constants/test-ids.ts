/**
 * Centralized test IDs for both Detox (iOS) and Playwright (web) E2E tests.
 * Components import these constants to avoid string duplication.
 *
 * Convention: dot notation — `section.subsection.element`
 */

export const TEST_IDS = {
  // ── Auth Screen ────────────────────────────────────────────────────────────
  AUTH: {
    SCREEN: 'auth.screen',
    CREATE_BUTTON: 'auth.create.button',
    IMPORT_BUTTON: 'auth.import.button',
    LOGO: 'auth.logo',
    TAGLINE: 'auth.tagline',
    ACCOUNT_LIST: 'auth.account.list',
    ACCOUNT_ITEM: 'auth.account.item',
    ACCOUNT_REMOVE: 'auth.account.remove',
  },

  // ── Create Wallet Flow ─────────────────────────────────────────────────────
  CREATE: {
    FLOW: 'create.flow',
    // Step 0: Display name
    NAME_INPUT: 'create.name.input',
    NAME_NEXT: 'create.name.next',
    IMPORT_PROFILE_BUTTON: 'create.import.profile.button',
    // Step 1: Recovery phrase
    SEED_PHRASE_GRID: 'create.seed.grid',
    SEED_COPY_BUTTON: 'seed.copy.button',
    SEED_NEXT: 'create.seed.next',
    // Step 2: Backup confirmation
    BACKUP_CHECKBOX: 'create.backup.checkbox',
    BACKUP_NEXT: 'create.backup.next',
    // Step 3: PIN setup
    PIN_STEP: 'create.pin.step',
    // Step 4: Username
    USERNAME_INPUT: 'create.username.input',
    USERNAME_SKIP: 'create.username.skip',
    USERNAME_REGISTER: 'create.username.register',
    // Step 5: Success
    SUCCESS_SCREEN: 'create.success.screen',
    REMEMBER_ME_CHECKBOX: 'create.remember.checkbox',
    SUCCESS_DONE: 'create.success.done',
    // Navigation
    BACK_BUTTON: 'create.back.button',
    STEP_INDICATOR: 'create.step.indicator',
  },

  // ── Import Wallet Flow ─────────────────────────────────────────────────────
  IMPORT: {
    FLOW: 'import.flow',
    // Step 0: Seed phrase input
    SEED_INPUT: 'import.seed.input',
    SEED_PASTE: 'import.seed.paste',
    SEED_NEXT: 'import.seed.next',
    // Step 1: Display name
    NAME_INPUT: 'import.name.input',
    NAME_NEXT: 'import.name.next',
    // Step 2: PIN setup
    PIN_STEP: 'import.pin.step',
    // Step 3: Result
    SUCCESS_SCREEN: 'import.success.screen',
    ERROR_SCREEN: 'import.error.screen',
    RETRY_BUTTON: 'import.retry.button',
    DONE_BUTTON: 'import.done.button',
    // Navigation
    BACK_BUTTON: 'import.back.button',
  },

  // ── PIN ─────────────────────────────────────────────────────────────────────
  PIN: {
    // GrowablePinInput
    INPUT: 'pin.input',
    CELL: 'pin.cell',
    HIDDEN_INPUT: 'pin.hidden.input',
    // PinSetupStep
    SETUP_TITLE: 'pin.setup.title',
    SETUP_SUBTITLE: 'pin.setup.subtitle',
    CONFIRM_TITLE: 'pin.confirm.title',
    SKIP_BUTTON: 'pin.skip.button',
    ERROR_TEXT: 'pin.error.text',
    // PinLockScreen
    LOCK_SCREEN: 'pin.lock.screen',
    LOCK_TITLE: 'pin.lock.title',
    LOCK_SUBTITLE: 'pin.lock.subtitle',
    LOCK_INPUT: 'pin.lock.input',
    LOCK_BACK: 'pin.lock.back',
    LOCK_ERROR: 'pin.lock.error',
    LOCK_COOLDOWN: 'pin.lock.cooldown',
  },

  // ── Seed Phrase Grid ───────────────────────────────────────────────────────
  SEED: {
    GRID: 'seed.grid',
    WORD: 'seed.word',
    COPY_BUTTON: 'seed.copy.button',
    WARNING: 'seed.warning',
  },

  // ── Navigation Rail ────────────────────────────────────────────────────────
  NAV: {
    RAIL: 'nav.rail',
    HOME: 'nav.home',
    FILES: 'nav.files',
    COMMUNITY_ITEM: 'nav.community.item',
    CREATE_COMMUNITY: 'nav.create.community',
    SETTINGS: 'nav.settings',
    AVATAR: 'nav.avatar',
    NOTIFICATIONS: 'nav.notifications',
    DIVIDER: 'nav.divider',
  },

  // ── Chat Sidebar ───────────────────────────────────────────────────────────
  SIDEBAR: {
    CONTAINER: 'sidebar.container',
    SEARCH_INPUT: 'sidebar.search.input',
    FRIENDS_BUTTON: 'sidebar.friends.button',
    GUIDE_BUTTON: 'sidebar.guide.button',
    MARKETPLACE_BUTTON: 'sidebar.marketplace.button',
    NEW_CHAT_BUTTON: 'sidebar.new.chat.button',
    CONVERSATION_LIST: 'sidebar.conversation.list',
    CONVERSATION_ITEM: 'sidebar.conversation.item',
    GROUP_INVITE_SECTION: 'sidebar.group.invite.section',
    GROUP_INVITE_ITEM: 'sidebar.group.invite.item',
    EMPTY_STATE: 'sidebar.empty.state',
  },

  // ── Account Switcher ───────────────────────────────────────────────────────
  ACCOUNT: {
    SWITCHER: 'account.switcher',
    CURRENT: 'account.current',
    LIST: 'account.list',
    ITEM: 'account.item',
    ADD_BUTTON: 'account.add.button',
    REMOVE_BUTTON: 'account.remove.button',
    DID_TEXT: 'account.did.text',
  },

  // ── Main / Chat Page ───────────────────────────────────────────────────────
  MAIN: {
    CONTAINER: 'main.container',
    EMPTY_STATE: 'main.empty.state',
    WELCOME_TEXT: 'main.welcome.text',
  },

  // ── Friends ────────────────────────────────────────────────────────────────
  FRIENDS: {
    PAGE: 'friends.page',
    TAB_ALL: 'friends.tab.all',
    TAB_ONLINE: 'friends.tab.online',
    TAB_PENDING: 'friends.tab.pending',
    TAB_BLOCKED: 'friends.tab.blocked',
    ADD_INPUT: 'friends.add.input',
    ADD_BUTTON: 'friends.add.button',
    ADD_FEEDBACK: 'friends.add.feedback',
    CARD: 'friends.card',
    CARD_NAME: 'friends.card.name',
    CARD_STATUS: 'friends.card.status',
    CARD_ACCEPT: 'friends.card.accept',
    CARD_REJECT: 'friends.card.reject',
    CARD_BLOCK: 'friends.card.block',
    CARD_REMOVE: 'friends.card.remove',
    CARD_MESSAGE: 'friends.card.message',
    EMPTY_STATE: 'friends.empty.state',
    CONNECTION_LINK: 'friends.connection.link',
    COPY_LINK: 'friends.copy.link',
  },

  // ── Chat Header ────────────────────────────────────────────────────────────
  CHAT: {
    HEADER: 'chat.header',
    HEADER_NAME: 'chat.header.name',
    HEADER_STATUS: 'chat.header.status',
    HEADER_AVATAR: 'chat.header.avatar',
    HEADER_BACK: 'chat.header.back',
    CALL_VOICE: 'chat.call.voice',
    CALL_VIDEO: 'chat.call.video',
    SEARCH_BUTTON: 'chat.search.button',
    FILES_BUTTON: 'chat.files.button',
    PINS_BUTTON: 'chat.pins.button',
    MEMBERS_BUTTON: 'chat.members.button',
    SETTINGS_BUTTON: 'chat.settings.button',
  },

  // ── Chat Area ──────────────────────────────────────────────────────────────
  CHAT_AREA: {
    CONTAINER: 'chat.area.container',
    MESSAGE_LIST: 'chat.area.message.list',
    SCROLL_BOTTOM: 'chat.area.scroll.bottom',
    TYPING_INDICATOR: 'chat.area.typing.indicator',
    DATE_DIVIDER: 'chat.area.date.divider',
    EMPTY_STATE: 'chat.area.empty.state',
  },

  // ── Chat Bubble ────────────────────────────────────────────────────────────
  BUBBLE: {
    CONTAINER: 'bubble.container',
    TEXT: 'bubble.text',
    TIMESTAMP: 'bubble.timestamp',
    AVATAR: 'bubble.avatar',
    SENDER_NAME: 'bubble.sender.name',
    REACTIONS: 'bubble.reactions',
    REPLY_PREVIEW: 'bubble.reply.preview',
    FILE_ATTACHMENT: 'bubble.file.attachment',
    IMAGE_ATTACHMENT: 'bubble.image.attachment',
  },

  // ── Chat Input ─────────────────────────────────────────────────────────────
  INPUT: {
    CONTAINER: 'input.container',
    TEXT_INPUT: 'input.text',
    SEND_BUTTON: 'input.send.button',
    EMOJI_BUTTON: 'input.emoji.button',
    ATTACH_BUTTON: 'input.attach.button',
    VOICE_BUTTON: 'input.voice.button',
    REPLY_PREVIEW: 'input.reply.preview',
    REPLY_CLOSE: 'input.reply.close',
  },

  // ── Groups ─────────────────────────────────────────────────────────────────
  GROUPS: {
    CREATE_DIALOG: 'groups.create.dialog',
    NAME_INPUT: 'groups.name.input',
    DESCRIPTION_INPUT: 'groups.description.input',
    MEMBER_PICKER: 'groups.member.picker',
    MEMBER_ITEM: 'groups.member.item',
    CREATE_BUTTON: 'groups.create.button',
    CANCEL_BUTTON: 'groups.cancel.button',
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  SETTINGS: {
    DIALOG: 'settings.dialog',
    CLOSE_BUTTON: 'settings.close.button',
    // Navigation sections
    NAV_ACCOUNT: 'settings.nav.account',
    NAV_PROFILE: 'settings.nav.profile',
    NAV_APPEARANCE: 'settings.nav.appearance',
    NAV_MESSAGING: 'settings.nav.messaging',
    NAV_NOTIFICATIONS: 'settings.nav.notifications',
    NAV_SOUNDS: 'settings.nav.sounds',
    NAV_PRIVACY: 'settings.nav.privacy',
    NAV_AUDIO_VIDEO: 'settings.nav.audio.video',
    NAV_NETWORK: 'settings.nav.network',
    NAV_DATA: 'settings.nav.data',
    NAV_PLUGINS: 'settings.nav.plugins',
    NAV_SHORTCUTS: 'settings.nav.shortcuts',
    NAV_ABOUT: 'settings.nav.about',
    // Sections
    SECTION_ACCOUNT: 'settings.section.account',
    SECTION_PROFILE: 'settings.section.profile',
    SECTION_APPEARANCE: 'settings.section.appearance',
    SECTION_MESSAGING: 'settings.section.messaging',
    SECTION_NOTIFICATIONS: 'settings.section.notifications',
    SECTION_SOUNDS: 'settings.section.sounds',
    SECTION_PRIVACY: 'settings.section.privacy',
    SECTION_AUDIO_VIDEO: 'settings.section.audio.video',
    SECTION_NETWORK: 'settings.section.network',
    SECTION_DATA: 'settings.section.data',
    SECTION_PLUGINS: 'settings.section.plugins',
    SECTION_SHORTCUTS: 'settings.section.shortcuts',
    SECTION_ABOUT: 'settings.section.about',
    // Common controls
    TOGGLE: 'settings.toggle',
    DROPDOWN: 'settings.dropdown',
    // Account
    DID_DISPLAY: 'settings.account.did',
    BACKUP_BUTTON: 'settings.account.backup',
    LOGOUT_BUTTON: 'settings.account.logout',
    DELETE_BUTTON: 'settings.account.delete',
    IDENTITY_CARD: 'settings.account.identity.card',
    // Key Rotation
    ROTATE_KEY_BUTTON: 'settings.account.rotate.key',
    ROTATE_KEY_CONFIRM: 'settings.account.rotate.key.confirm',
    ROTATE_KEY_CANCEL: 'settings.account.rotate.key.cancel',
    ROTATE_KEY_DIALOG: 'settings.account.rotate.key.dialog',
    ROTATE_KEY_SUCCESS: 'settings.account.rotate.key.success',
    ROTATE_KEY_WARNING: 'settings.account.rotate.key.warning',
    // Profile
    DISPLAY_NAME_INPUT: 'settings.profile.display.name',
    BIO_INPUT: 'settings.profile.bio',
    AVATAR_PICKER: 'settings.profile.avatar',
    SAVE_PROFILE: 'settings.profile.save',
    // Appearance
    THEME_SELECTOR: 'settings.appearance.theme',
    DARK_MODE_TOGGLE: 'settings.appearance.dark.mode',
    ACCENT_COLOR: 'settings.appearance.accent.color',
    FONT_SIZE: 'settings.appearance.font.size',
    COMPACT_MODE: 'settings.appearance.compact',
    // Network
    RELAY_STATUS: 'settings.network.relay.status',
    RELAY_URL: 'settings.network.relay.url',
    PEER_COUNT: 'settings.network.peer.count',
  },

  // ── Plugin Marketplace ─────────────────────────────────────────────────────
  PLUGINS: {
    MARKETPLACE: 'plugins.marketplace',
    TAB_BROWSE: 'plugins.tab.browse',
    TAB_INSTALLED: 'plugins.tab.installed',
    TAB_DEVELOPER: 'plugins.tab.developer',
    SEARCH_INPUT: 'plugins.search.input',
    PLUGIN_CARD: 'plugins.card',
    INSTALL_BUTTON: 'plugins.install.button',
    UNINSTALL_BUTTON: 'plugins.uninstall.button',
    ENABLE_TOGGLE: 'plugins.enable.toggle',
  },

  // ── Community ──────────────────────────────────────────────────────────────
  COMMUNITY: {
    SIDEBAR: 'community.sidebar',
    CHANNEL_LIST: 'community.channel.list',
    CHANNEL_ITEM: 'community.channel.item',
    VOICE_CHANNEL: 'community.voice.channel',
    MEMBER_LIST: 'community.member.list',
    MEMBER_ITEM: 'community.member.item',
    CREATE_CHANNEL: 'community.create.channel',
    SETTINGS_BUTTON: 'community.settings.button',
    HEADER: 'community.header',
    NAME: 'community.name',
  },

  // ── Sync ──────────────────────────────────────────────────────────────────
  SYNC: {
    // Settings subsection
    SETTINGS_SECTION: 'sync.settings.section',
    ENABLE_TOGGLE: 'sync.enable.toggle',
    STATUS_INDICATOR: 'sync.status.indicator',
    STATUS_LABEL: 'sync.status.label',
    LAST_SYNCED: 'sync.last.synced',
    SYNC_NOW_BUTTON: 'sync.now.button',
    DELETE_BUTTON: 'sync.delete.button',
    DELETE_CONFIRM: 'sync.delete.confirm',
    // Create wallet sync opt-in
    OPT_IN_CHECKBOX: 'sync.opt.in.checkbox',
    OPT_IN_LABEL: 'sync.opt.in.label',
    // Import wallet sync restore
    RESTORE_CARD: 'sync.restore.card',
    RESTORE_SUMMARY: 'sync.restore.summary',
    RESTORE_BUTTON: 'sync.restore.button',
    SKIP_BUTTON: 'sync.skip.button',
    RESTORE_SUCCESS: 'sync.restore.success',
  },

  // ── Common ─────────────────────────────────────────────────────────────────
  COMMON: {
    LOADING: 'common.loading',
    LOADING_TEXT: 'common.loading.text',
    EMPTY_STATE: 'common.empty.state',
    ERROR_STATE: 'common.error.state',
    MODAL_BACKDROP: 'common.modal.backdrop',
    TOAST: 'common.toast',
    CONFIRM_DIALOG: 'common.confirm.dialog',
    CONFIRM_YES: 'common.confirm.yes',
    CONFIRM_NO: 'common.confirm.no',
  },
} as const;

export type TestId = typeof TEST_IDS;
