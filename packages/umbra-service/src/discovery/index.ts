/**
 * Discovery service module
 *
 * Provides account linking and privacy-preserving friend discovery.
 *
 * ## Usage
 *
 * ```typescript
 * import { useDiscoveryService, setRelayUrl } from '@umbra/service/discovery';
 *
 * // Configure relay URL (if not using default)
 * setRelayUrl('https://relay.umbra.chat');
 *
 * // In your component
 * function LinkedAccountsSettings() {
 *   const { accounts, linkDiscord, discoverable, setDiscoverability } = useDiscoveryService(did);
 *
 *   return (
 *     <View>
 *       <Toggle checked={discoverable} onChange={setDiscoverability} />
 *       <Button onPress={linkDiscord}>Link Discord</Button>
 *       {accounts.map(a => <LinkedAccountCard key={a.platform} {...a} />)}
 *     </View>
 *   );
 * }
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  Platform,
  LinkedAccountInfo,
  DiscoveryStatus,
  HashedLookup,
  LookupResult,
  SearchResult,
  StartAuthResponse,
  FriendSuggestion,
  DiscoveryServiceEvent,
  UsernameResponse,
  UsernameLookupResult,
  UsernameSearchResult,
} from './types';

// API functions
export {
  setRelayUrl,
  getRelayUrl,
  startAuth,
  getStatus,
  updateSettings,
  batchLookup,
  unlinkAccount,
  createHash,
  batchCreateHashes,
  searchByUsername,
  registerUsername,
  getUsername,
  lookupUsername,
  searchUsernames,
  changeUsername,
  releaseUsername,
} from './api';

// React hooks
export {
  useLinkedAccounts,
  useDiscovery,
  useFriendSuggestions,
  useUsername,
  useUsernameSearch,
  useDiscoveryService,
} from './hooks';
