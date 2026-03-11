import type React from 'react';

// ---------------------------------------------------------------------------
// Node Status
// ---------------------------------------------------------------------------

/** Tuple of all supported {@link BoostNodeStatus} values. */
export const boostNodeStatuses = ['online', 'offline', 'syncing'] as const;

/**
 * Union of supported boost node connectivity states.
 *
 * @remarks
 * Derived from the {@link boostNodeStatuses} tuple so the two stay in sync automatically.
 */
export type BoostNodeStatus = (typeof boostNodeStatuses)[number];

/** Tuple of all supported {@link BoostNodeType} values. */
export const boostNodeTypes = ['local', 'remote'] as const;

/**
 * Union of supported boost node deployment types.
 */
export type BoostNodeType = (typeof boostNodeTypes)[number];

// ---------------------------------------------------------------------------
// BoostNode
// ---------------------------------------------------------------------------

/**
 * Data model for a single boost node.
 */
export interface BoostNode {
  /** Unique identifier for the node. */
  id: string;
  /** Human-readable display name. */
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
  /** Current connectivity status. */
  status: BoostNodeStatus;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the {@link BoostNodeDashboard} component.
 *
 * @remarks
 * Extends the native `HTMLDivElement` attributes so standard DOM props such as
 * `className`, `id`, and event handlers are forwarded to the root element.
 */
export interface BoostNodeDashboardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of boost nodes to display. */
  nodes: BoostNode[];
  /** Callback fired when a node card is clicked. */
  onNodeClick?: (nodeId: string) => void;
  /** Callback fired when the register button is clicked. */
  onRegisterClick?: () => void;
  /** Dashboard title override. @default 'Boost Nodes' */
  title?: string;
  /** Show loading state. */
  loading?: boolean;
  /** Show skeleton placeholder. */
  skeleton?: boolean;
}
