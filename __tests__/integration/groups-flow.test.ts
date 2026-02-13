/**
 * Integration tests for group messaging features:
 * create, update, delete groups; add/remove members; get members.
 *
 * Uses the Jest-mocked UmbraService singleton.
 */

const { UmbraService } = require('@umbra/service');

describe('Groups flow', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Create Group ─────────────────────────────────────────────────────

  test('createGroup returns groupId and conversationId', async () => {
    const result = await svc.createGroup('My Group', 'A description');
    expect(result).toBeDefined();
    expect(typeof result.groupId).toBe('string');
    expect(result.groupId.length).toBeGreaterThan(0);
    expect(typeof result.conversationId).toBe('string');
    expect(result.conversationId.length).toBeGreaterThan(0);
  });

  test('createGroup calls service with correct args', async () => {
    await svc.createGroup('Test Group', 'Test description');
    expect(svc.createGroup).toHaveBeenCalledWith('Test Group', 'Test description');
  });

  test('createGroup without description', async () => {
    const result = await svc.createGroup('No Desc Group');
    expect(result).toBeDefined();
    expect(typeof result.groupId).toBe('string');
  });

  // ── Get Group ────────────────────────────────────────────────────────

  test('getGroup returns group metadata', async () => {
    const group = await svc.getGroup('group-1');
    expect(group).toBeDefined();
    expect(group.id).toBe('group-1');
    expect(typeof group.name).toBe('string');
    expect(group.name.length).toBeGreaterThan(0);
    expect(typeof group.createdBy).toBe('string');
    expect(typeof group.createdAt).toBe('number');
    expect(typeof group.updatedAt).toBe('number');
  });

  // ── List Groups ──────────────────────────────────────────────────────

  test('getGroups returns array', async () => {
    const groups = await svc.getGroups();
    expect(Array.isArray(groups)).toBe(true);
  });

  // ── Update Group ─────────────────────────────────────────────────────

  test('updateGroup resolves without error', async () => {
    await expect(
      svc.updateGroup('group-1', 'Updated Name', 'Updated desc')
    ).resolves.not.toThrow();
  });

  test('updateGroup calls service with correct args', async () => {
    await svc.updateGroup('group-42', 'New Name', 'New Desc');
    expect(svc.updateGroup).toHaveBeenCalledWith('group-42', 'New Name', 'New Desc');
  });

  // ── Delete Group ─────────────────────────────────────────────────────

  test('deleteGroup resolves without error', async () => {
    await expect(svc.deleteGroup('group-1')).resolves.not.toThrow();
  });

  test('deleteGroup calls service with group id', async () => {
    await svc.deleteGroup('group-99');
    expect(svc.deleteGroup).toHaveBeenCalledWith('group-99');
  });

  // ── Add Member ───────────────────────────────────────────────────────

  test('addGroupMember resolves without error', async () => {
    await expect(
      svc.addGroupMember('group-1', 'did:key:z6MkAlice', 'Alice')
    ).resolves.not.toThrow();
  });

  test('addGroupMember calls service with correct args', async () => {
    await svc.addGroupMember('group-1', 'did:key:z6MkBob', 'Bob');
    expect(svc.addGroupMember).toHaveBeenCalledWith(
      'group-1',
      'did:key:z6MkBob',
      'Bob'
    );
  });

  // ── Remove Member ────────────────────────────────────────────────────

  test('removeGroupMember resolves without error', async () => {
    await expect(
      svc.removeGroupMember('group-1', 'did:key:z6MkAlice')
    ).resolves.not.toThrow();
  });

  test('removeGroupMember calls service with correct args', async () => {
    await svc.removeGroupMember('group-1', 'did:key:z6MkCharlie');
    expect(svc.removeGroupMember).toHaveBeenCalledWith(
      'group-1',
      'did:key:z6MkCharlie'
    );
  });

  // ── Get Members ──────────────────────────────────────────────────────

  test('getGroupMembers returns array of members', async () => {
    const members = await svc.getGroupMembers('group-1');
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThan(0);
    expect(members[0].memberDid).toBeDefined();
    expect(members[0].role).toBeDefined();
    expect(typeof members[0].joinedAt).toBe('number');
  });

  test('getGroupMembers includes admin role', async () => {
    const members = await svc.getGroupMembers('group-1');
    const admin = members.find((m: any) => m.role === 'admin');
    expect(admin).toBeDefined();
  });

  // ── Full Flow ────────────────────────────────────────────────────────

  test('full group lifecycle: create → add member → get members → remove → delete', async () => {
    // Step 1: Create group
    const created = await svc.createGroup('Lifecycle Group', 'Testing lifecycle');
    expect(created.groupId).toBeDefined();
    expect(svc.createGroup).toHaveBeenCalledTimes(1);

    // Step 2: Add a member
    await svc.addGroupMember(created.groupId, 'did:key:z6MkAlice', 'Alice');
    expect(svc.addGroupMember).toHaveBeenCalledWith(
      created.groupId,
      'did:key:z6MkAlice',
      'Alice'
    );

    // Step 3: Get members
    const members = await svc.getGroupMembers(created.groupId);
    expect(Array.isArray(members)).toBe(true);

    // Step 4: Remove the member
    await svc.removeGroupMember(created.groupId, 'did:key:z6MkAlice');
    expect(svc.removeGroupMember).toHaveBeenCalledWith(
      created.groupId,
      'did:key:z6MkAlice'
    );

    // Step 5: Delete the group
    await svc.deleteGroup(created.groupId);
    expect(svc.deleteGroup).toHaveBeenCalledWith(created.groupId);
  });
});
