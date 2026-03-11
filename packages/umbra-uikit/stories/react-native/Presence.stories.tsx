import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// NOTE: The Presence component relies on React Native's Animated API and
// Animated.View, which are not fully functional in a web Storybook. These
// stories demonstrate the component's API and behavior conceptually using
// CSS transitions as a visual stand-in.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Animation config display
// ---------------------------------------------------------------------------

const animations = [
  { name: 'fadeIn', description: 'Opacity 0 \u2192 1' },
  { name: 'scaleIn', description: 'Opacity + scale 0.95 \u2192 1' },
  { name: 'slideUp', description: 'Opacity + translateY 8px \u2192 0' },
  { name: 'slideDown', description: 'Opacity + translateY -8px \u2192 0' },
];

function PresenceDefaultDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Presence
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        Renders children with an animated mount/unmount transition. Keeps
        children in the tree during the exit animation and removes them only
        after the animation completes.
      </p>
      <div
        style={{
          padding: 16,
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
          API
        </div>
        <code
          style={{
            fontSize: 12,
            color: '#64748B',
            backgroundColor: '#F8FAFC',
            padding: '8px 10px',
            borderRadius: 4,
            whiteSpace: 'pre',
          }}
        >
{`<Presence
  visible={isVisible}
  animation="fadeIn"  // 'fadeIn' | 'scaleIn' | 'slideUp' | 'slideDown'
  duration={250}
>
  <YourContent />
</Presence>`}
        </code>

        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>
          Available Animations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {animations.map(({ name, description }) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
              }}
            >
              <code style={{ fontSize: 13, fontWeight: 600, color: '#3B82F6', minWidth: 100 }}>
                {name}
              </code>
              <span style={{ fontSize: 12, color: '#64748B' }}>{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle demo with CSS stand-in for each animation type
// ---------------------------------------------------------------------------

const cssAnimationStyles: Record<string, (visible: boolean) => React.CSSProperties> = {
  fadeIn: (visible) => ({
    opacity: visible ? 1 : 0,
    transition: 'opacity 0.25s ease-out',
  }),
  scaleIn: (visible) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'scale(1)' : 'scale(0.95)',
    transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
  }),
  slideUp: (visible) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
  }),
  slideDown: (visible) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(-8px)',
    transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
  }),
};

function PresenceToggleDemo() {
  const [visible, setVisible] = useState(true);
  const [animation, setAnimation] = useState<string>('fadeIn');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Toggle Demo
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setVisible((v) => !v)}
          style={{
            padding: '8px 20px',
            borderRadius: 6,
            border: '1px solid #E2E8F0',
            background: '#FFF',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          {animations.map(({ name }) => (
            <button
              key={name}
              onClick={() => setAnimation(name)}
              style={{
                padding: '4px 12px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: animation === name ? '#3B82F6' : '#FFF',
                color: animation === name ? '#FFF' : '#1E293B',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ minHeight: 80 }}>
        <div
          style={{
            padding: 20,
            borderRadius: 8,
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            ...cssAnimationStyles[animation](visible),
          }}
        >
          <span style={{ fontSize: 14, color: '#1E293B' }}>
            Content wrapped in {'<Presence>'} with animation=&quot;{animation}&quot;.
            On React Native this uses Animated.View with native-driver performance.
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <code style={{ fontSize: 12, color: '#64748B', backgroundColor: '#F8FAFC', padding: '2px 6px', borderRadius: 3 }}>
          visible: {String(visible)}
        </code>
        <code style={{ fontSize: 12, color: '#64748B', backgroundColor: '#F8FAFC', padding: '2px 6px', borderRadius: 3 }}>
          animation: {animation}
        </code>
      </div>
      <span style={{ fontSize: 12, color: '#94A0B8' }}>
        CSS transitions simulate the Animated behavior for this demo.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React Native/Hooks/Presence',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => <PresenceDefaultDemo />,
};

// ---------------------------------------------------------------------------
// 2. Toggle
// ---------------------------------------------------------------------------

export const Toggle: Story = {
  name: 'Toggle',
  render: () => <PresenceToggleDemo />,
};
