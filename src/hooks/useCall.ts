/**
 * useCall — Thin wrapper around CallContext for call state and actions.
 */

import { dbg } from '@/utils/debug';
import { useCallContext } from '@/contexts/CallContext';

const SRC = 'useCall';

export function useCall() {
  return useCallContext();
}
