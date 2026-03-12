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

  // Quality
  {
    id: 'ghost:quality',
    command: 'ghost quality',
    label: 'Stream Quality',
    description: 'Set video quality (4k, 1080p, 720p, 480p, auto)',
    icon: '📺',
    category: 'Ghost',
    sendAsMessage: true,
    args: '<preset>',
  },
  {
    id: 'ghost:resolution',
    command: 'ghost resolution',
    label: 'Custom Resolution',
    description: 'Set custom video resolution (e.g. 1920x1080)',
    icon: '🖥️',
    category: 'Ghost',
    sendAsMessage: true,
    args: '<WxH>',
  },
  {
    id: 'ghost:fps',
    command: 'ghost fps',
    label: 'Frame Rate',
    description: 'Set video frame rate (1-120)',
    icon: '🎞️',
    category: 'Ghost',
    sendAsMessage: true,
    args: '<number>',
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
// Swarm commands — available when chatting with Ghost bot
// =============================================================================

export const SWARM_COMMANDS: SlashCommandDef[] = [
  {
    id: 'swarm:summon',
    command: 'swarm summon',
    label: 'Summon Wisps',
    description: 'Befriend all wisps and create a group chat',
    icon: '\uD83D\uDC1D',
    category: 'Swarm',
    sendAsMessage: true,
  },
  {
    id: 'swarm:status',
    command: 'swarm status',
    label: 'Swarm Status',
    description: 'Show wisp swarm status',
    icon: '\uD83D\uDC1D',
    category: 'Swarm',
    sendAsMessage: true,
  },
  {
    id: 'swarm:group',
    command: 'swarm group',
    label: 'Create Group',
    description: 'Create a named group chat with all wisps',
    icon: '\uD83D\uDC1D',
    category: 'Swarm',
    sendAsMessage: true,
    args: '<name>',
  },
  {
    id: 'swarm:list',
    command: 'swarm list',
    label: 'List Wisps',
    description: 'Show available wisps and their personas',
    icon: '\uD83D\uDC1D',
    category: 'Swarm',
    sendAsMessage: true,
  },
  {
    id: 'swarm:scenario',
    command: 'swarm scenario',
    label: 'Run Scenario',
    description: 'Run a wisp scenario (debate, group-chat, etc.)',
    icon: '\uD83D\uDC1D',
    category: 'Swarm',
    sendAsMessage: true,
    args: '<name>',
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

export function isGhostBot(did: string | null | undefined, displayName?: string | null): boolean {
  if (did && KNOWN_GHOST_DIDS.has(did)) return true;
  // Fallback: match by display name (for dev/local Ghost with different DID)
  if (displayName) {
    const lower = displayName.toLowerCase();
    if (lower === 'ghost' || lower.includes('ghost')) return true;
  }
  return false;
}

/**
 * Register an additional Ghost DID at runtime (e.g. from config).
 */
export function registerGhostDid(did: string): void {
  KNOWN_GHOST_DIDS.add(did);
}
