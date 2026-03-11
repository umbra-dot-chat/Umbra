import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Sheet } from '@wisp-ui/react';
import { sheetSizes } from '@wisp-ui/react';
import type { SheetSize } from '@wisp-ui/react';
import { Text } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';

const meta: Meta<typeof Sheet> = {
  title: 'React/Components/Overlays/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: [...sheetSizes] },
    overlay: { control: 'boolean' },
    closeOnOverlayClick: { control: 'boolean' },
    closeOnEscape: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Sheet>;

// Sheet always renders on a dark raised surface, so text colors
// must use the onRaised palette regardless of the active theme mode.
const raised = { primary: '#F7F8FA', secondary: '#94A0B8', muted: '#667085', border: 'rgba(255,255,255,0.1)' };

// ---------------------------------------------------------------------------
// Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Sheet</Button>
          <Sheet open={open} onClose={() => setOpen(false)}>
            <div style={{ padding: 24 }}>
              <Text size="lg" weight="semibold" as="h2" style={{ margin: '0 0 8px 0', color: raised.primary }}>
                Sheet Title
              </Text>
              <Text size="sm" style={{ color: raised.secondary }}>
                This is a bottom sheet. Drag the handle down to dismiss.
              </Text>
            </div>
          </Sheet>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Sizes (sm, md, lg, full)
// ---------------------------------------------------------------------------

export const Sizes: Story = {
  name: 'Sizes',
  render: () => {
    const Demo = () => {
      const [openSize, setOpenSize] = useState<SheetSize | null>(null);
      return (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {sheetSizes.map((size) => (
            <React.Fragment key={size}>
              <Button variant="secondary" size="sm" onClick={() => setOpenSize(size)}>
                {size}
              </Button>
              <Sheet
                open={openSize === size}
                onClose={() => setOpenSize(null)}
                size={size}
              >
                <div style={{ padding: 24 }}>
                  <Text size="lg" weight="semibold" as="h2" style={{ margin: '0 0 8px 0', color: raised.primary }}>
                    {size.toUpperCase()} Sheet
                  </Text>
                  <Text size="sm" style={{ color: raised.secondary }}>
                    Max height: {size === 'sm' ? '40vh' : size === 'md' ? '60vh' : size === 'lg' ? '80vh' : '100vh'}.
                    Drag the handle down to dismiss.
                  </Text>
                </div>
              </Sheet>
            </React.Fragment>
          ))}
        </div>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// WithContent (form inside sheet)
// ---------------------------------------------------------------------------

export const WithContent: Story = {
  name: 'With Content',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Edit Profile</Button>
          <Sheet open={open} onClose={() => setOpen(false)} size="md">
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <Text size="lg" weight="semibold" as="h2" style={{ margin: '0 0 4px 0', color: raised.primary }}>
                  Edit Profile
                </Text>
                <Text size="sm" style={{ color: raised.secondary }}>
                  Update your personal information below.
                </Text>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text size="sm" weight="medium" as="label" style={{ color: raised.primary }}>Name</Text>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${raised.border}`,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: raised.primary,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text size="sm" weight="medium" as="label" style={{ color: raised.primary }}>Email</Text>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${raised.border}`,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: raised.primary,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Text size="sm" weight="medium" as="label" style={{ color: raised.primary }}>Bio</Text>
                  <textarea
                    placeholder="Tell us about yourself"
                    rows={4}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${raised.border}`,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: raised.primary,
                      fontSize: 14,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpen(false)}
                  style={{ color: raised.primary, borderColor: raised.border }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setOpen(false)}
                  style={{ backgroundColor: '#FFFFFF', color: '#0A0E15' }}
                >
                  Save
                </Button>
              </div>
            </div>
          </Sheet>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------

export const Glass: Story = {
  name: 'Glass',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Glass Sheet</Button>
          <Sheet open={open} onClose={() => setOpen(false)} variant="glass">
            <div style={{ padding: 24 }}>
              <Text size="lg" weight="semibold" as="h2" style={{ margin: '0 0 8px 0', color: raised.primary }}>
                Glass Sheet
              </Text>
              <Text size="sm" style={{ color: raised.secondary }}>
                This sheet uses the frosted-glass variant with backdrop blur. Drag the handle down to dismiss.
              </Text>
            </div>
          </Sheet>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// NoOverlay
// ---------------------------------------------------------------------------

export const NoOverlay: Story = {
  name: 'No Overlay',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Without Overlay</Button>
          <Sheet open={open} onClose={() => setOpen(false)} overlay={false}>
            <div style={{ padding: 24 }}>
              <Text size="lg" weight="semibold" as="h2" style={{ margin: '0 0 8px 0', color: raised.primary }}>
                No Overlay
              </Text>
              <Text size="sm" style={{ color: raised.secondary }}>
                This sheet has no backdrop overlay. Drag down or press Escape to close.
              </Text>
              <div style={{ marginTop: 16 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setOpen(false)}
                  style={{ color: raised.primary, borderColor: raised.border }}
                >
                  Close
                </Button>
              </div>
            </div>
          </Sheet>
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Composition (sheet with header + body + footer)
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Open Composed Sheet</Button>
          <Sheet open={open} onClose={() => setOpen(false)} size="lg">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header */}
              <div
                style={{
                  padding: '12px 24px 16px',
                  borderBottom: `1px solid ${raised.border}`,
                  flexShrink: 0,
                }}
              >
                <Text size="lg" weight="semibold" as="h2" style={{ margin: 0, color: raised.primary }}>
                  Notifications
                </Text>
                <Text size="xs" style={{ marginTop: 2, color: raised.muted }}>
                  You have 3 unread messages
                </Text>
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 0',
                      borderBottom: i < 5 ? `1px solid ${raised.border}` : 'none',
                    }}
                  >
                    <Text size="sm" weight="medium" style={{ color: raised.primary }}>
                      Notification {i + 1}
                    </Text>
                    <Text size="xs" style={{ marginTop: 2, color: raised.secondary }}>
                      This is a sample notification message with some details.
                    </Text>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  borderTop: `1px solid ${raised.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <Button
                  variant="tertiary"
                  size="sm"
                  onClick={() => setOpen(false)}
                  style={{ color: raised.secondary }}
                >
                  Mark all read
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setOpen(false)}
                  style={{ backgroundColor: '#FFFFFF', color: '#0A0E15' }}
                >
                  Done
                </Button>
              </div>
            </div>
          </Sheet>
        </>
      );
    };
    return <Demo />;
  },
};
