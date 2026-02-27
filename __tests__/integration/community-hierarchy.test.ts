/**
 * Integration tests for Community Hierarchy (T6.x):
 * Spaces, categories, channels, roles, invites, and member management.
 *
 * Tests the full community structure lifecycle: create community →
 * add spaces → add categories → add channels → assign roles → manage members.
 *
 * Uses the Jest-mocked UmbraService singleton.
 */

const { UmbraService } = require('@umbra/service');

describe('Community Hierarchy', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Community CRUD (T6.1) ───────────────────────────────────────────

  test('createCommunity returns communityId and community object', async () => {
    const result = await svc.createCommunity('My Community', 'did:key:z6MkOwner');
    expect(result).toBeDefined();
    expect(typeof result.communityId).toBe('string');
    expect(result.communityId.length).toBeGreaterThan(0);
    expect(result.community).toBeDefined();
    expect(result.community.name).toBe('My Community');
    expect(result.community.ownerDid).toBe('did:key:z6MkOwner');
  });

  test('getCommunity returns community by ID', async () => {
    const community = await svc.getCommunity('community-1');
    expect(community).toBeDefined();
    expect(community.id).toBe('community-1');
    expect(typeof community.name).toBe('string');
    expect(community.name.length).toBeGreaterThan(0);
    expect(typeof community.ownerDid).toBe('string');
  });

  test('updateCommunity resolves without error', async () => {
    await expect(svc.updateCommunity()).resolves.not.toThrow();
  });

  test('deleteCommunity resolves without error', async () => {
    await expect(svc.deleteCommunity()).resolves.not.toThrow();
  });

  // ── Spaces (T6.6) ──────────────────────────────────────────────────

  test('createSpace returns space with correct communityId and name', async () => {
    const space = await svc.createSpace('community-1', 'General');
    expect(space).toBeDefined();
    expect(typeof space.id).toBe('string');
    expect(space.id.length).toBeGreaterThan(0);
    expect(space.communityId).toBe('community-1');
    expect(space.name).toBe('General');
    expect(typeof space.position).toBe('number');
  });

  test('getSpaces returns array', async () => {
    const spaces = await svc.getSpaces();
    expect(Array.isArray(spaces)).toBe(true);
  });

  test('updateSpace resolves without error', async () => {
    await expect(svc.updateSpace()).resolves.not.toThrow();
  });

  test('deleteSpace resolves without error', async () => {
    await expect(svc.deleteSpace()).resolves.not.toThrow();
  });

  test('reorderSpaces accepts position array', async () => {
    await expect(svc.reorderSpaces()).resolves.not.toThrow();
    expect(svc.reorderSpaces).toHaveBeenCalledTimes(1);
  });

  // ── Categories (T6.7) ──────────────────────────────────────────────

  test('createCategory returns category linked to space', async () => {
    const category = await svc.createCategory('community-1', 'space-1', 'Text Channels');
    expect(category).toBeDefined();
    expect(typeof category.id).toBe('string');
    expect(category.id.length).toBeGreaterThan(0);
    expect(category.communityId).toBe('community-1');
    expect(category.spaceId).toBe('space-1');
    expect(category.name).toBe('Text Channels');
    expect(typeof category.position).toBe('number');
  });

  test('getCategories returns array', async () => {
    const categories = await svc.getCategories();
    expect(Array.isArray(categories)).toBe(true);
  });

  test('reorderCategories accepts position array', async () => {
    await expect(svc.reorderCategories()).resolves.not.toThrow();
    expect(svc.reorderCategories).toHaveBeenCalledTimes(1);
  });

  test('deleteCategory resolves without error', async () => {
    await expect(svc.deleteCategory()).resolves.not.toThrow();
  });

  // ── Channels (T6.8–T6.9) ──────────────────────────────────────────

  test('createChannel with text type returns correct channelType', async () => {
    const channel = await svc.createChannel('community-1', 'space-1', 'general', 'text');
    expect(channel).toBeDefined();
    expect(typeof channel.id).toBe('string');
    expect(channel.id.length).toBeGreaterThan(0);
    expect(channel.communityId).toBe('community-1');
    expect(channel.spaceId).toBe('space-1');
    expect(channel.name).toBe('general');
    expect(channel.channelType).toBe('text');
  });

  test('createChannel with voice type returns correct channelType', async () => {
    const channel = await svc.createChannel('community-1', 'space-1', 'voice-chat', 'voice');
    expect(channel).toBeDefined();
    expect(channel.name).toBe('voice-chat');
    expect(channel.channelType).toBe('voice');
  });

  test('createChannel with announcement type', async () => {
    const channel = await svc.createChannel('community-1', 'space-1', 'news', 'announcement');
    expect(channel).toBeDefined();
    expect(channel.name).toBe('news');
    expect(channel.channelType).toBe('announcement');
  });

  test('getChannel returns channel by ID', async () => {
    const channel = await svc.getChannel('ch-1');
    expect(channel).toBeDefined();
    expect(channel.id).toBe('ch-1');
    expect(typeof channel.name).toBe('string');
    expect(typeof channel.channelType).toBe('string');
  });

  test('moveChannelToCategory resolves without error', async () => {
    await expect(svc.moveChannelToCategory()).resolves.not.toThrow();
    expect(svc.moveChannelToCategory).toHaveBeenCalledTimes(1);
  });

  test('setSlowMode resolves without error', async () => {
    await expect(svc.setSlowMode()).resolves.not.toThrow();
    expect(svc.setSlowMode).toHaveBeenCalledTimes(1);
  });

  test('setChannelE2ee resolves without error', async () => {
    await expect(svc.setChannelE2ee()).resolves.not.toThrow();
    expect(svc.setChannelE2ee).toHaveBeenCalledTimes(1);
  });

  // ── Roles & Permissions ────────────────────────────────────────────

  test('createCustomRole returns role with name and position', async () => {
    const role = await svc.createCustomRole('community-1', 'Moderator');
    expect(role).toBeDefined();
    expect(typeof role.id).toBe('string');
    expect(role.id.length).toBeGreaterThan(0);
    expect(role.communityId).toBe('community-1');
    expect(role.name).toBe('Moderator');
    expect(typeof role.position).toBe('number');
  });

  test('getCommunityRoles returns array', async () => {
    const roles = await svc.getCommunityRoles();
    expect(Array.isArray(roles)).toBe(true);
  });

  test('assignRole resolves without error', async () => {
    await expect(svc.assignRole()).resolves.not.toThrow();
    expect(svc.assignRole).toHaveBeenCalledTimes(1);
  });

  test('unassignRole resolves without error', async () => {
    await expect(svc.unassignRole()).resolves.not.toThrow();
    expect(svc.unassignRole).toHaveBeenCalledTimes(1);
  });

  test('updateRolePermissions resolves without error', async () => {
    await expect(svc.updateRolePermissions()).resolves.not.toThrow();
    expect(svc.updateRolePermissions).toHaveBeenCalledTimes(1);
  });

  test('deleteRole resolves without error', async () => {
    await expect(svc.deleteRole()).resolves.not.toThrow();
    expect(svc.deleteRole).toHaveBeenCalledTimes(1);
  });

  // ── Member Management ──────────────────────────────────────────────

  test('getCommunityMembers returns array', async () => {
    const members = await svc.getCommunityMembers();
    expect(Array.isArray(members)).toBe(true);
  });

  test('getCommunityMember returns member with DID and nickname', async () => {
    const member = await svc.getCommunityMember('community-1', 'did:key:z6MkAlice');
    expect(member).toBeDefined();
    expect(member.communityId).toBe('community-1');
    expect(member.memberDid).toBe('did:key:z6MkAlice');
    expect(typeof member.nickname).toBe('string');
    expect(member.nickname.length).toBeGreaterThan(0);
    expect(typeof member.joinedAt).toBe('number');
  });

  test('kickCommunityMember resolves without error', async () => {
    await expect(svc.kickCommunityMember()).resolves.not.toThrow();
    expect(svc.kickCommunityMember).toHaveBeenCalledTimes(1);
  });

  test('banCommunityMember resolves without error', async () => {
    await expect(svc.banCommunityMember()).resolves.not.toThrow();
    expect(svc.banCommunityMember).toHaveBeenCalledTimes(1);
  });

  test('unbanCommunityMember resolves without error', async () => {
    await expect(svc.unbanCommunityMember()).resolves.not.toThrow();
    expect(svc.unbanCommunityMember).toHaveBeenCalledTimes(1);
  });

  // ── Invites (T6.2) ────────────────────────────────────────────────

  test('createCommunityInvite returns invite with code', async () => {
    const invite = await svc.createCommunityInvite('community-1');
    expect(invite).toBeDefined();
    expect(typeof invite.id).toBe('string');
    expect(invite.id.length).toBeGreaterThan(0);
    expect(invite.communityId).toBe('community-1');
    expect(typeof invite.code).toBe('string');
    expect(invite.code.length).toBeGreaterThan(0);
    expect(typeof invite.useCount).toBe('number');
    expect(typeof invite.createdAt).toBe('number');
  });

  test('useCommunityInvite returns communityId', async () => {
    const communityId = await svc.useCommunityInvite();
    expect(typeof communityId).toBe('string');
    expect(communityId).toBe('community-123');
  });

  test('getCommunityInvites returns array', async () => {
    const invites = await svc.getCommunityInvites();
    expect(Array.isArray(invites)).toBe(true);
  });

  test('deleteCommunityInvite resolves without error', async () => {
    await expect(svc.deleteCommunityInvite()).resolves.not.toThrow();
    expect(svc.deleteCommunityInvite).toHaveBeenCalledTimes(1);
  });

  // ── Full Lifecycle Flow ────────────────────────────────────────────

  test('full community setup: create → space → category → channel → role → invite', async () => {
    // Step 1: Create community
    const community = await svc.createCommunity('Lifecycle Community', 'did:key:z6MkOwner');
    expect(community.communityId).toBeDefined();
    expect(svc.createCommunity).toHaveBeenCalledWith('Lifecycle Community', 'did:key:z6MkOwner');

    // Step 2: Create a space within the community
    const space = await svc.createSpace(community.communityId, 'Main Space');
    expect(space.id).toBeDefined();
    expect(space.communityId).toBe(community.communityId);
    expect(svc.createSpace).toHaveBeenCalledWith(community.communityId, 'Main Space');

    // Step 3: Create a category within the space
    const category = await svc.createCategory(community.communityId, space.id, 'Text Channels');
    expect(category.id).toBeDefined();
    expect(category.spaceId).toBe(space.id);
    expect(svc.createCategory).toHaveBeenCalledWith(community.communityId, space.id, 'Text Channels');

    // Step 4: Create a channel within the space
    const channel = await svc.createChannel(community.communityId, space.id, 'general', 'text');
    expect(channel.id).toBeDefined();
    expect(channel.channelType).toBe('text');
    expect(svc.createChannel).toHaveBeenCalledWith(community.communityId, space.id, 'general', 'text');

    // Step 5: Create a custom role
    const role = await svc.createCustomRole(community.communityId, 'Admin');
    expect(role.id).toBeDefined();
    expect(role.name).toBe('Admin');
    expect(svc.createCustomRole).toHaveBeenCalledWith(community.communityId, 'Admin');

    // Step 6: Assign the role to a member
    await svc.assignRole();
    expect(svc.assignRole).toHaveBeenCalledTimes(1);

    // Step 7: Create an invite
    const invite = await svc.createCommunityInvite(community.communityId);
    expect(invite.code).toBeDefined();
    expect(typeof invite.code).toBe('string');
    expect(svc.createCommunityInvite).toHaveBeenCalledWith(community.communityId);
  });
});
