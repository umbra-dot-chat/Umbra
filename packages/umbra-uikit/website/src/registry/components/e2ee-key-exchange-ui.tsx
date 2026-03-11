import React, { useState } from 'react';
import { E2EEKeyExchangeUI, useThemeColors } from '@wisp-ui/react';
import type { ComponentEntry } from '../types';

// ---------------------------------------------------------------------------
// Demo components
// ---------------------------------------------------------------------------

function AllStatesDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 480 }}>
      <E2EEKeyExchangeUI status="pending" keyVersion={1} />
      <E2EEKeyExchangeUI status="active" keyVersion={3} onRotateKey={() => {}} />
      <E2EEKeyExchangeUI status="rotating" keyVersion={3} />
      <E2EEKeyExchangeUI
        status="error"
        errorMessage="Peer did not respond to key exchange"
        onRetry={() => {}}
      />
    </div>
  );
}

function ActiveDemo() {
  const [rotating, setRotating] = useState(false);
  const [version, setVersion] = useState(3);

  const handleRotate = () => {
    setRotating(true);
    setTimeout(() => {
      setRotating(false);
      setVersion((v) => v + 1);
    }, 2000);
  };

  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <E2EEKeyExchangeUI
        status={rotating ? 'rotating' : 'active'}
        keyVersion={version}
        onRotateKey={handleRotate}
        rotating={rotating}
      />
    </div>
  );
}

function ErrorDemo() {
  const [status, setStatus] = useState<'error' | 'pending' | 'active'>('error');

  const handleRetry = () => {
    setStatus('pending');
    setTimeout(() => setStatus('active'), 1500);
  };

  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <E2EEKeyExchangeUI
        status={status}
        keyVersion={1}
        errorMessage={status === 'error' ? 'Network timeout — peer unreachable' : undefined}
        onRetry={handleRetry}
      />
    </div>
  );
}

function CompactDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 480 }}>
      <E2EEKeyExchangeUI status="active" keyVersion={3} compact />
      <E2EEKeyExchangeUI status="pending" compact />
      <E2EEKeyExchangeUI status="rotating" keyVersion={2} compact />
      <E2EEKeyExchangeUI status="error" compact />
    </div>
  );
}

function SkeletonDemo() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <E2EEKeyExchangeUI status="active" skeleton />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card preview
// ---------------------------------------------------------------------------

function E2EEPreview() {
  const colors = useThemeColors();
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: 12,
        pointerEvents: 'none',
      }}
    >
      {/* Shield icon + status card */}
      <div
        style={{
          width: '100%',
          maxWidth: 190,
          borderRadius: 10,
          border: `1px solid ${colors.status.successBorder}`,
          backgroundColor: colors.status.successSurface,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Mini shield check */}
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.status.success} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          <span style={{ fontSize: 9, fontWeight: 600, color: colors.text.primary }}>End-to-End Encrypted</span>
          {/* Badge */}
          <span
            style={{
              fontSize: 7,
              fontWeight: 500,
              color: colors.status.success,
              border: `1px solid ${colors.status.success}`,
              borderRadius: 99,
              padding: '1px 4px',
              lineHeight: 1,
            }}
          >
            v3
          </span>
        </div>
        <span style={{ fontSize: 7, color: colors.text.secondary, lineHeight: 1.3 }}>
          Messages are secured with E2EE.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registry entry
// ---------------------------------------------------------------------------

export const e2eeKeyExchangeUIEntry: ComponentEntry = {
  slug: 'e2ee-key-exchange-ui',
  name: 'E2EEKeyExchangeUI',
  category: 'components',
  subcategory: 'Community',
  description:
    'Key exchange status banner displaying the current state of end-to-end encryption — pending, active, rotating, or error — with optional key version badge and action buttons.',
  variantCount: 4,
  keywords: [
    'e2ee', 'encryption', 'key exchange', 'key rotation', 'security',
    'banner', 'status', 'shield', 'end-to-end', 'encrypted', 'community',
  ],

  cardPreview: <E2EEPreview />,

  examples: [
    {
      title: 'All States',
      render: <AllStatesDemo />,
      code: `import { E2EEKeyExchangeUI } from '@wisp-ui/react';

<E2EEKeyExchangeUI status="pending" keyVersion={1} />
<E2EEKeyExchangeUI status="active" keyVersion={3} onRotateKey={() => {}} />
<E2EEKeyExchangeUI status="rotating" keyVersion={3} />
<E2EEKeyExchangeUI status="error" errorMessage="Peer did not respond" onRetry={() => {}} />`,
      rnCode: `import { E2EEKeyExchangeUI } from '@coexist/wisp-react-native';

<E2EEKeyExchangeUI status="pending" keyVersion={1} />
<E2EEKeyExchangeUI status="active" keyVersion={3} onRotateKey={() => {}} />
<E2EEKeyExchangeUI status="rotating" keyVersion={3} />
<E2EEKeyExchangeUI status="error" errorMessage="Peer did not respond" onRetry={() => {}} />`,
    },
    {
      title: 'Interactive — Key Rotation',
      render: <ActiveDemo />,
      code: `const [rotating, setRotating] = useState(false);
const [version, setVersion] = useState(3);

const handleRotate = () => {
  setRotating(true);
  setTimeout(() => {
    setRotating(false);
    setVersion(v => v + 1);
  }, 2000);
};

<E2EEKeyExchangeUI
  status={rotating ? 'rotating' : 'active'}
  keyVersion={version}
  onRotateKey={handleRotate}
  rotating={rotating}
/>`,
    },
    {
      title: 'Interactive — Error + Retry',
      render: <ErrorDemo />,
      code: `const [status, setStatus] = useState<'error' | 'pending' | 'active'>('error');

const handleRetry = () => {
  setStatus('pending');
  setTimeout(() => setStatus('active'), 1500);
};

<E2EEKeyExchangeUI
  status={status}
  keyVersion={1}
  errorMessage={status === 'error' ? 'Network timeout' : undefined}
  onRetry={handleRetry}
/>`,
    },
    {
      title: 'Compact Banners',
      render: <CompactDemo />,
      code: `<E2EEKeyExchangeUI status="active" keyVersion={3} compact />
<E2EEKeyExchangeUI status="pending" compact />
<E2EEKeyExchangeUI status="rotating" keyVersion={2} compact />
<E2EEKeyExchangeUI status="error" compact />`,
    },
    {
      title: 'Skeleton',
      render: <SkeletonDemo />,
      code: `<E2EEKeyExchangeUI status="active" skeleton />`,
    },
  ],

  props: [
    { name: 'status', type: "'pending' | 'active' | 'rotating' | 'error'", required: true, description: 'Current key exchange status.' },
    { name: 'keyVersion', type: 'number', description: 'Current key version number. Displays as "v{n}" badge.' },
    { name: 'errorMessage', type: 'string', description: 'Error message text (when status is "error"). Overrides the default description.' },
    { name: 'onRetry', type: '() => void', description: 'Called when the retry button is clicked (visible in error state).' },
    { name: 'onRotateKey', type: '() => void', description: 'Called when the rotate key button is clicked (visible in active state).' },
    { name: 'rotating', type: 'boolean', default: 'false', description: 'Whether key rotation is currently in progress. Shows spinner and disables button.' },
    { name: 'compact', type: 'boolean', default: 'false', description: 'Show as a compact single-row banner instead of a full card. Hides description and actions.' },
    { name: 'skeleton', type: 'boolean', default: 'false', description: 'Show loading skeleton placeholders.' },
  ],
};
