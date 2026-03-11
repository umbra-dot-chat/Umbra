# UX Designer Agent Memory

## Critical Patterns

### React Native Web ScrollView + overflow: hidden = BROKEN SCROLLING
Adding `overflow: 'hidden'` to a ScrollView's `style` prop on RN Web breaks vertical scrolling.
RN Web applies `overflow-y: auto` via CSS classes, but inline `overflow: hidden` overrides it.
If you need to clip content, use a wrapper View with overflow:hidden around the ScrollView, not on the ScrollView itself.
- File: `src/components/chat/ChatArea.tsx` line 474
- Discovered: 2026-03-10

### Layout Measurements (no active call)
- Chat header: 56px fixed
- Chat input: 72px fixed
- Available for content at desktop 800px: ~634px
- Available for content at tablet 1024px: ~858px
- Available for content at mobile 812px: ~638px

### ActiveCallPanel Hierarchy
`app/(main)/index.tsx` composes everything in a flex column:
ChatHeader > [ActiveCallPanel OR ActiveCallBar] > ChatArea > [PendingAttachmentBar] > ChatInput
The ActiveCallPanel and ChatArea share vertical flex space via flex ratios.

### Wisp ActiveCallPanel Internals
- Container has `position: relative`, `overflow: hidden`
- Video area uses `aspectRatio: 16/9` for video calls
- Already has its own overflow clipping -- wrapper overflow:hidden is redundant

### Pre-existing StyleSheet.create Violations
- `src/components/call/CallStatsOverlay.tsx` line 365: `styles` uses StyleSheet.create
  (debug overlay -- acceptable as dev-only, but should migrate to inline + theme tokens)

### Gradient Speed Conventions (as of Phase 4)
- GradientBorder (chat input focus): 3000ms
- GradientText (slash command highlight): 4000ms
- GradientText (sidebar empty state): 4000ms
- GradientText (settings description): 10000ms
- GradientText (welcome empty state): 10000ms
- GradientBorder (PIN input): 2000ms
- SpeakerBorder animation: 3000ms
Pattern: interactive/foreground elements use 2000-4000ms; decorative/ambient text uses 10000ms

### Wisp Design Token Reference (confirmed from wisp-core source)
- Spacing scale: 0, 2, 4, 8, 12, 16, 24, 32, 48, 64
- Radii scale: none(0), sm(4), md(8), lg(12), xl(16), full(9999)
- Avatar sizes: xs(24px), sm(32px), md(40px), lg(48px), xl(64px)

### Off-Scale Values Found in Call Components (Phase 4)
- CallControlsOverlay: borderRadius 24 (not in Wisp radii 0,4,8,12,16,9999) -- FIXED to 9999 (pill)
- VoiceAvatarCard: borderRadius 13 (inner radius math: 16-3=13, acceptable)
- VoiceAvatarCard: borderRadius 11 (mute badge circle, acceptable as width/2)
- CallStatsOverlay: padding 10, marginTop 5, marginBottom 1 (off Wisp spacing scale)
- SidebarCallPanel: paddingHorizontal 2, borderRadius 6 -- FIXED (padding 8, borderRadius 8)
- CallHistoryPanel: borderRadius 18 (circle: 36/2, acceptable)

## File Paths
- Main chat page: `app/(main)/index.tsx`
- Active call panel wrapper: `src/components/call/ActiveCallPanel.tsx`
- Chat area: `src/components/chat/ChatArea.tsx`
- Active call bar (compact): `src/components/call/ActiveCallBar.tsx`
- Wisp ActiveCallPanel: `node_modules/@coexist/wisp-react-native/src/components/active-call-panel/ActiveCallPanel.tsx`
