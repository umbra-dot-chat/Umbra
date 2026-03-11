import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

// ---------------------------------------------------------------------------
// NOTE: useSpring, usePressAnimation, and useAnimatedValue rely on
// React Native's Animated API, which is not fully available in a web
// Storybook environment. These stories demonstrate each hook's API and
// behavior conceptually. On a real React Native target the hooks drive
// native Animated.Value instances.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// SpringDemo
// ---------------------------------------------------------------------------

function SpringDemoComponent() {
  const [target, setTarget] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        useSpring
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        Animates a numeric value toward a target using spring physics
        (React Native Animated.spring). Returns an Animated.Value, a currentValue
        number, and an isAnimating boolean.
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
          API Demo
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
{`const { value, currentValue, isAnimating } = useSpring(
  ${target},
  { tension: 170, friction: 26 }
);`}
        </code>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setTarget(0)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
              background: target === 0 ? '#3B82F6' : '#FFF',
              color: target === 0 ? '#FFF' : '#1E293B',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Target: 0
          </button>
          <button
            onClick={() => setTarget(1)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #E2E8F0',
              background: target === 1 ? '#3B82F6' : '#FFF',
              color: target === 1 ? '#FFF' : '#1E293B',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            Target: 1
          </button>
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: '#E2E8F0',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${target * 100}%`,
              backgroundColor: '#3B82F6',
              borderRadius: 4,
              transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: '#94A0B8' }}>
          CSS transition simulates the spring behavior for this demo.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PressAnimationDemo
// ---------------------------------------------------------------------------

function PressAnimationDemoComponent() {
  const [pressed, setPressed] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        usePressAnimation
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        Provides spring-powered press feedback for Pressable components. Returns an
        animated scale value, onPressIn/onPressOut handlers, and a pre-built animated
        style with transform.
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
          Interactive Demo
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
{`const { scale, handlers, style } = usePressAnimation({
  scale: 0.97,
});
// Spread handlers on Pressable: onPressIn, onPressOut
// Apply style to Animated.View wrapping the button`}
        </code>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onMouseDown={() => setPressed(true)}
            onMouseUp={() => setPressed(false)}
            onMouseLeave={() => setPressed(false)}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: '#3B82F6',
              color: '#FFF',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transform: pressed ? 'scale(0.97)' : 'scale(1)',
              transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            Press me
          </button>
          <span style={{ fontSize: 12, color: '#94A0B8' }}>
            scale: {pressed ? '0.97' : '1.00'}
          </span>
        </div>
        <span style={{ fontSize: 12, color: '#94A0B8' }}>
          CSS transform simulates the spring press animation for this demo.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnimatedValueDemo
// ---------------------------------------------------------------------------

function AnimatedValueDemoComponent() {
  const [target, setTarget] = useState(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 11, color: '#94A0B8', textTransform: 'uppercase', letterSpacing: 1 }}>
        useAnimatedValue
      </div>
      <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
        Smoothly interpolates a numeric value toward a target over time using
        Animated.timing. Supports configurable duration and easing (linear, easeIn,
        easeOut, easeInOut).
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
          API Demo
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
{`const { value, currentValue, isAnimating } = useAnimatedValue(
  ${target},
  { duration: 250, easing: 'easeOut' }
);`}
        </code>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                background: target === t ? '#3B82F6' : '#FFF',
                color: target === t ? '#FFF' : '#1E293B',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div
          style={{
            position: 'relative',
            height: 40,
            borderRadius: 8,
            backgroundColor: '#F1F5F9',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: `${target * 100}%`,
              top: 4,
              width: 32,
              height: 32,
              borderRadius: 6,
              backgroundColor: '#3B82F6',
              transform: 'translateX(-50%)',
              transition: 'left 0.25s ease-out',
            }}
          />
        </div>
        <span style={{ fontSize: 12, color: '#94A0B8' }}>
          CSS transition simulates the timing animation for this demo.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

const meta: Meta = {
  title: 'React Native/Hooks/Animation Hooks',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// 1. SpringDemo
// ---------------------------------------------------------------------------

export const SpringDemo: Story = {
  name: 'SpringDemo',
  render: () => <SpringDemoComponent />,
};

// ---------------------------------------------------------------------------
// 2. PressAnimationDemo
// ---------------------------------------------------------------------------

export const PressAnimationDemo: Story = {
  name: 'PressAnimationDemo',
  render: () => <PressAnimationDemoComponent />,
};

// ---------------------------------------------------------------------------
// 3. AnimatedValueDemo
// ---------------------------------------------------------------------------

export const AnimatedValueDemo: Story = {
  name: 'AnimatedValueDemo',
  render: () => <AnimatedValueDemoComponent />,
};
