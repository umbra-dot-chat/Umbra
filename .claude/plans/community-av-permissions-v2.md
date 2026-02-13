# Detailed Implementation Plan v2: Communities, Audio/Video, Roles & Permissions

## REMINDER CHECKLIST (Check after every component!)
- [ ] Uses `useTheme()` + `useMemo` for color resolution
- [ ] Works in light AND dark mode (test both)
- [ ] Text contrast ≥ 4.5:1 against background (WCAG AA)
- [ ] Large text contrast ≥ 3:1 (WCAG AA-large)
- [ ] forwardRef pattern with ViewProps extension
- [ ] Skeleton/loading state support where applicable
- [ ] Proper accessibility labels
- [ ] All tests pass after each component
- [ ] Consistent spacing/radii/typography from theme tokens

---

## PHASE 1: COMMUNITIES

### 1A. Mock Data (`data/communities.ts`)

```typescript
export interface Community {
  id: string;
  name: string;
  icon?: string; // URL or null for initials
  initials: string;
  color: string; // accent color for the community
  channels: CommunityChannel[];
  members: CommunityMember[];
}

export interface CommunityChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  category: string;
  topic?: string;
  unreadCount?: number;
}

export interface CommunityMember {
  id: string;
  name: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  roles: string[];
  avatar?: string;
}

// 4 mock communities:
// 1. "Wisp Design" — design system community
// 2. "Gaming Hub" — gaming community
// 3. "Dev Team" — developer community
// 4. "Music Lounge" — music community

// Each has 2-3 categories with 2-4 channels each
// Mix of text and voice channels
// 8-15 members each with various roles
```

### 1B. Community Hook (`hooks/useCommunity.ts`)

```typescript
interface UseCommunityReturn {
  activeCommunity: string | null;
  activeChannel: string | null;
  community: Community | null; // resolved from activeCommunity
  channel: CommunityChannel | null; // resolved from activeChannel
  selectCommunity: (id: string) => void;
  selectChannel: (id: string) => void;
  goHome: () => void;
}
```

State transitions:
- `goHome()` → sets both to null, returns to DM view
- `selectCommunity(id)` → sets community, auto-selects first text channel
- `selectChannel(id)` → sets channel within current community

### 1C. Community Rail (`components/community/CommunityRail.tsx`)

**Layout:**
- Width: 64px fixed
- Background: `colors.background.sunken` (dark sidebar uses dark canvas)
- Wrapped in its own `WispProvider mode="dark"` (always dark like sidebar)
- Padding: 8px horizontal, 12px top

**Elements (top to bottom):**
1. **Home button** — White house icon (or DM icon) in a 40px circle
   - Active when `activeCommunity === null`
   - Active state: white background, dark icon
   - Inactive: transparent, white icon, hover → `colors.background.raised`
2. **Separator line** — 32px wide, 2px height, `colors.border.subtle`
3. **Community avatars** — ScrollView of 40px Avatar circles
   - Uses initials + community color as background
   - Active indicator: 4px wide white pill on left edge
   - Hover → rounded-rect (borderRadius transitions from full → lg)
   - Tooltip on hover showing community name
4. **Add button** — 40px circle with "+" icon
   - `colors.text.secondary` icon, hover → `colors.status.success`
   - Dashed border on hover

**Hover behavior:**
- Use Wisp `Tooltip` component for community name display
- Active community has left pill indicator (animated)

### 1D. Community Sidebar (`components/community/CommunitySidebar.tsx`)

**Layout:**
- Same width as ChatSidebar (wide variant)
- Wrapped in `WispProvider mode="dark"` (same as ChatSidebar)

**Elements:**
1. **Header** — Community name (bold, lg) with chevron-down icon
   - Pressable (future: dropdown menu)
   - Height: 56px to match chat header
2. **ChannelList** — Uses Wisp `ChannelList` component directly
   - Categories from community data
   - Active channel highlighted
   - Voice channels show connected user count
3. **Voice connection bar** (bottom) — shown when in voice channel
   - Channel name, "Connected" status
   - Mute/Deafen/Disconnect buttons

### 1E. Community View (`components/community/CommunityView.tsx`)

**For text channels:**
- Same layout as DM chat (header + chat area + input)
- Header shows `# channel-name` with topic
- Chat area reuses ChatArea component pattern
- Input at bottom

**For voice channels:**
- Large centered area showing connected participants
- Grid of participant tiles (avatar + name + status)
- Join Voice button at center if not connected
- CallControls at bottom when connected

### 1F. App Layout Changes (`app/index.tsx`)

```
┌──────┬──────────────┬─────────────────────────────┬──────────┐
│ Rail │   Sidebar    │       Main Content           │  Panel   │
│ 64px │   ~240px     │        flex: 1               │  280px   │
│      │              │                              │          │
│ [H]  │ (Chat or     │ (Chat or Community View)     │ Members  │
│ ---  │  Community)  │                              │ Pins     │
│ [W]  │              │                              │ Search   │
│ [G]  │              │                              │          │
│ [D]  │              │                              │          │
│ [M]  │              │                              │          │
│      │              │                              │          │
│ [+]  │              │                              │          │
└──────┴──────────────┴─────────────────────────────┴──────────┘
```

Conditional rendering:
- `activeCommunity === null` → ChatSidebar + ChatHeader + ChatArea + ChatInput
- `activeCommunity !== null` → CommunitySidebar + CommunityView

---

## PHASE 2: AUDIO & VIDEO COMPONENTS (Wisp)

### 2A. CallControls Component

**Wisp path:** `packages/react-native/src/components/call-controls/`
**Core types:** `packages/core/src/types/CallControls.types.ts`
**Core styles:** `packages/core/src/styles/CallControls.styles.ts`

**Visual design:**
- Row of circular buttons (48px default, 40px compact)
- Each button: icon centered, label below (optional)
- Toggle states: active = filled circle, inactive = outlined/subtle
- End call button: always red (`colors.status.danger`), phone-down icon
- Mute button: microphone / microphone-off
- Video button: camera / camera-off
- Screen share: monitor icon
- Speaker: speaker / speaker-off

**Color scheme:**
- Button bg (inactive): `withAlpha(colors.text.primary, 0.1)`
- Button bg (active): `colors.text.primary` with inverse icon color
- Button bg (end call): `colors.status.danger`
- Icon color: `colors.text.primary` (inactive), `colors.text.inverse` (active)
- Label: `colors.text.secondary`, size `2xs`

**Layout variants:**
- `horizontal`: all buttons in a row with equal spacing, labels below
- `compact`: smaller buttons, no labels, tighter spacing

### 2B. IncomingCall Component

**Visual design:**
- Fixed overlay centered on screen
- Card: 320px wide, rounded corners (`radii.xl`)
- Background: `colors.background.raised` with blur backdrop
- Content:
  - Pulsing ring animation around caller avatar (80px)
  - Caller name (lg, semibold)
  - Call type text ("Audio Call" / "Video Call") in `text.secondary`
  - Two large circular buttons at bottom:
    - Decline (red): phone-down icon, 56px
    - Accept (green): phone-up icon, 56px
  - Optional: "Accept as Video" text button between

**Animation:**
- Card slides up from bottom with opacity fade
- Avatar ring pulses (scale 1.0 → 1.15) with opacity
- Rings: 3 concentric rings with staggered timing
- Uses `Animated` API from React Native

**Accessibility:**
- `accessibilityRole="alert"`
- Auto-focus on accept button
- Announce caller name

### 2C. CallScreen Component

**Visual design:**
- Full-screen layout with dark background
- Top bar: duration timer (center), participant count (right)
- Main area: participant grid
- Bottom bar: CallControls + layout toggle button

**Participant grid layouts:**
1. **Grid** (default):
   - 1 participant: full screen
   - 2: side by side (50/50)
   - 3-4: 2x2 grid
   - 5-6: 2x3 grid
   - 7+: scrollable grid, 3 columns
2. **Speaker view**:
   - Active speaker takes 80% of space
   - Others in horizontal strip at bottom (scrollable)
3. **Sidebar view**:
   - Active speaker takes 75% left
   - Others stacked vertically on right 25%

**Participant tile:**
- Avatar centered (or video placeholder)
- Name overlay at bottom with semi-transparent bg
- Mute icon if muted (top-right corner)
- Speaking indicator: green border glow when `isSpeaking`
- Screen share indicator icon
- `borderRadius: radii.lg`

**Status overlays:**
- "Connecting..." — centered spinner + text
- "Reconnecting..." — with warning icon
- "Call ended" — with duration summary

### 2D. CallMiniWindow Component

**Visual design:**
- Small floating window: 200x150px (video) or 200x64px (audio)
- Rounded corners (`radii.xl`)
- Shadow: `shadows.xl`
- Content:
  - Video: participant video/avatar + small self-view corner
  - Audio: waveform or avatar + duration text
- Overlay controls (show on hover):
  - Expand button (top-right)
  - End call button (bottom-right)
  - Duration timer (top-left)
  - Mute indicator

**Dragging (web):**
- Uses `onMouseDown` + `onMouseMove` for drag
- On release: snaps to nearest corner
- Corner positions have 16px margin from viewport edges
- Smooth spring animation to snap position
- Stores snap position in state

**Portal rendering:**
- Uses `createPortal(document.body)` on web (like context menu)
- `position: fixed` with snap coordinates
- Always on top: `zIndex: 10000`

### 2E. VoiceChannelPanel Component

**Visual design:**
- Bottom bar panel (height: ~72px when connected)
- Background: `colors.background.raised`
- Left section: channel name + "Voice Connected" in green text
- Center: participant avatars (small, overlapping)
- Right: Mute, Deafen, Disconnect icon buttons

**States:**
- Not connected: hidden
- Connected: shows with slide-up animation
- Muted/Deafened: icons show slashed state

### 2F. Supporting SVG Icons (new in Wisp or Umbra)

Need to create these icons:
- `PhoneIcon` — incoming call accept
- `PhoneOffIcon` — end/decline call
- `MicIcon` / `MicOffIcon` — mute toggle
- `CameraIcon` / `CameraOffIcon` — video toggle
- `MonitorIcon` — screen share
- `SpeakerIcon` / `SpeakerOffIcon` — speaker toggle
- `MaximizeIcon` — expand mini window
- `HeadphonesIcon` / `HeadphonesOffIcon` — deafen toggle
- `HomeIcon` — community rail home
- `PlusIcon` — add community
- `HashIcon` — text channel
- `VolumeIcon` — voice channel
- `MegaphoneIcon` — announcement channel
- `ShieldIcon` — role/permission icon
- `CrownIcon` — admin/owner role

---

## PHASE 3: ROLES & PERMISSIONS

### 3A. RoleBadge Component

**Visual design:**
- Small colored pill/chip
- Role color as background with text
- Auto-detect text color using `bestTextColor()` from contrast utils
- Sizes: xs (16px height), sm (20px), md (24px)
- Optional removable "x" button
- Optional role icon (left of text)
- Border: 1px solid with slightly darker shade of role color

### 3B. PermissionManager Component

**Visual design:**
- Grouped list with category headers
- Each permission row:
  - Name (sm, semibold)
  - Description (xs, muted text)
  - Tri-state toggle: Allow (green) / Deny (red) / Inherit (gray)
- Categories separated by section headers with subtle dividers
- Dangerous permissions: row has subtle red bg tint (`dangerSurface`)
- Search/filter input at top (optional)

**Categories:**
- General: View Channels, Create Invite, Change Nickname, etc.
- Text: Send Messages, Embed Links, Attach Files, Add Reactions, etc.
- Voice: Connect, Speak, Video, Priority Speaker, etc.
- Management: Manage Channels, Manage Roles, Kick/Ban Members, etc.

### 3C. RoleEditor Component

**Visual design:**
- Two-panel layout (sidebar + content)
- Left panel (~200px): scrollable role list
  - Each role: colored dot + name
  - Selected role highlighted
  - "Create Role" button at bottom
  - Drag handles for reordering (future)
- Right panel (flex): role settings
  - Role name input
  - Role color picker (color swatch grid)
  - Permissions section (PermissionManager)
  - Delete role button (danger, at bottom)

### 3D. Mock Data (`data/roles.ts`)

```typescript
export const DEFAULT_PERMISSIONS: Permission[] = [
  // General (8)
  { id: 'view_channels', name: 'View Channels', description: 'Allows members to view text and voice channels', category: 'general' },
  { id: 'create_invite', name: 'Create Invite', description: 'Allows creating invite links', category: 'general' },
  // ... etc

  // Text (8)
  { id: 'send_messages', name: 'Send Messages', description: 'Allows sending messages in text channels', category: 'text' },
  // ... etc

  // Voice (6)
  { id: 'connect', name: 'Connect', description: 'Allows connecting to voice channels', category: 'voice' },
  // ... etc

  // Management (6, all dangerous)
  { id: 'manage_channels', name: 'Manage Channels', description: 'Create, edit, or delete channels', category: 'management', dangerous: true },
  // ... etc
];

export const MOCK_ROLES: Role[] = [
  { id: 'admin', name: 'Admin', color: '#E74C3C', position: 100 },
  { id: 'moderator', name: 'Moderator', color: '#3498DB', position: 50 },
  { id: 'developer', name: 'Developer', color: '#2ECC71', position: 30 },
  { id: 'member', name: 'Member', color: '#95A5A6', position: 0 },
];
```

### 3E. Profile Integration

Update `ProfilePopover.tsx` and `UserProfileCard` to show role badges:
- Below bio/status section
- Horizontal wrap layout
- Uses `RoleBadge` component for each role
- Roles sorted by position (highest first)

---

## EXACT IMPLEMENTATION ORDER

### Step 1: Data & Types Foundation
1. `data/communities.ts` — mock community data
2. `data/roles.ts` — mock roles and permissions
3. All Wisp core type files (8 files)

### Step 2: Wisp Core Styles
4. `CallControls.styles.ts`
5. `IncomingCall.styles.ts`
6. `CallScreen.styles.ts`
7. `CallMiniWindow.styles.ts`
8. `VoiceChannelPanel.styles.ts`
9. `RoleBadge.styles.ts`
10. `PermissionManager.styles.ts`
11. `RoleEditor.styles.ts`

### Step 3: Wisp React Native Components
12. CallControls (+ icons)
13. IncomingCall
14. CallScreen
15. CallMiniWindow
16. VoiceChannelPanel
17. RoleBadge
18. PermissionManager
19. RoleEditor
20. Update barrel exports + npm run patch

### Step 4: Umbra Hooks
21. `hooks/useCommunity.ts`
22. `hooks/useCall.ts`

### Step 5: Umbra Community Components
23. `components/community/CommunityRail.tsx`
24. `components/community/CommunitySidebar.tsx`
25. `components/community/CommunityView.tsx`
26. Update `app/index.tsx` layout

### Step 6: Umbra A/V Integration
27. `components/av/IncomingCallOverlay.tsx`
28. `components/av/ActiveCallView.tsx`
29. `components/av/VoiceBar.tsx`
30. Wire up in `app/index.tsx`

### Step 7: Umbra Roles Integration
31. `components/community/RoleDisplay.tsx`
32. `components/community/CommunitySettings.tsx`
33. Update ProfilePopover with role badges

### Step 8: Icons
34. Add all new SVG icons to `components/icons/index.tsx`

### Step 9: Testing
35. Contrast audit test
36. All component tests
37. All hook tests
38. Data tests
39. Integration test updates

### Step 10: Polish
40. npm run patch
41. Visual verification (light + dark)
42. Fix any issues
43. Final test run

---

## CONTRAST REQUIREMENTS (Critical!)

For every new component, verify these pairs:

**CallControls:**
- Button icon on button bg (both states) — ≥ 4.5:1
- End call icon on danger bg — ≥ 4.5:1
- Label text on parent bg — ≥ 3:1 (small text)

**IncomingCall:**
- Caller name on raised bg — ≥ 4.5:1
- Call type text on raised bg — ≥ 3:1
- Button icons on colored bg — ≥ 4.5:1

**CallScreen:**
- Duration text on dark overlay — ≥ 4.5:1
- Participant name on tile overlay — ≥ 4.5:1
- Status text in overlays — ≥ 4.5:1

**RoleBadge:**
- Role text on role color bg — ≥ 4.5:1 (use bestTextColor)
- Role text should be readable on both light and dark backgrounds

**PermissionManager:**
- Permission name on canvas bg — ≥ 4.5:1
- Description on canvas bg — ≥ 3:1 (small/muted)
- Toggle states clearly distinguishable
