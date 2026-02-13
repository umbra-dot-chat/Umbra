/**
 * Tests for shared panel types and constants.
 *
 * The old mock data has been removed. These tests verify the types/constants
 * that were migrated to @/types/panels.
 */
import { PANEL_WIDTH } from '@/types/panels';
import type { RightPanel, } from '@/types/panels';

describe('Panel types & constants', () => {
  test('PANEL_WIDTH is 280', () => {
    expect(PANEL_WIDTH).toBe(280);
  });

  test('RightPanel type allows expected values', () => {
    const panels: RightPanel[] = ['members', 'pins', 'thread', 'search', null];
    expect(panels).toHaveLength(5);
  });

  test('deprecated re-exports still resolve from @/data/mock', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const legacy = require('@/data/mock');
    expect(legacy.PANEL_WIDTH).toBe(280);
  });
});
