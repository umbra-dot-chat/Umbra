/**
 * Community Channels (T6.*)
 *
 * Stub tests for community text channels.
 * These correspond to TESTING_CHECKLIST sections 6-7 which don't yet
 * have web E2E coverage.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';

describe('Community > Channels', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it.todo('should display community sidebar when a community is selected');
  it.todo('should show channel list in community sidebar');
  it.todo('should allow creating a new text channel');
  it.todo('should allow renaming a channel');
  it.todo('should allow deleting a channel');
  it.todo('should navigate to channel on tap');
  it.todo('should show channel messages');
  it.todo('should send messages in a channel');
});
