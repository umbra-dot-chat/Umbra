/**
 * Jest mock for @umbra/service
 *
 * Provides a mock UmbraService with proper method signatures
 * matching the real service API.
 */

const ErrorCode = {
  NotInitialized: 100,
  AlreadyInitialized: 101,
  ShutdownInProgress: 102,
  NoIdentity: 200,
  IdentityExists: 201,
  InvalidRecoveryPhrase: 202,
  AlreadyFriends: 600,
  NotFriends: 601,
  RequestPending: 602,
  RequestNotFound: 603,
  UserBlocked: 604,
  ConversationNotFound: 700,
  Internal: 900,
};

class UmbraError extends Error {
  constructor(code, message, recoverable = false) {
    super(message);
    this.name = 'UmbraError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

const mockInstance = {
  // Identity
  createIdentity: jest.fn((name) =>
    Promise.resolve({
      identity: {
        did: `did:key:z6MkTest${Date.now().toString(36)}`,
        displayName: name,
        createdAt: Date.now() / 1000,
      },
      recoveryPhrase: [
        'abandon', 'ability', 'able', 'about', 'above', 'absent',
        'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident',
        'account', 'accuse', 'achieve', 'acid', 'across', 'act',
        'action', 'actor', 'actress', 'actual', 'adapt', 'add',
      ],
    })
  ),
  restoreIdentity: jest.fn((phrase, name) =>
    Promise.resolve({ did: 'did:key:z6MkRestored', displayName: name, createdAt: Date.now() / 1000 })
  ),
  loadIdentity: jest.fn(() =>
    Promise.resolve({ did: 'did:key:z6MkTest', displayName: 'Test', createdAt: Date.now() / 1000 })
  ),
  getIdentity: jest.fn(() =>
    Promise.resolve({ did: 'did:key:z6MkTest', displayName: 'Test', createdAt: Date.now() / 1000 })
  ),
  updateProfile: jest.fn(() => Promise.resolve()),
  getPublicIdentity: jest.fn(() =>
    Promise.resolve({
      did: 'did:key:z6MkTest',
      displayName: 'Test',
      publicKeys: { signing: 'mock-signing', encryption: 'mock-encryption' },
      createdAt: Date.now() / 1000,
    })
  ),

  // Friends
  getFriends: jest.fn(() => Promise.resolve([])),
  getIncomingRequests: jest.fn(() => Promise.resolve([])),
  getOutgoingRequests: jest.fn(() => Promise.resolve([])),
  sendFriendRequest: jest.fn((did, msg) =>
    Promise.resolve({
      id: `req-${Date.now()}`,
      fromDid: 'did:key:z6MkTest',
      toDid: did,
      direction: 'outgoing',
      message: msg,
      createdAt: Date.now(),
      status: 'pending',
    })
  ),
  acceptFriendRequest: jest.fn((id) =>
    Promise.resolve({ requestId: id, status: 'accepted' })
  ),
  rejectFriendRequest: jest.fn(() => Promise.resolve()),
  removeFriend: jest.fn(() => Promise.resolve(true)),
  blockUser: jest.fn(() => Promise.resolve()),
  unblockUser: jest.fn(() => Promise.resolve(true)),

  // Conversations
  getConversations: jest.fn(() => Promise.resolve([])),

  // Messages
  sendMessage: jest.fn((convId, text) =>
    Promise.resolve({
      id: `msg-${Date.now()}`,
      conversationId: convId,
      senderDid: 'did:key:z6MkTest',
      content: { type: 'text', text },
      timestamp: Date.now(),
      read: false,
      delivered: false,
      status: 'sent',
    })
  ),
  getMessages: jest.fn((_convId, _opts) => Promise.resolve([])),
  markAsRead: jest.fn(() => Promise.resolve(0)),
  sendTypingIndicator: jest.fn(() => Promise.resolve()),

  // Extended messaging
  editMessage: jest.fn((id, newText) =>
    Promise.resolve({
      id, content: { type: 'text', text: newText }, edited: true, editedAt: Date.now(),
      conversationId: 'conv-1', senderDid: 'did:key:z6MkTest', timestamp: Date.now(),
      read: false, delivered: false, status: 'sent',
    })
  ),
  deleteMessage: jest.fn(() => Promise.resolve()),
  pinMessage: jest.fn((id) =>
    Promise.resolve({
      id, pinned: true, pinnedBy: 'did:key:z6MkTest', pinnedAt: Date.now(),
      conversationId: 'conv-1', senderDid: 'did:key:z6MkTest', content: { type: 'text', text: '' },
      timestamp: Date.now(), read: false, delivered: false, status: 'sent',
    })
  ),
  unpinMessage: jest.fn(() => Promise.resolve()),
  addReaction: jest.fn((_id, emoji) =>
    Promise.resolve([{ emoji, count: 1, users: ['did:key:z6MkTest'], reacted: true }])
  ),
  removeReaction: jest.fn(() => Promise.resolve([])),
  forwardMessage: jest.fn((_id, targetConvId) =>
    Promise.resolve({
      id: `msg-fwd-${Date.now()}`, conversationId: targetConvId,
      senderDid: 'did:key:z6MkTest', content: { type: 'text', text: 'forwarded' },
      timestamp: Date.now(), read: false, delivered: false, status: 'sent', forwarded: true,
    })
  ),
  getThreadReplies: jest.fn(() => Promise.resolve([])),
  sendThreadReply: jest.fn((_parentId, text) =>
    Promise.resolve({
      id: `msg-reply-${Date.now()}`, conversationId: 'conv-1',
      senderDid: 'did:key:z6MkTest', content: { type: 'text', text },
      timestamp: Date.now(), read: false, delivered: false, status: 'sent',
    })
  ),
  getPinnedMessages: jest.fn(() => Promise.resolve([])),

  // Incoming messages
  storeIncomingMessage: jest.fn(() => Promise.resolve()),

  // Network
  getNetworkStatus: jest.fn(() =>
    Promise.resolve({ isRunning: false, peerCount: 0, listenAddresses: [] })
  ),
  startNetwork: jest.fn(() => Promise.resolve()),
  stopNetwork: jest.fn(() => Promise.resolve()),
  lookupPeer: jest.fn(() => Promise.resolve({ status: 'notFound' })),
  getConnectionInfo: jest.fn(() =>
    Promise.resolve({
      did: 'did:key:z6MkTest',
      peerId: 'mock-peer-id',
      addresses: [],
      displayName: 'Test',
    })
  ),
  parseConnectionInfo: jest.fn((info) =>
    Promise.resolve({ did: info, peerId: '', addresses: [], displayName: '' })
  ),
  connectDirect: jest.fn(() => Promise.resolve()),

  // Signaling (WebRTC)
  createOffer: jest.fn(() =>
    Promise.resolve(JSON.stringify({
      sdp: 'mock-sdp-offer',
      sdp_type: 'offer',
      ice_candidates: [{ candidate: 'mock-candidate', sdp_mid: '0', sdp_m_line_index: 0 }],
    }))
  ),
  acceptOffer: jest.fn((offerJson) =>
    Promise.resolve(JSON.stringify({
      sdp: 'mock-sdp-answer',
      sdp_type: 'answer',
      ice_candidates: [{ candidate: 'mock-answer-candidate', sdp_mid: '0', sdp_m_line_index: 0 }],
    }))
  ),
  completeHandshake: jest.fn(() => Promise.resolve(true)),
  completeAnswerer: jest.fn(() => Promise.resolve(true)),

  // Crypto
  sign: jest.fn(() => Promise.resolve(new Uint8Array(64))),
  verify: jest.fn(() => Promise.resolve(true)),

  // Groups
  createGroup: jest.fn((name, description) =>
    Promise.resolve({
      groupId: `group-${Date.now()}`,
      conversationId: `conv-group-${Date.now()}`,
    })
  ),
  getGroup: jest.fn((groupId) =>
    Promise.resolve({
      id: groupId,
      name: 'Test Group',
      description: 'A test group',
      createdBy: 'did:key:z6MkTest',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  ),
  getGroups: jest.fn(() => Promise.resolve([])),
  updateGroup: jest.fn(() => Promise.resolve()),
  deleteGroup: jest.fn(() => Promise.resolve()),
  addGroupMember: jest.fn(() => Promise.resolve()),
  removeGroupMember: jest.fn(() => Promise.resolve()),
  getGroupMembers: jest.fn((groupId) =>
    Promise.resolve([
      {
        groupId,
        memberDid: 'did:key:z6MkTest',
        displayName: 'Test',
        role: 'admin',
        joinedAt: Date.now(),
      },
    ])
  ),

  // Relay
  connectRelay: jest.fn((url) =>
    Promise.resolve({
      connected: true,
      relayUrl: url,
      did: 'did:key:z6MkTest',
      registerMessage: JSON.stringify({ type: 'register', did: 'did:key:z6MkTest' }),
    })
  ),
  disconnectRelay: jest.fn(() => Promise.resolve()),
  createOfferSession: jest.fn((relayUrl) =>
    Promise.resolve({
      relayUrl,
      did: 'did:key:z6MkTest',
      peerId: 'mock-peer-id',
      offerPayload: JSON.stringify({ sdp_type: 'offer', sdp: 'mock-offer' }),
      createSessionMessage: JSON.stringify({ type: 'create_session', offer_payload: '{}' }),
      sessionId: '',
      link: '',
    })
  ),
  acceptSession: jest.fn((sessionId, _offerPayload) =>
    Promise.resolve({
      sessionId,
      answerPayload: JSON.stringify({ sdp_type: 'answer', sdp: 'mock-answer' }),
      joinSessionMessage: JSON.stringify({ type: 'join_session', session_id: sessionId, answer_payload: '{}' }),
      did: 'did:key:z6MkTest',
      peerId: 'mock-peer-id',
    })
  ),
  relaySend: jest.fn((toDid, payload) =>
    Promise.resolve({
      relayMessage: JSON.stringify({ type: 'send', to_did: toDid, payload }),
    })
  ),
  relayFetchOffline: jest.fn(() =>
    Promise.resolve(JSON.stringify({ type: 'fetch_offline' }))
  ),

  // Events
  onMessageEvent: jest.fn(() => jest.fn()),
  onFriendEvent: jest.fn(() => jest.fn()),
  onDiscoveryEvent: jest.fn(() => jest.fn()),
  onRelayEvent: jest.fn(() => jest.fn()),

  // Call events
  onCallEvent: jest.fn(() => jest.fn()),
  dispatchCallEvent: jest.fn(),
  setRelayWs: jest.fn(),
  sendCallSignal: jest.fn(),
  createCallRoom: jest.fn(),
  joinCallRoom: jest.fn(),
  leaveCallRoom: jest.fn(),
  sendCallRoomSignal: jest.fn(),
  storeCallRecord: jest.fn(() => Promise.resolve({ id: 'call-1', startedAt: Date.now() })),
  endCallRecord: jest.fn(() => Promise.resolve({ id: 'call-1', endedAt: Date.now(), durationMs: 60000 })),
  getCallHistory: jest.fn(() => Promise.resolve([])),
  getAllCallHistory: jest.fn(() => Promise.resolve([])),

  // Community
  createCommunity: jest.fn((name, ownerDid) =>
    Promise.resolve({ communityId: `community-${Date.now()}`, community: { id: `community-${Date.now()}`, name, ownerDid } })
  ),
  getCommunity: jest.fn((id) => Promise.resolve({ id, name: 'Test Community', ownerDid: 'did:key:z6MkTest' })),
  getCommunities: jest.fn(() => Promise.resolve([])),
  updateCommunity: jest.fn(() => Promise.resolve()),
  deleteCommunity: jest.fn(() => Promise.resolve()),
  createSpace: jest.fn((communityId, name) => Promise.resolve({ id: `space-${Date.now()}`, communityId, name, position: 0 })),
  getSpaces: jest.fn(() => Promise.resolve([])),
  updateSpace: jest.fn(() => Promise.resolve()),
  deleteSpace: jest.fn(() => Promise.resolve()),
  reorderSpaces: jest.fn(() => Promise.resolve()),
  createCategory: jest.fn((communityId, spaceId, name) => Promise.resolve({ id: `cat-${Date.now()}`, communityId, spaceId, name, position: 0 })),
  getCategories: jest.fn(() => Promise.resolve([])),
  getAllCategories: jest.fn(() => Promise.resolve([])),
  updateCategory: jest.fn(() => Promise.resolve()),
  reorderCategories: jest.fn(() => Promise.resolve()),
  deleteCategory: jest.fn(() => Promise.resolve()),
  moveChannelToCategory: jest.fn(() => Promise.resolve()),
  createChannel: jest.fn((communityId, spaceId, name, type) =>
    Promise.resolve({ id: `ch-${Date.now()}`, communityId, spaceId, name, channelType: type, position: 0 })
  ),
  getChannels: jest.fn(() => Promise.resolve([])),
  getAllChannels: jest.fn(() => Promise.resolve([])),
  getChannel: jest.fn((id) => Promise.resolve({ id, name: 'general', channelType: 'text' })),
  updateChannel: jest.fn(() => Promise.resolve()),
  deleteChannel: jest.fn(() => Promise.resolve()),
  reorderChannels: jest.fn(() => Promise.resolve()),
  setSlowMode: jest.fn(() => Promise.resolve()),
  setChannelE2ee: jest.fn(() => Promise.resolve()),
  joinCommunity: jest.fn(() => Promise.resolve()),
  leaveCommunity: jest.fn(() => Promise.resolve()),
  getCommunityMembers: jest.fn(() => Promise.resolve([])),
  getCommunityMember: jest.fn((communityId, did) =>
    Promise.resolve({ communityId, memberDid: did, nickname: 'Test', joinedAt: Date.now() })
  ),
  kickCommunityMember: jest.fn(() => Promise.resolve()),
  banCommunityMember: jest.fn(() => Promise.resolve()),
  unbanCommunityMember: jest.fn(() => Promise.resolve()),
  getCommunityRoles: jest.fn(() => Promise.resolve([])),
  getMemberRoles: jest.fn(() => Promise.resolve([])),
  assignRole: jest.fn(() => Promise.resolve()),
  unassignRole: jest.fn(() => Promise.resolve()),
  createCustomRole: jest.fn((communityId, name) =>
    Promise.resolve({ id: `role-${Date.now()}`, communityId, name, position: 10, color: null })
  ),
  updateRole: jest.fn(() => Promise.resolve()),
  updateRolePermissions: jest.fn(() => Promise.resolve()),
  deleteRole: jest.fn(() => Promise.resolve()),
  createCommunityInvite: jest.fn((communityId) =>
    Promise.resolve({ id: `invite-${Date.now()}`, communityId, code: 'ABC123', useCount: 0, createdAt: Date.now() })
  ),
  useCommunityInvite: jest.fn(() => Promise.resolve('community-123')),
  getCommunityInvites: jest.fn(() => Promise.resolve([])),
  deleteCommunityInvite: jest.fn(() => Promise.resolve()),
  sendCommunityMessage: jest.fn((channelId, senderDid, content) =>
    Promise.resolve({ id: `cmsg-${Date.now()}`, channelId, senderDid, content, timestamp: Date.now() })
  ),
  getCommunityMessages: jest.fn(() => Promise.resolve([])),
  editCommunityMessage: jest.fn(() => Promise.resolve()),
  deleteCommunityMessage: jest.fn(() => Promise.resolve()),
  addCommunityReaction: jest.fn(() => Promise.resolve()),
  removeCommunityReaction: jest.fn(() => Promise.resolve()),
  pinCommunityMessage: jest.fn(() => Promise.resolve()),
  unpinCommunityMessage: jest.fn(() => Promise.resolve()),
  getCommunityPinnedMessages: jest.fn(() => Promise.resolve([])),
  markCommunityRead: jest.fn(() => Promise.resolve()),
  onCommunityEvent: jest.fn(() => jest.fn()),
  dispatchCommunityEvent: jest.fn(),
  broadcastCommunityEvent: jest.fn(() => Promise.resolve()),
  getRelayWs: jest.fn(() => null),

  // Group events
  onGroupEvent: jest.fn(() => jest.fn()),
  dispatchGroupEvent: jest.fn(),
  dispatchFriendEvent: jest.fn(),
  dispatchMessageEvent: jest.fn(),

  // Community files
  getCommunityFiles: jest.fn(() => Promise.resolve([])),
  getCommunityFile: jest.fn((id) =>
    Promise.resolve({ id, channelId: 'ch-1', filename: 'test.txt', fileSize: 1024, mimeType: 'text/plain', uploadedBy: 'did:key:z6MkTest', version: 1, downloadCount: 0, createdAt: Date.now(), storageChunksJson: '[]' })
  ),
  uploadCommunityFile: jest.fn(() =>
    Promise.resolve({ id: `file-${Date.now()}`, channelId: 'ch-1', filename: 'upload.txt', fileSize: 512, mimeType: 'text/plain', uploadedBy: 'did:key:z6MkTest', version: 1, downloadCount: 0, createdAt: Date.now(), storageChunksJson: '[]' })
  ),
  deleteCommunityFile: jest.fn(() => Promise.resolve()),
  getCommunityFolders: jest.fn(() => Promise.resolve([])),
  createCommunityFolder: jest.fn((channelId, name) =>
    Promise.resolve({ id: `folder-${Date.now()}`, channelId, name, parentFolderId: null, createdBy: 'did:key:z6MkTest', createdAt: Date.now() })
  ),
  deleteCommunityFolder: jest.fn(() => Promise.resolve()),

  // DM files
  uploadDmFile: jest.fn(() => Promise.resolve({ id: `dm-file-${Date.now()}` })),
  getDmFiles: jest.fn(() => Promise.resolve([])),
  getDmFile: jest.fn((id) =>
    Promise.resolve({ id, conversationId: 'conv-1', filename: 'shared.txt', fileSize: 256, mimeType: 'text/plain', uploadedBy: 'did:key:z6MkTest', version: 1, downloadCount: 0, createdAt: Date.now(), storageChunksJson: '[]' })
  ),
  deleteDmFile: jest.fn(() => Promise.resolve()),
  recordDmFileDownload: jest.fn(() => Promise.resolve()),
  moveDmFile: jest.fn(() => Promise.resolve()),
  createDmFolder: jest.fn((convId, parentId, name, createdBy) =>
    Promise.resolve({ id: `dm-folder-${Date.now()}`, conversationId: convId, name, parentFolderId: parentId, createdBy, createdAt: Date.now() })
  ),
  getDmFolders: jest.fn(() => Promise.resolve([])),
  deleteDmFolder: jest.fn(() => Promise.resolve()),
  renameDmFolder: jest.fn(() => Promise.resolve()),

  // File chunking
  chunkFile: jest.fn((fileId, filename, dataBase64) =>
    Promise.resolve({
      fileId,
      filename,
      totalSize: 1024,
      chunkSize: 262144,
      totalChunks: 1,
      fileHash: 'abc123',
      chunks: [{ chunkId: 'chunk-0', index: 0, size: 1024, hash: 'hash0' }],
    })
  ),
  reassembleFile: jest.fn((fileId) =>
    Promise.resolve({ dataB64: 'SGVsbG8gV29ybGQ=', filename: 'test.txt', fileHash: 'abc123', totalSize: 11 })
  ),
  getFileManifest: jest.fn(() => Promise.resolve(null)),

  // File transfer
  initiateTransfer: jest.fn(() =>
    Promise.resolve({ transferId: 'xfer-1', fileId: 'file-1', peerDid: 'did:key:z6MkPeer', direction: 'upload', state: 'negotiating', bytesTransferred: 0, totalBytes: 1024, chunksCompleted: 0, totalChunks: 1, speedBps: 0 })
  ),
  acceptTransfer: jest.fn(() => Promise.resolve({ transferId: 'xfer-1', state: 'transferring' })),
  pauseTransfer: jest.fn(() => Promise.resolve({ transferId: 'xfer-1', state: 'paused' })),
  resumeTransfer: jest.fn(() => Promise.resolve({ transferId: 'xfer-1', state: 'transferring' })),
  cancelTransfer: jest.fn(() => Promise.resolve({ transferId: 'xfer-1', state: 'cancelled' })),
  processTransferMessage: jest.fn(() => Promise.resolve({ events: [] })),
  getTransfers: jest.fn(() => Promise.resolve([])),
  getTransfer: jest.fn(() => Promise.resolve(null)),
  getIncompleteTransfers: jest.fn(() => Promise.resolve([])),
  getChunksToSend: jest.fn(() => Promise.resolve([])),
  markChunkSent: jest.fn(() => Promise.resolve()),
  onFileTransferEvent: jest.fn(() => jest.fn()),
  dispatchFileTransferEvent: jest.fn(),

  // DM file events
  buildDmFileEventEnvelope: jest.fn((convId, senderDid, event) => ({
    type: 'dm_file_event', conversationId: convId, senderDid, event,
  })),
  broadcastDmFileEvent: jest.fn(() => Promise.resolve()),

  // File encryption (E2EE)
  deriveFileKey: jest.fn((peerDid, fileId) =>
    Promise.resolve({ keyHex: 'a'.repeat(64) })
  ),
  encryptFileChunk: jest.fn((keyHex, chunkDataB64, fileId, chunkIndex) =>
    Promise.resolve({ nonceHex: 'b'.repeat(24), encryptedDataB64: chunkDataB64 })
  ),
  decryptFileChunk: jest.fn((keyHex, nonceHex, encryptedDataB64, fileId, chunkIndex) =>
    Promise.resolve({ chunkDataB64: encryptedDataB64 })
  ),
};

class UmbraService {
  static _initialized = false;

  static initialize = jest.fn(() => {
    UmbraService._initialized = true;
    return Promise.resolve();
  });

  static get instance() {
    return mockInstance;
  }

  static get isInitialized() {
    return UmbraService._initialized;
  }

  static shutdown = jest.fn(() => {
    UmbraService._initialized = false;
    return Promise.resolve();
  });

  static getVersion = jest.fn(() => '0.1.0-test');

  static validateRecoveryPhrase = jest.fn((phrase) => {
    const words = Array.isArray(phrase) ? phrase : phrase.split(' ');
    return words.length === 24;
  });

  static suggestRecoveryWords = jest.fn(() => []);
}

module.exports = {
  UmbraService,
  ErrorCode,
  UmbraError,
  default: UmbraService,
};
