/**
 * Community Activity Engine -- sustained autonomous wisp posting in communities.
 *
 * Manages channel-aware posting, wisp-to-wisp replies, reactions,
 * and natural timing variation (clusters + quiet periods).
 */

import { EventEmitter } from 'events';
import type { Wisp } from './wisp.js';
import type { WispPersona } from './personas.js';

export interface CommunityInfo {
  communityId: string;
  name: string;
  channels: ChannelInfo[];
  members: MemberInfo[];
}

export interface ChannelInfo {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  categoryName?: string;
}

export interface MemberInfo {
  did: string;
  displayName: string;
}

/** Recent message tracking for replies/reactions */
export interface RecentMessage {
  messageId: string;
  channelId: string;
  senderDid: string;
  senderName: string;
  content: string;
  timestamp: number;
}

/** Keywords mapped to wisp interests for channel affinity scoring */
const INTEREST_KEYWORDS: Record<string, string[]> = {
  cryptography: ['crypto', 'security', 'privacy', 'encryption', 'cipher'],
  'ancient languages': ['language', 'lore', 'history', 'mythology', 'ancient'],
  'conspiracy theories': ['conspiracy', 'mystery', 'paranormal', 'ufo', 'secret'],
  tea: ['tea', 'drinks', 'food', 'cafe', 'brew'],
  pranks: ['fun', 'memes', 'jokes', 'random', 'chaos'],
  fireworks: ['fire', 'celebration', 'party', 'events'],
  'speed runs': ['gaming', 'games', 'speedrun', 'leaderboard'],
  'energy drinks': ['drinks', 'food', 'energy'],
  botany: ['garden', 'nature', 'plants', 'botany', 'outdoors', 'green'],
  'soil composition': ['garden', 'nature', 'science', 'earth'],
  weather: ['weather', 'nature', 'outdoors', 'climate'],
  'herbal remedies': ['health', 'herbs', 'wellness', 'medicine', 'nature'],
  'digital art': ['art', 'creative', 'design', 'gallery', 'pixel'],
  'pixel art': ['art', 'pixel', 'retro', 'creative', 'design'],
  synthwave: ['music', 'retro', 'synth', 'electronic', 'audio'],
  'aurora borealis': ['nature', 'sky', 'space', 'photography'],
  chess: ['chess', 'games', 'strategy', 'board', 'competition'],
  'game theory': ['strategy', 'games', 'theory', 'logic', 'math'],
  'military history': ['history', 'military', 'strategy', 'war'],
  'logic puzzles': ['puzzles', 'logic', 'brain', 'games', 'trivia'],
  journaling: ['journal', 'writing', 'creative', 'diary', 'thoughts'],
  stargazing: ['space', 'astronomy', 'stars', 'sky', 'night'],
  'comfort food': ['food', 'cooking', 'recipes', 'comfort'],
  'small kindnesses': ['wholesome', 'kindness', 'community', 'support'],
  metalworking: ['forge', 'metal', 'craft', 'maker', 'diy'],
  'heavy metal music': ['music', 'metal', 'rock', 'audio', 'concert'],
  barbecue: ['food', 'cooking', 'bbq', 'grill'],
  'arm wrestling': ['fitness', 'strength', 'competition', 'sport'],
  'lucid dreaming': ['dreams', 'sleep', 'meditation', 'mindfulness'],
  philosophy: ['philosophy', 'thoughts', 'discussion', 'debate', 'deep'],
  'ambient music': ['music', 'ambient', 'chill', 'lofi', 'audio'],
  'cloud watching': ['nature', 'sky', 'weather', 'outdoors', 'chill'],
  surfing: ['surf', 'ocean', 'beach', 'water', 'sport'],
  'marine biology': ['ocean', 'marine', 'biology', 'science', 'nature'],
  'tide charts': ['ocean', 'tide', 'weather', 'science'],
  'lo-fi beats': ['music', 'lofi', 'chill', 'beats', 'audio'],
  'probability theory': ['math', 'probability', 'statistics', 'theory'],
  'card games': ['cards', 'games', 'poker', 'gambling', 'luck'],
  'fortune cookies': ['fortune', 'luck', 'food', 'fun'],
  'four-leaf clovers': ['luck', 'nature', 'garden'],
  'field recording': ['audio', 'recording', 'sound', 'music', 'nature'],
  'music production': ['music', 'production', 'audio', 'studio', 'beats'],
  acoustics: ['sound', 'audio', 'acoustics', 'science', 'music'],
  'vinyl records': ['vinyl', 'music', 'retro', 'audio', 'collection'],
  'circuit design': ['circuits', 'electronics', 'engineering', 'tech', 'maker'],
  networking: ['networking', 'tech', 'internet', 'connections'],
  robotics: ['robots', 'tech', 'engineering', 'maker', 'automation'],
  'neon lights': ['neon', 'lights', 'art', 'aesthetic', 'design'],
};

/** Max recent messages tracked per community */
const MAX_RECENT = 50;

export class CommunityActivity extends EventEmitter {
  private communities: Map<string, CommunityInfo> = new Map();
  private recentMessages: Map<string, RecentMessage[]> = new Map();
  private activityTimer: ReturnType<typeof setTimeout> | null = null;
  private running = false;

  constructor(
    private wisps: () => Wisp[],
    private generateMessage: (wisp: Wisp, channelName: string, replyContext?: string) => Promise<string>,
    private sendToRelay: (
      wispDid: string, communityId: string, channelId: string,
      channelName: string, senderDisplayName: string, content: string,
      replyToId?: string,
    ) => void,
    private sendReactionToRelay: (
      wispDid: string, communityId: string, channelId: string,
      messageId: string, emoji: string,
    ) => void,
  ) {
    super();
  }

  /** Register a community for activity */
  addCommunity(info: CommunityInfo): void {
    this.communities.set(info.communityId, info);
    this.recentMessages.set(info.communityId, []);
    console.log(`[CommunityActivity] Added community "${info.name}" with ${info.channels.length} channels`);
    // Schedule first activity if running and this is the first community
    if (this.running && this.communities.size === 1) {
      this.scheduleNext();
    }
  }

  /** Remove a community from activity tracking */
  removeCommunity(communityId: string): void {
    this.communities.delete(communityId);
    this.recentMessages.delete(communityId);
    console.log(`[CommunityActivity] Removed community ${communityId}`);
  }

  /** Track a received community message for reply/reaction targeting */
  trackMessage(communityId: string, msg: RecentMessage): void {
    let messages = this.recentMessages.get(communityId);
    if (!messages) {
      messages = [];
      this.recentMessages.set(communityId, messages);
    }
    messages.push(msg);
    // Trim to max recent
    if (messages.length > MAX_RECENT) {
      messages.splice(0, messages.length - MAX_RECENT);
    }
  }

  /** Start the activity loop */
  start(): void {
    if (this.running) return;
    this.running = true;
    console.log('[CommunityActivity] Started');
    if (this.communities.size > 0) {
      this.scheduleNext();
    }
  }

  /** Stop all activity */
  stop(): void {
    this.running = false;
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    console.log('[CommunityActivity] Stopped');
  }

  /** Schedule the next activity (message or reaction) */
  private scheduleNext(): void {
    if (!this.running) return;
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    // 20% chance of a "cluster" burst (short delay)
    const isCluster = Math.random() < 0.2;
    const delay = isCluster
      ? 30_000 + Math.random() * 90_000     // 30s - 2min for clusters
      : 360_000 + Math.random() * 360_000;  // 6-12 min normal
    this.activityTimer = setTimeout(() => void this.doActivity(), delay);
  }

  /** Perform one community activity (message or reaction) */
  private async doActivity(): Promise<void> {
    if (!this.running) return;
    try {
      const communityIds = Array.from(this.communities.keys());
      if (communityIds.length === 0) {
        this.scheduleNext();
        return;
      }

      // Pick a random community
      const communityId = communityIds[Math.floor(Math.random() * communityIds.length)];
      const community = this.communities.get(communityId)!;
      const textChannels = community.channels.filter(c => c.type === 'text');
      if (textChannels.length === 0) {
        this.scheduleNext();
        return;
      }

      const allWisps = this.wisps();
      if (allWisps.length === 0) {
        this.scheduleNext();
        return;
      }

      // Decide: reaction (20%) or message (80%)
      const isReaction = Math.random() < 0.2;

      if (isReaction) {
        await this.doReaction(communityId, allWisps);
      } else {
        await this.doMessage(communityId, community, textChannels, allWisps);
      }
    } catch (err) {
      console.warn('[CommunityActivity] Activity error:', err);
    }

    this.scheduleNext();
  }

  /** Send a message to a community channel */
  private async doMessage(
    communityId: string, community: CommunityInfo,
    textChannels: ChannelInfo[], allWisps: Wisp[],
  ): Promise<void> {
    // Pick a wisp, weighted by channel affinity
    const wisp = this.pickWispForCommunity(allWisps, textChannels);
    const channel = this.pickChannel(wisp, textChannels);

    // ~30% chance of replying to a recent message
    const recent = this.recentMessages.get(communityId) ?? [];
    const channelRecent = recent.filter(
      m => m.channelId === channel.id && m.senderDid !== wisp.did,
    );
    let replyContext: string | undefined;
    let replyToId: string | undefined;

    if (channelRecent.length > 0 && Math.random() < 0.3) {
      const target = channelRecent[Math.floor(Math.random() * channelRecent.length)];
      replyContext = `${target.senderName}: ${target.content}`;
      replyToId = target.messageId;
    }

    const content = await this.generateMessage(wisp, channel.name, replyContext);
    this.sendToRelay(
      wisp.did, communityId, channel.id, channel.name,
      wisp.name, content, replyToId,
    );

    this.emit('message', {
      communityId, channelId: channel.id, channelName: channel.name,
      wispName: wisp.name, content, isReply: !!replyToId,
    });

    console.log(
      `[CommunityActivity] ${wisp.name} → #${channel.name}: ${content.slice(0, 60)}...` +
      (replyToId ? ' (reply)' : ''),
    );
  }

  /** React to a recent message in a community */
  private async doReaction(communityId: string, allWisps: Wisp[]): Promise<void> {
    const recent = this.recentMessages.get(communityId) ?? [];
    if (recent.length === 0) return;

    // Pick a random recent message to react to
    const target = recent[Math.floor(Math.random() * recent.length)];

    // Pick a wisp that is NOT the sender
    const candidates = allWisps.filter(w => w.did !== target.senderDid);
    if (candidates.length === 0) return;

    const wisp = candidates[Math.floor(Math.random() * candidates.length)];
    const emojis = wisp.persona.reactionEmojis;
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    this.sendReactionToRelay(wisp.did, communityId, target.channelId, target.messageId, emoji);

    this.emit('reaction', {
      communityId, channelId: target.channelId,
      wispName: wisp.name, emoji, messageId: target.messageId,
    });

    console.log(`[CommunityActivity] ${wisp.name} reacted ${emoji} to message in ${communityId}`);
  }

  /** Pick a wisp to post, slightly weighted by best channel affinity */
  private pickWispForCommunity(wisps: Wisp[], channels: ChannelInfo[]): Wisp {
    // Score each wisp by their best channel affinity
    const scored = wisps.map(w => {
      const bestAffinity = Math.max(...channels.map(c => this.channelAffinity(w.persona, c)));
      return { wisp: w, score: bestAffinity + Math.random() * 2 }; // Add randomness
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].wisp;
  }

  /** Pick the best channel for a wisp based on persona interests */
  private pickChannel(wisp: Wisp, channels: ChannelInfo[]): ChannelInfo {
    if (channels.length === 1) return channels[0];

    // Score channels by affinity, add randomness for variety
    const scored = channels.map(c => ({
      channel: c,
      score: this.channelAffinity(wisp.persona, c) + Math.random() * 3,
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0].channel;
  }

  /** Match wisp interests to channel names for affinity scoring */
  private channelAffinity(persona: WispPersona, channel: ChannelInfo): number {
    const channelWords = [
      channel.name.toLowerCase(),
      (channel.categoryName ?? '').toLowerCase(),
    ].join(' ');

    let score = 0;
    for (const interest of persona.interests) {
      const keywords = INTEREST_KEYWORDS[interest] ?? [interest.toLowerCase()];
      for (const keyword of keywords) {
        if (channelWords.includes(keyword)) {
          score += 2;
        }
      }
    }

    // Baseline: "general" channels are always somewhat relevant
    if (channelWords.includes('general') || channelWords.includes('chat') || channelWords.includes('lounge')) {
      score += 1;
    }

    return score;
  }
}
