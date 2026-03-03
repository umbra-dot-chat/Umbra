/**
 * Community Members (T6.*)
 *
 * Stub tests for community member management.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';

describe('Community > Members', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it.todo('should display member list in community');
  it.todo('should show member roles (admin, moderator, member)');
  it.todo('should allow inviting new members');
  it.todo('should allow removing members (as admin)');
  it.todo('should allow changing member roles');
  it.todo('should show member profile on tap');
});
