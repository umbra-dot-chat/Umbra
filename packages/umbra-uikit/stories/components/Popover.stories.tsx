import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Popover, PopoverTrigger, PopoverContent } from '@wisp-ui/react';
import { popoverPlacements, popoverAligns } from '@wisp-ui/react';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React/Components/Overlays/Popover',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const Center = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 200,
      padding: 80,
    }}
  >
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  render: () => (
    <Center>
      <Popover>
        <PopoverTrigger>
          <button type="button" style={{ padding: '8px 16px' }}>
            Click me
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <div style={{ minWidth: 180 }}>
            <p style={{ margin: '0 0 8px' }}>Popover content</p>
            <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
              Click outside or press Escape to close.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </Center>
  ),
};

// ---------------------------------------------------------------------------
// 2. Placements
// ---------------------------------------------------------------------------

export const Placements: Story = {
  name: 'Placements',
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 48,
        padding: 120,
        justifyItems: 'center',
      }}
    >
      {popoverPlacements.map((p) => (
        <Popover key={p} placement={p}>
          <PopoverTrigger>
            <button type="button" style={{ padding: '8px 24px' }}>
              {p}
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Placement: {p}</span>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 3. Alignments
// ---------------------------------------------------------------------------

export const Alignments: Story = {
  name: 'Alignments',
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: 48,
        justifyContent: 'center',
        padding: 120,
      }}
    >
      {popoverAligns.map((a) => (
        <Popover key={a} placement="bottom" align={a}>
          <PopoverTrigger>
            <button type="button" style={{ padding: '8px 24px' }}>
              {a}
            </button>
          </PopoverTrigger>
          <PopoverContent>
            <span>Align: {a}</span>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  ),
};

// ---------------------------------------------------------------------------
// 4. Glass
// ---------------------------------------------------------------------------

export const Glass: Story = {
  name: 'Glass',
  render: () => (
    <Center>
      <div style={{ padding: 40, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16 }}>
        <Popover>
          <PopoverTrigger>
            <button type="button" style={{ padding: '8px 16px', color: '#fff', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 8, cursor: 'pointer' }}>
              Glass Popover
            </button>
          </PopoverTrigger>
          <PopoverContent variant="glass">
            <div style={{ minWidth: 180 }}>
              <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Frosted Glass</p>
              <p style={{ margin: 0, fontSize: 13, opacity: 0.7 }}>
                This popover uses the glass variant with backdrop blur.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </Center>
  ),
};

// ---------------------------------------------------------------------------
// 5. Controlled
// ---------------------------------------------------------------------------

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Center>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <p style={{ margin: 0 }}>Open: {String(open)}</p>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
              <button type="button" style={{ padding: '8px 16px' }}>
                Controlled Popover
              </button>
            </PopoverTrigger>
            <PopoverContent>
              <div style={{ minWidth: 160 }}>
                <p style={{ margin: '0 0 8px' }}>Controlled content</p>
                <button
                  type="button"
                  style={{ padding: '4px 12px' }}
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </Center>
    );
  },
};

// ---------------------------------------------------------------------------
// 5. WithForm
// ---------------------------------------------------------------------------

export const WithForm: Story = {
  name: 'With Form',
  render: () => (
    <Center>
      <Popover placement="bottom" align="start">
        <PopoverTrigger>
          <button type="button" style={{ padding: '8px 16px' }}>
            Edit Settings
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              Name
              <input
                type="text"
                placeholder="Enter name"
                style={{
                  padding: '6px 8px',
                  borderRadius: 4,
                  border: '1px solid currentColor',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              Email
              <input
                type="email"
                placeholder="Enter email"
                style={{
                  padding: '6px 8px',
                  borderRadius: 4,
                  border: '1px solid currentColor',
                  background: 'transparent',
                  color: 'inherit',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </label>
            <button type="button" style={{ padding: '6px 12px', marginTop: 4 }}>
              Save
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </Center>
  ),
};

// ---------------------------------------------------------------------------
// 6. Composition
// ---------------------------------------------------------------------------

export const Composition: Story = {
  name: 'Composition',
  render: () => (
    <Center>
      <Popover placement="bottom" align="start">
        <PopoverTrigger>
          <button type="button" style={{ padding: '8px 16px' }}>
            User Profile
          </button>
        </PopoverTrigger>
        <PopoverContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'currentColor',
                  opacity: 0.15,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Jane Doe</div>
                <div style={{ fontSize: 12, opacity: 0.6 }}>jane@example.com</div>
              </div>
            </div>
            <hr style={{ margin: 0, border: 'none', borderTop: '1px solid currentColor', opacity: 0.15 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
              <span style={{ cursor: 'pointer' }}>View Profile</span>
              <span style={{ cursor: 'pointer' }}>Settings</span>
              <span style={{ cursor: 'pointer', opacity: 0.6 }}>Sign Out</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </Center>
  ),
};
