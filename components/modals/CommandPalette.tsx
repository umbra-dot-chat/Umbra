import React from 'react';
import { useRouter } from 'expo-router';
import {
  Command, CommandInput, CommandList, CommandGroup,
  CommandItem, CommandSeparator, CommandEmpty,
} from '@coexist/wisp-react-native';
import { useFriends } from '@/hooks/useFriends';
import { UsersIcon, SearchIcon, SettingsIcon, MessageIcon } from '@/components/icons';

type IconComponent = React.ComponentType<{ size?: number | string; color?: string }>;
const Users = UsersIcon as IconComponent;
const Search = SearchIcon as IconComponent;
const Settings = SettingsIcon as IconComponent;
const Message = MessageIcon as IconComponent;

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
}

export function CommandPalette({ open, onOpenChange, onOpenSettings }: CommandPaletteProps) {
  const router = useRouter();
  const { friends } = useFriends();

  const handleSelect = (value: string) => {
    if (value === 'nav:friends') {
      router.push('/friends');
    } else if (value === 'nav:chat') {
      router.push('/');
    } else if (value === 'nav:settings') {
      onOpenSettings();
    }
    // user: items are no-op for now — could navigate to DM
  };

  return (
    <Command
      open={open}
      onOpenChange={onOpenChange}
      onSelect={handleSelect}
      size="md"
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
                  description={f.online ? 'online' : 'offline'}
                >
                  {f.displayName}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </Command>
  );
}
