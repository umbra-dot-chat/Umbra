import React, { forwardRef, useMemo, useState, useCallback } from 'react';
import type { NodeRegistrationWizardProps } from '@coexist/wisp-core/types/NodeRegistrationWizard.types';
import type { NodeRegistrationData } from '@coexist/wisp-core/types/NodeRegistrationWizard.types';
import type { BoostNodeType } from '@coexist/wisp-core/types/BoostNodeDashboard.types';
import {
  buildWizardContainerStyle,
  buildStepContentStyle,
  buildTypeCardStyle,
  buildFieldGroupStyle,
  buildFooterStyle,
  buildReviewRowStyle,
  buildKeyDisplayStyle,
  buildErrorStyle,
} from '@coexist/wisp-core/styles/NodeRegistrationWizard.styles';
import { useTheme } from '../../providers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * NodeRegistrationWizard -- Multi-step wizard for registering a new boost node.
 *
 * @remarks
 * Three-step wizard: Choose type, Configure, Review & confirm.
 *
 * @module components/node-registration-wizard
 */
export const NodeRegistrationWizard = forwardRef<HTMLDivElement, NodeRegistrationWizardProps>(
  function NodeRegistrationWizard(
    {
      open,
      onClose,
      onComplete,
      submitting = false,
      error,
      generatedPublicKey,
      style: userStyle,
      className,
      ...rest
    },
    ref,
  ) {
    const { theme } = useTheme();

    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [nodeType, setNodeType] = useState<BoostNodeType>('local');
    const [name, setName] = useState('');
    const [maxStorageBytes, setMaxStorageBytes] = useState(10 * 1024 * 1024 * 1024); // 10 GB
    const [maxBandwidthMbps, setMaxBandwidthMbps] = useState(100);

    const containerStyle = useMemo(() => buildWizardContainerStyle(theme), [theme]);
    const stepContentStyle = useMemo(() => buildStepContentStyle(theme), [theme]);
    const footerStyle = useMemo(() => buildFooterStyle(theme), [theme]);

    const handleComplete = useCallback(() => {
      const data: NodeRegistrationData = { name, nodeType, maxStorageBytes, maxBandwidthMbps };
      onComplete?.(data);
    }, [name, nodeType, maxStorageBytes, maxBandwidthMbps, onComplete]);

    if (!open) return null;

    const stepLabels = ['Choose Type', 'Configure', 'Review'];

    return (
      <div
        ref={ref}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label="Register Boost Node"
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background.overlay,
          zIndex: 1000,
          ...userStyle,
        }}
        {...rest}
      >
        <div
          style={{
            ...containerStyle,
            backgroundColor: theme.colors.background.surface,
            borderRadius: theme.radii.xl,
            border: `1px solid ${theme.colors.border.subtle}`,
            maxWidth: 520,
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: theme.colors.text.primary }}>
              Register Boost Node
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.text.muted,
                cursor: 'pointer',
                fontSize: 20,
                lineHeight: 1,
              }}
            >
              x
            </button>
          </div>

          {/* Progress indicator */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {stepLabels.map((label, i) => (
              <React.Fragment key={label}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: theme.radii.full,
                      backgroundColor: i <= step ? theme.colors.accent.primary : theme.colors.border.subtle,
                      color: i <= step ? '#fff' : theme.colors.text.muted,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, color: i <= step ? theme.colors.text.primary : theme.colors.text.muted }}>
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div style={{ flex: 1, height: 1, backgroundColor: theme.colors.border.subtle }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step content */}
          <div style={stepContentStyle}>
            {step === 0 && (
              <StepType
                nodeType={nodeType}
                onSelect={setNodeType}
                theme={theme}
              />
            )}
            {step === 1 && (
              <StepConfigure
                name={name}
                onNameChange={setName}
                maxStorageBytes={maxStorageBytes}
                onStorageChange={setMaxStorageBytes}
                maxBandwidthMbps={maxBandwidthMbps}
                onBandwidthChange={setMaxBandwidthMbps}
                theme={theme}
              />
            )}
            {step === 2 && (
              <StepReview
                name={name}
                nodeType={nodeType}
                maxStorageBytes={maxStorageBytes}
                maxBandwidthMbps={maxBandwidthMbps}
                generatedPublicKey={generatedPublicKey}
                theme={theme}
              />
            )}
          </div>

          {/* Error */}
          {error && <div style={buildErrorStyle(theme)}>{error}</div>}

          {/* Footer */}
          <div style={footerStyle}>
            <button
              type="button"
              onClick={step === 0 ? onClose : () => setStep((s) => Math.max(0, s - 1) as 0 | 1 | 2)}
              style={{
                padding: '8px 16px',
                borderRadius: theme.radii.md,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border.strong}`,
                color: theme.colors.text.secondary,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="button"
              disabled={submitting || (step === 1 && !name.trim())}
              onClick={step < 2 ? () => setStep((s) => Math.min(2, s + 1) as 0 | 1 | 2) : handleComplete}
              style={{
                padding: '8px 16px',
                borderRadius: theme.radii.md,
                backgroundColor: theme.colors.accent.primary,
                color: '#fff',
                border: 'none',
                cursor: submitting ? 'wait' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                opacity: (submitting || (step === 1 && !name.trim())) ? 0.5 : 1,
              }}
            >
              {submitting ? 'Submitting...' : step < 2 ? 'Next' : 'Register'}
            </button>
          </div>
        </div>
      </div>
    );
  },
);

NodeRegistrationWizard.displayName = 'NodeRegistrationWizard';

// ---------------------------------------------------------------------------
// Step sub-components
// ---------------------------------------------------------------------------

function StepType({
  nodeType,
  onSelect,
  theme,
}: {
  nodeType: BoostNodeType;
  onSelect: (t: BoostNodeType) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 14, color: theme.colors.text.secondary }}>
        Choose how your node will connect:
      </span>
      {(['local', 'remote'] as const).map((type) => (
        <div
          key={type}
          role="button"
          tabIndex={0}
          onClick={() => onSelect(type)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(type); }}
          style={buildTypeCardStyle(nodeType === type, theme)}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: theme.colors.text.primary, textTransform: 'capitalize' }}>
            {type}
          </span>
          <span style={{ fontSize: 13, color: theme.colors.text.muted }}>
            {type === 'local'
              ? 'Runs on this machine. Data stays on your local network.'
              : 'Runs on a remote server. Connects over the internet.'}
          </span>
        </div>
      ))}
    </div>
  );
}

function StepConfigure({
  name, onNameChange,
  maxStorageBytes, onStorageChange,
  maxBandwidthMbps, onBandwidthChange,
  theme,
}: {
  name: string;
  onNameChange: (v: string) => void;
  maxStorageBytes: number;
  onStorageChange: (v: number) => void;
  maxBandwidthMbps: number;
  onBandwidthChange: (v: number) => void;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const fieldGroup = buildFieldGroupStyle(theme);
  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: theme.radii.md,
    border: `1px solid ${theme.colors.border.strong}`,
    backgroundColor: theme.colors.background.sunken,
    color: theme.colors.text.primary,
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={fieldGroup}>
        <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text.secondary }}>Node Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="My Boost Node"
          style={inputStyle}
        />
      </div>
      <div style={fieldGroup}>
        <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text.secondary }}>
          Max Storage ({formatBytes(maxStorageBytes)})
        </label>
        <input
          type="range"
          min={1073741824}
          max={107374182400}
          step={1073741824}
          value={maxStorageBytes}
          onChange={(e) => onStorageChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
      <div style={fieldGroup}>
        <label style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text.secondary }}>
          Max Bandwidth ({maxBandwidthMbps} Mbps)
        </label>
        <input
          type="range"
          min={10}
          max={1000}
          step={10}
          value={maxBandwidthMbps}
          onChange={(e) => onBandwidthChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}

function StepReview({
  name, nodeType, maxStorageBytes, maxBandwidthMbps, generatedPublicKey, theme,
}: {
  name: string;
  nodeType: BoostNodeType;
  maxStorageBytes: number;
  maxBandwidthMbps: number;
  generatedPublicKey?: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const rowStyle = buildReviewRowStyle(theme);
  const keyStyle = buildKeyDisplayStyle(theme);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 500, color: theme.colors.text.secondary }}>
        Confirm your node settings:
      </span>
      <div style={rowStyle}>
        <span style={{ color: theme.colors.text.muted, fontSize: 13 }}>Name</span>
        <span style={{ color: theme.colors.text.primary, fontSize: 14, fontWeight: 500 }}>{name}</span>
      </div>
      <div style={rowStyle}>
        <span style={{ color: theme.colors.text.muted, fontSize: 13 }}>Type</span>
        <span style={{ color: theme.colors.text.primary, fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{nodeType}</span>
      </div>
      <div style={rowStyle}>
        <span style={{ color: theme.colors.text.muted, fontSize: 13 }}>Max Storage</span>
        <span style={{ color: theme.colors.text.primary, fontSize: 14, fontWeight: 500 }}>{formatBytes(maxStorageBytes)}</span>
      </div>
      <div style={{ ...rowStyle, borderBottom: 'none' }}>
        <span style={{ color: theme.colors.text.muted, fontSize: 13 }}>Max Bandwidth</span>
        <span style={{ color: theme.colors.text.primary, fontSize: 14, fontWeight: 500 }}>{maxBandwidthMbps} Mbps</span>
      </div>
      {generatedPublicKey && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text.secondary }}>
            Generated Public Key
          </span>
          <div style={keyStyle}>{generatedPublicKey}</div>
        </div>
      )}
    </div>
  );
}
