import { createContext } from 'react';

/**
 * React context that carries a boolean loading flag through the component tree.
 * Default value is false (not loading).
 */
export const LoadingContext = createContext<boolean>(false);
