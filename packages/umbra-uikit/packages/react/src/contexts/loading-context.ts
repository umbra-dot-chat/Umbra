/**
 * @module contexts/loading-context
 * @description Context for propagating loading state down the component tree.
 *
 * Wrap a subtree in LoadingContext.Provider with value=true to make all
 * Wisp components inside automatically show their skeleton / loading variants.
 * Components opt in to this behaviour via the useLoading hook.
 */

import { createContext } from 'react';

/**
 * React context that carries a boolean loading flag through the component tree.
 *
 * - Default value is `false` (not loading).
 * - Any Wisp component can read this via `useContext(LoadingContext)` or the
 *   convenience hook `useLoading()`.
 */
export const LoadingContext = createContext<boolean>(false);
