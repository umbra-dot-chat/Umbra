import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toolbar, ToolbarGroup, ToolbarSeparator } from './Toolbar';
import { toolbarSizes, toolbarVariants } from '@coexist/wisp-core/types/Toolbar.types';
import { Button } from '../../primitives/button';
import { Icon } from '../../primitives/icon';
import { Text } from '../../primitives/text';
import { Toggle } from '../../primitives/toggle';
import { Select } from '../select';
import { Badge } from '../../primitives/badge';
import { Avatar } from '../../primitives/avatar';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Save,
  Settings,
  Undo,
  Redo,
  Copy,
  Scissors,
  Clipboard,
  Search,
  ZoomIn,
  ZoomOut,
  Grid,
  List,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Download,
  Share2,
  MoreHorizontal,
  Bell,
  Plus,
  Trash2,
  RefreshCw,
  Filter,
  SlidersHorizontal,
  Layers,
  Maximize2,
  Type,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta<typeof Toolbar> = {
  title: 'Components/Toolbar',
  component: Toolbar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...toolbarSizes] },
    variant: { control: 'select', options: [...toolbarVariants] },
  },
};

export default meta;
type Story = StoryObj<typeof Toolbar>;

// ---------------------------------------------------------------------------
// Helper: section label
// ---------------------------------------------------------------------------

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    size="xs"
    color="tertiary"
    weight="semibold"
    as="div"
    style={{ textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 4 }}
  >
    {children}
  </Text>
);

// ---------------------------------------------------------------------------
// 1. Default — basic toolbar with buttons
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <Toolbar>
      <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bold} size="sm" color="currentColor" />}>
        Bold
      </Button>
      <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Italic} size="sm" color="currentColor" />}>
        Italic
      </Button>
      <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Underline} size="sm" color="currentColor" />}>
        Underline
      </Button>
    </Toolbar>
  ),
};

// ---------------------------------------------------------------------------
// 2. Variants — elevated, transparent, pill
// ---------------------------------------------------------------------------

export const Variants: Story = {
  name: 'Variants',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {toolbarVariants.map((variant) => (
        <div key={variant}>
          <SectionLabel>variant=&quot;{variant}&quot;</SectionLabel>
          <Toolbar variant={variant}>
            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bold} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Italic} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Underline} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Strikethrough} size="sm" color="currentColor" />} />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignLeft} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignCenter} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignRight} size="sm" color="currentColor" />} />
            </ToolbarGroup>
            <ToolbarSeparator />
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Save} size="sm" color="currentColor" />}>
              Save
            </Button>
          </Toolbar>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Sizes — sm, md, lg
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {toolbarSizes.map((size) => (
        <div key={size}>
          <SectionLabel>size=&quot;{size}&quot;</SectionLabel>
          <Toolbar size={size}>
            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bold} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Italic} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Underline} size="sm" color="currentColor" />} />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Undo} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Redo} size="sm" color="currentColor" />} />
            </ToolbarGroup>
            <ToolbarSeparator />
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Settings} size="sm" color="currentColor" />}>
              Settings
            </Button>
          </Toolbar>
        </div>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. With Groups — left group, spacer, right group
// ---------------------------------------------------------------------------

export const WithGroups: Story = {
  name: 'With Groups',
  render: () => (
    <Toolbar>
      <ToolbarGroup gap="xs">
        <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bold} size="sm" color="currentColor" />}>
          Bold
        </Button>
        <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Italic} size="sm" color="currentColor" />}>
          Italic
        </Button>
        <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Underline} size="sm" color="currentColor" />}>
          Underline
        </Button>
      </ToolbarGroup>

      {/* Flexible spacer pushes subsequent items to the right */}
      <div style={{ flex: 1 }} />

      <ToolbarGroup gap="xs">
        <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Save} size="sm" color="currentColor" />}>
          Save
        </Button>
        <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Settings} size="sm" color="currentColor" />}>
          Settings
        </Button>
      </ToolbarGroup>
    </Toolbar>
  ),
};

// ---------------------------------------------------------------------------
// 5. Pill — rounded, inline toolbar
// ---------------------------------------------------------------------------

export const Pill: Story = {
  name: 'Pill',
  render: () => {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {/* Text editor pill */}
        <div>
          <SectionLabel>text editor</SectionLabel>
          <Toolbar variant="pill">
            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bold} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Italic} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Underline} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Strikethrough} size="sm" color="currentColor" />} />
            </ToolbarGroup>
            <ToolbarSeparator />
            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignLeft} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignCenter} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignRight} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignJustify} size="sm" color="currentColor" />} />
            </ToolbarGroup>
          </Toolbar>
        </div>

        {/* Zoom controls pill */}
        <div>
          <SectionLabel>zoom controls</SectionLabel>
          <Toolbar variant="pill" size="sm">
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={ZoomOut} size="sm" color="currentColor" />} />
            <Text size="xs" weight="semibold" style={{ minWidth: 36, textAlign: 'center' }}>100%</Text>
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={ZoomIn} size="sm" color="currentColor" />} />
            <ToolbarSeparator />
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Maximize2} size="sm" color="currentColor" />} />
          </Toolbar>
        </div>

        {/* View toggle pill */}
        <div>
          <SectionLabel>view toggle</SectionLabel>
          <Toolbar variant="pill" size="sm">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'primary' : 'tertiary'}
              iconLeft={<Icon icon={Grid} size="sm" color="currentColor" />}
              onClick={() => setViewMode('grid')}
            />
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'primary' : 'tertiary'}
              iconLeft={<Icon icon={List} size="sm" color="currentColor" />}
              onClick={() => setViewMode('list')}
            />
          </Toolbar>
        </div>

        {/* Quick actions pill */}
        <div>
          <SectionLabel>quick actions</SectionLabel>
          <Toolbar variant="pill" size="lg">
            <Button size="sm" variant="primary" iconLeft={<Icon icon={Plus} size="sm" color="currentColor" />} />
            <ToolbarSeparator />
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Download} size="sm" color="currentColor" />} />
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Share2} size="sm" color="currentColor" />} />
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Trash2} size="sm" color="currentColor" />} />
          </Toolbar>
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 6. With Toggles — toggle switches inside toolbar
// ---------------------------------------------------------------------------

export const WithToggles: Story = {
  name: 'With Toggles',
  render: () => {
    const [preview, setPreview] = useState(false);
    const [autoSave, setAutoSave] = useState(true);
    const [locked, setLocked] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Elevated with toggles */}
        <div>
          <SectionLabel>editor toolbar with toggles</SectionLabel>
          <Toolbar variant="elevated">
            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bold} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Italic} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Underline} size="sm" color="currentColor" />} />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup gap="sm">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon icon={preview ? Eye : EyeOff} size="sm" color="currentColor" />
                <Text size="xs">Preview</Text>
                <Toggle size="sm" checked={preview} onChange={setPreview} />
              </div>
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup gap="sm">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Text size="xs">Auto-save</Text>
                <Toggle size="sm" checked={autoSave} onChange={setAutoSave} />
              </div>
            </ToolbarGroup>

            <div style={{ flex: 1 }} />

            <Button
              size="sm"
              variant="tertiary"
              iconLeft={<Icon icon={locked ? Lock : Unlock} size="sm" color="currentColor" />}
              onClick={() => setLocked(!locked)}
            />
          </Toolbar>
        </div>

        {/* Pill with toggle */}
        <div>
          <SectionLabel>pill with toggle</SectionLabel>
          <Toolbar variant="pill" size="sm">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon icon={Layers} size="sm" color="currentColor" />
              <Text size="xs" weight="semibold">Layers</Text>
              <Toggle size="xs" checked={preview} onChange={setPreview} />
            </div>
            <ToolbarSeparator />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon icon={Grid} size="sm" color="currentColor" />
              <Text size="xs" weight="semibold">Grid</Text>
              <Toggle size="xs" checked={autoSave} onChange={setAutoSave} />
            </div>
          </Toolbar>
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 7. With Select & Badge — dropdowns and status indicators
// ---------------------------------------------------------------------------

export const WithSelectAndBadge: Story = {
  name: 'With Select & Badge',
  render: () => {
    const [font, setFont] = useState('sans');
    const [fontSize, setFontSize] = useState('14');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Document toolbar with selects */}
        <div>
          <SectionLabel>document toolbar</SectionLabel>
          <Toolbar variant="elevated">
            <ToolbarGroup gap="xs">
              <Select
                size="sm"
                value={font}
                onChange={setFont}
                options={[
                  { value: 'sans', label: 'Sans Serif' },
                  { value: 'serif', label: 'Serif' },
                  { value: 'mono', label: 'Monospace' },
                ]}
              />
              <Select
                size="sm"
                value={fontSize}
                onChange={setFontSize}
                options={[
                  { value: '12', label: '12px' },
                  { value: '14', label: '14px' },
                  { value: '16', label: '16px' },
                  { value: '18', label: '18px' },
                  { value: '24', label: '24px' },
                ]}
              />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bold} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Italic} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Underline} size="sm" color="currentColor" />} />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup gap="2xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignLeft} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignCenter} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignRight} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignJustify} size="sm" color="currentColor" />} />
            </ToolbarGroup>

            <div style={{ flex: 1 }} />

            <ToolbarGroup gap="xs">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Badge size="sm" variant="warning">3 unsaved</Badge>
              </div>
              <Button size="sm" variant="primary" iconLeft={<Icon icon={Save} size="sm" color="currentColor" />}>
                Save
              </Button>
            </ToolbarGroup>
          </Toolbar>
        </div>

        {/* Notification bar with badge and avatar */}
        <div>
          <SectionLabel>notification bar</SectionLabel>
          <Toolbar variant="elevated" size="lg">
            <ToolbarGroup gap="xs">
              <Icon icon={Search} size="sm" color="currentColor" />
              <Text size="sm" color="secondary">Search...</Text>
            </ToolbarGroup>

            <div style={{ flex: 1 }} />

            <ToolbarGroup gap="sm">
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bell} size="sm" color="currentColor" />} />
                <div style={{ position: 'absolute', top: 0, right: 0 }}>
                  <Badge size="sm" variant="danger" dot />
                </div>
              </div>

              <ToolbarSeparator />

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar size="sm" name="Jane Doe" />
                <Text size="sm" weight="semibold">Jane</Text>
              </div>

              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={MoreHorizontal} size="sm" color="currentColor" />} />
            </ToolbarGroup>
          </Toolbar>
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 8. Complex — full-featured toolbar
// ---------------------------------------------------------------------------

export const Complex: Story = {
  name: 'Complex',
  render: () => {
    const [autoSave, setAutoSave] = useState(true);

    return (
      <Toolbar size="lg" variant="elevated">
        {/* Undo / Redo */}
        <ToolbarGroup gap="2xs">
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Undo} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Redo} size="sm" color="currentColor" />} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Clipboard */}
        <ToolbarGroup gap="2xs">
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Scissors} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Copy} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Clipboard} size="sm" color="currentColor" />} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Text formatting */}
        <ToolbarGroup gap="2xs">
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Bold} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Italic} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Underline} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Strikethrough} size="sm" color="currentColor" />} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Alignment */}
        <ToolbarGroup gap="2xs">
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignLeft} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignCenter} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignRight} size="sm" color="currentColor" />} />
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={AlignJustify} size="sm" color="currentColor" />} />
        </ToolbarGroup>

        <ToolbarSeparator />

        {/* Auto-save toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Text size="xs">Auto-save</Text>
          <Toggle size="sm" checked={autoSave} onChange={setAutoSave} />
        </div>

        {/* Flexible spacer */}
        <div style={{ flex: 1 }} />

        {/* Right side actions */}
        <ToolbarGroup gap="xs">
          <Badge size="sm" variant="info">Draft</Badge>
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Share2} size="sm" color="currentColor" />} />
          <Button size="sm" variant="primary" iconLeft={<Icon icon={Save} size="sm" color="currentColor" />}>
            Save
          </Button>
          <Button size="sm" variant="tertiary" iconLeft={<Icon icon={MoreHorizontal} size="sm" color="currentColor" />} />
        </ToolbarGroup>
      </Toolbar>
    );
  },
};

// ---------------------------------------------------------------------------
// 9. Filter Bar — toolbar as a filter/action bar
// ---------------------------------------------------------------------------

export const FilterBar: Story = {
  name: 'Filter Bar',
  render: () => {
    const [status, setStatus] = useState('all');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Elevated filter bar */}
        <div>
          <SectionLabel>elevated filter bar</SectionLabel>
          <Toolbar variant="elevated">
            <ToolbarGroup gap="xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Filter} size="sm" color="currentColor" />}>
                Filter
              </Button>
              <Select
                size="sm"
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'all', label: 'All items' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                  { value: 'draft', label: 'Drafts' },
                ]}
              />
            </ToolbarGroup>

            <ToolbarSeparator />

            <ToolbarGroup gap="xs">
              <Badge size="sm" variant="default">42 results</Badge>
            </ToolbarGroup>

            <div style={{ flex: 1 }} />

            <ToolbarGroup gap="xs">
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={RefreshCw} size="sm" color="currentColor" />} />
              <Button size="sm" variant="tertiary" iconLeft={<Icon icon={SlidersHorizontal} size="sm" color="currentColor" />} />
              <Button size="sm" variant="primary" iconLeft={<Icon icon={Plus} size="sm" color="currentColor" />}>
                New
              </Button>
            </ToolbarGroup>
          </Toolbar>
        </div>

        {/* Pill filter bar */}
        <div>
          <SectionLabel>pill filter bar</SectionLabel>
          <Toolbar variant="pill" size="sm">
            <Button size="sm" variant="tertiary" iconLeft={<Icon icon={Filter} size="sm" color="currentColor" />}>
              Filters
            </Button>
            <ToolbarSeparator />
            <Badge size="sm" variant="info">Status: Active</Badge>
            <Badge size="sm" variant="default">Type: Document</Badge>
            <ToolbarSeparator />
            <Button size="sm" variant="tertiary">
              Clear all
            </Button>
          </Toolbar>
        </div>
      </div>
    );
  },
};
