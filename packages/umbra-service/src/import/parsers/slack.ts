/**
 * Slack Export Parser
 *
 * Parses Slack workspace export format.
 * Workspace owners can export data via Settings → Import/Export Data.
 *
 * @packageDocumentation
 */

import type {
  ImportParseResult,
  ImportedConversation,
  ImportedMessage,
  ImportedParticipant,
  ImportedReaction,
} from '../types';

/**
 * Slack user from users.json.
 */
interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  profile?: {
    display_name?: string;
    real_name?: string;
    image_72?: string;
  };
  is_bot?: boolean;
  deleted?: boolean;
}

/**
 * Slack channel from channels.json or dms.json.
 */
interface SlackChannel {
  id: string;
  name: string;
  is_channel?: boolean;
  is_group?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
  user?: string; // For DMs, the other user's ID
  members?: string[];
  created?: number;
}

/**
 * Slack message format.
 */
interface SlackMessage {
  type: string;
  subtype?: string;
  user?: string;
  bot_id?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  reactions?: Array<{
    name: string;
    users: string[];
    count: number;
  }>;
  files?: Array<{
    id: string;
    name: string;
    mimetype?: string;
    size?: number;
    url_private?: string;
  }>;
  attachments?: Array<{
    fallback?: string;
    text?: string;
    title?: string;
  }>;
}

/**
 * Parse a Slack workspace export.
 */
export async function parseSlackExport(
  files: Map<string, string | ArrayBuffer>
): Promise<ImportParseResult> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const conversations: ImportedConversation[] = [];

  // Parse users.json
  const usersFile = files.get('users.json');
  const userMap = new Map<string, SlackUser>();

  if (usersFile && typeof usersFile === 'string') {
    try {
      const users: SlackUser[] = JSON.parse(usersFile);
      for (const u of users) {
        userMap.set(u.id, u);
      }
    } catch {
      warnings.push('Could not parse users.json');
    }
  }

  // Parse channels.json
  const channelsFile = files.get('channels.json');
  const channels: SlackChannel[] = [];

  if (channelsFile && typeof channelsFile === 'string') {
    try {
      channels.push(...JSON.parse(channelsFile));
    } catch {
      warnings.push('Could not parse channels.json');
    }
  }

  // Parse groups.json (private channels)
  const groupsFile = files.get('groups.json');
  if (groupsFile && typeof groupsFile === 'string') {
    try {
      channels.push(...JSON.parse(groupsFile));
    } catch {
      // Optional file
    }
  }

  // Parse dms.json
  const dmsFile = files.get('dms.json');
  if (dmsFile && typeof dmsFile === 'string') {
    try {
      channels.push(...JSON.parse(dmsFile));
    } catch {
      // Optional file
    }
  }

  // Parse mpims.json (multi-person DMs)
  const mpimsFile = files.get('mpims.json');
  if (mpimsFile && typeof mpimsFile === 'string') {
    try {
      channels.push(...JSON.parse(mpimsFile));
    } catch {
      // Optional file
    }
  }

  if (channels.length === 0) {
    errors.push('No channels found in Slack export');
    return {
      source: 'slack',
      user: { id: 'unknown', name: 'Unknown', isSelf: true },
      conversations: [],
      totalMessages: 0,
      dateRange: { start: new Date(), end: new Date() },
      warnings,
      errors,
    };
  }

  // Try to identify self (usually the workspace owner or most active user)
  // For now, we'll mark the first non-bot user as self
  let selfUser: SlackUser | undefined;
  for (const u of userMap.values()) {
    if (!u.is_bot && !u.deleted) {
      selfUser = u;
      break;
    }
  }

  const user: ImportedParticipant = selfUser
    ? {
        id: selfUser.id,
        name: selfUser.real_name || selfUser.profile?.display_name || selfUser.name,
        isSelf: true,
      }
    : { id: 'unknown', name: 'Unknown', isSelf: true };

  let totalMessages = 0;
  let earliestDate = new Date();
  let latestDate = new Date(0);

  // Process each channel
  for (const channel of channels) {
    const channelDir = channel.name || channel.id;
    const channelMessages: ImportedMessage[] = [];
    const participantMap = new Map<string, ImportedParticipant>();

    // Find message files for this channel (YYYY-MM-DD.json format)
    for (const [filename, content] of files) {
      if (
        filename.startsWith(`${channelDir}/`) &&
        filename.endsWith('.json') &&
        typeof content === 'string'
      ) {
        try {
          const dayMessages: SlackMessage[] = JSON.parse(content);

          for (const msg of dayMessages) {
            if (msg.type !== 'message') continue;
            if (msg.subtype && ['channel_join', 'channel_leave', 'bot_message'].includes(msg.subtype)) {
              continue;
            }

            // Parse timestamp (Slack uses Unix timestamp with microseconds)
            const timestamp = new Date(parseFloat(msg.ts) * 1000);
            if (isNaN(timestamp.getTime())) continue;

            if (timestamp < earliestDate) earliestDate = timestamp;
            if (timestamp > latestDate) latestDate = timestamp;

            const senderId = msg.user || msg.bot_id || 'unknown';
            const senderInfo = userMap.get(senderId);
            const senderName =
              senderInfo?.real_name ||
              senderInfo?.profile?.display_name ||
              senderInfo?.name ||
              senderId;
            const isFromSelf = senderId === user.id;

            if (!participantMap.has(senderId)) {
              participantMap.set(senderId, {
                id: senderId,
                name: senderName,
                isSelf: isFromSelf,
                avatarUrl: senderInfo?.profile?.image_72,
              });
            }

            // Process text (replace user mentions)
            let text = msg.text;
            text = text.replace(/<@([A-Z0-9]+)>/g, (_, userId) => {
              const mentioned = userMap.get(userId);
              return `@${mentioned?.name || userId}`;
            });

            const importedMessage: ImportedMessage = {
              originalId: msg.ts,
              content: text,
              senderName,
              senderId,
              timestamp,
              isFromSelf,
              replyTo: msg.thread_ts !== msg.ts ? msg.thread_ts : undefined,
            };

            // Handle files
            if (msg.files && msg.files.length > 0) {
              importedMessage.attachments = msg.files.map((f) => ({
                filename: f.name,
                url: f.url_private || '',
                mimeType: f.mimetype,
                size: f.size,
              }));
            }

            // Handle reactions
            if (msg.reactions && msg.reactions.length > 0) {
              importedMessage.reactions = msg.reactions.map((r) => ({
                emoji: `:${r.name}:`,
                users: r.users,
                count: r.count,
              }));
            }

            channelMessages.push(importedMessage);
          }
        } catch {
          warnings.push(`Could not parse ${filename}`);
        }
      }
    }

    if (channelMessages.length === 0) continue;

    totalMessages += channelMessages.length;

    // Determine channel type
    let type: 'dm' | 'group' | 'channel' = 'channel';
    if (channel.is_im) {
      type = 'dm';
    } else if (channel.is_mpim || channel.is_group) {
      type = 'group';
    }

    // For DMs, use the other user's name
    let name = channel.name;
    if (channel.is_im && channel.user) {
      const otherUser = userMap.get(channel.user);
      name = otherUser?.real_name || otherUser?.name || channel.user;
    }

    conversations.push({
      originalId: channel.id,
      name: name || `Channel ${channel.id}`,
      type,
      participants: Array.from(participantMap.values()),
      messages: channelMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      createdAt: channel.created ? new Date(channel.created * 1000) : undefined,
    });
  }

  return {
    source: 'slack',
    user,
    conversations,
    totalMessages,
    dateRange: {
      start: earliestDate,
      end: latestDate,
    },
    warnings,
    errors,
  };
}

/**
 * Get Slack export source info.
 */
export function getSlackSourceInfo() {
  return {
    id: 'slack' as const,
    name: 'Slack',
    description: 'Import your Slack workspace messages',
    exportInstructions:
      'Workspace owners: Settings & administration → Workspace settings → Import/Export Data → Export. Standard exports include public channels; Corporate exports include all data.',
    exportUrl: 'https://slack.com/help/articles/201658943',
    acceptedFiles: ['.zip'],
    color: '#4A154B',
  };
}
