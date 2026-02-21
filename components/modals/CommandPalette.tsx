import React from 'react';
import { useRouter } from 'expo-router';
import {
  Command, CommandInput, CommandList, CommandGroup,
  CommandItem, CommandSeparator, CommandEmpty,
  WispProvider,
  useTheme,
} from '@coexist/wisp-react-native';
import { useFriends } from '@/hooks/useFriends';
import { useNetwork } from '@/hooks/useNetwork';
import { usePlugins } from '@/contexts/PluginContext';
import { UsersIcon, SearchIcon, SettingsIcon, MessageIcon, ZapIcon, DownloadIcon } from '@/components/icons';

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
  /** Open the in-conversation message search panel */
  onSearchMessages?: () => void;
}

const Zap = ZapIcon as IconComponent;
const Download = DownloadIcon as IconComponent;

export function CommandPalette({ open, onOpenChange, onOpenSettings, onOpenMarketplace, onSearchMessages }: CommandPaletteProps) {
  const router = useRouter();
  const { friends } = useFriends();
  const { onlineDids } = useNetwork();
  const { pluginCommands } = usePlugins();
  const { mode } = useTheme();

  const handleSelect = (value: string) => {
    if (value === 'nav:friends') {
      router.push('/friends');
    } else if (value === 'nav:chat') {
      router.push('/');
    } else if (value === 'nav:settings') {
      onOpenSettings();
    } else if (value === 'nav:marketplace') {
      onOpenMarketplace?.();
    } else if (value === 'nav:search-messages') {
      onSearchMessages?.();
    }
    // user: items are no-op for now — could navigate to DM
  };

  // In light mode, override the raised surface to be light-colored instead of the
  // default dark raised background from the Wisp design system.
  const lightRaisedOverrides = mode === 'light' ? {
    colors: {
      background: { raised: '#FFFFFF', },
      text: { onRaised: '#0C0C0E', onRaisedSecondary: '#71717A', muted: '#8E8E96' },
      border: { subtle: '#E4E4E7' },
      accent: { highlight: 'rgba(0, 0, 0, 0.04)', highlightRaised: 'rgba(0, 0, 0, 0.04)' },
    },
  } : undefined;

  return (
    <WispProvider mode={mode} overrides={lightRaisedOverrides}>
    <Command
      open={open}
      onOpenChange={onOpenChange}
      onSelect={handleSelect}
      size="md"
      style={mode === 'light' ? { borderWidth: 1, borderColor: '#E4E4E7', shadowOpacity: 0.15 } : undefined}
    >
      <CommandInput placeholder="Search users, messages, or type a command..." />
      <CommandList>
        <CommandGroup heading="Navigation">
          <CommandItem
            value="nav:friends"
            icon={Users}
            keywords={['friends', 'people', 'users']}
          >
            Go to Friends
          </CommandItem>
          <CommandItem
            value="nav:chat"
            icon={Message}
            keywords={['chat', 'messages', 'conversations', 'home']}
          >
            Go to Chat
          </CommandItem>
          <CommandItem
            value="nav:settings"
            icon={Settings}
            keywords={['settings', 'preferences', 'config']}
          >
            Open Settings
          </CommandItem>
          {onSearchMessages && (
            <CommandItem
              value="nav:search-messages"
              icon={Search}
              keywords={['search', 'find', 'messages', 'lookup']}
            >
              Search Messages
            </CommandItem>
          )}
          {onOpenMarketplace && (
            <CommandItem
              value="nav:marketplace"
              icon={Download}
              keywords={['plugins', 'marketplace', 'extensions', 'addons', 'install']}
            >
              Plugin Marketplace
            </CommandItem>
          )}
        </CommandGroup>

        {friends.length > 0 && (
          <>
            <CommandSeparator />

            <CommandGroup heading="Friends">
              {friends.map((f) => (
                <CommandItem
                  key={f.did}
                  value={`user:${f.did}`}
                  keywords={[f.displayName, f.displayName.toLowerCase().replace(/\s/g, '')]}
                  icon={Users}
                  description={onlineDids.has(f.did) ? 'online' : 'offline'}
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
            <CommandGroup heading="Plugins">
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

        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </Command>
    </WispProvider>
  );
}
