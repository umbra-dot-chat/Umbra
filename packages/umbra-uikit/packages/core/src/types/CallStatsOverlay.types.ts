/**
 * CallStatsOverlay — Real-time WebRTC stats display.
 */

export interface CallStatsData {
  /** Current video resolution */
  resolution: { width: number; height: number } | null;
  /** Current framerate */
  frameRate: number | null;
  /** Current bitrate in kbps */
  bitrate: number | null;
  /** Packet loss percentage */
  packetLoss: number | null;
  /** Current codec */
  codec: string | null;
  /** Round-trip time in ms */
  roundTripTime: number | null;
  /** Jitter in ms */
  jitter: number | null;
}

export interface CallStatsOverlayProps {
  /** Call stats data */
  stats: CallStatsData;
  /** Whether the overlay is visible */
  visible?: boolean;
  /** Toggle visibility */
  onToggle?: () => void;
  /** Custom style */
  style?: object;
}
