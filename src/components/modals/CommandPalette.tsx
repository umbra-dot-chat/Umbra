import React, { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Command, CommandInput, CommandList, CommandGroup,
  CommandItem, CommandSeparator, CommandEmpty,
  WispProvider,
  useTheme,
} from '@coexist/wisp-react-native';
import { useFriends } from '@/hooks/useFriends';
import { useNetwork } from '@/hooks/useNetwork';
import { usePlugins } from '@/contexts/PluginContext';
import { useUnifiedSearch } from '@/contexts/UnifiedSearchContext';
import { UsersIcon, SearchIcon, SettingsIcon, MessageIcon, ZapIcon, DownloadIcon } from '@/components/ui';

type IconComponent = React.ComponentType<{ size?: number | string; color?: string }>;
const Users = UsersIcon as IconComponent;
const Search = SearchIcon as IconComponent;
const Settings = SettingsIcon as IconComponent;
const Message = MessageIcon as IconComponent;

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
  onOpenMarketplace?: () => void;
  /** Whether there is an active conversation (to show "Search in this conversation") */
  hasActiveConversation?: boolean;
}

const Zap = ZapIcon as IconComponent;
const Download = DownloadIcon as IconComponent;

export function CommandPalette({ open, onOpenChange, onOpenSettings, onOpenMarketplace, hasActiveConversation }: CommandPaletteProps) {
  const router = useRouter();
  const { friends } = useFriends();
  const { onlineDids } = useNetwork();
  const { pluginCommands } = usePlugins();
  const { mode } = useTheme();
  const { t } = useTranslation('common');
  const {
    setQuery,
    searchHistory,
    results,
    jumpToMessage,
    setSidebarSearchActive,
    activeConversationId,
  } = useUnifiedSearch();

  // Flatten results into a display-friendly list (up to 10)
  const flatResults = useMemo(() => {
    const items: Array<{
      messageId: string;
      conversationId: string;
      senderDid: string;
      text: string;
      matchedTerms: string[];
    }> = [];
    for (const group of results) {
      for (const r of group.results) {
        items.push({
          messageId: r.document.id,
          conversationId: r.document.conversationId,
          senderDid: r.document.senderDid,
          text: r.document.text,
          matchedTerms: r.matchedTerms,
        });
        if (items.length >= 10) break;
      }
      if (items.length >= 10) break;
    }
    return items;
  }, [results]);

  // Track the current command input search value for conditional rendering
  const [commandSearch, setCommandSearch] = React.useState('');

  const handleSearchChange = useCallback((search: string) => {
    setCommandSearch(search);
    setQuery(search);
  }, [setQuery]);

  const handleSelect = (value: string) => {
    if (value === 'nav:friends') {
      router.push('/friends');
    } else if (value === 'nav:chat') {
      router.push('/');
    } else if (value === 'nav:settings') {
      onOpenSettings();
    } else if (value === 'nav:marketplace') {
      onOpenMarketplace?.();
    } else if (value === 'nav:search-in-conversation') {
      onOpenChange(false);
      setSidebarSearchActive(true);
    } else if (value.startsWith('msg:')) {
      // Message result selected — parse conversationId and messageId
      const [, convId, msgId] = value.split(':');
      if (convId && msgId && jumpToMessage) {
        jumpToMessage(convId, msgId);
      }
      onOpenChange(false);
    } else if (value.startsWith('history:')) {
      // Recent search selected — set the query to that term
      const term = value.slice('history:'.length);
      setQuery(term);
      setCommandSearch(term);
    } else if (value.startsWith('user:')) {
      // Friend selected — emit custom event to open DM
      const did = value.slice('user:'.length);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('umbra:open-dm', { detail: { did } }));
      }
      onOpenChange(false);
    }
  };

  // In light mode, override the raised surface to be light-colored instead of the
  // default dark raised background from the Wisp design system.
  // NOTE: These hex/rgba values are intentional — they define theme token overrides
  // passed to WispProvider, not inline style colors.
  const lightBorderSubtle = '#E4E4E7';
  const lightRaisedOverrides = mode === 'light' ? {
    colors: {
      background: { raised: '#FFFFFF', },
      text: { onRaised: '#0C0C0E', onRaisedSecondary: '#71717A', muted: '#8E8E96' },
      border: { subtle: lightBorderSubtle },
      accent: { highlight: 'rgba(0, 0, 0, 0.04)', highlightRaised: 'rgba(0, 0, 0, 0.04)' },
    },
  } : undefined;

  const hasQuery = commandSearch.trim().length > 0;

  return (
    <WispProvider mode={mode} overrides={lightRaisedOverrides}>
    <Command
      open={open}
      onOpenChange={onOpenChange}
      onSelect={handleSelect}
      onSearchChange={handleSearchChange}
      size="md"
      style={mode === 'light' ? { borderWidth: 1, borderColor: lightBorderSubtle, shadowOpacity: 0.15 } : undefined}
    >
      <CommandInput placeholder={t('searchCommandPlaceholder')} />
      <CommandList>
        {/* Recent Searches — shown when query is empty */}
        {!hasQuery && searchHistory.length > 0 && (
          <>
            <CommandGroup heading={t('recentSearches')}>
              {searchHistory.slice(0, 5).map((term) => (
                <CommandItem
                  key={`history-${term}`}
                  value={`history:${term}`}
                  icon={Search}
                  keywords={[term]}
                >
                  {term}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading={t('navigation')}>
          <CommandItem
            value="nav:friends"
            icon={Users}
            keywords={['friends', 'people', 'users']}
          >
            {t('goToFriends')}
          </CommandItem>
          <CommandItem
            value="nav:chat"
            icon={Message}
            keywords={['chat', 'messages', 'conversations', 'home']}
          >
            {t('goToChat')}
          </CommandItem>
          <CommandItem
            value="nav:settings"
            icon={Settings}
            keywords={['settings', 'preferences', 'config']}
          >
            {t('openSettings')}
          </CommandItem>
          {(hasActiveConversation || activeConversationId) && (
            <CommandItem
              value="nav:search-in-conversation"
              icon={Search}
              keywords={['search', 'find', 'messages', 'conversation', 'current']}
            >
              {t('searchInConversation')}
            </CommandItem>
          )}
          {onOpenMarketplace && (
            <CommandItem
              value="nav:marketplace"
              icon={Download}
              keywords={['plugins', 'marketplace', 'extensions', 'addons', 'install']}
            >
              {t('pluginMarketplace')}
            </CommandItem>
          )}
        </CommandGroup>

        {/* Message search results — shown when query is non-empty */}
        {hasQuery && flatResults.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('messages')}>
              {flatResults.map((r) => {
                const senderName = r.senderDid.slice(0, 16);
                const snippet = r.text.length > 60 ? r.text.slice(0, 57) + '...' : r.text;
                return (
                  <CommandItem
                    key={`msg-${r.messageId}`}
                    value={`msg:${r.conversationId}:${r.messageId}`}
                    icon={Message}
                    keywords={[r.text, r.senderDid]}
                    description={snippet}
                  >
                    {senderName}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {friends.length > 0 && (
          <>
            <CommandSeparator />

            <CommandGroup heading={t('friends')}>
              {friends.map((f) => (
                <CommandItem
                  key={f.did}
                  value={`user:${f.did}`}
                  keywords={[f.displayName, f.displayName.toLowerCase().replace(/\s/g, '')]}
                  icon={Users}
                  description={onlineDids.has(f.did) ? t('online') : t('offline')}
                >
                  {f.displayName}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {pluginCommands.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('plugins')}>
              {pluginCommands.map((cmd) => (
                <CommandItem
                  key={cmd.id}
                  value={`plugin:${cmd.id}`}
                  icon={Zap}
                  keywords={[cmd.label, ...(cmd.description ? [cmd.description] : [])]}
                  onSelect={() => { cmd.onSelect(); onOpenChange(false); }}
                >
                  {cmd.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandEmpty>{t('noResultsFound')}</CommandEmpty>
      </CommandList>
    </Command>
    </WispProvider>
  );
}
