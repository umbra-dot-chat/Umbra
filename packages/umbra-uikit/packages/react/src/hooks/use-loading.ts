/**
 * @module hooks/use-loading
 * @description Hook to check if the current subtree is in a loading state.
 *
 * Reads the nearest {@link LoadingContext} value and returns a boolean.
 * Components can use this to automatically switch to skeleton / placeholder
 * variants without requiring an explicit `loading` prop.
 *
 * @example
 * ```tsx
 * import { useLoading } from '../hooks';
 *
 * function ProfileCard() {
 *   const isLoading = useLoading();
 *
 *   if (isLoading) {
 *     return <Skeleton width={200} height={80} />;
 *   }
 *
 *   return (
 *     <Card>
 *       <Text>John Doe</Text>
 *     </Card>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Combined with a local loading prop override
 * function Avatar({ loading: loadingProp }: { loading?: boolean }) {
 *   const contextLoading = useLoading();
 *   const isLoading = loadingProp ?? contextLoading;
 *   // ...
 * }
 * ```
 */

import { useContext } from 'react';
import { LoadingContext } from '../contexts/loading-context';

/**
 * Returns `true` when the nearest `LoadingContext.Provider` ancestor has
 * a truthy value, indicating that the current subtree is in a loading state.
 *
 * Falls back to `false` when no provider is present.
 *
 * @returns Whether the current subtree is loading.
 *
 * @example
 * ```tsx
 * const isLoading = useLoading();
 * if (isLoading) return <Skeleton />;
 * ```
 */
export function useLoading(): boolean {
  return useContext(LoadingContext);
}
