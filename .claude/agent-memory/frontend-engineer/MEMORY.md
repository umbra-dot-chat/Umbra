# Frontend Engineer Memory

## Layout Patterns
- `ActiveCallPanel` now uses our own composition (JustifiedVideoGrid + CallControlsOverlay + VoiceAvatarCard) instead of Wisp's `WispActiveCallPanel`. The old Wisp wrapper was removed in Phase 4.
- `useWindowDimensions` from react-native is the standard way to get viewport dimensions for responsive calculations.
- Call panel maxHeight: `windowHeight * 0.55` (desktop) or `windowHeight * 0.30` (mobile via `useIsMobile()`).

## Wisp Components
- `SegmentedControl` options use `{ value: string, label: string | ReactNode }` shape. Import from `@coexist/wisp-react-native`.
- `VideoTile` accepts `stream`, `displayName`, `isMuted`, `isCameraOff`, `isSpeaking`, `mirror`, `size`, `style`.
- `CallControls` accepts `layout="compact"` for smaller control bars.

## Pre-existing Type Errors
- `ChatArea.tsx` line ~400: `getInnerViewRef` does not exist on ScrollView (pre-existing, not introduced by us).
- Many test files under `__tests__/` have pre-existing type errors (mock typing issues, missing properties). These are not caused by frontend changes.

## Key File Locations
- Call panel: `src/components/call/ActiveCallPanel.tsx` (rewritten in Phase 4)
- Video grid: `src/components/call/JustifiedVideoGrid.tsx` (with fullscreen support)
- Fullscreen hook: `src/hooks/useFullscreen.ts`
- Speaker detection: `src/hooks/useSpeakerDetection.ts`
- Call controls overlay: `src/components/call/CallControlsOverlay.tsx`
- Speaker border animation: `src/components/call/SpeakerBorder.tsx`
- Voice avatar card: `src/components/call/VoiceAvatarCard.tsx`
- Sidebar call panel: `src/components/call/SidebarCallPanel.tsx`
- Chat page (main): `app/(main)/index.tsx`
- Chat message area: `src/components/chat/ChatArea.tsx`
- 51 hooks in `src/hooks/`, 19 contexts in `src/contexts/` — always check before creating new ones.

## Call Context
- `useCall()` returns: `activeCall`, `startCall`, `toggleMute`, `toggleCamera`, `endCall`, `videoQuality`, `audioQuality`, `setVideoQuality`, `setAudioQuality`, `switchCamera`, `callStats`, `ghostMetadata`, `isScreenSharing`, `startScreenShare`, `stopScreenShare`, `screenShareStream`, `selfViewVisible`, `toggleSelfView`.
- `activeCall.participants` is a `Map<string, CallParticipant>` — convert to array via `Array.from(map.values())`.
