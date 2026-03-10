# VOICE_VIDEO_CALL_UI_REVAMP

## Context

The current call UI has several issues: video doesn't scale to fit available space, controls go off-screen on large windows, buttons are invisible in both light and dark mode (black on black), and the PiP popup when navigating away is disruptive. The local video uses a small PiP overlay instead of a proper multi-stream grid. This plan redesigns the entire call experience based on 15 design decisions, informed by analysis of Discord and Google Meet patterns.

## Design Decisions Summary

| # | Decision | Choice |
|---|----------|--------|
| 1 | 1:1 layout | Adaptive (equal when both cameras on, remote-dominant when one camera) |
| 2 | Focus/spotlight | Spotlight + vertical sidebar strip on right |
| 3 | Controls | Bottom center overlay, auto-hides on idle |
| 4 | Button style | Standard theme-aware appearances (fix invisible buttons) |
| 5 | Sidebar call panel | Fixed footer at bottom of ChatSidebar (~120px) |
| 6 | Navigate away | Sidebar panel shows prominent speaker with live video preview |
| 7 | Grid algorithm | Justified packing (maximize tile area, minimize gaps) |
| 8 | Call + chat | Split: video top (~55%), scrollable chat bottom |
| 9 | Voice-only | Avatar cards in grid, pulse/glow when speaking |
| 10 | Full-screen | Double-click any tile to full-screen it, Escape to exit |
| 11 | Speaker indicator | Brand gradient border (violet->pink->blue) with pulse animation |
| 12 | Self view | Toggleable, last tile in grid when visible |
| 13 | Mobile | Compact video (~30% height) + chat fills rest |
| 14 | Default controls | Mic, Camera, Screen Share, End Call |
| 15 | Sidebar panel design | Expanded (~120px) with live video thumbnail + controls |
| 16 | Screen share | Tabbed toggle: Screen Share view / Participant grid |
| 17 | Tile styling | Rounded corners + gap using Wisp design tokens |
| 18 | Speaker color | Brand gradient (violet->pink->blue) |

---

## Phase 1: Foundation — Types + State + Speaker Detection

### Commit 1: Add CallParticipant type and extend ActiveCall
**File:** `src/types/call.ts`

```typescript
export interface CallParticipant {
  did: string;
  displayName: string;
  stream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  avatar?: string;
}
```

Extend `ActiveCall` with:
- `participants: Map<string, CallParticipant>` — all call participants keyed by DID
- `selfViewVisible: boolean` — whether local video tile is shown

Keep existing `localStream`/`remoteStream` for backward compat during migration.

### Commit 2: Update CallContext for participants + self-view toggle
**File:** `src/contexts/CallContext.tsx`

- Add `selfViewVisible` state + `toggleSelfView` callback to context value
- In `startCall`/`acceptCall`: populate `participants` Map with local + remote entries
- In stream handlers: update participant stream in Map
- In `toggleMute`/`toggleCamera`: update local participant entry
- In `callState` event handler: update remote participant state
- Expose `selfViewVisible` and `toggleSelfView` on context

### Commit 3: Add useSpeakerDetection hook
**New file:** `src/hooks/useSpeakerDetection.ts`

Uses `AudioContext` + `AnalyserNode` to detect who's speaking:
- For each participant with a stream, creates an AnalyserNode
- Polls `getByteFrequencyData()` at 100ms intervals
- Compares RMS volume against threshold
- Returns `{ activeSpeakerDid, speakingDids: Set<string> }`
- Cleans up on unmount or participant change

---

## Phase 2: New Call UI Components

### Commit 4: Create JustifiedVideoGrid
**New file:** `src/components/call/JustifiedVideoGrid.tsx`

Core layout component with justified packing algorithm:

```
for cols from 1 to count:
  rows = ceil(count / cols)
  tileW = (containerW - gap * (cols + 1)) / cols
  tileH = tileW / aspectRatio
  if fits vertically: score = tileW * tileH
  also try height-first calculation
  pick arrangement with largest tile area
```

- Uses Wisp `VideoTile` for rendering each stream
- Wisp design tokens for `borderRadius` and `gap`
- `onLayout` for container measurement
- Wraps active speaker tiles with `SpeakerBorder`
- `onTileDoubleClick` prop for fullscreen
- Adaptive 1:1 logic: equal split when both cameras on, remote-dominant otherwise

**Props:** `participants`, `selfViewVisible`, `localDid`, `activeSpeakerDid`, `speakingDids`, `onTileDoubleClick`, `gap`, `aspectRatio`

### Commit 5: Create CallControlsOverlay with auto-hide
**New file:** `src/components/call/CallControlsOverlay.tsx`

- Wraps Wisp `CallControls` positioned at bottom-center as absolute overlay
- Auto-hides after 3s of no mouse movement (configurable)
- Reappears on hover/touch
- `Animated.Value` for opacity fade
- Primary buttons: Mic, Camera, Screen Share, End Call
- Overflow menu for Settings
- Respects `useAppTheme()` motion preferences
- Always visible on mobile (no auto-hide — touch needs accessible targets)

### Commit 6: Create SpeakerBorder with brand gradient
**New file:** `src/components/call/SpeakerBorder.tsx`

- Animated gradient border: `#8B5CF6` (violet) -> `#EC4899` (pink) -> `#3B82F6` (blue)
- On web: CSS `@keyframes` for gradient rotation + `box-shadow` pulse
- On native: `Animated.Value` to cycle border color
- Respects reduced motion preferences
- **Props:** `active: boolean`, `children`, `borderRadius`
- Reused in: JustifiedVideoGrid tiles, VoiceAvatarCard, SidebarCallPanel thumbnail

### Commit 7: Create VoiceAvatarCard for voice-only calls
**New file:** `src/components/call/VoiceAvatarCard.tsx`

- Uses Wisp `Avatar` component for the circle
- Display name below avatar
- Wraps in `SpeakerBorder` when speaking
- Mute indicator badge (Wisp `Badge`)
- Used inside JustifiedVideoGrid when `callType === 'voice'`

---

## Phase 3: Sidebar Call Panel + PiP Removal

### Commit 8: Create SidebarCallPanel
**New file:** `src/components/call/SidebarCallPanel.tsx`

~120px fixed footer panel for ChatSidebar:
1. **Video thumbnail** (~60px) — prominent speaker's stream via Wisp `VideoTile` size="sm", or avatar for voice
2. **Caller info row** — avatar + name + Wisp `CallTimer`
3. **Compact controls** — Wisp `CallControls` layout="compact"
4. Click video thumbnail = "Return to call" navigation

**Props:** `activeCall`, `onReturnToCall`, `onToggleMute`, `onToggleCamera`, `onEndCall`

### Commit 9: Wire SidebarCallPanel + remove PiP widget
**Files modified:**
1. `src/components/sidebar/ChatSidebar.tsx` — Add SidebarCallPanel as fixed footer, accept call props
2. `app/(main)/_layout.tsx` — Remove CallPipWidget block (lines ~899-915), pass call props to ChatSidebar

---

## Phase 4: Rewrite ActiveCallPanel + Polish

### Commit 10: Rewrite ActiveCallPanel with new composition
**Files:** `src/components/call/ActiveCallPanel.tsx` (rewrite), `app/(main)/index.tsx` (prop updates)

New composition:
```
<View style={{ maxHeight, bg: theme.colors.background.sunken }}>
  <View onMouseMove={resetAutoHide}>
    {hasVideo ? <JustifiedVideoGrid /> : <VoiceAvatarGrid />}
    <CallControlsOverlay />
    <CallStatsOverlay />
  </View>
</View>
```

Key fixes:
- **No hardcoded `backgroundColor: '#000'`** — uses `theme.colors.background.sunken` (fixes invisible buttons)
- maxHeight: `windowHeight * 0.55` (desktop) or `windowHeight * 0.30` (mobile via `useIsMobile()`)
- Mouse/touch events drive auto-hide
- Add `useSpeakerDetection` hook call in ChatPage (index.tsx)

### Commit 11: Add double-click fullscreen
**New file:** `src/hooks/useFullscreen.ts`
**Modified:** `src/components/call/JustifiedVideoGrid.tsx`

- `useFullscreen` hook: `{ fullscreenDid, enterFullscreen, exitFullscreen }`
- Double-click tile -> fills entire grid container (`position: absolute, inset: 0`)
- Escape key listener on web to exit
- Small "exit fullscreen" hint in top-right corner

### Commit 12: Screen share tabs + mobile responsive
**File:** `src/components/call/ActiveCallPanel.tsx` (modification)

Screen share:
- When `isScreenSharing`: show tab bar "Screen" | "Participants"
- "Screen" tab: full-width VideoTile with screen stream
- "Participants" tab: JustifiedVideoGrid with camera feeds
- Local `useState` for active tab

Mobile responsive:
- `useIsMobile()` -> video area at 30% height, controls always visible
- Self-view defaults hidden on mobile

---

## File Summary

| # | File | Action | ~LOC |
|---|------|--------|------|
| 1 | `src/types/call.ts` | Modify | 25 |
| 2 | `src/contexts/CallContext.tsx` | Modify | 60 |
| 3 | `src/hooks/useSpeakerDetection.ts` | **New** | 80 |
| 4 | `src/components/call/JustifiedVideoGrid.tsx` | **New** | 95 |
| 5 | `src/components/call/CallControlsOverlay.tsx` | **New** | 90 |
| 6 | `src/components/call/SpeakerBorder.tsx` | **New** | 75 |
| 7 | `src/components/call/VoiceAvatarCard.tsx` | **New** | 65 |
| 8 | `src/components/call/SidebarCallPanel.tsx` | **New** | 90 |
| 9 | `src/components/sidebar/ChatSidebar.tsx` + `app/(main)/_layout.tsx` | Modify | 55 |
| 10 | `src/components/call/ActiveCallPanel.tsx` + `app/(main)/index.tsx` | Rewrite + modify | 95 |
| 11 | `src/hooks/useFullscreen.ts` + `JustifiedVideoGrid.tsx` | **New** + modify | 50 |
| 12 | `src/components/call/ActiveCallPanel.tsx` | Modify | 70 |
| | **Total** | 6 new, 6 modified | **~850** |

## Reusable Existing Code

- **Wisp `VideoTile`** — `<video>` rendering with srcObject, size presets, mirror, speaking border
- **Wisp `CallControls`** — themed button bar, `horizontal`/`compact` layouts, `resolveCallControlsColors()`
- **Wisp `CallTimer`** — live duration display
- **Wisp `Avatar`** — user avatar with fallback initial
- **`useIsMobile()`** (`src/hooks/useIsMobile.ts`) — responsive breakpoint at 768px
- **`useWindowDimensions()`** from react-native — viewport measurements
- **`useAppTheme()`** (`src/contexts/ThemeContext.tsx`) — motion preferences for animation control
- **CallContext** (`src/contexts/CallContext.tsx`) — streams, mute, camera, quality, screen sharing
- **CSS keyframe injection pattern** from `NavigationRail.tsx` lines 37-44 — reuse for SpeakerBorder

## Verification

After each commit:
1. `npx tsc --noEmit` — type-check passes
2. `preview_screenshot` at desktop/tablet/mobile — layout correct
3. `preview_console_logs(level: 'error')` — zero new errors
4. `preview_inspect` on call panel — verify theme colors (not hardcoded black)

End-to-end:
- Start a call with Ghost -> video grid renders with justified packing
- Toggle self-view -> local tile appears/disappears as last in grid
- Navigate to different conversation -> SidebarCallPanel appears with video preview (no PiP popup)
- Click sidebar panel -> returns to call view
- Double-click a tile -> fullscreen, Escape to exit
- Resize window -> grid recalculates tile sizes
- Switch to light mode -> all buttons visible and themed
- Mobile viewport -> video at 30%, chat below, controls always visible
