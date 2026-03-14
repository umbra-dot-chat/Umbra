# QA Manual Agent Memory

## Key Selectors
- `[data-testid="chat.area.message.list"]` - ChatArea ScrollView (message list)
- `[data-testid="main.container"]` - Main layout container (flex column, takes remaining width)
- `[data-testid="sidebar.conversation.item"]` - Conversation list item (click to enter chat)
- `[data-testid="sidebar.conversation.list"]` - Conversation list ScrollView
- `[data-testid="sidebar.friends.button"]` - Friends nav button in sidebar
- `[data-testid="sidebar.guide.button"]` - Guide nav button in sidebar
- `[data-testid="sidebar.marketplace.button"]` - Marketplace nav button in sidebar
- `[data-testid="sidebar.new.chat.button"]` - New chat button (+)
- `[data-testid="sidebar.search.input"]` - Search input in sidebar
- `[data-testid="nav.rail"]` - Icon navigation rail (64px wide, left edge)
- `[data-testid="nav.settings"]` - Settings gear icon (bottom of nav rail)
- `[data-testid="nav.home"]` - Home/ghost icon (top of nav rail)
- `[data-testid="input.container"]` / `[data-testid="input.text"]` - Chat input
- `[data-testid="chat.header"]` - Chat header bar
- `[data-testid="chat.call.voice"]` / `[data-testid="chat.call.video"]` - Call buttons
- `[data-testid="settings.dialog"]` - Settings dialog container
- `[data-testid="auth.screen"]` - Auth/login screen container
- `[data-testid="auth.create.button"]` / `[data-testid="auth.import.button"]` - Auth buttons
- Test IDs defined in `src/constants/test-ids.ts`

## Layout Architecture
- Main container: `flex: 1, flexDirection: 'row'` at `/Users/mattmattmattmatt/Development/Umbra/app/(main)/index.tsx` line 552
- Inside: KeyboardAvoidingView `flex: 1, flexDirection: 'column'` wraps ChatHeader + ActiveCallPanel/ActiveCallBar + ChatArea
- ActiveCallPanel renders only when `activeCall` is non-null and matches current conversation
- ActiveCallPanel: `flex: 2, overflow: hidden, zIndex: 10` (line 45 of ActiveCallPanel.tsx)
- ChatArea root is a ScrollView: `flex: 1, overflow: hidden` (line 474 of ChatArea.tsx)

## Mobile Behavior
- On mobile (375px), sidebar takes full width; chat panel has width: 0px when sidebar is visible
- Clicking a conversation item navigates to chat view (full width)
- Back button returns to conversation list
- After page reload on mobile, view returns to conversation list (not chat)

## Pre-existing Issues (not bugs from current changes)
- `ChatArea.tsx` line 400: TS2551 error on `getInnerViewRef` (pre-existing, unrelated to flex/overflow changes)
- Type errors in `__tests__/`, `app/(main)/friends.tsx`, `node_modules/`, `packages/umbra-test-bot/` are all pre-existing
- `GET relay.umbra.chat/api/sync/...` returns 404 in dev (no relay server running)

## Dev Server
- Launch config: `.claude/launch.json` -> `expo-dev` on port 8083 / `web-dev` on port 8082
- Server names: `expo-dev`, `web-dev`
- Port 8081 is often already occupied by a running Expo server; use 8082+ for new servers

## Verification Patterns
- ActiveCallPanel is conditionally rendered; cannot verify its computed styles without an active call
- Verify source code directly for components that are conditionally rendered
- On mobile, must click into conversation before inspecting chat area styles (width: 0 when hidden)
- Settings dialog uses `useIsMobile()` (breakpoint 768px from `src/hooks/useIsMobile.ts`) -- at narrow viewports it renders mobile mode with `width:100%, height:100%`
- At narrow viewports (<768px), settings dialog in mobile mode has `height: 0` on container but content overflows visually -- this is a layout issue with the Overlay+AuraBurst wrapper
- `HelpIndicator` components show "?" text intentionally (tooltip triggers) -- not a rendering bug
- Auth screen renders content twice (normal + inverted/clipped for blob animation) -- the duplicate in snapshot is expected
- To create a test account: auth.create.button -> fill create.name.input -> create.name.next -> create.seed.next -> create.backup.checkbox + create.backup.next -> pin.skip.button -> create.success.done
- Settings dialog source: `/Users/mattmattmattmatt/Development/Umbra/src/components/modals/SettingsDialog.tsx`
