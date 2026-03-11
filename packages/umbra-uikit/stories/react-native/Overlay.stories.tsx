import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Overlay, Text } from '@wisp-ui/react-native';

const meta: Meta<typeof Overlay> = {
  title: 'React Native/Layouts/Overlay',
  component: Overlay,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    backdrop: { control: 'select', options: ['dim', 'blur', 'transparent'] },
    center: { control: 'boolean' },
    useModal: { control: 'boolean' },
    transparent: { control: 'boolean' },
    animationType: { control: 'select', options: ['none', 'slide', 'fade'] },
  },
};

export default meta;
type Story = StoryObj<typeof Overlay>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sectionLabel = { fontSize: 11, color: '#94A0B8', textTransform: 'uppercase' as const, letterSpacing: 1 };

const DialogBox = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 24,
      minWidth: 260,
      boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  args: {
    open: true,
    backdrop: 'dim',
    center: true,
    useModal: false,
  },
  render: (args) => (
    <div style={{ position: 'relative', height: 300, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: 16 }}>
        <Text>Background content behind the overlay</Text>
      </div>
      <Overlay {...args}>
        <DialogBox>
          <Text style={{ fontWeight: '600' }}>Overlay is open</Text>
        </DialogBox>
      </Overlay>
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 2. WithContent
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={sectionLabel}>Overlay with rich content</div>
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: '1px solid #334155',
            background: '#fff',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          Open Overlay
        </button>
        <div style={{ position: 'relative', height: 320, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: 16 }}>
            <Text>Page content sits underneath</Text>
          </div>
          <Overlay open={open} backdrop="dim" center useModal={false} onBackdropPress={() => setOpen(false)}>
            <DialogBox>
              <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 8 }}>Confirm Action</Text>
              <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                Are you sure you want to continue?
              </Text>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setOpen(false)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setOpen(false)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}
                >
                  Confirm
                </button>
              </div>
            </DialogBox>
          </Overlay>
        </div>
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// 3. CustomOpacity
// ---------------------------------------------------------------------------

export const CustomOpacity: Story = {
  name: 'Custom Opacity',
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {(['dim', 'blur', 'transparent'] as const).map((backdrop) => (
        <div key={backdrop}>
          <div style={{ ...sectionLabel, marginBottom: 8 }}>backdrop="{backdrop}"</div>
          <div style={{ position: 'relative', height: 200, border: '1px dashed #334155', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: 16 }}>
              <Text>Background content visible through the overlay</Text>
              <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 4 }}>
                The overlay backdrop is set to "{backdrop}"
              </Text>
            </div>
            <Overlay open backdrop={backdrop} center useModal={false}>
              <DialogBox>
                <Text style={{ fontWeight: '600' }}>{backdrop}</Text>
              </DialogBox>
            </Overlay>
          </div>
        </div>
      ))}
    </div>
  ),
};
