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
