/**
 * useCall — Thin wrapper around CallContext for call state and actions.
 */

import { useCallContext } from '@/contexts/CallContext';

export function useCall() {
  return useCallContext();
}
