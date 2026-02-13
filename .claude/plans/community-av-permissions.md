# Massive Feature Plan: Communities, Audio/Video, Roles & Permissions

## Overview
This plan covers three major feature areas:
1. **Communities** — Server/community navigation rail + community views in Umbra
2. **Audio & Video** — Full calling UI system as new Wisp components
3. **Roles & Permissions** — User role display and permission management components

---

## PHASE 1: Community Navigation & Views

### 1.1 Community Rail (Umbra)
A slim vertical bar to the LEFT of the existing ChatSidebar, displaying community avatars.

**New file:** `components/community/CommunityRail.tsx`
- Slim vertical bar (~64px wide)
- Dark background matching sidebar theme
- Contains a list of community avatars (Avatar component, size="sm")
- Hovering an avatar shows a Tooltip with the community name
- Clicking selects the community, transforms sidebar + main content
- Active community has a visual indicator (pill/bar on left side)
- "Home" icon at top returns to DM/conversation view
- Separator between Home and community list
- "Add Community" button at bottom (+)

**New file:** `data/communities.ts`
- Mock community data: 4-5 communities with id, name, icon/initials, channels, members
- Each community has categories with channels (text + voice)
- Uses ChannelCategory/ChannelItem types from Wisp

**New hook:** `hooks/useCommunity.ts`
- State: `activeCommunity: string | null` (null = DM view)
- State: `activeChannel: string | null`
- Functions: `selectCommunity(id)`, `selectChannel(id)`, `goHome()`

### 1.2 Community Sidebar (Umbra)
When a community is selected, the ChatSidebar transforms to show community info.

**New file:** `components/community/CommunitySidebar.tsx`
- Community name header with dropdown icon
- Uses Wisp `ChannelList` component with categories
- Text channels (#general, #dev, #design, etc.)
- Voice channels (🔊 General Voice, 🔊 Gaming)
- Active channel highlighted
- Channel click navigates to that channel

### 1.3 Community Main View (Umbra)
When viewing a community, the main area shows community content instead of DM chat.

**New file:** `components/community/CommunityView.tsx`
- Header showing channel name + topic
- Member list on right (reuse existing MemberList)
- Chat area for the channel (reuse ChatArea pattern)
- For voice channels: show connected users + join button

### 1.4 App Layout Updates (Umbra)
**Modified:** `app/index.tsx`
- Add CommunityRail to the left of ChatSidebar
- Conditionally render ChatSidebar vs CommunitySidebar based on `activeCommunity`
- Conditionally render ChatArea vs CommunityView

### 1.5 Tests for Phase 1
- `__tests__/data/communities.test.ts` — shape validation
- `__tests__/hooks/useCommunity.test.ts` — state transitions
- `__tests__/components/community/CommunityRail.test.tsx` — render, hover, click
- `__tests__/components/community/CommunitySidebar.test.tsx` — channel list render
- `__tests__/components/community/CommunityView.test.tsx` — layout render

---

## PHASE 2: Audio & Video Calling Components (Wisp)

### 2.1 Core Types (`packages/core/src/types/`)

**New file:** `CallControls.types.ts`
```typescript
type CallStatus = 'idle' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'failed';
type CallType = 'audio' | 'video';
type ParticipantStatus = 'connecting' | 'connected' | 'muted' | 'speaking' | 'disconnected';

interface CallParticipant {
  id: string;
  name: string;
  avatar?: React.ReactNode;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
  status?: ParticipantStatus;
}

interface CallControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isSpeakerOn: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onToggleSpeaker: () => void;
  onEndCall: () => void;
  callType: CallType;
  layout?: 'horizontal' | 'compact';
}
```

**New file:** `IncomingCall.types.ts`
```typescript
interface IncomingCallProps {
  caller: { name: string; avatar?: React.ReactNode; status?: string };
  callType: CallType;
  onAccept: () => void;
  onDecline: () => void;
  onAcceptVideo?: () => void;
  visible: boolean;
}
```

**New file:** `CallScreen.types.ts`
```typescript
interface CallScreenProps {
  participants: CallParticipant[];
  localParticipant: CallParticipant;
  callType: CallType;
  callStatus: CallStatus;
  duration?: number;
  onEndCall: () => void;
  // Control states
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  layout?: 'grid' | 'speaker' | 'sidebar';
}
```

**New file:** `CallMiniWindow.types.ts`
```typescript
type SnapPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface CallMiniWindowProps {
  participant: CallParticipant;
  localParticipant: CallParticipant;
  callType: CallType;
  duration?: number;
  onExpand: () => void;
  onEndCall: () => void;
  snapPosition?: SnapPosition;
  onSnapChange?: (pos: SnapPosition) => void;
  draggable?: boolean;
}
```

**New file:** `VoiceChannelPanel.types.ts`
```typescript
interface VoiceChannelPanelProps {
  channelName: string;
  participants: CallParticipant[];
  localParticipant?: CallParticipant;
  isConnected: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  isMuted: boolean;
  isDeafened: boolean;
}
```

### 2.2 Core Styles (`packages/core/src/styles/`)

**New files:**
- `CallControls.styles.ts` — button sizing, icon colors, active states, danger for end-call
- `IncomingCall.styles.ts` — overlay, card, caller info, accept/decline buttons, animation keyframes
- `CallScreen.styles.ts` — full-screen layout, participant grid, speaker view, sidebar layout
- `CallMiniWindow.styles.ts` — floating window, corner snapping, minimal controls
- `VoiceChannelPanel.styles.ts` — channel panel with participant list, join/leave bar

Each follows the pattern:
1. `resolve[Component]Colors(theme)` function
2. Individual `build[Element]Style(colors, theme)` functions

### 2.3 React Native Components (`packages/react-native/src/components/`)

**New directory:** `call-controls/`
- `CallControls.tsx` — Row of circular control buttons (mute, video, screen share, speaker, end call)
- Each button: icon + label below, toggleable state, end call in red
- Responsive: horizontal (full) and compact layouts
- Proper accessibility labels

**New directory:** `incoming-call/`
- `IncomingCall.tsx` — Modal-style overlay for incoming calls
- Animated pulsing avatar ring
- Caller name + call type indicator
- Accept (green) + Decline (red) circular buttons
- Accept as video option
- Slide-up entrance animation
- Ring animation on avatar

**New directory:** `call-screen/`
- `CallScreen.tsx` — Full call view
- Grid layout: 1 participant = centered, 2 = side-by-side, 3-4 = 2x2 grid, 5+ = scroll grid
- Speaker layout: active speaker large, others in sidebar strip
- Participant tiles: avatar/video placeholder, name overlay, mute indicator, speaking border glow
- Top bar: call duration timer, call type badge, participant count
- Bottom bar: CallControls component
- Status overlay (connecting, reconnecting)

**New directory:** `call-mini-window/`
- `CallMiniWindow.tsx` — Small floating PiP window
- Draggable on web (pan gesture)
- Snaps to corners (top-left, top-right, bottom-left, bottom-right)
- Shows active speaker or self-view
- Minimal overlay: duration, mute icon, expand button, end call button
- Smooth corner-snap animation
- `position: fixed` (portaled on web like context menu)

**New directory:** `voice-channel-panel/`
- `VoiceChannelPanel.tsx` — Bottom panel showing voice channel connection
- Shows current channel name
- Lists connected participants with speaking indicator
- Mute/Deafen/Disconnect buttons
- Join/Leave toggle
- Mini user controls

### 2.4 Barrel Exports

**Update:** `packages/react-native/src/components/index.ts`
- Add all new A/V component exports under "Wave 15: Audio & Video"

**Update:** `packages/react-native/src/index.ts`
- Add all new exports + types to main barrel

### 2.5 Tests for Phase 2 (in Umbra)
- `__tests__/components/av/CallControls.test.tsx`
- `__tests__/components/av/IncomingCall.test.tsx`
- `__tests__/components/av/CallScreen.test.tsx`
- `__tests__/components/av/CallMiniWindow.test.tsx`
- `__tests__/components/av/VoiceChannelPanel.test.tsx`

### 2.6 Umbra Integration
**New files:**
- `components/av/IncomingCallOverlay.tsx` — Renders IncomingCall when someone calls
- `components/av/ActiveCallView.tsx` — Renders CallScreen or mini window
- `components/av/VoiceBar.tsx` — Voice channel connection bar at bottom of sidebar
- `hooks/useCall.ts` — Call state management (status, participants, controls)

**Modified:** `app/index.tsx`
- Add IncomingCallOverlay at root level
- Add VoiceBar to sidebar
- Support transitioning between mini/full call views

---

## PHASE 3: Roles & Permissions (Wisp + Umbra)

### 3.1 Core Types

**New file:** `packages/core/src/types/RoleBadge.types.ts`
```typescript
interface Role {
  id: string;
  name: string;
  color: string;
  icon?: React.ReactNode;
  position: number; // sort order, higher = more power
}

interface RoleBadgeProps {
  role: Role;
  size?: ComponentSize;
  removable?: boolean;
  onRemove?: () => void;
}
```

**New file:** `packages/core/src/types/PermissionManager.types.ts`
```typescript
type PermissionCategory = 'general' | 'text' | 'voice' | 'management';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  dangerous?: boolean;
}

interface PermissionState {
  [permissionId: string]: boolean | null; // true=allow, false=deny, null=inherit
}

interface PermissionManagerProps {
  permissions: Permission[];
  state: PermissionState;
  onChange: (permissionId: string, value: boolean | null) => void;
  categories?: PermissionCategory[];
  readOnly?: boolean;
}
```

**New file:** `packages/core/src/types/RoleEditor.types.ts`
```typescript
interface RoleEditorProps {
  roles: Role[];
  selectedRoleId?: string;
  onSelectRole: (id: string) => void;
  onCreateRole: () => void;
  onDeleteRole: (id: string) => void;
  onUpdateRole: (id: string, updates: Partial<Role>) => void;
  permissions: Permission[];
  permissionStates: Record<string, PermissionState>;
  onPermissionChange: (roleId: string, permissionId: string, value: boolean | null) => void;
}
```

### 3.2 Core Styles

**New files:**
- `RoleBadge.styles.ts` — Colored pill badges for roles
- `PermissionManager.styles.ts` — Toggle grid for permissions with categories
- `RoleEditor.styles.ts` — Role list + editor panel

### 3.3 React Native Components

**New directory:** `role-badge/`
- `RoleBadge.tsx` — Colored pill showing role name, optional icon, removable

**New directory:** `permission-manager/`
- `PermissionManager.tsx` — Grouped list of permissions with tri-state toggles (allow/deny/inherit)
- Category headers (General, Text, Voice, Management)
- Permission rows: name, description, toggle
- Dangerous permissions highlighted in red

**New directory:** `role-editor/`
- `RoleEditor.tsx` — Two-panel layout
- Left: role list with colored dots, add button
- Right: selected role settings (name, color picker, permissions)
- Uses PermissionManager for the permissions tab

### 3.4 Barrel Exports
- Add to component index and main index as "Wave 16: Roles & Permissions"

### 3.5 Umbra Integration

**New files:**
- `data/roles.ts` — Mock roles and permissions data
- `components/community/RoleDisplay.tsx` — Shows user roles in member list/profile
- `components/community/CommunitySettings.tsx` — Dialog with role management

**Modified:**
- `components/modals/ProfilePopover.tsx` — Show role badges on user profile
- MemberList items — Show highest role color

### 3.6 Tests
- `__tests__/components/roles/RoleBadge.test.tsx`
- `__tests__/components/roles/PermissionManager.test.tsx`
- `__tests__/components/roles/RoleEditor.test.tsx`

---

## PHASE 4: Contrast & Theme Verification

### 4.1 Contrast Audit Tests (Wisp)
**New file:** `packages/core/src/__tests__/contrast-audit.test.ts`
- Audit ALL new component color pairs against WCAG AA
- Test both light and dark themes
- Verify text on backgrounds passes 4.5:1
- Verify large text passes 3:1
- Verify interactive elements have sufficient contrast
- Verify status indicators are distinguishable

### 4.2 Visual Verification (Umbra)
- Toggle dark mode → verify all community components
- Toggle dark mode → verify all A/V components
- Toggle dark mode → verify all role/permission components
- Check border contrast in both modes
- Check focus ring visibility in both modes

---

## Implementation Order

### Round 1: Foundation (Wisp types + styles)
1. All core types files (CallControls, IncomingCall, CallScreen, CallMiniWindow, VoiceChannelPanel, RoleBadge, PermissionManager, RoleEditor)
2. All core styles files
3. Contrast audit test

### Round 2: Wisp Components
4. CallControls component
5. IncomingCall component
6. CallScreen component
7. CallMiniWindow component
8. VoiceChannelPanel component
9. RoleBadge component
10. PermissionManager component
11. RoleEditor component
12. Barrel exports

### Round 3: Umbra Data & Hooks
13. data/communities.ts
14. data/roles.ts
15. hooks/useCommunity.ts
16. hooks/useCall.ts

### Round 4: Umbra Community UI
17. CommunityRail component
18. CommunitySidebar component
19. CommunityView component
20. App layout updates (index.tsx)

### Round 5: Umbra A/V Integration
21. IncomingCallOverlay
22. ActiveCallView
23. VoiceBar
24. App integration

### Round 6: Umbra Roles Integration
25. RoleDisplay
26. CommunitySettings
27. Profile updates

### Round 7: Testing
28. All Umbra component tests
29. All hook tests
30. All data tests
31. Contrast audit
32. Integration test updates
33. Visual verification

### Round 8: Polish
34. npm run patch
35. Visual testing in browser
36. Dark/light mode verification
37. Fix any contrast failures
38. Final test run

---

## File Count Summary
- **New Wisp files:** ~24 (8 types, 5 styles, 5 components, 5 indexes, 1 test)
- **New Umbra files:** ~20 (2 data, 2 hooks, 8 components, 8 tests)
- **Modified files:** ~6 (barrel exports, app layout, profile popover, jest config)
- **Total estimated:** ~50 files

## Quality Checklist (Check frequently!)
- [ ] Every component uses `useTheme()` and resolves colors from theme
- [ ] Every component works in both light and dark mode
- [ ] Text on backgrounds passes WCAG AA (4.5:1)
- [ ] Large text passes WCAG AA-large (3:1)
- [ ] Interactive elements have visible focus states
- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors
- [ ] Consistent with existing Wisp patterns (forwardRef, ViewProps, etc.)
- [ ] Community rail looks good at narrow widths
- [ ] A/V components responsive
- [ ] Role badges readable against various backgrounds
- [ ] Animations smooth and accessible (reduced motion support)
