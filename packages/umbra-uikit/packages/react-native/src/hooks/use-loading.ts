import { useContext } from 'react';
import { LoadingContext } from '../contexts/LoadingContext';

/**
 * Returns true when the nearest LoadingContext.Provider ancestor has
 * a truthy value, indicating that the current subtree is in a loading state.
 */
export function useLoading(): boolean {
  return useContext(LoadingContext);
}
