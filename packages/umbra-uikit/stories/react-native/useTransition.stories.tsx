import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// NOTE: useTransition relies on React Native's Animated API and is not fully
// functional in a web Storybook. These stories demonstrate the hook's API and
// lifecycle conceptually using CSS transitions as a visual stand-in.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Conceptual demo showing the transition lifecycle
// ---------------------------------------------------------------------------

function TransitionDefaultDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        useTransition
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        Manages mount/unmount lifecycle with animated opacity and transform.
        The element stays mounted during the exit animation and is removed only
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
{`const { mounted, style, phase } = useTransition(visible, {
  duration: 250,
  easing: 'easeOut',
});

// phase: 'enter' | 'idle' | 'exit'
// mounted: boolean (stays true during exit animation)
// style: animated opacity + translateY + scale`}
        </code>

        <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>
          Lifecycle Phases
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['enter', 'idle', 'exit'] as const).map((phase) => (
            <div
              key={phase}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{phase}</div>
              <div style={{ fontSize: 11, color: '#94A0B8', marginTop: 4 }}>
                {phase === 'enter' && 'Opacity 0\u21921, scale 0.98\u21921'}
                {phase === 'idle' && 'Fully visible, at rest'}
                {phase === 'exit' && 'Opacity 1\u21920, scale 1\u21920.98'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle demo with CSS stand-in
// ---------------------------------------------------------------------------

function TransitionToggleDemo() {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(true);
  const [phase, setPhase] = useState<'enter' | 'idle' | 'exit'>('idle');

  const handleToggle = () => {
    if (visible) {
      setPhase('exit');
      setVisible(false);
      setTimeout(() => {
        setMounted(false);
        setPhase('exit');
      }, 250);
    } else {
      setMounted(true);
      setPhase('enter');
      setVisible(true);
      setTimeout(() => {
        setPhase('idle');
      }, 250);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        Toggle Demo
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleToggle}
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
        <div style={{ display: 'flex', gap: 8 }}>
          <code style={{ fontSize: 12, color: '#64748B', backgroundColor: '#F8FAFC', padding: '2px 6px', borderRadius: 3 }}>
            mounted: {String(mounted)}
          </code>
          <code style={{ fontSize: 12, color: '#64748B', backgroundColor: '#F8FAFC', padding: '2px 6px', borderRadius: 3 }}>
            phase: {phase}
          </code>
        </div>
      </div>
      <div style={{ minHeight: 80 }}>
        {mounted && (
          <div
            style={{
              padding: 20,
              borderRadius: 8,
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0) scale(1)' : 'translateY(4px) scale(0.98)',
              transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
            }}
          >
            <span style={{ fontSize: 14, color: '#1E293B' }}>
              Animated content. This element stays mounted during exit and
              unmounts after the animation completes.
            </span>
          </div>
        )}
      </div>
      <span style={{ fontSize: 12, color: '#94A0B8' }}>
        CSS transitions simulate the Animated.timing behavior for this demo.
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React Native/Hooks/useTransition',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// 1. Default
// ---------------------------------------------------------------------------

export const Default: Story = {
  name: 'Default',
  render: () => <TransitionDefaultDemo />,
};

// ---------------------------------------------------------------------------
// 2. Toggle
// ---------------------------------------------------------------------------

export const Toggle: Story = {
  name: 'Toggle',
  render: () => <TransitionToggleDemo />,
};
