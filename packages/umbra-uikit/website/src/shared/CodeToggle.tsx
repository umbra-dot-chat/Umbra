import React, { useState } from 'react';
import { Button, Collapse, useThemeColors } from '@wisp-ui/react';
import { Code, ChevronDown, ChevronUp, Monitor, Smartphone } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

interface CodeToggleProps {
  code: string;
  rnCode?: string;
}

export function CodeToggle({ code, rnCode }: CodeToggleProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'react' | 'rn'>('react');
  const colors = useThemeColors();
  const isDark = colors.background.canvas === '#000000' || colors.text.primary === '#F5F5F5';

  const hasTabs = Boolean(rnCode);
  const displayedCode = activeTab === 'rn' && rnCode ? rnCode : code;

  return (
    <div>
      <Button
        variant="tertiary"
        size="sm"
        iconLeft={<Code size={14} />}
        iconRight={open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        onClick={() => setOpen((p) => !p)}
      >
        {open ? 'Hide Code' : 'View Code'}
      </Button>

      <Collapse open={open}>
        <div style={{ paddingTop: 8 }}>
          {hasTabs && (
            <div
              style={{
                display: 'flex',
                gap: 0,
                marginBottom: 0,
                borderRadius: '10px 10px 0 0',
                backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                borderBottom: isDark ? undefined : '1px solid rgba(0, 0, 0, 0.08)',
              }}
            >
              <TabButton
                active={activeTab === 'react'}
                onClick={() => setActiveTab('react')}
                icon={<Monitor size={13} />}
                label="React"
                isDark={isDark}
              />
              <TabButton
                active={activeTab === 'rn'}
                onClick={() => setActiveTab('rn')}
                icon={<Smartphone size={13} />}
                label="React Native"
                isDark={isDark}
              />
            </div>
          )}
          <div style={{ borderRadius: hasTabs ? '0 0 10px 10px' : undefined }}>
            <CodeBlock
              code={displayedCode}
              {...(hasTabs ? { style: { borderRadius: '0 0 10px 10px' } } : {})}
            />
          </div>
        </div>
      </Collapse>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  isDark,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isDark: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        cursor: 'pointer',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        fontWeight: active ? 600 : 400,
        color: isDark
          ? (active ? 'rgba(255, 255, 255, 0.95)' : hovered ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)')
          : (active ? 'rgba(0, 0, 0, 0.9)' : hovered ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)'),
        backgroundColor: isDark
          ? (active ? 'rgba(255, 255, 255, 0.08)' : 'transparent')
          : (active ? 'rgba(0, 0, 0, 0.05)' : 'transparent'),
        borderBottom: active
          ? `2px solid ${isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'}`
          : '2px solid transparent',
        transition: 'color 150ms ease, background-color 150ms ease',
        userSelect: 'none',
      }}
    >
      {icon}
      {label}
    </div>
  );
}
