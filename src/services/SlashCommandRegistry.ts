/**
 * SlashCommandRegistry — central registry for all slash commands.
 *
 * Commands come from three sources:
 * 1. System commands (always available)
 * 2. Bot commands (e.g. Ghost, available when chatting with a bot)
 * 3. Plugin commands (registered by installed plugins)
 */

import type { SlashCommandDef } from '@/hooks/useSlashCommand';

// =============================================================================
// System commands — always available
// =============================================================================

export function getSystemCommands(callbacks: {
  onClear?: () => void;
  onHelp?: () => void;
}): SlashCommandDef[] {
  return [
    {
      id: 'system:help',
      command: 'help',
      label: 'Help',
      description: 'Show available commands',
      icon: '❓',
      category: 'System',
      onExecute: callbacks.onHelp,
    },
    {
      id: 'system:clear',
      command: 'clear',
      label: 'Clear Chat',
      description: 'Clear chat messages from view',
      icon: '🧹',
      category: 'System',
      onExecute: callbacks.onClear,
    },
  ];
}

// =============================================================================
// Ghost AI commands — available when chatting with Ghost bot
// =============================================================================

export const GHOST_COMMANDS: SlashCommandDef[] = [
  // Call Control
  {
    id: 'ghost:help',
    command: 'ghost help',
    label: 'Help',
    description: 'Show all Ghost commands',
    icon: '🤖',
    category: 'Ghost',
    sendAsMessage: true,
  },
  {
    id: 'ghost:status',
    command: 'ghost status',
    label: 'Call Status',
    description: 'Show active call info',
    icon: '📞',
    category: 'Ghost',
    sendAsMessage: true,
  },
  {
    id: 'ghost:end',
    command: 'ghost end',
    label: 'End Call',
    description: 'End the current call',
    icon: '📵',
    category: 'Ghost',
    sendAsMessage: true,
  },
  {
    id: 'ghost:upgrade',
    command: 'ghost upgrade',
    label: 'Upgrade to Video',
    description: 'Add video to a voice call',
    icon: '📹',
    category: 'Ghost',
    sendAsMessage: true,
  },
  {
    id: 'ghost:downgrade',
    command: 'ghost downgrade',
    label: 'Downgrade to Voice',
    description: 'Remove video from call',
    icon: '🔇',
    category: 'Ghost',
    sendAsMessage: true,
  },

  // Audio
  {
    id: 'ghost:tracks',
    command: 'ghost tracks',
    label: 'List Audio Tracks',
    description: 'Show available audio tracks',
    icon: '🎵',
    category: 'Ghost',
    sendAsMessage: true,
  },
  {
    id: 'ghost:play',
    command: 'ghost play',
    label: 'Play Track',
    description: 'Play a specific audio track',
    icon: '▶️',
    category: 'Ghost',
    sendAsMessage: true,
    args: '<track-id>',
  },
  {
    id: 'ghost:next',
    command: 'ghost next',
    label: 'Next Track',
    description: 'Skip to next audio track',
    icon: '⏭️',
    category: 'Ghost',
    sendAsMessage: true,
  },
  {
    id: 'ghost:pause',
    command: 'ghost pause',
    label: 'Pause Playback',
    description: 'Pause audio and video',
    icon: '⏸️',
    category: 'Ghost',
    sendAsMessage: true,
  },
  {
    id: 'ghost:resume',
    command: 'ghost resume',
    label: 'Resume Playback',
    description: 'Resume audio and video',
    icon: '▶️',
    category: 'Ghost',
    sendAsMessage: true,
  },

  // Video
  {
    id: 'ghost:videos',
    command: 'ghost videos',
    label: 'List Videos',
    description: 'Show available video files',
    icon: '📹',
    category: 'Ghost',
    sendAsMessage: true,
  },
  {
    id: 'ghost:play-video',
    command: 'ghost play-video',
    label: 'Play Video',
    description: 'Play a specific video file',
    icon: '🎬',
    category: 'Ghost',
    sendAsMessage: true,
    args: '<video-id>',
  },
  {
    id: 'ghost:next-video',
    command: 'ghost next-video',
    label: 'Next Video',
    description: 'Skip to next video',
    icon: '⏭️',
    category: 'Ghost',
    sendAsMessage: true,
  },

  // Files
  {
    id: 'ghost:files',
    command: 'ghost files',
    label: 'List Files',
    description: 'Show available files to send',
    icon: '📁',
    category: 'Ghost',
    sendAsMessage: true,
    args: '[category]',
  },
  {
    id: 'ghost:send',
    command: 'ghost send',
    label: 'Send File',
    description: 'Send a file by ID or name',
    icon: '📤',
    category: 'Ghost',
    sendAsMessage: true,
    args: '<file-id or name>',
  },
];

// =============================================================================
// Helpers
// =============================================================================

/**
 * Check if a friend DID belongs to a Ghost bot.
 * For now this uses a static list; eventually bots could self-identify.
 */
const KNOWN_GHOST_DIDS = new Set([
  'did:key:z6MkhSo7UBSqfsnF6dM2iw5qbPbKoKBHQ6XnAGGMo7XV5Fyd', // Ghost EN
]);

export function isGhostBot(did: string | null | undefined): boolean {
  if (!did) return false;
  return KNOWN_GHOST_DIDS.has(did);
}

/**
 * Register an additional Ghost DID at runtime (e.g. from config).
 */
export function registerGhostDid(did: string): void {
  KNOWN_GHOST_DIDS.add(did);
}
