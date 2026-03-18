/**
 * SidebarShell — Reusable wrapper providing shared sidebar chrome.
 *
 * Extracts the universal panels (account, notifications, call, resize handles)
 * and CSS injection from ChatSidebar so that multiple sidebar variants
 * (ChatSidebar, SettingsNavSidebar, etc.) can share them.
 *
 * Children receive layout info via SidebarShellContext (hasBottomPanel, contentFlex).
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, type View } from 'react-native';
import {
  Box,
  Button,
  SearchInput,
  Sidebar,
  Text,
  useTheme,
} from '@coexist/wisp-react-native';
import { UserPlusIcon } from '@/components/ui';
import { SidebarCallPanel } from '@/components/call/SidebarCallPanel';
import { SidebarNotificationsPanel } from './SidebarNotificationsPanel';
import { SidebarAccountPanel } from './SidebarAccountPanel';
import { SidebarSearchResults } from './SidebarSearchPanel';
import { SettingsSearchResults } from './SettingsSearchResults';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';
import { searchSettings, type SettingsSearchItem } from '@/services/SettingsSearchService';
import type { SettingsSection } from '@/components/modals/SettingsDialog';
import { TEST_IDS } from '@/constants/test-ids';
import { dbg } from '@/utils/debug';
import type { ActiveCall } from '@/types/call';
import type { StoredAccount } from '@/contexts/AuthContext';

// ─── CSS injection for sidebar layout (web only) ────────────────────────────

const SIDEBAR_CSS_ID = 'sidebar-layout-css';

/**
 * The Wisp Sidebar wraps children in a ScrollView. To push the call panel
 * to the bottom, we make the ScrollView content container a flex column
 * with min-height: 100%, then use margin-top: auto on the call footer.
 */
function injectSidebarLayoutCSS() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (document.getElementById(SIDEBAR_CSS_ID)) return;

  const style = document.createElement('style');
  style.id = SIDEBAR_CSS_ID;
  style.textContent = `
    /* Make the Sidebar ScrollView content container a flex column
       so margin-top:auto pushes the call panel to the bottom. */
    [role="menu"] > div:first-child > div {
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }
    /* When notifications panel is open, lock the sidebar to exact
       viewport height and disable ScrollView overflow so flex
       children split the space 50/50 instead of overflowing. */
    [role="menu"].notif-open > div:first-child {
      overflow: hidden !important;
    }
    [role="menu"].notif-open > div:first-child > div {
      min-height: unset;
      height: 100%;
    }
  `;
  document.head.appendChild(style);
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface SidebarShellLayoutValue {
  hasBottomPanel: boolean;
  contentFlex: number;
}

const SidebarShellContext = createContext<SidebarShellLayoutValue>({
  hasBottomPanel: false,
  contentFlex: 1,
});

export const useSidebarShellLayout = () => useContext(SidebarShellContext);

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SidebarShellProps {
  children: React.ReactNode;
  /** Sidebar style overrides */
  sidebarStyle?: any;
  /** Whether the notifications panel should be shown */
  showNotificationsPanel?: boolean;
  onCloseNotificationsPanel?: () => void;
  /** Whether the account panel should be shown */
  showAccountPanel?: boolean;
  onCloseAccountPanel?: () => void;
  accountPanelProps?: {
    accounts: StoredAccount[];
    activeAccountDid: string | null;
    onSwitchAccount: (did: string) => void;
    onActiveAccountPress: () => void;
    onAddAccount: () => void;
    onRemoveAccount?: (did: string) => void;
  };
  /** Placeholder text for the sidebar search input */
  searchPlaceholder?: string;
  /** Search scope — 'conversations' searches messages, 'settings' searches settings options */
  searchScope?: 'conversations' | 'settings';
  /** Called when a settings search result is selected (navigate to section) */
  onNavigateToSettings?: (section: SettingsSection, subsection?: string) => void;
  /** Called when the Friends / Add User button is pressed */
  onFriendsPress?: () => void;
  /** Number of pending friend requests for badge display */
  pendingFriendRequests?: number;
  /** Active call */
  activeCall?: ActiveCall | null;
  activeConversationId?: string | null;
  onReturnToCall?: () => void;
  onToggleMute?: () => void;
  onToggleDeafen?: () => void;
  onToggleCamera?: () => void;
  onEndCall?: () => void;
  isScreenSharing?: boolean;
  onToggleScreenShare?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SidebarShell({
  children,
  sidebarStyle,
  searchPlaceholder = 'Search...',
  searchScope = 'conversations',
  onNavigateToSettings,
  onFriendsPress,
  pendingFriendRequests,
  showNotificationsPanel,
  onCloseNotificationsPanel,
  showAccountPanel,
  onCloseAccountPanel,
  accountPanelProps,
  activeCall,
  activeConversationId,
  onReturnToCall,
  onToggleMute,
  onToggleDeafen,
  onToggleCamera,
  onEndCall,
  isScreenSharing,
  onToggleScreenShare,
}: SidebarShellProps) {
  if (__DEV__) dbg.trackRender('SidebarShell');
  const { theme } = useTheme();
  const { t: tSettings } = useTranslation('settings');

  // ── Sidebar search ──────────────────────────────────────────────────────
  const isSettingsScope = searchScope === 'settings';

  // Conversation search (UnifiedSearch context)
  const { query: convQuery, setQuery: setConvQuery, sidebarSearchActive, setSidebarSearchActive, loading: convLoading } = useUnifiedSearch();

  // Settings search (local state)
  const [settingsQuery, setSettingsQuery] = useState('');
  const [settingsResults, setSettingsResults] = useState<SettingsSearchItem[]>([]);

  const query = isSettingsScope ? settingsQuery : convQuery;
  const setQuery = isSettingsScope ? setSettingsQuery : setConvQuery;

  // Run settings search on query change (pass tSettings for translated labels)
  useEffect(() => {
    if (isSettingsScope && settingsQuery.trim()) {
      setSettingsResults(searchSettings(settingsQuery, tSettings));
    } else {
      setSettingsResults([]);
    }
  }, [isSettingsScope, settingsQuery, tSettings]);

  // Only expand search results when there's an active query
  const hasQuery = query.trim().length > 0;
  const showConvSearchResults = !isSettingsScope && sidebarSearchActive && (hasQuery || convLoading);
  const showSettingsSearchResults = isSettingsScope && hasQuery;
  const showSearchResults = showConvSearchResults || showSettingsSearchResults;

  const handleSearchFocus = useCallback(() => {
    if (!isSettingsScope) {
      setSidebarSearchActive(true);
    }
  }, [isSettingsScope, setSidebarSearchActive]);

  const handleClearSearch = useCallback(() => {
    if (isSettingsScope) {
      setSettingsQuery('');
    } else {
      setConvQuery('');
      setSidebarSearchActive(false);
    }
  }, [isSettingsScope, setConvQuery, setSidebarSearchActive]);

  const handleSettingsSelect = useCallback((sectionId: string, subsectionId?: string) => {
    onNavigateToSettings?.(sectionId as SettingsSection, subsectionId);
    setSettingsQuery('');
  }, [onNavigateToSettings]);

  // Independent resize ratios for each panel
  const [accountRatio, setAccountRatio] = useState(0.3);
  const [notifRatio, setNotifRatio] = useState(0.35);
  const accountHandleRef = useRef<View>(null);
  const notifHandleRef = useRef<View>(null);

  // Attach resize drag for account panel handle
  useEffect(() => {
    if (Platform.OS !== 'web' || !showAccountPanel) return;
    const node = accountHandleRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      let lastY = e.clientY;
      const sidebar = document.querySelector('[role="menu"]');
      const sidebarHeight = sidebar?.clientHeight ?? 600;

      const onMouseMove = (ev: MouseEvent) => {
        const dy = ev.clientY - lastY;
        if (dy !== 0) {
          setAccountRatio((prev) => Math.min(0.6, Math.max(0.1, prev + (-dy / sidebarHeight))));
          lastY = ev.clientY;
        }
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    };

    node.addEventListener('mousedown', handleMouseDown);
    return () => node.removeEventListener('mousedown', handleMouseDown);
  }, [showAccountPanel]);

  // Attach resize drag for notifications panel handle
  useEffect(() => {
    if (Platform.OS !== 'web' || !showNotificationsPanel) return;
    const node = notifHandleRef.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      let lastY = e.clientY;
      const sidebar = document.querySelector('[role="menu"]');
      const sidebarHeight = sidebar?.clientHeight ?? 600;

      const onMouseMove = (ev: MouseEvent) => {
        const dy = ev.clientY - lastY;
        if (dy !== 0) {
          setNotifRatio((prev) => Math.min(0.6, Math.max(0.1, prev + (-dy / sidebarHeight))));
          lastY = ev.clientY;
        }
      };
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    };

    node.addEventListener('mousedown', handleMouseDown);
    return () => node.removeEventListener('mousedown', handleMouseDown);
  }, [showNotificationsPanel]);

  // Inject CSS to make sidebar ScrollView content a flex column (web only)
  useEffect(() => {
    injectSidebarLayoutCSS();
  }, []);

  // Toggle .notif-open class on the Sidebar's [role="menu"] element
  const hasBottomPanel = !!(showNotificationsPanel || showAccountPanel);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const el = document.querySelector('[role="menu"]');
    if (!el) return;
    if (hasBottomPanel) {
      el.classList.add('notif-open');
    } else {
      el.classList.remove('notif-open');
    }
  }, [hasBottomPanel]);

  // Compute content flex for children
  const contentFlex = hasBottomPanel
    ? Math.max(0.1, 1 - (showAccountPanel ? accountRatio : 0) - (showNotificationsPanel ? notifRatio : 0))
    : 1;

  const layoutValue: SidebarShellLayoutValue = { hasBottomPanel, contentFlex };

  return (
    <SidebarShellContext.Provider value={layoutValue}>
      <Sidebar
        testID={TEST_IDS.SIDEBAR.CONTAINER}
        width="wide"
        style={sidebarStyle ?? { paddingHorizontal: 8, paddingTop: 20, width: '100%' }}
      >
        {/* Persistent search bar at the top of every sidebar */}
        <Box style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, gap: 6 }}>
          <Box style={{ flex: 1 }}>
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder={searchPlaceholder}
              size="sm"
              fullWidth
              onSurface
              gradientBorder
              onClear={handleClearSearch}
              onFocus={handleSearchFocus}
            />
          </Box>
          {onFriendsPress && (
            <Box style={{ position: 'relative' }}>
              <Button
                testID={TEST_IDS.SIDEBAR.FRIENDS_BUTTON}
                variant="tertiary"
                onSurface
                size="sm"
                onPress={onFriendsPress}
                accessibilityLabel="Friends"
                iconLeft={<UserPlusIcon size={16} color={theme.colors.text.onRaisedSecondary} />}
                shape="pill"
              />
              {!!pendingFriendRequests && pendingFriendRequests > 0 && (
                <Box style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  backgroundColor: theme.colors.status.danger,
                  borderRadius: 99,
                  paddingHorizontal: 3,
                  minWidth: 14,
                  height: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Text size="xs" weight="bold" style={{ lineHeight: 10, fontSize: 9, color: theme.colors.text.inverse, textAlign: 'center' }}>
                    {pendingFriendRequests > 99 ? '99+' : pendingFriendRequests}
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </Box>

        {/* When search has a query, replace children with search results */}
        {showSettingsSearchResults ? (
          <SettingsSearchResults results={settingsResults} query={settingsQuery} onSelect={handleSettingsSelect} />
        ) : showConvSearchResults ? (
          <SidebarSearchResults />
        ) : children}

        {/* Active call footer panel -- pinned to the bottom of sidebar */}
        {activeCall && activeCall.status === 'connected' && (activeCall.isGroupCall || activeCall.conversationId !== activeConversationId) && onReturnToCall && onToggleMute && onToggleDeafen && onToggleCamera && onEndCall && (
          <Box style={{
            marginTop: 'auto' as any,
            marginHorizontal: -4,
            ...(Platform.OS === 'web' ? {
              position: 'sticky' as any,
              bottom: 0,
              zIndex: 20,
              backgroundColor: theme.colors.background.raised,
            } : {}),
          }}>
            <SidebarCallPanel
              activeCall={activeCall}
              onReturnToCall={onReturnToCall}
              onToggleMute={onToggleMute}
              onToggleDeafen={onToggleDeafen}
              onToggleCamera={onToggleCamera}
              onEndCall={onEndCall}
              isScreenSharing={isScreenSharing}
              onToggleScreenShare={onToggleScreenShare}
            />
          </Box>
        )}

        {/* Account panel with its own resize handle */}
        {showAccountPanel && accountPanelProps && (
          <>
            <Box
              ref={accountHandleRef}
              nativeID="sidebar-section-accounts"
              style={{
                height: 8,
                justifyContent: 'center',
                alignItems: 'center',
                borderTopWidth: 1,
                borderTopColor: theme.colors.border.subtle,
                ...(Platform.OS === 'web' ? { cursor: 'row-resize' } as any : {}),
                zIndex: 10,
              }}
            >
              <Box style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: theme.colors.border.strong }} />
            </Box>
            <Box style={{ flex: accountRatio, minHeight: 80, overflow: 'hidden' as any }}>
              <SidebarAccountPanel
                onClose={onCloseAccountPanel}
                {...accountPanelProps}
              />
            </Box>
          </>
        )}

        {/* Notifications panel with its own resize handle */}
        {showNotificationsPanel && (
          <>
            <Box
              ref={notifHandleRef}
              nativeID="sidebar-section-notifications"
              style={{
                height: 8,
                justifyContent: 'center',
                alignItems: 'center',
                borderTopWidth: 1,
                borderTopColor: theme.colors.border.subtle,
                ...(Platform.OS === 'web' ? { cursor: 'row-resize' } as any : {}),
                zIndex: 10,
              }}
            >
              <Box style={{ width: 32, height: 3, borderRadius: 2, backgroundColor: theme.colors.border.strong }} />
            </Box>
            <Box style={{ flex: notifRatio, minHeight: 80, overflow: 'hidden' as any }}>
              <SidebarNotificationsPanel onClose={onCloseNotificationsPanel} />
            </Box>
          </>
        )}
      </Sidebar>
    </SidebarShellContext.Provider>
  );
}
