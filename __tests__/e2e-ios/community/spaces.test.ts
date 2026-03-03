/**
 * Community Spaces / Categories (T6.*)
 *
 * Stub tests for community space/category organization.
 */
import { device, element, by, waitFor, expect } from 'detox';
import { TEST_IDS } from '../../shared/test-ids';
import { TIMEOUTS } from '../../shared/timeouts';
import { FIXTURES } from '../../shared/fixtures';
import { launchApp, waitForMainScreen, waitForUISettle } from '../helpers/app';
import { createAccount } from '../helpers/auth';

describe('Community > Spaces', () => {
  beforeAll(async () => {
    await launchApp({ delete: true });
    await createAccount(FIXTURES.USER_A.displayName);
    await waitForMainScreen();
  });

  it.todo('should display community creation dialog');
  it.todo('should create a new community with name and description');
  it.todo('should show community in navigation rail after creation');
  it.todo('should allow editing community settings');
  it.todo('should allow deleting a community (as owner)');
  it.todo('should show community header with name and avatar');
});
