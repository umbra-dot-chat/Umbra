/**
 * Dialog Compositions — Core modal patterns showing key variants.
 *
 * @module stories/dialog-compositions
 */

import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from '@wisp-ui/react';
import { Button } from '@wisp-ui/react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react';

const meta: Meta<typeof Dialog> = {
  title: 'React/Components/Overlays/Dialog Compositions',
  component: Dialog,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

// ---------------------------------------------------------------------------
// Helper: Featured Icon Circle
// ---------------------------------------------------------------------------

function FeaturedIcon({
  icon: IconComponent,
  color = 'danger',
}: {
  icon: React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>;
  color?: 'danger' | 'warning' | 'success' | 'info' | 'brand';
}) {
  const colorMap = {
    danger: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#EF4444', ring: 'rgba(239, 68, 68, 0.06)' },
    warning: { bg: 'rgba(245, 158, 11, 0.12)', fg: '#F59E0B', ring: 'rgba(245, 158, 11, 0.06)' },
    success: { bg: 'rgba(34, 197, 94, 0.12)', fg: '#22C55E', ring: 'rgba(34, 197, 94, 0.06)' },
    info: { bg: 'rgba(59, 130, 246, 0.12)', fg: '#3B82F6', ring: 'rgba(59, 130, 246, 0.06)' },
    brand: { bg: 'rgba(99, 102, 241, 0.12)', fg: '#6366F1', ring: 'rgba(99, 102, 241, 0.06)' },
  };
  const c = colorMap[color];
  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', backgroundColor: c.ring }} />
      <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', backgroundColor: c.ring }} />
      <div style={{
        position: 'relative',
        width: 48, height: 48, borderRadius: '50%',
        backgroundColor: c.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <IconComponent size={22} style={{ color: c.fg }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Standard Confirmation
// ---------------------------------------------------------------------------

export const Standard: Story = {
  name: 'Standard',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button onClick={() => setOpen(true)}>Confirm Action</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Confirm action"
            description="Are you sure you want to proceed? This will apply your changes."
            icon={<FeaturedIcon icon={Info} color="info" />}
            size="sm"
            footer={
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <Button variant="secondary" onSurface size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button variant="primary" onSurface size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>Confirm</Button>
              </div>
            }
          />
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Destructive
// ---------------------------------------------------------------------------

export const Destructive: Story = {
  name: 'Destructive',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button variant="destructive" onClick={() => setOpen(true)}>Delete Item</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Delete item"
            description="Are you sure? This action cannot be undone."
            icon={<FeaturedIcon icon={Trash2} color="danger" />}
            size="sm"
            footer={
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <Button variant="secondary" onSurface size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button variant="destructive" size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>Delete</Button>
              </div>
            }
          />
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Warning
// ---------------------------------------------------------------------------

export const Warning: Story = {
  name: 'Warning',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button variant="warning-outline" onClick={() => setOpen(true)}>Leave Page</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Unsaved changes"
            description="You have unsaved changes. Save before leaving?"
            icon={<FeaturedIcon icon={AlertTriangle} color="warning" />}
            size="sm"
            footer={
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <Button variant="secondary" onSurface size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>Discard</Button>
                <Button variant="warning" size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>Save Changes</Button>
              </div>
            }
          />
        </>
      );
    };
    return <Demo />;
  },
};

// ---------------------------------------------------------------------------
// Success
// ---------------------------------------------------------------------------

export const Success: Story = {
  name: 'Success',
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      return (
        <>
          <Button variant="success" onClick={() => setOpen(true)}>Show Success</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Action complete"
            description="Everything was processed successfully."
            icon={<FeaturedIcon icon={CheckCircle} color="success" />}
            size="sm"
            footer={
              <Button variant="primary" onSurface size="md" onClick={() => setOpen(false)} style={{ width: '100%' }}>Done</Button>
            }
          />
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
          <Button variant="destructive-outline" onClick={() => setOpen(true)}>Delete (Glass)</Button>
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            title="Delete workspace"
            description="This will permanently delete the workspace and all data."
            icon={<FeaturedIcon icon={Trash2} color="danger" />}
            size="sm"
            variant="glass"
            footer={
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <Button variant="secondary" onSurface size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                <Button variant="destructive" size="md" onClick={() => setOpen(false)} style={{ flex: 1 }}>Delete</Button>
              </div>
            }
          />
        </>
      );
    };
    return <Demo />;
  },
};
