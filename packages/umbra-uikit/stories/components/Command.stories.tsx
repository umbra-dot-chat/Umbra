import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandEmpty,
} from '@wisp-ui/react';
import { commandSizes } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import {
  FileText,
  Settings,
  User,
  Search,
  Plus,
  Trash2,
  Copy,
  Download,
  Upload,
  Mail,
  Calendar,
  Star,
  Zap,
  Globe,
  Lock,
  Terminal,
  Palette,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';

const meta: Meta<typeof Command> = {
  title: 'React/Components/Utilities/Command',
  component: Command,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...commandSizes] },
    loop: { control: 'boolean' },
    loading: { control: 'boolean' },
    closeOnSelect: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Command>;

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Command Palette</Button>
          <Command open={open} onOpenChange={setOpen} onSelect={(v) => console.log('Selected:', v)}>
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandItem value="new-file" icon={Plus}>New File</CommandItem>
              <CommandItem value="open-file" icon={FileText}>Open File</CommandItem>
              <CommandItem value="save-file" icon={Download}>Save File</CommandItem>
              <CommandSeparator />
              <CommandItem value="settings" icon={Settings}>Settings</CommandItem>
              <CommandItem value="profile" icon={User}>Profile</CommandItem>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// With Groups
// ---------------------------------------------------------------------------

export const WithGroups: Story = {
  name: 'With Groups',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Grouped Palette</Button>
          <Command open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search commands..." />
            <CommandList>
              <CommandGroup heading="File">
                <CommandItem value="new-file" icon={Plus}>New File</CommandItem>
                <CommandItem value="open-file" icon={FileText}>Open File</CommandItem>
                <CommandItem value="copy-path" icon={Copy}>Copy File Path</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Edit">
                <CommandItem value="copy" icon={Copy}>Copy</CommandItem>
                <CommandItem value="delete" icon={Trash2}>Delete</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="View">
                <CommandItem value="toggle-sidebar">Toggle Sidebar</CommandItem>
                <CommandItem value="toggle-terminal" icon={Terminal}>Toggle Terminal</CommandItem>
              </CommandGroup>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// With Shortcuts
// ---------------------------------------------------------------------------

export const WithShortcuts: Story = {
  name: 'With Shortcuts',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open With Shortcuts</Button>
          <Command open={open} onOpenChange={setOpen}>
            <CommandInput />
            <CommandList>
              <CommandGroup heading="Actions">
                <CommandItem value="new-file" icon={Plus} shortcut="Ctrl+N">New File</CommandItem>
                <CommandItem value="open-file" icon={FileText} shortcut="Ctrl+O">Open File</CommandItem>
                <CommandItem value="save" icon={Download} shortcut="Ctrl+S">Save</CommandItem>
                <CommandItem value="copy" icon={Copy} shortcut="Ctrl+C">Copy</CommandItem>
                <CommandItem value="delete" icon={Trash2} shortcut="Ctrl+D">Delete</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Navigation">
                <CommandItem value="settings" icon={Settings} shortcut="Ctrl+,">Settings</CommandItem>
                <CommandItem value="terminal" icon={Terminal} shortcut="Ctrl+`">Terminal</CommandItem>
              </CommandGroup>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// With Descriptions
// ---------------------------------------------------------------------------

export const WithDescriptions: Story = {
  name: 'With Descriptions',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open With Descriptions</Button>
          <Command open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search integrations..." />
            <CommandList>
              <CommandItem value="email" icon={Mail} description="Connect your email account">
                Email Integration
              </CommandItem>
              <CommandItem value="calendar" icon={Calendar} description="Sync events and meetings">
                Calendar
              </CommandItem>
              <CommandItem value="cloud" icon={Globe} description="Manage cloud storage settings">
                Cloud Storage
              </CommandItem>
              <CommandItem value="security" icon={Lock} description="Configure authentication and access">
                Security
              </CommandItem>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// With Icons
// ---------------------------------------------------------------------------

export const WithIcons: Story = {
  name: 'With Icons',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open With Icons</Button>
          <Command open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Search..." />
            <CommandList>
              <CommandGroup heading="Quick Actions">
                <CommandItem value="star" icon={Star}>Star Repository</CommandItem>
                <CommandItem value="zap" icon={Zap}>Quick Run</CommandItem>
                <CommandItem value="palette" icon={Palette}>Change Theme</CommandItem>
                <CommandItem value="upload" icon={Upload}>Upload Files</CommandItem>
                <CommandItem value="download" icon={Download}>Download Report</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Preferences">
                <CommandItem value="dark-mode" icon={Moon}>Dark Mode</CommandItem>
                <CommandItem value="light-mode" icon={Sun}>Light Mode</CommandItem>
                <CommandItem value="logout" icon={LogOut}>Log Out</CommandItem>
              </CommandGroup>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

export const EmptyState: Story = {
  name: 'Empty State',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open (type to filter)</Button>
          <Command open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Try typing something that doesn't match..." />
            <CommandList>
              <CommandItem value="alpha">Alpha</CommandItem>
              <CommandItem value="beta">Beta</CommandItem>
              <CommandEmpty>No commands match your search.</CommandEmpty>
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export const Loading: Story = {
  name: 'Loading',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      const [loading, setLoading] = useState(true);
      return (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={() => { setLoading(true); setOpen(true); }}>Open (Loading)</Button>
            <Button variant="secondary" onClick={() => { setLoading(false); setOpen(true); }}>Open (Loaded)</Button>
          </div>
          <Command open={open} onOpenChange={setOpen} loading={loading}>
            <CommandInput placeholder="Loading results..." />
            <CommandList>
              <CommandItem value="result-1" icon={FileText}>Search Result 1</CommandItem>
              <CommandItem value="result-2" icon={FileText}>Search Result 2</CommandItem>
              <CommandItem value="result-3" icon={FileText}>Search Result 3</CommandItem>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Custom Filter
// ---------------------------------------------------------------------------

export const CustomFilter: Story = {
  name: 'Custom Filter',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      // Fuzzy-ish filter: match if all chars appear in order
      const fuzzyFilter = (value: string, search: string) => {
        const valueLower = value.toLowerCase();
        const searchLower = search.toLowerCase();
        let j = 0;
        for (let i = 0; i < valueLower.length && j < searchLower.length; i++) {
          if (valueLower[i] === searchLower[j]) j++;
        }
        return j === searchLower.length;
      };
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open (Fuzzy Filter)</Button>
          <Command open={open} onOpenChange={setOpen} filter={fuzzyFilter}>
            <CommandInput placeholder='Try "nf" for "New File"...' />
            <CommandList>
              <CommandItem value="new-file" icon={Plus}>New File</CommandItem>
              <CommandItem value="open-file" icon={FileText}>Open File</CommandItem>
              <CommandItem value="new-folder" icon={Plus}>New Folder</CommandItem>
              <CommandItem value="delete-file" icon={Trash2}>Delete File</CommandItem>
              <CommandItem value="close-tab">Close Tab</CommandItem>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Disabled Items
// ---------------------------------------------------------------------------

export const DisabledItems: Story = {
  name: 'Disabled Items',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open With Disabled</Button>
          <Command open={open} onOpenChange={setOpen}>
            <CommandInput />
            <CommandList>
              <CommandItem value="enabled-1" icon={FileText}>Available Action</CommandItem>
              <CommandItem value="disabled-1" icon={Lock} disabled>Premium Feature (Locked)</CommandItem>
              <CommandItem value="enabled-2" icon={Settings}>Settings</CommandItem>
              <CommandItem value="disabled-2" icon={Trash2} disabled>Delete Account (Restricted)</CommandItem>
              <CommandItem value="enabled-3" icon={User}>Profile</CommandItem>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Nested Pages
// ---------------------------------------------------------------------------

export const NestedPages: Story = {
  name: 'Nested Pages',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      const [page, setPage] = useState<'root' | 'theme'>('root');
      return (
        <>
          <Button onClick={() => { setPage('root'); setOpen(true); }}>Open Nested</Button>
          <Command
            open={open}
            onOpenChange={setOpen}
            onSelect={(v) => {
              if (v === 'theme') {
                setPage('theme');
              } else {
                console.log('Selected:', v);
              }
            }}
            closeOnSelect={page === 'theme' ? false : true}
          >
            <CommandInput placeholder={page === 'root' ? 'Search commands...' : 'Select a theme...'} />
            <CommandList>
              {page === 'root' ? (
                <>
                  <CommandGroup heading="General">
                    <CommandItem value="theme" icon={Palette}>Change Theme...</CommandItem>
                    <CommandItem value="settings" icon={Settings} shortcut="Ctrl+,">Settings</CommandItem>
                    <CommandItem value="profile" icon={User}>Profile</CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="File">
                    <CommandItem value="new-file" icon={Plus} shortcut="Ctrl+N">New File</CommandItem>
                    <CommandItem value="open-file" icon={FileText} shortcut="Ctrl+O">Open File</CommandItem>
                  </CommandGroup>
                </>
              ) : (
                <>
                  <CommandGroup heading="Themes">
                    <CommandItem value="dark" icon={Moon}>Dark</CommandItem>
                    <CommandItem value="light" icon={Sun}>Light</CommandItem>
                    <CommandItem value="system" icon={Globe}>System</CommandItem>
                  </CommandGroup>
                </>
              )}
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Sizes
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const Demo = () => {
      const [openSize, setOpenSize] = useState<string | null>(null);
      return (
        <div style={{ display: 'flex', gap: 12 }}>
          {commandSizes.map((size) => (
            <React.Fragment key={size}>
              <Button variant="secondary" size="sm" onClick={() => setOpenSize(size)}>
                {size}
              </Button>
              <Command
                open={openSize === size}
                onOpenChange={(o) => { if (!o) setOpenSize(null); }}
                size={size}
              >
                <CommandInput placeholder={`${size.toUpperCase()} palette...`} />
                <CommandList>
                  <CommandItem value="item-1" icon={FileText}>First Item</CommandItem>
                  <CommandItem value="item-2" icon={Settings}>Second Item</CommandItem>
                  <CommandItem value="item-3" icon={User}>Third Item</CommandItem>
                  <CommandEmpty />
                </CommandList>
              </Command>
            </React.Fragment>
          ))}
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Glass Variant
// ---------------------------------------------------------------------------

export const Glass: Story = {
  name: 'Glass Variant',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Glass Palette</Button>
          <Command open={open} onOpenChange={setOpen} variant="glass" onSelect={(v) => console.log('Selected:', v)}>
            <CommandInput placeholder="Search commands..." />
            <CommandList>
              <CommandGroup heading="Actions">
                <CommandItem value="new-file" icon={Plus} shortcut="Ctrl+N">New File</CommandItem>
                <CommandItem value="open-file" icon={FileText} shortcut="Ctrl+O">Open File</CommandItem>
                <CommandItem value="save" icon={Download} shortcut="Ctrl+S">Save</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Navigation">
                <CommandItem value="settings" icon={Settings} shortcut="Ctrl+,">Settings</CommandItem>
                <CommandItem value="profile" icon={User}>Profile</CommandItem>
                <CommandItem value="theme" icon={Palette}>Change Theme</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem value="logout" icon={LogOut}>Log Out</CommandItem>
              </CommandGroup>
              <CommandEmpty />
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Full Featured
// ---------------------------------------------------------------------------

export const FullFeatured: Story = {
  name: 'Full Featured',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);

      // Cmd+K listener
      React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
      }, []);

      return (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button onClick={() => setOpen(true)}>Open Command Palette</Button>
            <Text size="xs" color="tertiary">or press Ctrl+K / Cmd+K</Text>
          </div>
          <Command open={open} onOpenChange={setOpen} onSelect={(v) => console.log('Selected:', v)}>
            <CommandInput placeholder="What do you need?" />
            <CommandList>
              <CommandGroup heading="Suggestions">
                <CommandItem value="new-file" icon={Plus} shortcut="Ctrl+N" description="Create a new untitled file">
                  New File
                </CommandItem>
                <CommandItem value="search" icon={Search} shortcut="Ctrl+F" description="Search in current workspace">
                  Find in Files
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Navigation">
                <CommandItem value="settings" icon={Settings} shortcut="Ctrl+," keywords={['preferences', 'config']}>
                  Settings
                </CommandItem>
                <CommandItem value="profile" icon={User} keywords={['account', 'me']}>
                  Profile
                </CommandItem>
                <CommandItem value="calendar" icon={Calendar} keywords={['schedule', 'events']}>
                  Calendar
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Theme">
                <CommandItem value="dark-mode" icon={Moon}>Dark Mode</CommandItem>
                <CommandItem value="light-mode" icon={Sun}>Light Mode</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Account">
                <CommandItem value="security" icon={Lock} description="Manage your security settings">
                  Security
                </CommandItem>
                <CommandItem value="logout" icon={LogOut}>Log Out</CommandItem>
              </CommandGroup>
              <CommandEmpty>No commands match your search.</CommandEmpty>
            </CommandList>
          </Command>
        </>
      );
    };
    return <Demo />;
  },
};
