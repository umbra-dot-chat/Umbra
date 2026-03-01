/**
 * React hook for multi-instance detection.
 *
 * Uses the instance coordinator from @umbra/service to detect when
 * multiple browser tabs are running Umbra simultaneously. Returns
 * state that can be used to show a warning banner.
 *
 * @example
 * ```tsx
 * const { isPrimary, hasConflict } = useInstanceDetection();
 *
 * if (hasConflict && !isPrimary) {
 *   return <WarningBanner>Umbra is open in another tab</WarningBanner>;
 * }
 * ```
 */

import { useEffect, useState, useRef } from 'react';
import { startInstanceCoordinator, type InstanceCoordinator } from '@umbra/service';

export interface InstanceDetectionState {
  /** Whether this tab is the primary (first) instance */
  isPrimary: boolean;
  /** Whether another instance was detected */
  hasConflict: boolean;
}

export function useInstanceDetection(): InstanceDetectionState {
  const [isPrimary, setIsPrimary] = useState(true);
  const [hasConflict, setHasConflict] = useState(false);
  const coordinatorRef = useRef<InstanceCoordinator | null>(null);

  useEffect(() => {
    const coordinator = startInstanceCoordinator();
    coordinatorRef.current = coordinator;

    setIsPrimary(coordinator.isPrimary);

    coordinator.onConflict(() => {
      setHasConflict(true);
      setIsPrimary(coordinator.isPrimary);
    });

    return () => {
      coordinator.shutdown();
      coordinatorRef.current = null;
    };
  }, []);

  return { isPrimary, hasConflict };
}
