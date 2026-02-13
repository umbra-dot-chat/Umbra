const { UmbraService } = require('@umbra/service');

describe('Identity flow', () => {
  let svc: InstanceType<typeof UmbraService>;

  beforeAll(async () => {
    await UmbraService.initialize();
    svc = UmbraService.instance;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('create identity returns DID and 24-word recovery phrase', async () => {
    const result = await svc.createIdentity('Alice');
    expect(result.identity.did).toMatch(/^did:key:/);
    expect(result.identity.displayName).toBe('Alice');
    expect(result.recoveryPhrase).toEqual(expect.any(Array));
    expect(result.recoveryPhrase.length).toBe(24);
  });

  test('recovery phrase words are all non-empty strings', async () => {
    const result = await svc.createIdentity('Bob');
    for (const word of result.recoveryPhrase) {
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
    }
  });

  test('load identity returns stored identity', async () => {
    const identity = await svc.loadIdentity();
    expect(identity).toBeDefined();
    expect(identity.did).toMatch(/^did:key:/);
    expect(typeof identity.displayName).toBe('string');
  });

  test('restore identity with 24-word recovery phrase returns DID', async () => {
    const phrase = Array(24).fill('ability');
    const identity = await svc.restoreIdentity(phrase, 'Restored');
    expect(identity).toBeDefined();
    expect(identity.did).toMatch(/^did:key:/);
    expect(identity.displayName).toBe('Restored');
  });

  test('update profile resolves without error', async () => {
    await expect(
      svc.updateProfile({ type: 'displayName', value: 'Updated' })
    ).resolves.not.toThrow();
  });

  test('getVersion returns a string', () => {
    const version = UmbraService.getVersion();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });
});
