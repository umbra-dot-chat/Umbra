/**
 * Main Umbra Service class
 *
 * Provides a unified API for interacting with Umbra Core across all platforms.
 * This is the main entry point that composes all domain modules.
 *
 * @packageDocumentation
 */

import {
  initUmbraWasm,
  getWasm,
  isWasmReady,
  eventBridge,
} from '@umbra/wasm';
import type { UmbraEvent } from '@umbra/wasm';

import { ErrorCode, UmbraError } from './errors';
import { snakeToCamel } from './helpers';
import type {
  InitConfig,
  Identity,
  PublicIdentity,
  CreateIdentityResult,
  ProfileUpdate,
  NetworkStatus,
  ConnectionInfo,
  DiscoveryResult,
  DiscoveryEvent,
  FriendRequest,
  Friend,
  FriendEvent,
  Message,
  Conversation,
  MessageReaction,
  MessageEvent,
  ChatMessagePayload,
  Group,
  GroupMember,
  GroupEvent,
  PendingGroupInvite,
  GroupInvitePayload,
  RelayStatus,
  RelaySession,
  RelayAcceptResult,
  RelayEvent,
  Community,
  CommunityCreateResult,
  CommunitySpace,
  CommunityCategory,
  CommunityChannel,
  CommunityMember,
  CommunityRole,
  CommunitySeat,
  CommunityMessage,
  CommunityInvite,
  CommunityEvent,
  CommunityFileRecord,
  CommunityFileFolderRecord,
  CommunityEmoji,
  CommunitySticker,
  StickerPack,
  MessageMetadata,
  DmSharedFileRecord,
  DmSharedFolderRecord,
  DmFileEventPayload,
  MetadataEvent,
  ChunkManifest,
  FileManifestRecord,
  ReassembledFile,
  TransferProgress,
  TransferDirection,
  TransportType,
  FileTransferEvent,
} from './types';

// Import domain modules
import * as identity from './identity';
import * as network from './network';
import * as friends from './friends';
import * as messaging from './messaging';
import * as calling from './calling';
import * as groups from './groups';
import * as crypto from './crypto';
import * as relay from './relay';
import * as communityModule from './community';
import * as dmFiles from './dm-files';
import * as chunkingModule from './chunking';
import * as fileTransfer from './file-transfer';
import * as fileEncryption from './file-encryption';

/**
 * Main Umbra Service class
 *
 * Provides a unified API for interacting with Umbra Core across all platforms.
 * Methods delegate to WASM (web) or native (mobile) bindings.
 */
export class UmbraService {
  private static _instance: UmbraService | null = null;
  private static _initialized = false;

  // Event listeners
  private _discoveryListeners: Array<(event: DiscoveryEvent) => void> = [];
  private _friendListeners: Array<(event: FriendEvent) => void> = [];
  private _messageListeners: Array<(event: MessageEvent) => void> = [];
  private _relayListeners: Array<(event: RelayEvent) => void> = [];
  private _groupListeners: Array<(event: GroupEvent) => void> = [];
  private _callListeners: Array<(event: any) => void> = [];
  private _communityListeners: Array<(event: CommunityEvent) => void> = [];
  private _dmFileListeners: Array<(event: DmFileEventPayload) => void> = [];
  private _metadataListeners: Array<(event: MetadataEvent) => void> = [];
  private _fileTransferListeners: Array<(event: FileTransferEvent) => void> = [];
  private _relayWsRef: WebSocket | null = null;

  private constructor() {}

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize Umbra Service
   *
   * Loads the WASM module, initializes sql.js, and sets up the event bridge.
   *
   * @param config - Optional configuration
   * @throws {UmbraError} If already initialized
   */
  static async initialize(config?: InitConfig): Promise<void> {
    if (this._initialized && this._instance) {
      // Already initialized — safe to return (handles HMR re-renders)
      return;
    }

    // Load and initialize the WASM module (includes sql.js + DB schema init)
    // Pass DID for IndexedDB persistence when available
    const wasmModule = await initUmbraWasm(config?.did);

    const instance = new UmbraService();

    // Connect event bridge to dispatch events to our listeners
    eventBridge.connect(wasmModule);
    eventBridge.onAll((event: UmbraEvent) => {
      instance._dispatchEvent(event);
    });

    this._instance = instance;
    this._initialized = true;

    console.log(
      '[UmbraService] Initialized — WASM version:',
      wasmModule.umbra_wasm_version()
    );
  }

  /**
   * Get the service instance
   *
   * @throws {UmbraError} If not initialized
   */
  static get instance(): UmbraService {
    if (!this._initialized || !this._instance) {
      throw new UmbraError(
        ErrorCode.NotInitialized,
        'UmbraService not initialized. Call UmbraService.initialize() first.'
      );
    }
    return this._instance;
  }

  /**
   * Check if the service is initialized
   */
  static get isInitialized(): boolean {
    return this._initialized;
  }

  /**
   * Shutdown the service
   */
  static async shutdown(): Promise<void> {
    if (this._instance) {
      eventBridge.clear();
      this._instance = null;
      this._initialized = false;
    }
  }

  // ===========================================================================
  // IDENTITY (delegated to identity module)
  // ===========================================================================

  createIdentity(displayName: string): Promise<CreateIdentityResult> {
    return identity.createIdentity(displayName);
  }

  restoreIdentity(recoveryPhrase: string[], displayName: string): Promise<Identity> {
    return identity.restoreIdentity(recoveryPhrase, displayName);
  }

  loadIdentity(): Promise<Identity | null> {
    return identity.loadIdentity();
  }

  getIdentity(): Promise<Identity> {
    return identity.getIdentity();
  }

  updateProfile(update: ProfileUpdate): Promise<void> {
    return identity.updateProfile(update);
  }

  getPublicIdentity(): Promise<PublicIdentity> {
    return identity.getPublicIdentity();
  }

  // ===========================================================================
  // NETWORK & DISCOVERY (delegated to network module)
  // ===========================================================================

  startNetwork(): Promise<void> {
    return network.startNetwork();
  }

  stopNetwork(): Promise<void> {
    return network.stopNetwork();
  }

  createOffer(): Promise<string> {
    return network.createOffer();
  }

  acceptOffer(offerJson: string): Promise<string> {
    return network.acceptOffer(offerJson);
  }

  completeHandshake(answerJson: string): Promise<void> {
    return network.completeHandshake(answerJson);
  }

  completeAnswerer(offererDid?: string, offererPeerId?: string): Promise<void> {
    return network.completeAnswerer(offererDid, offererPeerId);
  }

  getNetworkStatus(): Promise<NetworkStatus> {
    return network.getNetworkStatus();
  }

  lookupPeer(did: string): Promise<DiscoveryResult> {
    return network.lookupPeer(did);
  }

  getConnectionInfo(): Promise<ConnectionInfo> {
    return network.getConnectionInfo();
  }

  parseConnectionInfo(info: string): Promise<ConnectionInfo> {
    return network.parseConnectionInfo(info);
  }

  connectDirect(info: ConnectionInfo): Promise<void> {
    return network.connectDirect(info);
  }

  onDiscoveryEvent(callback: (event: DiscoveryEvent) => void): () => void {
    this._discoveryListeners.push(callback);
    return () => {
      const index = this._discoveryListeners.indexOf(callback);
      if (index !== -1) {
        this._discoveryListeners.splice(index, 1);
      }
    };
  }

  // ===========================================================================
  // FRIENDS (delegated to friends module)
  // ===========================================================================

  sendFriendRequest(
    toDid: string,
    message?: string,
    relayWs?: WebSocket | null,
    fromIdentity?: { did: string; displayName: string } | null
  ): Promise<FriendRequest & { relayDelivered?: boolean }> {
    return friends.sendFriendRequest(toDid, message, relayWs, fromIdentity);
  }

  getIncomingRequests(): Promise<FriendRequest[]> {
    return friends.getIncomingRequests();
  }

  getOutgoingRequests(): Promise<FriendRequest[]> {
    return friends.getOutgoingRequests();
  }

  acceptFriendRequest(
    requestId: string,
    relayWs?: WebSocket | null,
    fromIdentity?: { did: string; displayName: string } | null
  ): Promise<{ requestId: string; status: string; relayDelivered?: boolean }> {
    return friends.acceptFriendRequest(requestId, relayWs, fromIdentity);
  }

  rejectFriendRequest(requestId: string): Promise<void> {
    return friends.rejectFriendRequest(requestId);
  }

  getFriends(): Promise<Friend[]> {
    return friends.getFriends();
  }

  removeFriend(did: string): Promise<boolean> {
    return friends.removeFriend(did);
  }

  blockUser(did: string, reason?: string): Promise<void> {
    return friends.blockUser(did, reason);
  }

  unblockUser(did: string): Promise<boolean> {
    return friends.unblockUser(did);
  }

  storeIncomingRequest(request: FriendRequest): Promise<boolean> {
    return friends.storeIncomingRequest(request);
  }

  processAcceptedFriendResponse(payload: {
    fromDid: string;
    fromDisplayName?: string;
    fromAvatar?: string;
    fromSigningKey?: string;
    fromEncryptionKey?: string;
  }): Promise<void> {
    return friends.processAcceptedFriendResponse(payload);
  }

  sendFriendAcceptAck(
    accepterDid: string,
    myDid: string,
    relayWs?: WebSocket | null
  ): Promise<void> {
    return friends.sendFriendAcceptAck(accepterDid, myDid, relayWs);
  }

  onFriendEvent(callback: (event: FriendEvent) => void): () => void {
    this._friendListeners.push(callback);
    return () => {
      const index = this._friendListeners.indexOf(callback);
      if (index !== -1) {
        this._friendListeners.splice(index, 1);
      }
    };
  }

  dispatchFriendEvent(event: FriendEvent): void {
    for (const listener of this._friendListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Friend listener error:', err);
      }
    }
  }

  // ===========================================================================
  // MESSAGING (delegated to messaging module)
  // ===========================================================================

  getConversations(): Promise<Conversation[]> {
    return messaging.getConversations();
  }

  createDmConversation(friendDid: string): Promise<string> {
    return messaging.createDmConversation(friendDid);
  }

  sendMessage(
    conversationId: string,
    text: string,
    relayWs?: WebSocket | null
  ): Promise<Message> {
    return messaging.sendMessage(conversationId, text, relayWs);
  }

  getMessages(
    conversationId: string,
    options?: { offset?: number; limit?: number }
  ): Promise<Message[]> {
    return messaging.getMessages(conversationId, options);
  }

  markAsRead(conversationId: string): Promise<number> {
    return messaging.markAsRead(conversationId);
  }

  editMessage(messageId: string, newText: string): Promise<Message> {
    return messaging.editMessage(messageId, newText);
  }

  deleteMessage(messageId: string): Promise<void> {
    return messaging.deleteMessage(messageId);
  }

  pinMessage(messageId: string): Promise<Message> {
    return messaging.pinMessage(messageId);
  }

  unpinMessage(messageId: string): Promise<void> {
    return messaging.unpinMessage(messageId);
  }

  addReaction(messageId: string, emoji: string): Promise<MessageReaction[]> {
    return messaging.addReaction(messageId, emoji);
  }

  removeReaction(messageId: string, emoji: string): Promise<MessageReaction[]> {
    return messaging.removeReaction(messageId, emoji);
  }

  forwardMessage(messageId: string, targetConversationId: string): Promise<Message> {
    return messaging.forwardMessage(messageId, targetConversationId);
  }

  getThreadReplies(parentId: string): Promise<Message[]> {
    return messaging.getThreadReplies(parentId);
  }

  sendThreadReply(
    parentId: string,
    text: string,
    relayWs?: WebSocket | null
  ): Promise<Message> {
    return messaging.sendThreadReply(parentId, text, relayWs);
  }

  getPinnedMessages(conversationId: string): Promise<Message[]> {
    return messaging.getPinnedMessages(conversationId);
  }

  sendTypingIndicator(
    conversationId: string,
    recipientDid: string,
    senderDid: string,
    senderName: string,
    isTyping: boolean,
    relayWs?: WebSocket | null
  ): Promise<void> {
    return messaging.sendTypingIndicator(
      conversationId,
      recipientDid,
      senderDid,
      senderName,
      isTyping,
      relayWs
    );
  }

  storeIncomingMessage(payload: ChatMessagePayload): Promise<void> {
    return messaging.storeIncomingMessage(payload);
  }

  decryptIncomingMessage(payload: ChatMessagePayload): Promise<string | null> {
    return messaging.decryptIncomingMessage(payload);
  }

  updateMessageStatus(messageId: string, status: 'sent' | 'delivered' | 'read'): Promise<void> {
    return messaging.updateMessageStatus(messageId, status);
  }

  sendDeliveryReceipt(
    messageId: string,
    conversationId: string,
    senderDid: string,
    status: 'delivered' | 'read',
    relayWs?: WebSocket | null
  ): Promise<void> {
    return messaging.sendDeliveryReceipt(messageId, conversationId, senderDid, status, relayWs);
  }

  onMessageEvent(callback: (event: MessageEvent) => void): () => void {
    this._messageListeners.push(callback);
    return () => {
      const index = this._messageListeners.indexOf(callback);
      if (index !== -1) {
        this._messageListeners.splice(index, 1);
      }
    };
  }

  dispatchMessageEvent(event: MessageEvent): void {
    for (const listener of this._messageListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Message listener error:', err);
      }
    }
  }

  // ===========================================================================
  // CALLING (delegated to calling module)
  // ===========================================================================

  storeCallRecord(
    id: string,
    conversationId: string,
    callType: string,
    direction: string,
    participants: string[]
  ): Promise<{ id: string; startedAt: number }> {
    return calling.storeCallRecord(id, conversationId, callType, direction, participants);
  }

  endCallRecord(
    callId: string,
    status: string
  ): Promise<{ id: string; endedAt: number; durationMs: number }> {
    return calling.endCallRecord(callId, status);
  }

  getCallHistory(conversationId: string, limit?: number, offset?: number): Promise<any[]> {
    return calling.getCallHistory(conversationId, limit, offset);
  }

  getAllCallHistory(limit?: number, offset?: number): Promise<any[]> {
    return calling.getAllCallHistory(limit, offset);
  }

  onCallEvent(callback: (event: any) => void): () => void {
    this._callListeners.push(callback);
    return () => {
      const index = this._callListeners.indexOf(callback);
      if (index !== -1) {
        this._callListeners.splice(index, 1);
      }
    };
  }

  dispatchCallEvent(event: any): void {
    for (const listener of this._callListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Call listener error:', err);
      }
    }
  }

  setRelayWs(ws: WebSocket | null): void {
    this._relayWsRef = ws;
  }

  getRelayWs(): WebSocket | null {
    return this._relayWsRef;
  }

  sendCallSignal(toDid: string, relayMessage: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(relayMessage);
    } else {
      console.warn('[UmbraService] Cannot send call signal: relay not connected');
    }
  }

  createCallRoom(groupId: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(JSON.stringify({ type: 'create_call_room', group_id: groupId }));
    } else {
      console.warn('[UmbraService] Cannot create call room: relay not connected');
    }
  }

  joinCallRoom(roomId: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(JSON.stringify({ type: 'join_call_room', room_id: roomId }));
    } else {
      console.warn('[UmbraService] Cannot join call room: relay not connected');
    }
  }

  leaveCallRoom(roomId: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(JSON.stringify({ type: 'leave_call_room', room_id: roomId }));
    } else {
      console.warn('[UmbraService] Cannot leave call room: relay not connected');
    }
  }

  sendCallRoomSignal(roomId: string, toDid: string, payload: string): void {
    if (this._relayWsRef && this._relayWsRef.readyState === WebSocket.OPEN) {
      this._relayWsRef.send(JSON.stringify({ type: 'call_signal', room_id: roomId, to_did: toDid, payload }));
    } else {
      console.warn('[UmbraService] Cannot send call room signal: relay not connected');
    }
  }

  // ===========================================================================
  // GROUPS (delegated to groups module)
  // ===========================================================================

  createGroup(name: string, description?: string): Promise<{ groupId: string; conversationId: string }> {
    return groups.createGroup(name, description);
  }

  getGroup(groupId: string): Promise<Group> {
    return groups.getGroup(groupId);
  }

  getGroups(): Promise<Group[]> {
    return groups.getGroups();
  }

  updateGroup(groupId: string, name: string, description?: string): Promise<void> {
    return groups.updateGroup(groupId, name, description);
  }

  deleteGroup(groupId: string): Promise<void> {
    return groups.deleteGroup(groupId);
  }

  addGroupMember(groupId: string, did: string, displayName?: string): Promise<void> {
    return groups.addGroupMember(groupId, did, displayName);
  }

  removeGroupMember(groupId: string, did: string): Promise<void> {
    return groups.removeGroupMember(groupId, did);
  }

  getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return groups.getGroupMembers(groupId);
  }

  generateGroupKey(groupId: string): Promise<{ groupId: string; keyVersion: number }> {
    return groups.generateGroupKey(groupId);
  }

  rotateGroupKey(groupId: string): Promise<{ groupId: string; keyVersion: number }> {
    return groups.rotateGroupKey(groupId);
  }

  importGroupKey(
    encryptedKey: string,
    nonce: string,
    senderDid: string,
    groupId: string,
    keyVersion: number
  ): Promise<void> {
    return groups.importGroupKey(encryptedKey, nonce, senderDid, groupId, keyVersion);
  }

  encryptGroupKeyForMember(
    groupId: string,
    memberDid: string,
    keyVersion: number
  ): Promise<{ encryptedKey: string; nonce: string }> {
    return groups.encryptGroupKeyForMember(groupId, memberDid, keyVersion);
  }

  encryptGroupMessage(
    groupId: string,
    plaintext: string
  ): Promise<{ ciphertext: string; nonce: string; keyVersion: number }> {
    return groups.encryptGroupMessage(groupId, plaintext);
  }

  decryptGroupMessage(
    groupId: string,
    ciphertext: string,
    nonce: string,
    keyVersion: number
  ): Promise<string> {
    return groups.decryptGroupMessage(groupId, ciphertext, nonce, keyVersion);
  }

  sendGroupInvite(groupId: string, memberDid: string, relayWs?: WebSocket | null): Promise<void> {
    return groups.sendGroupInvite(groupId, memberDid, relayWs);
  }

  storeGroupInvite(payload: GroupInvitePayload): Promise<void> {
    return groups.storeGroupInvite(payload);
  }

  getPendingGroupInvites(): Promise<PendingGroupInvite[]> {
    return groups.getPendingGroupInvites();
  }

  acceptGroupInvite(
    inviteId: string,
    relayWs?: WebSocket | null
  ): Promise<{ groupId: string; conversationId: string }> {
    return groups.acceptGroupInvite(inviteId, relayWs);
  }

  declineGroupInvite(inviteId: string, relayWs?: WebSocket | null): Promise<void> {
    return groups.declineGroupInvite(inviteId, relayWs);
  }

  sendGroupMessage(
    groupId: string,
    conversationId: string,
    text: string,
    relayWs?: WebSocket | null
  ): Promise<Message> {
    return groups.sendGroupMessage(groupId, conversationId, text, relayWs);
  }

  removeGroupMemberWithRotation(
    groupId: string,
    memberDid: string,
    relayWs?: WebSocket | null
  ): Promise<void> {
    return groups.removeGroupMemberWithRotation(groupId, memberDid, relayWs);
  }

  onGroupEvent(callback: (event: GroupEvent) => void): () => void {
    this._groupListeners.push(callback);
    return () => {
      const index = this._groupListeners.indexOf(callback);
      if (index !== -1) {
        this._groupListeners.splice(index, 1);
      }
    };
  }

  dispatchGroupEvent(event: GroupEvent): void {
    for (const listener of this._groupListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Group listener error:', err);
      }
    }
  }

  // ===========================================================================
  // COMMUNITY (delegated to community module)
  // ===========================================================================

  createCommunity(name: string, ownerDid: string, description?: string, ownerNickname?: string): Promise<CommunityCreateResult> {
    return communityModule.createCommunity(name, ownerDid, description, ownerNickname);
  }

  getCommunity(communityId: string): Promise<Community> {
    return communityModule.getCommunity(communityId);
  }

  getCommunities(memberDid: string): Promise<Community[]> {
    return communityModule.getCommunities(memberDid);
  }

  updateCommunity(id: string, actorDid: string, name?: string, description?: string): Promise<void> {
    return communityModule.updateCommunity(id, actorDid, name, description);
  }

  deleteCommunity(id: string, actorDid: string): Promise<void> {
    return communityModule.deleteCommunity(id, actorDid);
  }

  // Spaces
  createSpace(communityId: string, name: string, actorDid: string, position?: number): Promise<CommunitySpace> {
    return communityModule.createSpace(communityId, name, actorDid, position);
  }

  getSpaces(communityId: string): Promise<CommunitySpace[]> {
    return communityModule.getSpaces(communityId);
  }

  updateSpace(spaceId: string, name: string, actorDid: string): Promise<void> {
    return communityModule.updateSpace(spaceId, name, actorDid);
  }

  deleteSpace(spaceId: string, actorDid: string): Promise<void> {
    return communityModule.deleteSpace(spaceId, actorDid);
  }

  reorderSpaces(communityId: string, spaceIds: string[]): Promise<void> {
    return communityModule.reorderSpaces(communityId, spaceIds);
  }

  // Categories
  createCategory(communityId: string, spaceId: string, name: string, actorDid: string, position?: number): Promise<CommunityCategory> {
    return communityModule.createCategory(communityId, spaceId, name, actorDid, position);
  }

  getCategories(spaceId: string): Promise<CommunityCategory[]> {
    return communityModule.getCategories(spaceId);
  }

  getAllCategories(communityId: string): Promise<CommunityCategory[]> {
    return communityModule.getAllCategories(communityId);
  }

  updateCategory(categoryId: string, name: string, actorDid: string): Promise<void> {
    return communityModule.updateCategory(categoryId, name, actorDid);
  }

  reorderCategories(spaceId: string, categoryIds: string[]): Promise<void> {
    return communityModule.reorderCategories(spaceId, categoryIds);
  }

  deleteCategory(categoryId: string, actorDid: string): Promise<void> {
    return communityModule.deleteCategory(categoryId, actorDid);
  }

  moveChannelToCategory(channelId: string, categoryId: string | null, actorDid: string): Promise<void> {
    return communityModule.moveChannelToCategory(channelId, categoryId, actorDid);
  }

  // Channels
  createChannel(
    communityId: string, spaceId: string, name: string, channelType: string,
    actorDid: string, topic?: string, position?: number, categoryId?: string,
  ): Promise<CommunityChannel> {
    return communityModule.createChannel(communityId, spaceId, name, channelType, actorDid, topic, position, categoryId);
  }

  getChannels(spaceId: string): Promise<CommunityChannel[]> {
    return communityModule.getChannels(spaceId);
  }

  getAllChannels(communityId: string): Promise<CommunityChannel[]> {
    return communityModule.getAllChannels(communityId);
  }

  getChannel(channelId: string): Promise<CommunityChannel> {
    return communityModule.getChannel(channelId);
  }

  updateChannel(channelId: string, actorDid: string, name?: string, topic?: string): Promise<void> {
    return communityModule.updateChannel(channelId, actorDid, name, topic);
  }

  deleteChannel(channelId: string, actorDid: string): Promise<void> {
    return communityModule.deleteChannel(channelId, actorDid);
  }

  reorderChannels(spaceId: string, channelIds: string[]): Promise<void> {
    return communityModule.reorderChannels(spaceId, channelIds);
  }

  setSlowMode(channelId: string, seconds: number, actorDid: string): Promise<void> {
    return communityModule.setSlowMode(channelId, seconds, actorDid);
  }

  setChannelE2ee(channelId: string, enabled: boolean, actorDid: string): Promise<void> {
    return communityModule.setChannelE2ee(channelId, enabled, actorDid);
  }

  // Members
  joinCommunity(communityId: string, memberDid: string, nickname?: string): Promise<void> {
    return communityModule.joinCommunity(communityId, memberDid, nickname);
  }

  leaveCommunity(communityId: string, memberDid: string): Promise<void> {
    return communityModule.leaveCommunity(communityId, memberDid);
  }

  getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
    return communityModule.getMembers(communityId);
  }

  getCommunityMember(communityId: string, memberDid: string): Promise<CommunityMember> {
    return communityModule.getMember(communityId, memberDid);
  }

  kickCommunityMember(communityId: string, targetDid: string, actorDid: string): Promise<void> {
    return communityModule.kickMember(communityId, targetDid, actorDid);
  }

  banCommunityMember(communityId: string, targetDid: string, actorDid: string, reason?: string): Promise<void> {
    return communityModule.banMember(communityId, targetDid, actorDid, reason);
  }

  unbanCommunityMember(communityId: string, targetDid: string, actorDid: string): Promise<void> {
    return communityModule.unbanMember(communityId, targetDid, actorDid);
  }

  // Roles
  getCommunityRoles(communityId: string): Promise<CommunityRole[]> {
    return communityModule.getRoles(communityId);
  }

  getMemberRoles(communityId: string, memberDid: string): Promise<CommunityRole[]> {
    return communityModule.getMemberRoles(communityId, memberDid);
  }

  assignRole(communityId: string, memberDid: string, roleId: string, actorDid: string): Promise<void> {
    return communityModule.assignRole(communityId, memberDid, roleId, actorDid);
  }

  unassignRole(communityId: string, memberDid: string, roleId: string, actorDid: string): Promise<void> {
    return communityModule.unassignRole(communityId, memberDid, roleId, actorDid);
  }

  createCustomRole(
    communityId: string,
    name: string,
    actorDid: string,
    color?: string,
    position?: number,
    hoisted?: boolean,
    mentionable?: boolean,
    permissionsBitfield?: string,
  ): Promise<CommunityRole> {
    return communityModule.createCustomRole(communityId, name, actorDid, color, position, hoisted, mentionable, permissionsBitfield);
  }

  updateRole(
    roleId: string,
    actorDid: string,
    updates: { name?: string; color?: string; hoisted?: boolean; mentionable?: boolean; position?: number },
  ): Promise<void> {
    return communityModule.updateRole(roleId, actorDid, updates);
  }

  updateRolePermissions(roleId: string, permissionsBitfield: string, actorDid: string): Promise<void> {
    return communityModule.updateRolePermissions(roleId, permissionsBitfield, actorDid);
  }

  deleteRole(roleId: string, actorDid: string): Promise<void> {
    return communityModule.deleteRole(roleId, actorDid);
  }

  // Seats
  getSeats(communityId: string): Promise<CommunitySeat[]> {
    return communityModule.getSeats(communityId);
  }

  getUnclaimedSeats(communityId: string): Promise<CommunitySeat[]> {
    return communityModule.getUnclaimedSeats(communityId);
  }

  findMatchingSeat(communityId: string, platform: string, platformUserId: string): Promise<CommunitySeat | null> {
    return communityModule.findMatchingSeat(communityId, platform, platformUserId);
  }

  async claimSeat(seatId: string, claimerDid: string): Promise<void> {
    await communityModule.claimSeat(seatId, claimerDid);
  }

  deleteSeat(seatId: string, actorDid: string): Promise<void> {
    return communityModule.deleteSeat(seatId, actorDid);
  }

  countSeats(communityId: string): Promise<{ total: number; unclaimed: number }> {
    return communityModule.countSeats(communityId);
  }

  createSeatsBatch(
    communityId: string,
    seats: Array<{
      platform: string;
      platform_user_id: string;
      platform_username: string;
      nickname?: string;
      avatar_url?: string;
      role_ids: string[];
    }>
  ): Promise<number> {
    return communityModule.createSeatsBatch(communityId, seats);
  }

  // Invites
  createCommunityInvite(communityId: string, creatorDid: string, maxUses?: number, expiresAt?: number): Promise<CommunityInvite> {
    return communityModule.createInvite(communityId, creatorDid, maxUses, expiresAt);
  }

  useCommunityInvite(code: string, memberDid: string, nickname?: string): Promise<string> {
    return communityModule.useInvite(code, memberDid, nickname);
  }

  getCommunityInvites(communityId: string): Promise<CommunityInvite[]> {
    return communityModule.getInvites(communityId);
  }

  deleteCommunityInvite(inviteId: string, actorDid: string): Promise<void> {
    return communityModule.deleteInvite(inviteId, actorDid);
  }

  /** Publish an invite to the relay so others can discover and join. */
  publishCommunityInviteToRelay(
    relayWs: WebSocket | null,
    invite: CommunityInvite,
    communityName: string,
    communityDescription?: string | null,
    communityIcon?: string | null,
    memberCount?: number,
    invitePayload?: string,
  ): void {
    communityModule.publishInviteToRelay(
      relayWs, invite, communityName, communityDescription, communityIcon, memberCount, invitePayload,
    );
  }

  /** Revoke a published invite on the relay. */
  revokeCommunityInviteOnRelay(relayWs: WebSocket | null, code: string): void {
    communityModule.revokeInviteOnRelay(relayWs, code);
  }

  /** Resolve an invite code from relay servers (fallback when local DB lookup fails). */
  resolveInviteFromRelay(
    relayUrls: readonly string[],
    code: string,
  ): Promise<communityModule.RelayInviteResolution | null> {
    return communityModule.resolveInviteFromRelay(relayUrls, code);
  }

  /** Import community + invite from relay-resolved data into local DB. */
  importCommunityFromRelay(
    communityId: string,
    communityName: string,
    description: string | null,
    ownerDid: string,
    inviteCode: string,
    maxUses?: number | null,
    expiresAt?: number | null,
  ): Promise<void> {
    return communityModule.importCommunityFromRelay(
      communityId, communityName, description, ownerDid, inviteCode, maxUses, expiresAt,
    );
  }

  /** Import community from an invite payload JSON string (relay-resolved). */
  async importCommunityFromInvitePayload(payload: string): Promise<void> {
    try {
      const data = JSON.parse(payload);
      if (data.community_id && data.community_name && data.owner_did && data.invite_code) {
        await communityModule.importCommunityFromRelay(
          data.community_id,
          data.community_name,
          data.description ?? null,
          data.owner_did,
          data.invite_code,
          data.max_uses,
          data.expires_at,
        );
      }
    } catch (err) {
      console.warn('[UmbraService] importCommunityFromInvitePayload failed:', err);
    }
  }

  // Messages
  sendCommunityMessage(
    channelId: string, senderDid: string, content: string,
    replyToId?: string, threadId?: string, metadata?: MessageMetadata,
  ): Promise<CommunityMessage> {
    return communityModule.sendMessage(channelId, senderDid, content, replyToId, threadId, metadata);
  }

  /** Store a message received from another member via relay / bridge (INSERT OR IGNORE). */
  storeReceivedCommunityMessage(
    id: string, channelId: string, senderDid: string, content: string, createdAt: number,
    metadata?: MessageMetadata,
  ): Promise<void> {
    return communityModule.storeReceivedMessage(id, channelId, senderDid, content, createdAt, metadata);
  }

  getCommunityMessages(channelId: string, limit?: number, beforeTimestamp?: number): Promise<CommunityMessage[]> {
    return communityModule.getMessages(channelId, limit, beforeTimestamp);
  }

  editCommunityMessage(messageId: string, newContent: string, editorDid: string): Promise<void> {
    return communityModule.editMessage(messageId, newContent, editorDid);
  }

  deleteCommunityMessage(messageId: string): Promise<void> {
    return communityModule.deleteMessage(messageId);
  }

  // Reactions
  addCommunityReaction(messageId: string, memberDid: string, emoji: string): Promise<void> {
    return communityModule.addReaction(messageId, memberDid, emoji);
  }

  removeCommunityReaction(messageId: string, memberDid: string, emoji: string): Promise<void> {
    return communityModule.removeReaction(messageId, memberDid, emoji);
  }

  // Pins
  pinCommunityMessage(messageId: string, channelId: string, actorDid: string): Promise<void> {
    return communityModule.pinMessage(messageId, channelId, actorDid);
  }

  unpinCommunityMessage(messageId: string, channelId: string, _actorDid?: string): Promise<void> {
    return communityModule.unpinMessage(messageId, channelId);
  }

  getCommunityPinnedMessages(channelId: string): Promise<CommunityMessage[]> {
    return communityModule.getPinnedMessages(channelId);
  }

  // Read Receipts
  markCommunityRead(channelId: string, memberDid: string, timestamp?: number): Promise<void> {
    return communityModule.markRead(channelId, memberDid, timestamp);
  }

  // Emoji
  createCommunityEmoji(
    communityId: string, name: string, imageUrl: string, animated: boolean, uploadedBy: string,
  ): Promise<CommunityEmoji> {
    return communityModule.createEmoji(communityId, name, imageUrl, animated, uploadedBy);
  }

  listCommunityEmoji(communityId: string): Promise<CommunityEmoji[]> {
    return communityModule.listEmoji(communityId);
  }

  deleteCommunityEmoji(emojiId: string, actorDid: string): Promise<void> {
    return communityModule.deleteEmoji(emojiId, actorDid);
  }

  renameCommunityEmoji(emojiId: string, newName: string): Promise<void> {
    return communityModule.renameEmoji(emojiId, newName);
  }

  storeReceivedCommunityEmoji(
    id: string, communityId: string, name: string, imageUrl: string,
    animated: boolean, uploadedBy: string, createdAt: number,
  ): Promise<void> {
    return communityModule.storeReceivedEmoji(id, communityId, name, imageUrl, animated, uploadedBy, createdAt);
  }

  // Stickers
  createCommunitySticker(
    communityId: string, name: string, imageUrl: string, animated: boolean, format: string, uploadedBy: string, packId?: string,
  ): Promise<CommunitySticker> {
    return communityModule.createSticker(communityId, name, imageUrl, animated, format, uploadedBy, packId);
  }

  listCommunityStickers(communityId: string): Promise<CommunitySticker[]> {
    return communityModule.listStickers(communityId);
  }

  deleteCommunitySticker(stickerId: string): Promise<void> {
    return communityModule.deleteSticker(stickerId);
  }

  storeReceivedCommunitySticker(
    id: string, communityId: string, name: string, imageUrl: string,
    animated: boolean, format: string, uploadedBy: string, createdAt: number,
    packId?: string,
  ): Promise<void> {
    return communityModule.storeReceivedSticker(id, communityId, name, imageUrl, animated, format, uploadedBy, createdAt, packId);
  }

  // Sticker Packs
  createCommunityStickerPack(
    communityId: string, name: string, createdBy: string, description?: string, coverStickerId?: string,
  ): Promise<StickerPack> {
    return communityModule.createStickerPack(communityId, name, createdBy, description, coverStickerId);
  }

  listCommunityStickerPacks(communityId: string): Promise<StickerPack[]> {
    return communityModule.listStickerPacks(communityId);
  }

  deleteCommunityStickerPack(packId: string): Promise<void> {
    return communityModule.deleteStickerPack(packId);
  }

  renameCommunityStickerPack(packId: string, newName: string): Promise<void> {
    return communityModule.renameStickerPack(packId, newName);
  }

  storeReceivedCommunityStickerPack(
    id: string, communityId: string, name: string, createdBy: string, createdAt: number,
    description?: string, coverStickerId?: string,
  ): Promise<void> {
    return communityModule.storeReceivedStickerPack(id, communityId, name, createdBy, createdAt, description, coverStickerId);
  }

  // ── Files ──────────────────────────────────────────────────────────────

  uploadCommunityFile(
    channelId: string, folderId: string | null, filename: string,
    description: string | null, fileSize: number, mimeType: string | null,
    storageChunksJson: string, uploadedBy: string,
  ): Promise<CommunityFileRecord> {
    return communityModule.uploadFile(channelId, folderId, filename, description, fileSize, mimeType, storageChunksJson, uploadedBy);
  }

  getCommunityFiles(channelId: string, folderId: string | null, limit: number, offset: number): Promise<CommunityFileRecord[]> {
    return communityModule.getFiles(channelId, folderId, limit, offset);
  }

  getCommunityFile(id: string): Promise<CommunityFileRecord> {
    return communityModule.getFile(id);
  }

  deleteCommunityFile(id: string, actorDid: string): Promise<void> {
    return communityModule.deleteFile(id, actorDid);
  }

  recordCommunityFileDownload(id: string): Promise<void> {
    return communityModule.recordFileDownload(id);
  }

  // ── Folders ────────────────────────────────────────────────────────────

  createCommunityFolder(
    channelId: string, parentFolderId: string | null, name: string, createdBy: string,
  ): Promise<CommunityFileFolderRecord> {
    return communityModule.createFolder(channelId, parentFolderId, name, createdBy);
  }

  getCommunityFolders(channelId: string, parentFolderId: string | null): Promise<CommunityFileFolderRecord[]> {
    return communityModule.getFolders(channelId, parentFolderId);
  }

  deleteCommunityFolder(id: string): Promise<void> {
    return communityModule.deleteFolder(id);
  }

  // ── DM Shared Files ──────────────────────────────────────────────────

  uploadDmFile(
    conversationId: string, folderId: string | null, filename: string,
    description: string | null, fileSize: number, mimeType: string | null,
    storageChunksJson: string, uploadedBy: string,
  ): Promise<DmSharedFileRecord> {
    return dmFiles.uploadDmFile(conversationId, folderId, filename, description, fileSize, mimeType, storageChunksJson, uploadedBy);
  }

  getDmFiles(conversationId: string, folderId: string | null, limit: number, offset: number): Promise<DmSharedFileRecord[]> {
    return dmFiles.getDmFiles(conversationId, folderId, limit, offset);
  }

  getDmFile(id: string): Promise<DmSharedFileRecord> {
    return dmFiles.getDmFile(id);
  }

  deleteDmFile(id: string, actorDid: string): Promise<void> {
    return dmFiles.deleteDmFile(id, actorDid);
  }

  recordDmFileDownload(id: string): Promise<void> {
    return dmFiles.recordDmFileDownload(id);
  }

  moveDmFile(fileId: string, targetFolderId: string | null): Promise<void> {
    return dmFiles.moveDmFile(fileId, targetFolderId);
  }

  // ── DM Shared Folders ────────────────────────────────────────────────

  createDmFolder(conversationId: string, parentFolderId: string | null, name: string, createdBy: string): Promise<DmSharedFolderRecord> {
    return dmFiles.createDmFolder(conversationId, parentFolderId, name, createdBy);
  }

  getDmFolders(conversationId: string, parentFolderId: string | null): Promise<DmSharedFolderRecord[]> {
    return dmFiles.getDmFolders(conversationId, parentFolderId);
  }

  deleteDmFolder(id: string): Promise<void> {
    return dmFiles.deleteDmFolder(id);
  }

  renameDmFolder(folderId: string, newName: string): Promise<void> {
    return dmFiles.renameDmFolder(folderId, newName);
  }

  // ── File Chunking ──────────────────────────────────────────────────

  chunkFile(fileId: string, filename: string, dataBase64: string, chunkSize?: number): Promise<ChunkManifest> {
    return chunkingModule.chunkFile(fileId, filename, dataBase64, chunkSize);
  }

  reassembleFile(fileId: string): Promise<ReassembledFile> {
    return chunkingModule.reassembleFile(fileId);
  }

  getFileManifest(fileId: string): Promise<FileManifestRecord | null> {
    return chunkingModule.getFileManifest(fileId);
  }

  // ── File Encryption (E2EE) ──────────────────────────────────────────

  deriveFileKey(peerDid: string, fileId: string, context?: string) {
    return fileEncryption.deriveFileKey(peerDid, fileId, context);
  }

  encryptFileChunk(keyHex: string, chunkDataB64: string, fileId: string, chunkIndex: number) {
    return fileEncryption.encryptFileChunk(keyHex, chunkDataB64, fileId, chunkIndex);
  }

  decryptFileChunk(keyHex: string, nonceHex: string, encryptedDataB64: string, fileId: string, chunkIndex: number) {
    return fileEncryption.decryptFileChunk(keyHex, nonceHex, encryptedDataB64, fileId, chunkIndex);
  }

  deriveChannelFileKey(channelKeyHex: string, fileId: string, keyVersion: number) {
    return fileEncryption.deriveChannelFileKey(channelKeyHex, fileId, keyVersion);
  }

  computeKeyFingerprint(keyHex: string) {
    return fileEncryption.computeKeyFingerprint(keyHex);
  }

  verifyKeyFingerprint(keyHex: string, remoteFingerprint: string) {
    return fileEncryption.verifyKeyFingerprint(keyHex, remoteFingerprint);
  }

  markFilesForReencryption(channelId: string, newKeyVersion: number) {
    return fileEncryption.markFilesForReencryption(channelId, newKeyVersion);
  }

  getFilesNeedingReencryption(channelId: string, limit?: number) {
    return fileEncryption.getFilesNeedingReencryption(channelId, limit);
  }

  clearReencryptionFlag(fileId: string, fingerprint?: string) {
    return fileEncryption.clearReencryptionFlag(fileId, fingerprint);
  }

  // ===========================================================================
  // FILE TRANSFER (delegated to file-transfer module)
  // ===========================================================================

  initiateTransfer(
    fileId: string, peerDid: string, manifestJson: string,
    direction?: TransferDirection, transportType?: TransportType,
  ): Promise<TransferProgress> {
    return fileTransfer.initiateTransfer(fileId, peerDid, manifestJson, direction, transportType);
  }

  acceptTransfer(transferId: string): Promise<TransferProgress> {
    return fileTransfer.acceptTransfer(transferId);
  }

  pauseTransfer(transferId: string): Promise<TransferProgress> {
    return fileTransfer.pauseTransfer(transferId);
  }

  resumeTransfer(transferId: string): Promise<TransferProgress> {
    return fileTransfer.resumeTransfer(transferId);
  }

  cancelTransfer(transferId: string, reason?: string): Promise<TransferProgress> {
    return fileTransfer.cancelTransfer(transferId, reason);
  }

  processTransferMessage(messageJson: string): Promise<{ events: Array<Record<string, unknown>> }> {
    return fileTransfer.processTransferMessage(messageJson);
  }

  getTransfers(): Promise<TransferProgress[]> {
    return fileTransfer.getTransfers();
  }

  getTransfer(transferId: string): Promise<TransferProgress | null> {
    return fileTransfer.getTransfer(transferId);
  }

  getIncompleteTransfers(): Promise<TransferProgress[]> {
    return fileTransfer.getIncompleteTransfers();
  }

  getChunksToSend(transferId: string): Promise<number[]> {
    return fileTransfer.getChunksToSend(transferId);
  }

  markChunkSent(transferId: string, chunkIndex: number): Promise<void> {
    return fileTransfer.markChunkSent(transferId, chunkIndex);
  }

  // File transfer events
  onFileTransferEvent(callback: (event: FileTransferEvent) => void): () => void {
    this._fileTransferListeners.push(callback);
    return () => {
      const index = this._fileTransferListeners.indexOf(callback);
      if (index !== -1) {
        this._fileTransferListeners.splice(index, 1);
      }
    };
  }

  dispatchFileTransferEvent(event: FileTransferEvent): void {
    for (const listener of this._fileTransferListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] File transfer listener error:', err);
      }
    }
  }

  // ── DM File Events ──────────────────────────────────────────────────

  buildDmFileEventEnvelope(conversationId: string, senderDid: string, event: DmFileEventPayload['event']): Promise<{ payload: string }> {
    return dmFiles.buildDmFileEventEnvelope(conversationId, senderDid, event);
  }

  broadcastDmFileEvent(recipientDids: string[], envelope: { payload: string }, relayWs: WebSocket | null): Promise<void> {
    return dmFiles.broadcastDmFileEvent(recipientDids, envelope, relayWs);
  }

  // Community events
  onCommunityEvent(callback: (event: CommunityEvent) => void): () => void {
    this._communityListeners.push(callback);
    return () => {
      const index = this._communityListeners.indexOf(callback);
      if (index !== -1) {
        this._communityListeners.splice(index, 1);
      }
    };
  }

  dispatchCommunityEvent(event: CommunityEvent): void {
    for (const listener of this._communityListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Community listener error:', err);
      }
    }
  }

  broadcastCommunityEvent(communityId: string, event: CommunityEvent, senderDid: string, relayWs: WebSocket | null): Promise<void> {
    return communityModule.broadcastCommunityEvent(communityId, event, senderDid, relayWs);
  }

  // DM file events
  onDmFileEvent(callback: (event: DmFileEventPayload) => void): () => void {
    this._dmFileListeners.push(callback);
    return () => {
      const index = this._dmFileListeners.indexOf(callback);
      if (index !== -1) {
        this._dmFileListeners.splice(index, 1);
      }
    };
  }

  dispatchDmFileEvent(event: DmFileEventPayload): void {
    for (const listener of this._dmFileListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] DM file listener error:', err);
      }
    }
  }

  // Metadata events
  onMetadataEvent(callback: (event: MetadataEvent) => void): () => void {
    this._metadataListeners.push(callback);
    return () => {
      const index = this._metadataListeners.indexOf(callback);
      if (index !== -1) {
        this._metadataListeners.splice(index, 1);
      }
    };
  }

  dispatchMetadataEvent(event: MetadataEvent): void {
    for (const listener of this._metadataListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[UmbraService] Metadata listener error:', err);
      }
    }
  }

  // ===========================================================================
  // CRYPTO (delegated to crypto module)
  // ===========================================================================

  sign(data: Uint8Array): Promise<Uint8Array> {
    return crypto.sign(data);
  }

  verify(publicKeyHex: string, data: Uint8Array, signature: Uint8Array): Promise<boolean> {
    return crypto.verify(publicKeyHex, data, signature);
  }

  // ===========================================================================
  // RELAY (delegated to relay module)
  // ===========================================================================

  connectRelay(relayUrl: string): Promise<RelayStatus & { registerMessage: string }> {
    return relay.connectRelay(relayUrl);
  }

  disconnectRelay(): Promise<void> {
    return relay.disconnectRelay();
  }

  createOfferSession(relayUrl: string): Promise<RelaySession> {
    return relay.createOfferSession(relayUrl);
  }

  acceptSession(sessionId: string, offerPayload: string): Promise<RelayAcceptResult> {
    return relay.acceptSession(sessionId, offerPayload);
  }

  relaySend(toDid: string, payload: string): Promise<{ relayMessage: string }> {
    return relay.relaySend(toDid, payload);
  }

  relayFetchOffline(): Promise<string> {
    return relay.relayFetchOffline();
  }

  onRelayEvent(callback: (event: RelayEvent) => void): () => void {
    this._relayListeners.push(callback);
    return () => {
      const index = this._relayListeners.indexOf(callback);
      if (index !== -1) {
        this._relayListeners.splice(index, 1);
      }
    };
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Get WASM module version
   */
  static getVersion(): string {
    if (!isWasmReady()) return 'not loaded';
    return getWasm()!.umbra_wasm_version();
  }

  /**
   * Validate a recovery phrase
   *
   * Checks if the phrase has valid words and checksum.
   *
   * @param phrase - Recovery phrase (space-separated or array)
   * @returns True if valid
   */
  static validateRecoveryPhrase(phrase: string | string[]): boolean {
    const words = Array.isArray(phrase) ? phrase : phrase.split(' ');
    if (words.length !== 24) {
      return false;
    }
    // TODO: call WASM validation when available
    return true;
  }

  /**
   * Get word suggestions for recovery phrase input
   *
   * @param _prefix - Partial word typed by user
   * @returns Matching BIP39 words
   */
  static suggestRecoveryWords(_prefix: string): string[] {
    // TODO: call WASM suggestion when available
    return [];
  }

  // ===========================================================================
  // INTERNAL: Event Dispatch
  // ===========================================================================

  /**
   * Dispatch a WASM event to registered listeners.
   *
   * Called by the event bridge when Rust emits an event.
   */
  private _dispatchEvent(event: UmbraEvent): void {
    const { domain, data } = event;
    if (!data || typeof data !== 'object') {
      console.warn('[UmbraService] Ignoring event with missing/invalid data:', JSON.stringify(event));
      return;
    }
    const camelData = snakeToCamel(data) as Record<string, unknown>;

    switch (domain) {
      case 'message': {
        // Rust now emits structured content ({ type, text }) and status directly.
        if (!camelData || !camelData.type) {
          console.warn('[UmbraService] Ignoring message event with no type:', JSON.stringify(data));
          break;
        }
        for (const listener of this._messageListeners) {
          try {
            listener(camelData as unknown as MessageEvent);
          } catch (err) {
            console.error('[UmbraService] Message listener error:', err);
          }
        }
        break;
      }

      case 'friend':
        for (const listener of this._friendListeners) {
          try {
            listener(camelData as unknown as FriendEvent);
          } catch (err) {
            console.error('[UmbraService] Friend listener error:', err);
          }
        }
        break;

      case 'discovery':
      case 'network':
        for (const listener of this._discoveryListeners) {
          try {
            listener(camelData as unknown as DiscoveryEvent);
          } catch (err) {
            console.error('[UmbraService] Discovery listener error:', err);
          }
        }
        break;

      case 'relay':
        for (const listener of this._relayListeners) {
          try {
            listener(camelData as unknown as RelayEvent);
          } catch (err) {
            console.error('[UmbraService] Relay listener error:', err);
          }
        }
        break;

      case 'group':
        for (const listener of this._groupListeners) {
          try {
            listener(camelData as unknown as GroupEvent);
          } catch (err) {
            console.error('[UmbraService] Group listener error:', err);
          }
        }
        break;

      case 'community':
        for (const listener of this._communityListeners) {
          try {
            listener(camelData as unknown as CommunityEvent);
          } catch (err) {
            console.error('[UmbraService] Community listener error:', err);
          }
        }
        break;

      case 'file_transfer':
        for (const listener of this._fileTransferListeners) {
          try {
            listener(camelData as unknown as FileTransferEvent);
          } catch (err) {
            console.error('[UmbraService] File transfer listener error:', err);
          }
        }
        break;
    }
  }
}
