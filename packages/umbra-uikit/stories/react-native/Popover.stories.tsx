import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Popover, PopoverTrigger, PopoverContent, Button, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Popover> = {
  title: 'React Native/Components/Overlays/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    placement: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
  },
};

export default meta;
type Story = StoryObj<typeof Popover>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div style={sectionLabel}>Basic popover</div>
      <Popover>
        <PopoverTrigger>
          <Button size="sm">Open Popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Popover</Text>
          <Text style={{ fontSize: 13, color: '#6B7280' }}>
            This is a basic popover with some content.
          </Text>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. Positions
// ---------------------------------------------------------------------------

export const Positions: Story = {
  name: 'Positions',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <div style={sectionLabel}>Placement variants</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
          <Popover key={placement} placement={placement}>
            <PopoverTrigger>
              <Button size="sm">{placement}</Button>
            </PopoverTrigger>
            <PopoverContent>
              <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 2 }}>
                {placement.charAt(0).toUpperCase() + placement.slice(1)}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                Placed on the {placement} side of the trigger.
              </Text>
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. WithContent
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 480 }}>
      <div style={sectionLabel}>Rich popover content</div>
      <Popover placement="bottom">
        <PopoverTrigger>
          <Button size="sm">User Info</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600' }}>Jane Cooper</Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>jane.cooper@example.com</Text>
            <div style={{ height: 1, backgroundColor: '#E5E7EB', marginTop: 4, marginBottom: 4 }} />
            <Text style={{ fontSize: 12, color: '#6B7280' }}>Member since Jan 2024</Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>3 active projects</Text>
          </div>
        </PopoverContent>
      </Popover>

      <div style={sectionLabel}>Action menu</div>
      <Popover placement="bottom">
        <PopoverTrigger>
          <Button size="sm" variant="ghost">More Actions</Button>
        </PopoverTrigger>
        <PopoverContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {['Edit', 'Duplicate', 'Archive', 'Delete'].map((action) => (
              <Text
                key={action}
                style={{
                  fontSize: 13,
                  paddingVertical: 4,
                  color: action === 'Delete' ? '#E5564B' : undefined,
                }}
              >
                {action}
              </Text>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  name: 'Controlled',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
        <div style={sectionLabel}>Controlled open state</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Popover open={open} onOpenChange={setOpen} placement="bottom">
            <PopoverTrigger>
              <Button size="sm">Controlled Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Controlled</Text>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                This popover is controlled externally via the open prop.
              </Text>
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="ghost" onPress={() => setOpen(!open)}>
            Toggle
          </Button>
        </div>
        <Text style={{ fontSize: 12, color: '#94A0B8' }}>
          State: {open ? 'Open' : 'Closed'}
        </Text>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. DefaultOpen
// ---------------------------------------------------------------------------

export const DefaultOpen: Story = {
  name: 'Default Open',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
      <div style={sectionLabel}>Opens on mount</div>
      <Popover defaultOpen placement="bottom">
        <PopoverTrigger>
          <Button size="sm">Already Open</Button>
        </PopoverTrigger>
        <PopoverContent>
          <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Welcome</Text>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>
            This popover starts in the open state by default.
          </Text>
        </PopoverContent>
      </Popover>
    </div>
  ),
};
