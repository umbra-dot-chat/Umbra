import type React from 'react';
import type { BoostNodeType, BoostNodeStatus } from './BoostNodeDashboard.types';

// ---------------------------------------------------------------------------
// Config Update
// ---------------------------------------------------------------------------

/**
 * Partial configuration updates for a boost node.
 */
export interface NodeConfigUpdate {
  /** New maximum storage capacity in bytes. */
  maxStorageBytes?: number;
  /** New maximum bandwidth limit in Mbps. */
  maxBandwidthMbps?: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link NodeDetailPanel} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so standard DOM props such as
 * `className`, `id`, and event handlers are forwarded to the root element.
 */
export interface NodeDetailPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Node display name. */
  name: string;
  /** Deployment type — local or remote. */
  nodeType: BoostNodeType;
  /** Whether the node is currently enabled. */
  enabled: boolean;
  /** ISO timestamp of the last heartbeat, if available. */
  lastSeenAt?: string;
  /** Maximum storage capacity in bytes. */
  maxStorageBytes: number;
  /** Currently used storage in bytes. */
  usedStorageBytes: number;
  /** Maximum bandwidth limit in Mbps. */
  maxBandwidthMbps: number;
  /** Node's public key for identity verification. */
  publicKey: string;
  /** Current connectivity status. */
  status: BoostNodeStatus;
  /** Callback fired when the enable/disable toggle is changed. */
  onToggleEnabled?: (enabled: boolean) => void;
  /** Callback fired when configuration is updated. */
  onUpdateConfig?: (updates: NodeConfigUpdate) => void;
  /** Callback fired when the delete button is clicked. */
  onDelete?: () => void;
  /** Callback fired when the panel close button is clicked. */
  onClose?: () => void;
  /** Whether a save operation is in progress. */
  saving?: boolean;
  /** Show skeleton placeholder. */
  skeleton?: boolean;
}
