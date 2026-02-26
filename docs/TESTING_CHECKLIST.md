# Umbra — Master Testing Checklist

> **Purpose:** Complete coverage of every user-facing interaction in Umbra.
> Each test case has an ID (`T<section>.<sub>.<num>`) that maps 1:1 to a future Playwright `test()` block.
>
> **Manual testing:** Open two browser tabs (Tab A / Tab B) with different identities.
> Use the production relay at `relay.umbra.chat` or `localhost:8081`.
>
> **Playwright mapping:** Each section corresponds to a spec file in `__tests__/e2e/`.
> The test ID is used as the test title for traceability.

---

## 1. Authentication & Identity
> `__tests__/e2e/identity.spec.ts`

### 1.1 Account Creation (Wallet)
- [ ] **T1.1.1** Fresh app load (no stored identity) shows auth screen with animated blob background
- [ ] **T1.1.2** "Create New Wallet" card is visible and clickable
- [ ] **T1.1.3** "Import Wallet" card is visible and clickable
- [ ] **T1.1.4** Step 1 (Display Name): input field visible with placeholder "Enter your name"
- [ ] **T1.1.5** Step 1: "Continue" button disabled until name entered
- [ ] **T1.1.6** Step 1: Display name accepts Unicode characters (emoji, CJK, accented)
- [ ] **T1.1.7** Step 1: Profile Import option — OAuth providers listed (GitHub, Discord, Twitter, Google)
- [ ] **T1.1.8** Step 1: Clicking OAuth provider triggers authorize flow, pre-fills name + avatar
- [ ] **T1.1.9** Step 1: Clear Import button removes pre-filled data
- [ ] **T1.1.10** Step 2 (Recovery Phrase): 24-word BIP-39 mnemonic displayed in SeedPhraseGrid
- [ ] **T1.1.11** Step 2: Each word shows numbered label (1–24)
- [ ] **T1.1.12** Step 2: Individual word selectable/copyable on click
- [ ] **T1.1.13** Step 2: "Copy All" button copies entire phrase to clipboard
- [ ] **T1.1.14** Step 2: "Download as Text" button exports phrase as .txt file
- [ ] **T1.1.15** Step 2: Loading spinner shown while identity is being created
- [ ] **T1.1.16** Step 2: "Continue" button proceeds after phrase displayed
- [ ] **T1.1.17** Step 3 (Confirm Backup): checkbox "I have backed up my recovery phrase"
- [ ] **T1.1.18** Step 3: "Continue" disabled until checkbox checked
- [ ] **T1.1.19** Step 3: Warning message about losing access without backup
- [ ] **T1.1.20** Step 4 (Security PIN): 6-digit PinInput with masked dots
- [ ] **T1.1.21** Step 4: "Show PIN" checkbox toggles digit visibility
- [ ] **T1.1.22** Step 4: Confirm PIN step — must match original entry
- [ ] **T1.1.23** Step 4: Mismatched PIN confirm — error message shown, input clears
- [ ] **T1.1.24** Step 4: "Set PIN" button saves PIN
- [ ] **T1.1.25** Step 4: "Skip" button bypasses PIN setup entirely
- [ ] **T1.1.26** Step 5 (Username): username input field visible
- [ ] **T1.1.27** Step 5: "Check Availability" button checks uniqueness
- [ ] **T1.1.28** Step 5: Available username — green status indicator
- [ ] **T1.1.29** Step 5: Taken username — red status indicator with error message
- [ ] **T1.1.30** Step 5: "Register Username" button registers the username
- [ ] **T1.1.31** Step 5: "Skip" button bypasses username registration
- [ ] **T1.1.32** Step 6 (Complete): success message "Wallet Created!" displayed
- [ ] **T1.1.33** Step 6: Account summary shows display name + truncated DID
- [ ] **T1.1.34** Step 6: "Remember Me" checkbox visible
- [ ] **T1.1.35** Step 6: "Get Started" navigates to main app with sidebar

### 1.2 Account Import
- [ ] **T1.2.1** "Import Wallet" card navigates to import flow
- [ ] **T1.2.2** Seed phrase import: text input area for pasting full phrase
- [ ] **T1.2.3** Word count display updates as phrase is entered
- [ ] **T1.2.4** Can enter 24-word recovery phrase
- [ ] **T1.2.5** Can enter 12-word recovery phrase
- [ ] **T1.2.6** Invalid phrase rejected with error message
- [ ] **T1.2.7** "Validate" button checks phrase validity
- [ ] **T1.2.8** Display name input appears after valid phrase
- [ ] **T1.2.9** PIN setup step works (same flow as creation)
- [ ] **T1.2.10** After import — identity restored, main screen loads
- [ ] **T1.2.11** Imported identity has same DID as original creation
- [ ] **T1.2.12** Account preview shows DID, display name, avatar before confirming
- [ ] **T1.2.13** "Confirm Import" button finalizes import
- [ ] **T1.2.14** "Back" button returns to import source selection

### 1.3 PIN Lock
- [ ] **T1.3.1** Enable PIN: Settings > Privacy > Security > PIN Lock toggle — setup dialog appears
- [ ] **T1.3.2** Setup dialog Stage 1: enter 6-digit PIN (masked dots)
- [ ] **T1.3.3** Setup dialog Stage 2: confirm PIN (masked dots)
- [ ] **T1.3.4** Matching confirm — PIN saved, toggle shows ON
- [ ] **T1.3.5** Mismatched confirm — error message, input clears
- [ ] **T1.3.6** Cancel button on setup dialog — toggle reverts to OFF
- [ ] **T1.3.7** Refresh page — PIN lock screen appears before main app
- [ ] **T1.3.8** Lock screen shows "App Lock" message with PIN input
- [ ] **T1.3.9** Enter correct PIN — app unlocks
- [ ] **T1.3.10** Enter wrong PIN — error message, input clears
- [ ] **T1.3.11** Disable PIN: toggle off — "Enter current PIN" removal dialog appears
- [ ] **T1.3.12** Enter correct PIN to remove — toggle shows OFF
- [ ] **T1.3.13** Wrong PIN on disable — error, toggle stays ON
- [ ] **T1.3.14** Cancel button on removal dialog — toggle stays ON

### 1.4 Multi-Account
- [ ] **T1.4.1** Avatar press in nav rail opens Account Switcher
- [ ] **T1.4.2** Current account highlighted with active indicator
- [ ] **T1.4.3** "Add Account" triggers logout + redirect to auth screen
- [ ] **T1.4.4** Create second account — both appear in switcher
- [ ] **T1.4.5** Switch between accounts — loading screen shows "Switching account"
- [ ] **T1.4.6** After switch — identity, friends, conversations belong to new account
- [ ] **T1.4.7** Remove account from switcher — removed from list
- [ ] **T1.4.8** Switching back to original account restores its data
- [ ] **T1.4.9** Separate databases per account — data isolated

### 1.5 Loading / Splash Screen
- [ ] **T1.5.1** Refresh with existing identity — splash screen with progress steps
- [ ] **T1.5.2** Steps: "Initializing core" → "Loading database" → "Restoring identity" → "Loading preferences" → "Ready"
- [ ] **T1.5.3** After loading completes — main screen with data intact
- [ ] **T1.5.4** Loading screen dismisses automatically on completion

### 1.6 Logout
- [ ] **T1.6.1** Settings > Account > Danger Zone > "Log Out" button (red) — confirmation dialog
- [ ] **T1.6.2** Confirm logout — redirects to auth screen
- [ ] **T1.6.3** Cancel logout — stays in settings

### 1.7 Discovery Opt-In
- [ ] **T1.7.1** Discovery opt-in dialog appears during account creation (optional step)
- [ ] **T1.7.2** Toggle: Enable/Disable friend discovery
- [ ] **T1.7.3** Linked accounts display section
- [ ] **T1.7.4** "Continue" button proceeds to next step

---

## 2. Navigation & Layout
> `__tests__/e2e/navigation.spec.ts`

### 2.1 Navigation Rail (Left)
- [ ] **T2.1.1** Nav rail visible on left edge with icon buttons
- [ ] **T2.1.2** Home icon navigates to conversations view
- [ ] **T2.1.3** Files icon navigates to file transfers page
- [ ] **T2.1.4** Community icons appear for each joined community
- [ ] **T2.1.5** "+" button to create/join community
- [ ] **T2.1.6** Settings gear icon at bottom
- [ ] **T2.1.7** User avatar at bottom opens account switcher
- [ ] **T2.1.8** Notification bell icon — shows badge count
- [ ] **T2.1.9** Active item has visual highlight/indicator
- [ ] **T2.1.10** Home badge shows combined friend requests + unread messages count
- [ ] **T2.1.11** Upload ring progress indicator visible during file uploads
- [ ] **T2.1.12** Community icons show unread indicator when channels have unread messages

### 2.2 Sidebar (Conversations)
- [ ] **T2.2.1** Sidebar appears to right of nav rail with dark surface
- [ ] **T2.2.2** Search input at top with magnifying glass icon
- [ ] **T2.2.3** "Friends" button with users icon
- [ ] **T2.2.4** Guide button (book icon)
- [ ] **T2.2.5** "+" button for new chat/group
- [ ] **T2.2.6** Conversations list shows avatar, name, last message preview, time
- [ ] **T2.2.7** Unread count badge on conversations with unread messages
- [ ] **T2.2.8** Clicking conversation highlights it and loads chat
- [ ] **T2.2.9** Pinned conversations appear at top
- [ ] **T2.2.10** Group chats show stacked avatar circles + "Group" label

### 2.3 Sidebar Search
- [ ] **T2.3.1** Typing filters conversations by name
- [ ] **T2.3.2** Filtering by last message preview text works
- [ ] **T2.3.3** Filtering by friend name in conversation works
- [ ] **T2.3.4** Clear search — all conversations visible again
- [ ] **T2.3.5** No results — empty state shown

### 2.4 New Chat Menu (+ button)
- [ ] **T2.4.1** Click "+" — dropdown shows "New Group" and "New DM"
- [ ] **T2.4.2** "New DM" — friend picker dialog opens
- [ ] **T2.4.3** "New Group" — create group dialog opens
- [ ] **T2.4.4** Click outside dropdown — dismisses it

### 2.5 New DM Dialog
- [ ] **T2.5.1** Friend picker shows all friends
- [ ] **T2.5.2** Search filter within friend list works
- [ ] **T2.5.3** Friends with existing DM show "Already chatting" indicator
- [ ] **T2.5.4** Selecting friend with existing DM navigates to that conversation
- [ ] **T2.5.5** Selecting friend without DM creates new conversation + navigates

### 2.6 Sidebar Resize (Desktop)
- [ ] **T2.6.1** Drag resize handle between sidebar and content
- [ ] **T2.6.2** Sidebar has minimum width (220px)
- [ ] **T2.6.3** Sidebar has maximum width (500px)
- [ ] **T2.6.4** Resize persists during session

### 2.7 Mobile Layout
- [ ] **T2.7.1** On narrow viewport — sidebar fills screen, no content visible
- [ ] **T2.7.2** Selecting a conversation slides content into view
- [ ] **T2.7.3** Swipe right from left edge reveals sidebar
- [ ] **T2.7.4** Swipe left hides sidebar, shows content
- [ ] **T2.7.5** Fast flick follows swipe direction
- [ ] **T2.7.6** Slow drag snaps to nearest position

### 2.8 Group Invites Section
- [ ] **T2.8.1** Pending group invites — "Group Invites" section appears above conversations
- [ ] **T2.8.2** Each invite shows group name + inviter name
- [ ] **T2.8.3** Accept button — joins group, conversation appears
- [ ] **T2.8.4** Decline button — removes invite from list
- [ ] **T2.8.5** Section collapses when all invites handled

---

## 3. Friends
> `__tests__/e2e/friends.spec.ts`

### 3.1 Friends Page Navigation
- [ ] **T3.1.1** Click "Friends" in sidebar — friends page loads
- [ ] **T3.1.2** Header shows "Friends" title with users icon
- [ ] **T3.1.3** Four tabs: All, Online, Pending, Blocked

### 3.2 All Friends Tab
- [ ] **T3.2.1** Profile card at top with your DID info
- [ ] **T3.2.2** "Add Friend" input with DID placeholder
- [ ] **T3.2.3** Friends grouped into "Online" and "Offline" sections
- [ ] **T3.2.4** Each friend: avatar, name, truncated DID, status dot
- [ ] **T3.2.5** "Message" action button on each friend
- [ ] **T3.2.6** "More" action button on each friend (block, remove)
- [ ] **T3.2.7** Offline section collapsed by default
- [ ] **T3.2.8** Click "Message" — navigates to DM conversation

### 3.3 Online Tab
- [ ] **T3.3.1** Only shows friends currently online
- [ ] **T3.3.2** Empty state: "No friends online right now."
- [ ] **T3.3.3** Online status updates in real-time when friend connects/disconnects

### 3.4 Pending Tab
- [ ] **T3.4.1** "Add Friend" input available
- [ ] **T3.4.2** "Incoming" section shows requests from others
- [ ] **T3.4.3** Each incoming request has Accept / Decline buttons
- [ ] **T3.4.4** Relative timestamps: "Just now", "5 minutes ago", etc.
- [ ] **T3.4.5** "Outgoing" section shows requests you've sent
- [ ] **T3.4.6** Each outgoing request has Cancel button
- [ ] **T3.4.7** Tab shows count badge: "Pending (2)"

### 3.5 Blocked Tab
- [ ] **T3.5.1** Shows list of blocked users (or empty state)
- [ ] **T3.5.2** Unblock button on each blocked user
- [ ] **T3.5.3** Unblock — user removed from blocked list
- [ ] **T3.5.4** Blocking reason displayed if provided

### 3.6 Friend Request Flow (Two-User)
- [ ] **T3.6.1** Tab A: Copy DID from Settings > Account
- [ ] **T3.6.2** Tab B: Paste DID into Add Friend input > "Send Request"
- [ ] **T3.6.3** Tab B: Success feedback "Friend request sent!"
- [ ] **T3.6.4** Tab A: Pending tab shows incoming request from Tab B
- [ ] **T3.6.5** Tab A: Accept — friend appears in All tab
- [ ] **T3.6.6** Tab B: Friend also appears in All tab (relay sync)
- [ ] **T3.6.7** Both tabs: DM conversation auto-created in sidebar
- [ ] **T3.6.8** Tab A: Decline — request removed, no friendship created
- [ ] **T3.6.9** Duplicate request to same DID — appropriate error
- [ ] **T3.6.10** Accept acknowledgment sent via relay to requester

### 3.7 Friend Validation
- [ ] **T3.7.1** Invalid DID — error "Please enter a valid DID"
- [ ] **T3.7.2** Friend request to self — appropriate error
- [ ] **T3.7.3** Request to already-friended DID — appropriate error
- [ ] **T3.7.4** Request to blocked DID — appropriate error

### 3.8 Friend Actions
- [ ] **T3.8.1** Remove friend — confirmation dialog, friend removed from list
- [ ] **T3.8.2** Block friend — confirmation dialog, moved to Blocked tab
- [ ] **T3.8.3** Block with reason — reason stored and displayed
- [ ] **T3.8.4** Unblock — user returned to normal state

### 3.9 Discovery
- [ ] **T3.9.1** Username search — find friends by registered username
- [ ] **T3.9.2** Platform linking: Discord account link via OAuth
- [ ] **T3.9.3** Platform linking: GitHub account link via OAuth
- [ ] **T3.9.4** Platform linking: Steam account link
- [ ] **T3.9.5** Platform linking: Bluesky account link
- [ ] **T3.9.6** Platform linking: Xbox account link
- [ ] **T3.9.7** Unlink account — removes platform association
- [ ] **T3.9.8** Linked account verification status badge
- [ ] **T3.9.9** QR code display for DID sharing
- [ ] **T3.9.10** QR code scan to add friend (mobile)
- [ ] **T3.9.11** Friend suggestions based on linked accounts
- [ ] **T3.9.12** Batch lookup by usernames

---

## 4. Direct Messaging
> `__tests__/e2e/messaging.spec.ts`

### 4.1 Chat Header
- [ ] **T4.1.1** Shows recipient name + online status dot
- [ ] **T4.1.2** Panel toggle buttons: Members, Search, Pins
- [ ] **T4.1.3** Voice call button visible
- [ ] **T4.1.4** Video call button visible
- [ ] **T4.1.5** Shared files button visible

### 4.2 Sending Messages
- [ ] **T4.2.1** Type message in input — text appears
- [ ] **T4.2.2** Press Enter — message appears in chat as outgoing bubble
- [ ] **T4.2.3** Outgoing bubble: accent color, right-aligned (bubble mode)
- [ ] **T4.2.4** Timestamp appears below message
- [ ] **T4.2.5** Input clears after send
- [ ] **T4.2.6** Placeholder text: "Type a message..."
- [ ] **T4.2.7** Shift+Enter creates new line (does not send)
- [ ] **T4.2.8** Send button click sends message

### 4.3 Receiving Messages (Two-User)
- [ ] **T4.3.1** Tab A sends message — Tab B receives in real-time
- [ ] **T4.3.2** Incoming bubble: light gray, left-aligned (bubble mode)
- [ ] **T4.3.3** Sender name shown above incoming message group
- [ ] **T4.3.4** Timestamp visible on incoming messages
- [ ] **T4.3.5** Tab B incoming message notification if conversation not active

### 4.4 Message Display Modes
- [ ] **T4.4.1** Bubble mode: colored bubbles, your messages right-aligned, others left-aligned
- [ ] **T4.4.2** Inline mode: Slack/Discord style, all left-aligned, sender name + timestamp headers
- [ ] **T4.4.3** Settings > Messaging > Display Style switch between Bubble and Inline
- [ ] **T4.4.4** Mode change applies immediately to all conversations
- [ ] **T4.4.5** Live preview shown in settings for each mode

### 4.5 Message Input Features
- [ ] **T4.5.1** Emoji button opens combined emoji/GIF picker
- [ ] **T4.5.2** Attachment/file button visible — opens file picker
- [ ] **T4.5.3** Send button centered in circle shape
- [ ] **T4.5.4** Mention highlighting renders inline as you type

### 4.6 Emoji / GIF Picker (CombinedPicker)
- [ ] **T4.6.1** Click emoji button — picker appears above input
- [ ] **T4.6.2** Picker has rounded corners and themed background
- [ ] **T4.6.3** Two tabs: Emoji and GIF
- [ ] **T4.6.4** **Emoji tab**: Search input filters emoji
- [ ] **T4.6.5** **Emoji tab**: Category tabs — Recent, Smileys, People, Nature, Food, Activities, Travel, Objects, Symbols, Flags
- [ ] **T4.6.6** **Emoji tab**: Tab icons are Lucide SVG icons
- [ ] **T4.6.7** **Emoji tab**: Click emoji — inserted into message input
- [ ] **T4.6.8** **Emoji tab**: Category tabs switch emoji grid content
- [ ] **T4.6.9** **Emoji tab**: Community custom emoji appear if in community context
- [ ] **T4.6.10** **Emoji tab**: Recent emoji section shows recently used
- [ ] **T4.6.11** **GIF tab**: Search input for GIF search
- [ ] **T4.6.12** **GIF tab**: Trending GIFs displayed by default
- [ ] **T4.6.13** **GIF tab**: GIF grid shows results
- [ ] **T4.6.14** **GIF tab**: Click GIF — sends as message
- [ ] **T4.6.15** **GIF tab**: GIF categories for browsing
- [ ] **T4.6.16** Picker closes after selection (configurable)

### 4.7 Sticker Picker
- [ ] **T4.7.1** Sticker picker accessible from input toolbar
- [ ] **T4.7.2** Community sticker packs listed
- [ ] **T4.7.3** Per-pack sticker grid display
- [ ] **T4.7.4** Click sticker — sends as message
- [ ] **T4.7.5** Sticker shows preview before sending

### 4.8 @Mentions
- [ ] **T4.8.1** Type "@" — mention autocomplete dropdown appears
- [ ] **T4.8.2** Dropdown shows matching friends/members with avatar + name
- [ ] **T4.8.3** Online status indicator in dropdown items
- [ ] **T4.8.4** Arrow keys (Up/Down) navigate dropdown
- [ ] **T4.8.5** Enter selects mention, inserts into text
- [ ] **T4.8.6** Escape closes dropdown
- [ ] **T4.8.7** Mentions highlighted in input + sent message
- [ ] **T4.8.8** Continued typing filters dropdown results

### 4.9 Message Hover Actions
- [ ] **T4.9.1** Hover over message — action bar appears
- [ ] **T4.9.2** Actions: React, Reply, Thread, More
- [ ] **T4.9.3** Click React — emoji picker for reactions
- [ ] **T4.9.4** Click Reply — reply context in input area
- [ ] **T4.9.5** Click Thread — thread panel opens
- [ ] **T4.9.6** Custom action slots from plugins appear (message-actions slot)

### 4.10 Context Menu (Right-Click)
- [ ] **T4.10.1** Right-click message — context menu appears
- [ ] **T4.10.2** Menu items: Reply, Thread, Copy Text, Edit (own), Forward, Pin, Delete (own)
- [ ] **T4.10.3** Click outside — dismisses menu
- [ ] **T4.10.4** Edit option only visible on own messages
- [ ] **T4.10.5** Delete option only visible on own messages (danger red styling)
- [ ] **T4.10.6** Separator line before Delete option

### 4.11 Edit Message
- [ ] **T4.11.1** Right-click own message > Edit
- [ ] **T4.11.2** Input switches to edit mode with existing text
- [ ] **T4.11.3** Placeholder: "Edit message..."
- [ ] **T4.11.4** Attachment button hidden during edit
- [ ] **T4.11.5** Cancel edit button — reverts to normal input
- [ ] **T4.11.6** Save edit button — message updated with "(edited)" badge
- [ ] **T4.11.7** Other user sees updated text + "(edited)" badge in real-time

### 4.12 Delete Message
- [ ] **T4.12.1** Right-click own message > Delete
- [ ] **T4.12.2** Message replaced with "[Message deleted]"
- [ ] **T4.12.3** Other user sees "[Message deleted]"

### 4.13 Reply
- [ ] **T4.13.1** Click Reply — reply preview in input area (sender + text)
- [ ] **T4.13.2** "X" button clears reply context
- [ ] **T4.13.3** Cancel Reply button also clears
- [ ] **T4.13.4** Send — quoted reply context above bubble
- [ ] **T4.13.5** Long quoted text truncated

### 4.14 Forward
- [ ] **T4.14.1** Right-click > Forward — conversation picker dialog
- [ ] **T4.14.2** Select conversation — message forwarded
- [ ] **T4.14.3** Forwarded message shows "Forwarded from [name]" label + original content

### 4.15 Pin Message
- [ ] **T4.15.1** Right-click > Pin — message pinned
- [ ] **T4.15.2** Pin icon/indicator on pinned message
- [ ] **T4.15.3** Message appears in Pins panel
- [ ] **T4.15.4** Unpin from Pins panel — removes pin

### 4.16 Reactions
- [ ] **T4.16.1** Click React on hover — emoji picker for reaction
- [ ] **T4.16.2** Select emoji — reaction chip below message
- [ ] **T4.16.3** Chip shows emoji + count
- [ ] **T4.16.4** Click own reaction — toggles off
- [ ] **T4.16.5** Multiple users react — count increases
- [ ] **T4.16.6** Other user sees reactions in real-time
- [ ] **T4.16.7** View who reacted — reactor list visible
- [ ] **T4.16.8** Multiple different emoji on same message — all displayed

### 4.17 Threads
- [ ] **T4.17.1** Click Thread — right panel opens with thread view
- [ ] **T4.17.2** Original message shown at top
- [ ] **T4.17.3** Can compose + send thread replies
- [ ] **T4.17.4** Thread replies visible to other user
- [ ] **T4.17.5** Thread reply count indicator on parent message
- [ ] **T4.17.6** Reply-to within thread supported

### 4.18 Text Effects
- [ ] **T4.18.1** Send message with slam effect — animation plays
- [ ] **T4.18.2** Gentle text effect
- [ ] **T4.18.3** Loud text effect
- [ ] **T4.18.4** Invisible ink effect (reveal on tap/hover)
- [ ] **T4.18.5** Confetti effect
- [ ] **T4.18.6** Balloons effect
- [ ] **T4.18.7** Shake effect
- [ ] **T4.18.8** Fade in effect

### 4.19 Message Types
- [ ] **T4.19.1** Text message renders with content
- [ ] **T4.19.2** File message renders with icon, name, size, download link
- [ ] **T4.19.3** System message renders with centered text and timestamp
- [ ] **T4.19.4** Forwarded message shows original sender attribution
- [ ] **T4.19.5** Deleted message shows "[Message deleted]" placeholder
- [ ] **T4.19.6** Edited message shows content + "(edited)" label
- [ ] **T4.19.7** Thread message shows thread reply indicator + original reference

### 4.20 Message Grouping & Display
- [ ] **T4.20.1** Consecutive messages from same sender grouped
- [ ] **T4.20.2** Only first message in group shows sender name
- [ ] **T4.20.3** Date divider "Today" / "Yesterday" between day boundaries
- [ ] **T4.20.4** Very long message (10,000+ chars) renders correctly

### 4.21 Typing Indicators
- [ ] **T4.21.1** Tab A types — Tab B sees "Alice is typing..."
- [ ] **T4.21.2** Stop typing — indicator disappears (~4s timeout)
- [ ] **T4.21.3** In groups: "Alice is typing..." or "Alice and Bob are typing..."

### 4.22 Delivery Receipts
- [ ] **T4.22.1** Send message — clock icon (sending)
- [ ] **T4.22.2** Relay confirms — single checkmark (sent)
- [ ] **T4.22.3** Recipient receives — double checkmark (delivered)
- [ ] **T4.22.4** Recipient reads — blue double checkmark (read)
- [ ] **T4.22.5** Read receipts respect privacy toggle (disabled = no blue checks)

### 4.23 Empty State
- [ ] **T4.23.1** No conversation selected — welcome/empty state shown
- [ ] **T4.23.2** Helpful text explaining how to start chatting

---

## 5. Group Chat
> `__tests__/e2e/groups.spec.ts`

### 5.1 Create Group
- [ ] **T5.1.1** Click "+" > "New Group" — dialog opens
- [ ] **T5.1.2** Enter group name (required)
- [ ] **T5.1.3** Enter optional description
- [ ] **T5.1.4** Select friends as initial members (checkboxes)
- [ ] **T5.1.5** Minimum 1 friend selected
- [ ] **T5.1.6** Maximum 255 friends
- [ ] **T5.1.7** Validation error if limits violated
- [ ] **T5.1.8** Submit — group created, "Invitations sent!" feedback
- [ ] **T5.1.9** Group appears in sidebar with group label + stacked avatars

### 5.2 Group Invitations (Two-User)
- [ ] **T5.2.1** Invited user sees pending invite in sidebar
- [ ] **T5.2.2** Invite shows group name + inviter name
- [ ] **T5.2.3** Accept — joins group, conversation appears
- [ ] **T5.2.4** Decline — invite removed
- [ ] **T5.2.5** Declined invite does not create conversation
- [ ] **T5.2.6** Accept acknowledgment envelope sent via relay

### 5.3 Group Messaging
- [ ] **T5.3.1** Send message in group — all members receive
- [ ] **T5.3.2** Sender name shown above messages
- [ ] **T5.3.3** Consecutive messages from same sender grouped
- [ ] **T5.3.4** All message actions work (edit, delete, react, reply, pin, forward)
- [ ] **T5.3.5** Messages encrypted with group key

### 5.4 Group Header
- [ ] **T5.4.1** Shows group name + member count
- [ ] **T5.4.2** Click header — group settings/info

### 5.5 Group Member Management
- [ ] **T5.5.1** Admin can view member list
- [ ] **T5.5.2** Admin can remove members
- [ ] **T5.5.3** Removed member can't see new messages
- [ ] **T5.5.4** Admin can invite new members
- [ ] **T5.5.5** Member leave — leaves group

### 5.6 Group Encryption
- [ ] **T5.6.1** Group key generated on creation
- [ ] **T5.6.2** Key encrypted per-member (DH exchange)
- [ ] **T5.6.3** New member receives encrypted key on join
- [ ] **T5.6.4** Key rotation on member removal
- [ ] **T5.6.5** Messages encrypted/decrypted transparently
- [ ] **T5.6.6** Key import for rejoining members

---

## 6. Communities
> `__tests__/e2e/communities.spec.ts`

### 6.1 Create Community
- [ ] **T6.1.1** Nav rail "+" > opens Community Create Options Dialog
- [ ] **T6.1.2** Option: "Create from Scratch" — opens create dialog
- [ ] **T6.1.3** Option: "Import from Discord" — opens import dialog
- [ ] **T6.1.4** Option: "Join via Invite" — opens join dialog
- [ ] **T6.1.5** Create dialog: name input (required) + description textarea
- [ ] **T6.1.6** Submit — community created, navigates to community view
- [ ] **T6.1.7** Community icon appears in nav rail
- [ ] **T6.1.8** Error state — error message displayed in dialog
- [ ] **T6.1.9** "Creating..." loading state on submit button

### 6.2 Join Community
- [ ] **T6.2.1** Join dialog: input accepts invite code, full URL (https://umbra.chat/invite/CODE), or deep link (umbra://invite/CODE)
- [ ] **T6.2.2** "Join" button triggers acceptInvite flow
- [ ] **T6.2.3** Auto-join when initialCode prop is provided
- [ ] **T6.2.4** Loading state while joining
- [ ] **T6.2.5** Error state with message on failure
- [ ] **T6.2.6** Success — navigates to community
- [ ] **T6.2.7** Invalid invite code — error message
- [ ] **T6.2.8** Expired invite — appropriate error
- [ ] **T6.2.9** Used-up invite (max uses reached) — appropriate error

### 6.3 Community Navigation
- [ ] **T6.3.1** Click community icon in nav rail — community sidebar loads
- [ ] **T6.3.2** Community header shows name, member count, icon
- [ ] **T6.3.3** Channel list organized by spaces → categories → channels
- [ ] **T6.3.4** Channel icons: # text, 🔊 voice, 📢 announcement, 📁 files
- [ ] **T6.3.5** Click channel — content area loads channel messages
- [ ] **T6.3.6** Active channel highlighted in sidebar
- [ ] **T6.3.7** Voice channel shows connected users beneath it (VoiceChannelUsers)
- [ ] **T6.3.8** Speaking indicators: green ring + audio wave icon on active speakers

### 6.4 Community Header Context Menu
- [ ] **T6.4.1** Long-press/right-click community header — dropdown menu appears
- [ ] **T6.4.2** "Copy Community URL" — copies invite link to clipboard
- [ ] **T6.4.3** "Share QR Code" — opens QRCardDialog
- [ ] **T6.4.4** "Settings" — opens CommunitySettingsDialog
- [ ] **T6.4.5** "Leave Community" — opens confirmation dialog
- [ ] **T6.4.6** "Delete Community" (owner only) — opens confirmation dialog

### 6.5 QR Code Dialog
- [ ] **T6.5.1** Show/Hide QR Code toggle
- [ ] **T6.5.2** QR code displays invite URL
- [ ] **T6.5.3** "Copy QR URL" — copies invite link to clipboard
- [ ] **T6.5.4** "Save QR as Image" — exports QR code image
- [ ] **T6.5.5** QR uses community accent color

### 6.6 Spaces
- [ ] **T6.6.1** Spaces displayed as tabs above channel list
- [ ] **T6.6.2** Click space tab — switches displayed categories/channels
- [ ] **T6.6.3** **Space context menu** (long-press/right-click):
- [ ] **T6.6.4** → "Create Channel" — opens ChannelCreateDialog
- [ ] **T6.6.5** → "Create Category" — opens InputDialog for category name
- [ ] **T6.6.6** → "Edit Space" — opens InputDialog to rename
- [ ] **T6.6.7** → "Delete Space" (danger) — opens ConfirmDialog
- [ ] **T6.6.8** Space list reordering

### 6.7 Categories
- [ ] **T6.7.1** Categories shown as collapsible section headers in sidebar
- [ ] **T6.7.2** Click category header — toggle collapse/expand
- [ ] **T6.7.3** Channels nested under their category
- [ ] **T6.7.4** **Category context menu** (long-press/right-click):
- [ ] **T6.7.5** → "Create Channel" — opens ChannelCreateDialog with pre-selected category
- [ ] **T6.7.6** → "Create Category" — opens InputDialog for new category name
- [ ] **T6.7.7** → "Edit Category" — opens InputDialog to rename
- [ ] **T6.7.8** → "Move Up" (hidden if first) — reorders category position
- [ ] **T6.7.9** → "Move Down" (hidden if last) — reorders category position
- [ ] **T6.7.10** → "Delete Category" (danger) — opens ConfirmDialog

### 6.8 Channels
- [ ] **T6.8.1** Click channel — navigates to channel content
- [ ] **T6.8.2** **Channel context menu** (long-press/right-click):
- [ ] **T6.8.3** → "Move to Category" — opens MoveToCategoryDialog
- [ ] **T6.8.4** → "Edit Channel" — opens ChannelCreateDialog in edit mode
- [ ] **T6.8.5** → "Delete Channel" (danger) — opens ConfirmDialog

### 6.9 Create/Edit Channel Dialog
- [ ] **T6.9.1** Channel name input (max 100 chars, non-empty validation)
- [ ] **T6.9.2** Channel type picker (radio/card select):
- [ ] **T6.9.3** → Text Channel (speech bubbles icon): "Send messages, images, and files"
- [ ] **T6.9.4** → Voice Channel (microphone icon): "Talk with voice and video"
- [ ] **T6.9.5** → Announcement Channel (bell icon): "Important updates (only admins can post)"
- [ ] **T6.9.6** → Forum Channel (chat bubbles icon): "Organized discussions with threads"
- [ ] **T6.9.7** → Files Channel (folder icon): "Shared file storage with folders"
- [ ] **T6.9.8** Cancel button — closes dialog
- [ ] **T6.9.9** Create/Save button — submits with "Creating..."/"Saving..." state
- [ ] **T6.9.10** Edit mode: pre-fills existing channel name and type

### 6.10 Move to Category Dialog
- [ ] **T6.10.1** Lists all categories in current space
- [ ] **T6.10.2** Current category shows "Current" badge and is disabled
- [ ] **T6.10.3** "Uncategorized" option at bottom with separator (italic, muted)
- [ ] **T6.10.4** Click category — moves channel, dialog auto-closes

### 6.11 Channel Header (Community)
- [ ] **T6.11.1** Channel type icon + channel name
- [ ] **T6.11.2** Topic/description text (clickable)
- [ ] **T6.11.3** E2EE lock icon when encryption enabled
- [ ] **T6.11.4** Desktop: Search, Pins, Members panel toggle buttons
- [ ] **T6.11.5** Mobile: Members panel toggle button only
- [ ] **T6.11.6** Channel settings gear icon button
- [ ] **T6.11.7** Mobile: Back button (left arrow) to return to channel list
- [ ] **T6.11.8** Active panel buttons show highlight state

### 6.12 Community Text Channels
- [ ] **T6.12.1** Send message in text channel — appears for all members
- [ ] **T6.12.2** All message actions work (edit, delete, react, reply, pin, forward, thread)
- [ ] **T6.12.3** Reactions display with emoji + count
- [ ] **T6.12.4** Pinned messages accessible via Pins panel
- [ ] **T6.12.5** Message threading/replies work
- [ ] **T6.12.6** System messages displayed (joins, role changes, moderation actions)
- [ ] **T6.12.7** Typing indicators show for channel members
- [ ] **T6.12.8** Read receipts per-channel (mark as read)
- [ ] **T6.12.9** Slow mode enforcement when configured

### 6.13 Community Announcement Channels
- [ ] **T6.13.1** Only admins/authorized roles can post
- [ ] **T6.13.2** Regular members can read but not send
- [ ] **T6.13.3** Members can react to announcements
- [ ] **T6.13.4** Bell icon indicates announcement type

### 6.14 Voice Channels
- [ ] **T6.14.1** Click voice channel — shows lobby with connected participants
- [ ] **T6.14.2** Lobby: see who is connected before joining
- [ ] **T6.14.3** "Join Voice Channel" button — connects to voice
- [ ] **T6.14.4** "Connecting..." state while joining (button disabled)
- [ ] **T6.14.5** **Voice Channel Bar** (bottom of sidebar when connected):
- [ ] **T6.14.6** → "Voice Connected" / "Connecting..." status with radio icon
- [ ] **T6.14.7** → Channel name display
- [ ] **T6.14.8** → "Leave Voice Channel" button (PhoneOff icon)
- [ ] **T6.14.9** **Voice Call Panel** (content area when in voice):
- [ ] **T6.14.10** → Participant list: avatar, name, speaking indicator
- [ ] **T6.14.11** → Self marked as "You"
- [ ] **T6.14.12** → Speaking indicator: green ring + audio wave icon
- [ ] **T6.14.13** → Sort: self first, speakers active, then alphabetical
- [ ] **T6.14.14** → Toggle Mute button (mic icon state changes)
- [ ] **T6.14.15** → Toggle Deafen button (speaker icon state changes)
- [ ] **T6.14.16** → End Call / Leave button
- [ ] **T6.14.17** Multiple users in same voice channel — all visible

### 6.15 File Channels
- [ ] **T6.15.1** Navigate to file channel — empty state or file listing
- [ ] **T6.15.2** **Upload**: "Upload File" button — opens file picker
- [ ] **T6.15.3** File type validation (extension + MIME)
- [ ] **T6.15.4** Upload progress indicator
- [ ] **T6.15.5** Error message on upload failure
- [ ] **T6.15.6** File appears in listing after successful upload
- [ ] **T6.15.7** **File metadata display**: name, size, MIME type, uploader (truncated DID), upload date
- [ ] **T6.15.8** **Folder navigation**:
- [ ] **T6.15.9** → Breadcrumb path navigation (click any segment)
- [ ] **T6.15.10** → Back button to parent folder
- [ ] **T6.15.11** → "Create Folder" button — InputDialog for folder name
- [ ] **T6.15.12** **Sort options**: Sort by Name / Size / Date / Type, Ascending / Descending
- [ ] **T6.15.13** **View modes**: Grid view / List view toggle
- [ ] **T6.15.14** **Search input**: filter files by name
- [ ] **T6.15.15** **File context menu**:
- [ ] **T6.15.16** → Download — triggers download
- [ ] **T6.15.17** → Rename — opens InputDialog
- [ ] **T6.15.18** → Move — opens folder picker dialog
- [ ] **T6.15.19** → Delete — opens ConfirmDialog
- [ ] **T6.15.20** **File detail panel**:
- [ ] **T6.15.21** → File name, size, MIME type
- [ ] **T6.15.22** → Uploaded by (DID truncated)
- [ ] **T6.15.23** → Upload date (ISO format)
- [ ] **T6.15.24** → Download count
- [ ] **T6.15.25** → Encryption status badge
- [ ] **T6.15.26** → Encryption key version
- [ ] **T6.15.27** → "Needs Re-encryption" flag (after key rotation)
- [ ] **T6.15.28** → File version number
- [ ] **T6.15.29** **Folder context menu**: Rename, Delete (recursive), Navigate into
- [ ] **T6.15.30** **Permission gating**: Upload button hidden if !canUploadFiles
- [ ] **T6.15.31** **Permission gating**: Rename/Move/Delete hidden if !canManageFiles

### 6.16 Community Members
- [ ] **T6.16.1** Members panel shows all community members
- [ ] **T6.16.2** Members grouped by highest hoisted role
- [ ] **T6.16.3** Non-hoisted members in "Members" catch-all section
- [ ] **T6.16.4** Role sections sorted by position (highest authority first)
- [ ] **T6.16.5** Each section shows role name + member count
- [ ] **T6.16.6** Member item: avatar, display name (nickname or DID), top role color
- [ ] **T6.16.7** Online/offline status indicators
- [ ] **T6.16.8** Click member — profile popover appears

### 6.17 Member Context Menu
- [ ] **T6.17.1** Long-press/right-click member — context menu opens
- [ ] **T6.17.2** Member name shown in header
- [ ] **T6.17.3** **"ROLES" section** (uppercase, muted label):
- [ ] **T6.17.4** → Custom checkbox per role (non-hoisted roles)
- [ ] **T6.17.5** → Role color dot + role name
- [ ] **T6.17.6** → Toggle state: assign/unassign role to member
- [ ] **T6.17.7** → Menu stays open while toggling roles
- [ ] **T6.17.8** **Moderation actions** (after separator):
- [ ] **T6.17.9** → "Kick Member" button (danger styling)
- [ ] **T6.17.10** → "Ban Member" button (danger styling)

### 6.18 Community Invites
- [ ] **T6.18.1** Settings > Invites tab — InviteManager panel
- [ ] **T6.18.2** **Invite list** displays per invite: code, created by (DID), created at, expires at, max uses, current uses, vanity flag
- [ ] **T6.18.3** "Create Invite" button — options for max uses (unlimited default) + expiry time (never default)
- [ ] **T6.18.4** "Invite creating..." loading state
- [ ] **T6.18.5** "Copy Invite Link" — copies https://umbra.chat/invite/CODE to clipboard
- [ ] **T6.18.6** "Delete/Revoke Invite" — removes invite
- [ ] **T6.18.7** **QR Code**: toggle show/hide for most recent non-vanity invite
- [ ] **T6.18.8** QR displays invite URL, medium size, rounded styling
- [ ] **T6.18.9** **Vanity URL**: display current slug
- [ ] **T6.18.10** Vanity URL edit: input field with validation (alphanumeric + hyphens)
- [ ] **T6.18.11** Vanity URL uniqueness check

### 6.19 Community Roles & Permissions
- [ ] **T6.19.1** Settings > Roles tab — RoleManagementPanel
- [ ] **T6.19.2** Role list in left column — click to select
- [ ] **T6.19.3** "Create New Role" button
- [ ] **T6.19.4** **Role editor** (right column):
- [ ] **T6.19.5** → Edit role name (text input)
- [ ] **T6.19.6** → Edit role color (color picker)
- [ ] **T6.19.7** → Toggle: Hoisted (displayed as separate section in member list)
- [ ] **T6.19.8** → Toggle: Mentionable (allows @role mentions)
- [ ] **T6.19.9** → Delete Role button (danger, not for preset roles)
- [ ] **T6.19.10** **Role members section**: member count, add/remove members
- [ ] **T6.19.11** **Drag-to-reorder roles**: position determines hierarchy
- [ ] **T6.19.12** **Permission toggles — General (6)**:
- [ ] **T6.19.13** → View Channels
- [ ] **T6.19.14** → Manage Community ⚠️ (dangerous)
- [ ] **T6.19.15** → Manage Channels ⚠️ (dangerous)
- [ ] **T6.19.16** → Manage Roles ⚠️ (dangerous)
- [ ] **T6.19.17** → Create Invites
- [ ] **T6.19.18** → Manage Invites ⚠️ (dangerous)
- [ ] **T6.19.19** **Permission toggles — Members (5)**:
- [ ] **T6.19.20** → Kick Members ⚠️ (dangerous)
- [ ] **T6.19.21** → Ban Members ⚠️ (dangerous)
- [ ] **T6.19.22** → Timeout Members ⚠️ (dangerous)
- [ ] **T6.19.23** → Change Nickname
- [ ] **T6.19.24** → Manage Nicknames ⚠️ (dangerous)
- [ ] **T6.19.25** **Permission toggles — Messages (8)**:
- [ ] **T6.19.26** → Send Messages
- [ ] **T6.19.27** → Embed Links
- [ ] **T6.19.28** → Attach Files
- [ ] **T6.19.29** → Add Reactions
- [ ] **T6.19.30** → Use External Emoji
- [ ] **T6.19.31** → Mention Everyone ⚠️ (dangerous)
- [ ] **T6.19.32** → Manage Messages ⚠️ (dangerous)
- [ ] **T6.19.33** → Read Message History
- [ ] **T6.19.34** **Permission toggles — Threads (3)**:
- [ ] **T6.19.35** → Create Threads
- [ ] **T6.19.36** → Send Thread Messages
- [ ] **T6.19.37** → Manage Threads ⚠️ (dangerous)
- [ ] **T6.19.38** **Permission toggles — Voice (6)**:
- [ ] **T6.19.39** → Connect
- [ ] **T6.19.40** → Speak
- [ ] **T6.19.41** → Stream
- [ ] **T6.19.42** → Mute Members ⚠️ (dangerous)
- [ ] **T6.19.43** → Deafen Members ⚠️ (dangerous)
- [ ] **T6.19.44** → Move Members ⚠️ (dangerous)
- [ ] **T6.19.45** **Permission toggles — Moderation (4)**:
- [ ] **T6.19.46** → View Audit Log
- [ ] **T6.19.47** → Manage Webhooks ⚠️ (dangerous)
- [ ] **T6.19.48** → Manage Emoji ⚠️ (dangerous)
- [ ] **T6.19.49** → Manage Branding ⚠️ (dangerous)
- [ ] **T6.19.50** **Permission toggles — Files (2)**:
- [ ] **T6.19.51** → Upload Files
- [ ] **T6.19.52** → Manage Files ⚠️ (dangerous)
- [ ] **T6.19.53** **Permission toggles — Advanced (1)**:
- [ ] **T6.19.54** → Administrator ⚠️ (dangerous — bypasses all permission checks)
- [ ] **T6.19.55** Permission states: TRUE (Allow), NULL (Inherit), FALSE (Deny)

### 6.20 Community Settings — Overview
- [ ] **T6.20.1** Settings dialog: 3-column layout (sidebar nav | section content | detail)
- [ ] **T6.20.2** Overview tab selected by default
- [ ] **T6.20.3** Server Name input (editable, min 1 char)
- [ ] **T6.20.4** Description textarea (editable)
- [ ] **T6.20.5** "You have unsaved changes" badge appears when modified
- [ ] **T6.20.6** "Reset" button reverts to last saved values
- [ ] **T6.20.7** "Save Changes" button — "Saving..." state → "Changes saved successfully"
- [ ] **T6.20.8** Save disabled if name is empty
- [ ] **T6.20.9** Community icon upload
- [ ] **T6.20.10** Community banner upload
- [ ] **T6.20.11** Accent color customization

### 6.21 Community Custom Emoji
- [ ] **T6.21.1** Settings > Emoji tab — CommunityEmojiPanel
- [ ] **T6.21.2** Usage counter: "X / 1000" emoji used
- [ ] **T6.21.3** "Upload Emoji" button — file picker
- [ ] **T6.21.4** Allowed types: PNG, GIF, WEBP, APNG, JPEG
- [ ] **T6.21.5** Max size: 256 KB (validated)
- [ ] **T6.21.6** Auto-name from filename (normalized to [a-zA-Z0-9_])
- [ ] **T6.21.7** Duplicate name detection + timestamp suffix auto-append
- [ ] **T6.21.8** Search input filters emoji by name
- [ ] **T6.21.9** Results count: "X results found"
- [ ] **T6.21.10** Error banner with dismiss button on failure
- [ ] **T6.21.11** Emoji grid (8 columns, 88px cards):
- [ ] **T6.21.12** → Image display (PNG/GIF/WEBP)
- [ ] **T6.21.13** → Name label in ":emoji_name:" format
- [ ] **T6.21.14** → "GIF" badge on animated emoji
- [ ] **T6.21.15** → Edit button (pencil icon) — enters rename mode
- [ ] **T6.21.16** → Delete button (trash icon)
- [ ] **T6.21.17** **Rename mode**:
- [ ] **T6.21.18** → Input field: [a-zA-Z0-9_], 2-32 chars, auto-focused
- [ ] **T6.21.19** → Duplicate name validation
- [ ] **T6.21.20** → Save button — confirms rename
- [ ] **T6.21.21** → Cancel button — exits rename mode
- [ ] **T6.21.22** Empty state: "No custom emoji yet. Upload one to get started!"
- [ ] **T6.21.23** No search results: "No emoji match your search."
- [ ] **T6.21.24** Custom emoji appears in emoji picker for channel messages

### 6.22 Community Stickers
- [ ] **T6.22.1** Settings > Stickers tab — CommunityStickerPanel
- [ ] **T6.22.2** Sticker pack list: all packs + "Uncategorized" default
- [ ] **T6.22.3** "Create Pack" — InputDialog for pack name
- [ ] **T6.22.4** "Delete Pack" — removes pack (cannot delete "Uncategorized")
- [ ] **T6.22.5** "Rename Pack" — updates pack name
- [ ] **T6.22.6** Upload sticker to pack — file picker
- [ ] **T6.22.7** Accepted types: PNG, GIF, WEBP, APNG, Lottie JSON
- [ ] **T6.22.8** Max size: 2 MB
- [ ] **T6.22.9** Auto-detect format (png/gif/webp/apng/lottie)
- [ ] **T6.22.10** Animated detection for GIF/APNG/Lottie
- [ ] **T6.22.11** Delete individual sticker from pack
- [ ] **T6.22.12** Error banner with dismiss button on failure
- [ ] **T6.22.13** Uploading indicator with status message
- [ ] **T6.22.14** Stickers appear in sticker picker for channel messages

### 6.23 Community Seats (Ghost Members)
- [ ] **T6.23.1** Settings > Seats tab — CommunitySeatsPanel
- [ ] **T6.23.2** Statistics header: "X total seats", "Y unclaimed", "Z claimed"
- [ ] **T6.23.3** "Fetch Users from Discord" button — OAuth flow → creates ghost seats
- [ ] **T6.23.4** "Fetching..." loading state
- [ ] **T6.23.5** "Re-scan Members" button — syncs Discord member list, updates roles
- [ ] **T6.23.6** "Scanning..." loading state
- [ ] **T6.23.7** Search input: filter by username, nickname, platform, role name
- [ ] **T6.23.8** "X results found" filter count
- [ ] **T6.23.9** Pagination: 50 items per page
- [ ] **T6.23.10** Previous/Next page buttons + "Page X of Y" indicator
- [ ] **T6.23.11** **Seat row display**:
- [ ] **T6.23.12** → Avatar (with fallback initial letter, image error fallback)
- [ ] **T6.23.13** → Username/Nickname (clickable)
- [ ] **T6.23.14** → Platform badge: Discord, GitHub, Steam, Bluesky, Xbox
- [ ] **T6.23.15** → Status badge: "Claimed" (green + checkmark) or "Unclaimed" (ghost)
- [ ] **T6.23.16** → Platform ID: "ID: [platformUserId]"
- [ ] **T6.23.17** → "Imported [date]" timestamp
- [ ] **T6.23.18** → "Claimed [date]" timestamp (if claimed)
- [ ] **T6.23.19** → Role pills: colored dot + role name, sorted by position
- [ ] **T6.23.20** → Delete button (trash icon) — loading spinner while deleting

### 6.24 Seat Claiming Flow
- [ ] **T6.24.1** User joins community with linked platform account
- [ ] **T6.24.2** Auto-detect matching unclaimed seat by platform + username
- [ ] **T6.24.3** Seat claimed — inherits roles from ghost seat
- [ ] **T6.24.4** Status badge changes from "Unclaimed" to "Claimed"
- [ ] **T6.24.5** "Claiming..." loading state

### 6.25 Discord Import
- [ ] **T6.25.1** Import dialog opens with upload/auth area
- [ ] **T6.25.2** Discord bot authorization OAuth flow
- [ ] **T6.25.3** Guild selection from authorized guilds
- [ ] **T6.25.4** Preview shows mapped channels, categories, roles
- [ ] **T6.25.5** Import creates community with correct structure
- [ ] **T6.25.6** Channels mapped correctly from Discord (text, voice, announcement)
- [ ] **T6.25.7** Roles mapped with permissions (Discord color → hex conversion)
- [ ] **T6.25.8** Ghost seats created for unmapped members
- [ ] **T6.25.9** Pinned messages imported
- [ ] **T6.25.10** Custom emoji imported
- [ ] **T6.25.11** Import errors/warnings displayed in summary
- [ ] **T6.25.12** Snowflake timestamps converted correctly
- [ ] **T6.25.13** Audit log entries imported

### 6.26 Permission-Gated UI
- [ ] **T6.26.1** Upload Files button hidden when !canUploadFiles
- [ ] **T6.26.2** Manage Files actions (rename, move, delete) hidden when !canManageFiles
- [ ] **T6.26.3** Delete/Edit Channel/Category/Space hidden when !canManageChannels and !isOwner
- [ ] **T6.26.4** Manage Roles UI hidden when !canManageRoles and !isOwner
- [ ] **T6.26.5** Manage Emoji/Stickers hidden when !canManageEmoji and !isOwner
- [ ] **T6.26.6** Kick/Ban Member hidden when !canKickMembers / !canBanMembers
- [ ] **T6.26.7** Settings button hidden when !canManageCommunity and !isOwner
- [ ] **T6.26.8** Administrator role bypasses all permission checks

---

## 7. Voice & Video Calls
> `__tests__/e2e/calling.spec.ts`

### 7.1 Initiating Calls
- [ ] **T7.1.1** Click voice call button in DM header — outgoing call starts
- [ ] **T7.1.2** Click video call button — outgoing call with camera
- [ ] **T7.1.3** Outgoing call shows ringing state with timer
- [ ] **T7.1.4** Ring timeout after 45 seconds — call cancelled

### 7.2 Receiving Calls
- [ ] **T7.2.1** Incoming call overlay appears with caller name + call type (audio/video)
- [ ] **T7.2.2** Semi-transparent dark overlay background
- [ ] **T7.2.3** Accept button (phone icon) — connects call
- [ ] **T7.2.4** Decline button (hang-up icon) — rejects call
- [ ] **T7.2.5** Caller sees "declined" state

### 7.3 Active Call Controls
- [ ] **T7.3.1** Mute/unmute microphone toggle (mic icon with slash when muted)
- [ ] **T7.3.2** Toggle camera on/off (camera icon with slash when off)
- [ ] **T7.3.3** Switch camera button (for dual-camera devices)
- [ ] **T7.3.4** Screen sharing start/stop
- [ ] **T7.3.5** End call button (red danger styling, phone with slash icon)
- [ ] **T7.3.6** Settings button (opens call settings)
- [ ] **T7.3.7** Call duration timer visible
- [ ] **T7.3.8** Remote audio volume adjustable
- [ ] **T7.3.9** Local video stream displayed
- [ ] **T7.3.10** Remote video stream displayed

### 7.4 Call PiP Widget
- [ ] **T7.4.1** Navigate away from call conversation — PiP widget appears
- [ ] **T7.4.2** PiP shows remote video/avatar
- [ ] **T7.4.3** PiP shows caller name + duration
- [ ] **T7.4.4** Click PiP — returns to call conversation
- [ ] **T7.4.5** End call from PiP
- [ ] **T7.4.6** Toggle mute from PiP

### 7.5 Call Quality & Stats
- [ ] **T7.5.1** Call statistics visible during call:
- [ ] **T7.5.2** → Audio bitrate
- [ ] **T7.5.3** → Video bitrate
- [ ] **T7.5.4** → Packet loss %
- [ ] **T7.5.5** → Latency (ping in ms)
- [ ] **T7.5.6** → Frame rate (FPS)
- [ ] **T7.5.7** Video quality adjustable (Low, Medium, High)
- [ ] **T7.5.8** Noise suppression toggle during call
- [ ] **T7.5.9** Echo cancellation during call

### 7.6 Call Diagnostics Page
- [ ] **T7.6.1** Navigate to /call-diagnostics — page loads
- [ ] **T7.6.2** Section 1: Relay Connectivity — "Test All" button tests all relays
- [ ] **T7.6.3** Relay results show latency values or error
- [ ] **T7.6.4** Section 2: TURN/STUN Connectivity — "Run Tests" button
- [ ] **T7.6.5** STUN results show "STUN stun..." with pass/fail
- [ ] **T7.6.6** Section 3: Loopback Audio — "Start Mic" button (requires mic permission)
- [ ] **T7.6.7** Mic test shows device name when active
- [ ] **T7.6.8** "Stop" button ends mic test
- [ ] **T7.6.9** Section 4: Call Negotiation — "Create Offer" button
- [ ] **T7.6.10** State changes from idle to offer-created/new/checking/connected
- [ ] **T7.6.11** Log entries: "Offer created", "ICE candidate", "ICE gathering"
- [ ] **T7.6.12** "Reset" button resets negotiation state
- [ ] **T7.6.13** Section 5: Real-Time Call Stats — shows "No active call" when idle
- [ ] **T7.6.14** Section 6: ICE Candidate Log

### 7.7 Call Records
- [ ] **T7.7.1** Completed call stored in call history
- [ ] **T7.7.2** Missed call stored with reason
- [ ] **T7.7.3** Call history accessible per-DM conversation
- [ ] **T7.7.4** Global call history available

---

## 8. File Sharing
> `__tests__/e2e/file-sharing.spec.ts`

### 8.1 DM File Upload
- [ ] **T8.1.1** Click attachment button in DM — file picker opens
- [ ] **T8.1.2** Upload small text file (<1KB) — file message renders
- [ ] **T8.1.3** Upload image — thumbnail preview shown
- [ ] **T8.1.4** Upload large file (>256KB) — chunked transfer initiated
- [ ] **T8.1.5** Upload progress indicator visible
- [ ] **T8.1.6** Encryption indicator (lock icon) on file message

### 8.2 DM File Download
- [ ] **T8.2.1** Click file message — download starts
- [ ] **T8.2.2** Download progress indicator
- [ ] **T8.2.3** Pause/resume download
- [ ] **T8.2.4** Downloaded file matches original (integrity check)

### 8.3 DM Shared Files Panel
- [ ] **T8.3.1** Open shared files panel in DM
- [ ] **T8.3.2** All shared files listed
- [ ] **T8.3.3** Filter by Images tab
- [ ] **T8.3.4** Filter by Documents tab
- [ ] **T8.3.5** Filter by Media tab
- [ ] **T8.3.6** Download from shared files panel

### 8.4 DM Folder Management
- [ ] **T8.4.1** Create folder in DM conversation
- [ ] **T8.4.2** Upload file into folder
- [ ] **T8.4.3** Move file between folders
- [ ] **T8.4.4** Rename folder
- [ ] **T8.4.5** Delete folder

### 8.5 Files Page (Global)
- [ ] **T8.5.1** Navigate to Files page via nav rail
- [ ] **T8.5.2** Active transfers show progress bar + speed
- [ ] **T8.5.3** Transport type badge (P2P, Relay)
- [ ] **T8.5.4** Pause/resume/cancel buttons on transfers
- [ ] **T8.5.5** Storage usage meter displayed
- [ ] **T8.5.6** Smart cleanup button

### 8.6 P2P File Transfer (Two-User)
- [ ] **T8.6.1** User A uploads file in DM — User B receives event
- [ ] **T8.6.2** User B downloads file — integrity verified
- [ ] **T8.6.3** Large file transfer — chunked, shows progress
- [ ] **T8.6.4** Pause mid-transfer — state saved
- [ ] **T8.6.5** Resume transfer — only missing chunks sent
- [ ] **T8.6.6** Cancel transfer — both sides see cancellation
- [ ] **T8.6.7** Incomplete transfers recoverable after restart

### 8.7 File Encryption (E2EE)
- [ ] **T8.7.1** Files encrypted with AES-256-GCM before upload
- [ ] **T8.7.2** Key derived per-conversation/channel
- [ ] **T8.7.3** Key fingerprint verification available
- [ ] **T8.7.4** Files marked for re-encryption after key rotation
- [ ] **T8.7.5** Re-encryption flag cleared after completion

---

## 9. Right Panels
> `__tests__/e2e/panels.spec.ts`

### 9.1 Members Panel
- [ ] **T9.1.1** Click members icon in header — panel opens
- [ ] **T9.1.2** Shows online and offline members
- [ ] **T9.1.3** Click member avatar — profile popover appears
- [ ] **T9.1.4** Panel close button works
- [ ] **T9.1.5** Toggle: clicking members icon again closes panel

### 9.2 Search Panel
- [ ] **T9.2.1** Click search icon — search panel opens
- [ ] **T9.2.2** Search input with placeholder text
- [ ] **T9.2.3** Search within current conversation/channel
- [ ] **T9.2.4** Results listed with message preview + timestamp
- [ ] **T9.2.5** Query terms highlighted in results
- [ ] **T9.2.6** Click result — scrolls to message in chat

### 9.3 Pins Panel
- [ ] **T9.3.1** Click pin icon — pins panel opens
- [ ] **T9.3.2** All pinned messages listed with author, text preview, timestamp
- [ ] **T9.3.3** Click pinned message — scrolls to it in chat
- [ ] **T9.3.4** Unpin button on each pinned message (owner/mod)

### 9.4 Thread Panel
- [ ] **T9.4.1** Click thread icon on message — thread panel opens
- [ ] **T9.4.2** Shows original message + all replies
- [ ] **T9.4.3** Can compose + send thread replies
- [ ] **T9.4.4** Reply count updates in real-time

### 9.5 Shared Files Panel (DM)
- [ ] **T9.5.1** Shows all files shared in conversation
- [ ] **T9.5.2** Categorized: Images, Documents, Media
- [ ] **T9.5.3** Download directly from panel

---

## 10. Profile Popover
> `__tests__/e2e/profile.spec.ts`

- [ ] **T10.0.1** Click member avatar — profile card appears near click position
- [ ] **T10.0.2** Card positioned within viewport (clamped to screen bounds)
- [ ] **T10.0.3** Shows name, @username, status indicator
- [ ] **T10.0.4** Banner uses accent color
- [ ] **T10.0.5** Avatar with initials fallback + status dot
- [ ] **T10.0.6** "Message" action button — navigates to DM
- [ ] **T10.0.7** Close (X) button works
- [ ] **T10.0.8** Click backdrop — dismisses card
- [ ] **T10.0.9** Light mode: light bg, dark text
- [ ] **T10.0.10** Dark mode: dark bg, light text
- [ ] **T10.0.11** All four corners rounded
- [ ] **T10.0.12** Bio text displayed if set

---

## 11. Settings
> `__tests__/e2e/settings.spec.ts`

### 11.1 General
- [ ] **T11.1.1** Gear icon in nav rail — settings overlay opens
- [ ] **T11.1.2** Left sidebar with 13 sections: Account, Profile, Appearance, Messaging, Notifications, Sounds, Privacy, Audio & Video, Network, Data, Plugins, Keyboard Shortcuts, About
- [ ] **T11.1.3** Click section — content loads on right
- [ ] **T11.1.4** Click outside overlay — closes settings

### 11.2 Account
- [ ] **T11.2.1** Shows display name with avatar
- [ ] **T11.2.2** Shows "Member since" date
- [ ] **T11.2.3** Truncated DID with "Copy" button
- [ ] **T11.2.4** Copy DID — clipboard + "Copied" feedback
- [ ] **T11.2.5** QR code visible with DID (uses accent color)
- [ ] **T11.2.6** Recovery phrase view (display-only with copy button)
- [ ] **T11.2.7** "Share" section for sharing DID/link
- [ ] **T11.2.8** Danger Zone: "Log Out" button (red)

### 11.3 Profile
- [ ] **T11.3.1** Avatar upload area (clickable) + "Upload Photo" button
- [ ] **T11.3.2** Display name input (editable, placeholder: "Your display name")
- [ ] **T11.3.3** Username input (editable)
- [ ] **T11.3.4** Bio textarea
- [ ] **T11.3.5** Status dropdown: Online ("You appear as available"), Idle ("You appear as away"), Do Not Disturb ("Mute all notifications"), Invisible ("You appear offline")
- [ ] **T11.3.6** "Save Changes" button appears when modifications detected
- [ ] **T11.3.7** Changes persist across refresh

### 11.4 Appearance
- [ ] **T11.4.1** **Theme** sub-section: theme dropdown (Default + installed custom themes)
- [ ] **T11.4.2** Theme swatch display (color preview circles)
- [ ] **T11.4.3** **Dark Mode** sub-section: dark mode toggle (when showModeToggle enabled)
- [ ] **T11.4.4** Toggle switches theme immediately — ALL components update
- [ ] **T11.4.5** **Colors** sub-section: accent color picker
- [ ] **T11.4.6** 11 preset colors: Black, Blue, Purple, Pink, Red, Orange, Yellow, Green, Cyan, Indigo, Rose
- [ ] **T11.4.7** Custom hex color input field
- [ ] **T11.4.8** Color picker visual component
- [ ] **T11.4.9** Accent color updates buttons, bubbles, links, QR code globally
- [ ] **T11.4.10** **Text Size** sub-section: dropdown — Small ("Compact text for more content"), Medium ("Default text size"), Large ("Easier to read")
- [ ] **T11.4.11** **Font** sub-section: font family dropdown (installed + system fonts)
- [ ] **T11.4.12** Font category labels: Sans Serif, Serif, Mono, Display
- [ ] **T11.4.13** Font preview text shown for selection
- [ ] **T11.4.14** Font change applies throughout app
- [ ] **T11.4.15** All appearance changes persist across refresh

### 11.5 Messaging
- [ ] **T11.5.1** **Display Style** sub-section: message display mode selector
- [ ] **T11.5.2** Bubble Mode option: colored bubbles, your messages right, others left
- [ ] **T11.5.3** Inline Mode option: Slack/Discord style, left-aligned, sender name + timestamp headers
- [ ] **T11.5.4** Mode selection toggle buttons
- [ ] **T11.5.5** Live preview for each mode in settings

### 11.6 Notifications
- [ ] **T11.6.1** Push Notifications toggle: "Receive push notifications for new messages and mentions"
- [ ] **T11.6.2** Message Preview toggle: "Show message content in notification banners"
- [ ] **T11.6.3** Toggle changes take effect immediately

### 11.7 Sounds
- [ ] **T11.7.1** Enable Sounds master toggle
- [ ] **T11.7.2** Sound Theme dropdown (list of available sound packs with descriptions)
- [ ] **T11.7.3** Master Volume slider: 0–100%, step 5%, displays current %
- [ ] **T11.7.4** **Per-category sound controls** (each with toggle + volume slider + play test button):
- [ ] **T11.7.5** → Message: "Sending, receiving, and deleting messages"
- [ ] **T11.7.6** → Call: "Joining, leaving, muting, and ringing"
- [ ] **T11.7.7** → Navigation: "Tab switches, dialog open/close"
- [ ] **T11.7.8** → Social: "Friend requests, accepts, notifications"
- [ ] **T11.7.9** → System: "Toggles, errors, success confirmations"
- [ ] **T11.7.10** Each category: enable/disable toggle
- [ ] **T11.7.11** Each category: volume slider 0–100%
- [ ] **T11.7.12** Each category: "Play Test" button plays sample sound

### 11.8 Privacy
- [ ] **T11.8.1** **Friend Discovery** sub-section: FriendDiscoveryPanel component
- [ ] **T11.8.2** Discovery toggle: "Allow friends to find you"
- [ ] **T11.8.3** Linked accounts panel: platform name, username, verification badge, unlink button
- [ ] **T11.8.4** "Add New Platform" link account button → OAuth flow
- [ ] **T11.8.5** Friend suggestions list: avatar, name, mutual friends count, add friend button
- [ ] **T11.8.6** **Visibility** sub-section:
- [ ] **T11.8.7** → Read Receipts toggle: "Let others know when you've seen their messages" (with help indicator)
- [ ] **T11.8.8** → Typing Indicators toggle: "Show when you are typing a message to others"
- [ ] **T11.8.9** → Online Status toggle: "Show your online status to other users"
- [ ] **T11.8.10** **Security** sub-section:
- [ ] **T11.8.11** → PIN Lock toggle: "Require a PIN to unlock the app and access your keys"
- [ ] **T11.8.12** → PIN setup/removal dialogs (see Section 1.3)
- [ ] **T11.8.13** Help indicators (i) next to applicable toggles

### 11.9 Audio & Video
- [ ] **T11.9.1** **Calling** sub-section:
- [ ] **T11.9.2** → Incoming Call Display dropdown: Fullscreen / Toast
- [ ] **T11.9.3** → Ring Volume slider: 0–100%, step 5%
- [ ] **T11.9.4** **Video** sub-section:
- [ ] **T11.9.5** → Video Quality dropdown: Auto, 720p HD (~2.5 Mbps), 1080p Full HD (~5 Mbps), 1440p QHD (~8 Mbps), 4K Ultra HD (~16 Mbps)
- [ ] **T11.9.6** → Test Video Preview (camera preview with effects)
- [ ] **T11.9.7** → Start Preview / Stop Preview buttons
- [ ] **T11.9.8** → Background Effect dropdown: None, Blur, Virtual Background (Image)
- [ ] **T11.9.9** → Blur Intensity slider (when Blur selected)
- [ ] **T11.9.10** → Background Image Upload (when Virtual Background selected)
- [ ] **T11.9.11** → Preset background image selection
- [ ] **T11.9.12** **Audio** sub-section:
- [ ] **T11.9.13** → Audio Quality dropdown: Voice (VoIP), Music (Full Band), Low Latency, PCM Lossless (~1.4 Mbps)
- [ ] **T11.9.14** → Opus Application Mode dropdown: Voice (VoIP), Music (Full Band), Low Latency
- [ ] **T11.9.15** → Opus Bitrate dropdown: Low (24 kbps), Medium (48 kbps), High (96 kbps), Max (128 kbps)
- [ ] **T11.9.16** → Opus Complexity slider: 0–10 (CPU/quality tradeoff)
- [ ] **T11.9.17** → Forward Error Correction toggle: "Adds redundancy to resist packet loss"
- [ ] **T11.9.18** → Discontinuous Transmission toggle: "Save bandwidth during silence"
- [ ] **T11.9.19** → Microphone Volume slider: 0–100%
- [ ] **T11.9.20** → Microphone Test button (start/stop) + mic level meter
- [ ] **T11.9.21** → Output Volume slider: 0–100%
- [ ] **T11.9.22** **Devices** sub-section:
- [ ] **T11.9.23** → Microphone Input Device dropdown (enumerated devices)
- [ ] **T11.9.24** → Camera Input Device dropdown (enumerated devices)
- [ ] **T11.9.25** → Speaker/Audio Output Device dropdown (enumerated devices)
- [ ] **T11.9.26** → Noise Suppression toggle: "Reduce background noise from your microphone"
- [ ] **T11.9.27** → Echo Cancellation toggle: "Prevent audio feedback loops"
- [ ] **T11.9.28** → Auto Gain Control toggle: "Automatically adjust microphone volume"
- [ ] **T11.9.29** → End-to-End Media Encryption toggle: "Encrypts audio and video frames with AES-256-GCM. May increase CPU usage." (availability depends on RTCRtpScriptTransform support)

### 11.10 Network
- [ ] **T11.10.1** **Connection** sub-section:
- [ ] **T11.10.2** → P2P Network toggle
- [ ] **T11.10.3** → Status indicator (green/red dot) + Connected/Disconnected text
- [ ] **T11.10.4** → Peer count display
- [ ] **T11.10.5** → Listen addresses count display
- [ ] **T11.10.6** → Network state indicator with color-coded status: Idle / Creating Offer / Waiting for Answer / Accepting Offer / Completing Handshake / Connected / Error
- [ ] **T11.10.7** → "Create Offer" button (Step 1)
- [ ] **T11.10.8** → "Copy Offer" button (shows "Copied" status)
- [ ] **T11.10.9** → "Accept Offer" button
- [ ] **T11.10.10** → Paste input field (for peer's offer/answer)
- [ ] **T11.10.11** → "Complete Connection" button
- [ ] **T11.10.12** → "Copy Answer" button (shows "Copied" status)
- [ ] **T11.10.13** → Success: green "Peer connected successfully!" message
- [ ] **T11.10.14** → Error: red error message with "Try Again" button
- [ ] **T11.10.15** → "Reset" button
- [ ] **T11.10.16** **Relays** sub-section:
- [ ] **T11.10.17** → Relay server list with per-relay toggle (enable/disable)
- [ ] **T11.10.18** → Relay status per server: ping (latency ms), region, location, online clients, mesh online, connected peers, federation status
- [ ] **T11.10.19** → Remove Relay button per server
- [ ] **T11.10.20** → Default Relay badge on primary relay
- [ ] **T11.10.21** → "Add New Relay" section: URL input + Add Relay button
- [ ] **T11.10.22** → Error display for invalid relay URL
- [ ] **T11.10.23** **Identity** sub-section:
- [ ] **T11.10.24** → Peer ID display with copy button
- [ ] **T11.10.25** → DID QR code + text + copy button

### 11.11 Data Management
- [ ] **T11.11.1** **Storage** sub-section:
- [ ] **T11.11.2** → Local storage info card with description + current DID (truncated)
- [ ] **T11.11.3** → Storage usage meter (total + per-context breakdown)
- [ ] **T11.11.4** → Status message display (success/failure feedback)
- [ ] **T11.11.5** **Danger Zone** sub-section:
- [ ] **T11.11.6** → "Clear Messages" button (orange) — confirmation dialog
- [ ] **T11.11.7** → Confirm: messages, reactions, pins, threads deleted; friends/groups kept
- [ ] **T11.11.8** → "Clear All Data" button (red, warning icon) — confirmation dialog
- [ ] **T11.11.9** → Confirm: everything wiped; identity preserved
- [ ] **T11.11.10** Auto-cleanup rules configuration
- [ ] **T11.11.11** Manual cleanup suggestions

### 11.12 Plugins
- [ ] **T11.12.1** "Marketplace" button — opens PluginMarketplace
- [ ] **T11.12.2** No plugins installed: empty state with CTA to open Marketplace
- [ ] **T11.12.3** **Per-plugin card** (installed):
- [ ] **T11.12.4** → Plugin icon (colored background)
- [ ] **T11.12.5** → Plugin name, description, version, author
- [ ] **T11.12.6** → Enable/Disable toggle
- [ ] **T11.12.7** → Permission tags display
- [ ] **T11.12.8** → Uninstall button → confirmation ("Remove plugin and data?") → Remove (danger) + Cancel

### 11.13 Keyboard Shortcuts
- [ ] **T11.13.1** Shortcuts list displayed with all registered shortcuts
- [ ] **T11.13.2** Shortcut label + category
- [ ] **T11.13.3** Key combination display (monospace font)
- [ ] **T11.13.4** Plugin attribution for plugin-added shortcuts

### 11.14 About
- [ ] **T11.14.1** App version + core version displayed
- [ ] **T11.14.2** Latest available version shown
- [ ] **T11.14.3** "Update Available" badge (when newer version exists)
- [ ] **T11.14.4** "Check for Updates" button
- [ ] **T11.14.5** "All Downloads" button → AllPlatformsDialog
- [ ] **T11.14.6** Links: GitHub repository, Release Notes, Web App
- [ ] **T11.14.7** Platform info display

---

## 12. Plugin Marketplace
> `__tests__/e2e/plugins.spec.ts`

### 12.1 Marketplace Navigation
- [ ] **T12.1.1** Marketplace accessible from Settings > Plugins > "Marketplace" button
- [ ] **T12.1.2** Sidebar tabs: Plugins, Themes (coming soon), Fonts

### 12.2 Plugins Tab — Browse
- [ ] **T12.2.1** Sub-tabs: Browse / Installed
- [ ] **T12.2.2** Search input field with real-time filtering
- [ ] **T12.2.3** **Plugin listing cards**:
- [ ] **T12.2.4** → Plugin icon/avatar
- [ ] **T12.2.5** → Plugin name + version badge
- [ ] **T12.2.6** → Description (2 lines max)
- [ ] **T12.2.7** → Author name
- [ ] **T12.2.8** → Download count
- [ ] **T12.2.9** → File size
- [ ] **T12.2.10** → Platform badges: Web (blue globe), Desktop (purple computer), Mobile (green phone)
- [ ] **T12.2.11** → Cross-platform badge (when all 3 platforms)
- [ ] **T12.2.12** → Tag pills (colored, first 4 shown, "+N more" indicator)
- [ ] **T12.2.13** → Status: "Install" button / "Installed" badge / "Disabled" badge
- [ ] **T12.2.14** → Installing spinner during installation

### 12.3 Plugins Tab — Installed
- [ ] **T12.3.1** Lists all installed plugins
- [ ] **T12.3.2** Plugin icon + name + description + version + author
- [ ] **T12.3.3** Enable/Disable toggle per plugin
- [ ] **T12.3.4** Permission tags with icons:
- [ ] **T12.3.5** → messages:read (Message icon), messages:write, friends:read (Users icon)
- [ ] **T12.3.6** → conversations:read, storage:kv (Database icon), storage:sql
- [ ] **T12.3.7** → network:local (Globe icon), notifications (Bell icon), commands (Zap icon)
- [ ] **T12.3.8** Uninstall button → "Remove plugin and data?" → Remove (danger) + Cancel

### 12.4 Themes Tab
- [ ] **T12.4.1** Coming soon placeholder

### 12.5 Fonts Tab
- [ ] **T12.5.1** Font search input
- [ ] **T12.5.2** Available fonts grid
- [ ] **T12.5.3** **Per font card**: font preview text, name, category, author
- [ ] **T12.5.4** Install button / "Installed" badge
- [ ] **T12.5.5** Font preview: "The quick brown fox..." + alphabet + numbers rendered in font

---

## 13. Command Palette
> `__tests__/e2e/command-palette.spec.ts`

- [ ] **T13.0.1** Cmd+K (Ctrl+K) opens palette
- [ ] **T13.0.2** Search input focused automatically
- [ ] **T13.0.3** Type "friends" — navigation option appears
- [ ] **T13.0.4** Type friend name — friend search results
- [ ] **T13.0.5** Type "settings" — settings option appears
- [ ] **T13.0.6** Type "chat" — conversation results
- [ ] **T13.0.7** Type "marketplace" — marketplace option
- [ ] **T13.0.8** Press Escape — closes palette
- [ ] **T13.0.9** Select item — navigates to correct location
- [ ] **T13.0.10** Arrow keys navigate results
- [ ] **T13.0.11** Enter selects highlighted result

---

## 14. Notifications
> `__tests__/e2e/notifications.spec.ts`

### 14.1 Notification Drawer
- [ ] **T14.1.1** Bell icon in nav rail — badge shows unread count
- [ ] **T14.1.2** Click bell — notification drawer panel opens
- [ ] **T14.1.3** Drawer title: "Notifications"
- [ ] **T14.1.4** "Mark All Read" button
- [ ] **T14.1.5** Close drawer button

### 14.2 Category Tabs
- [ ] **T14.2.1** Tabs: All, Social, Calls, Mentions, System
- [ ] **T14.2.2** Unread count badges per category tab
- [ ] **T14.2.3** Tab switch filters notifications by type

### 14.3 Notification Grouping
- [ ] **T14.3.1** Notifications grouped by date: Today, Yesterday, This Week, Older
- [ ] **T14.3.2** Within groups: sorted by recency

### 14.4 Notification Items
- [ ] **T14.4.1** Each notification: type icon, title, description, timestamp
- [ ] **T14.4.2** Timestamps: "Just now", "5m ago", "2h ago", "3d ago"
- [ ] **T14.4.3** Avatar (if applicable, e.g., friend request sender)
- [ ] **T14.4.4** Read/unread visual indicator
- [ ] **T14.4.5** Dismiss button (X) per notification
- [ ] **T14.4.6** Press notification — marks as read

### 14.5 Notification Types
- [ ] **T14.5.1** **Social**: friend_request_received, friend_request_accepted, friend_request_rejected, group_invite, community_invite
- [ ] **T14.5.2** **Calls**: call_missed, call_completed
- [ ] **T14.5.3** **Mentions**: @mention in community channel
- [ ] **T14.5.4** **System**: app updates, system events
- [ ] **T14.5.5** Notification sounds play per type (when sounds enabled)

---

## 15. Help System
> `__tests__/e2e/help.spec.ts`

- [ ] **T15.0.1** Guide dialog accessible from sidebar (book icon)
- [ ] **T15.0.2** 10+ sections: Getting Started, Friends, Messaging, Groups, etc.
- [ ] **T15.0.3** Feature status cards: "Working" / "Coming Soon" badges
- [ ] **T15.0.4** HOW TO USE steps in each section
- [ ] **T15.0.5** LIMITATIONS warnings
- [ ] **T15.0.6** Version label (Umbra v0.1.0)
- [ ] **T15.0.7** Help indicators (i) throughout settings
- [ ] **T15.0.8** Click help indicator — popover with explanation
- [ ] **T15.0.9** (!) priority indicators for dangerous actions
- [ ] **T15.0.10** Help popovers theme-aware (light/dark)

---

## 16. Theme & Visual Consistency
> `__tests__/e2e/theme.spec.ts`

### 16.1 Light Mode
- [ ] **T16.1.1** Background: light gray/white canvas
- [ ] **T16.1.2** Text: dark (near-black)
- [ ] **T16.1.3** Sidebar: light theme
- [ ] **T16.1.4** Outgoing bubbles: accent color, light text
- [ ] **T16.1.5** Incoming bubbles: light gray, dark text
- [ ] **T16.1.6** Input area: light background
- [ ] **T16.1.7** Cards/dialogs: light bg, subtle borders
- [ ] **T16.1.8** Emoji picker: light theme

### 16.2 Dark Mode
- [ ] **T16.2.1** Background: dark gray/black canvas
- [ ] **T16.2.2** Text: light (near-white)
- [ ] **T16.2.3** Sidebar: dark theme
- [ ] **T16.2.4** Outgoing bubbles: accent color, light text
- [ ] **T16.2.5** Incoming bubbles: dark surface, light text
- [ ] **T16.2.6** Input area: dark background
- [ ] **T16.2.7** Cards/dialogs: dark bg, subtle borders
- [ ] **T16.2.8** Emoji picker: dark theme

### 16.3 Theme Switching
- [ ] **T16.3.1** Toggle dark mode — ALL components update immediately
- [ ] **T16.3.2** No flash of wrong colors
- [ ] **T16.3.3** Profile cards switch correctly
- [ ] **T16.3.4** Emoji picker switches correctly
- [ ] **T16.3.5** Settings dialog switches correctly
- [ ] **T16.3.6** Chat bubbles switch correctly
- [ ] **T16.3.7** Community sidebar switches correctly

---

## 17. Persistence (IndexedDB)
> `__tests__/e2e/persistence.spec.ts`

- [ ] **T17.0.1** Create identity → refresh → identity restored
- [ ] **T17.0.2** Add friend → refresh → friend still in list
- [ ] **T17.0.3** Send messages → refresh → messages visible
- [ ] **T17.0.4** Create group → refresh → group in sidebar
- [ ] **T17.0.5** Pin message → refresh → pin persists
- [ ] **T17.0.6** React to message → refresh → reaction persists
- [ ] **T17.0.7** Theme/accent changes → refresh → settings restored
- [ ] **T17.0.8** Font choice → refresh → font persists
- [ ] **T17.0.9** Different accounts — separate databases (data isolated)
- [ ] **T17.0.10** Clear messages → refresh → messages gone, friends remain
- [ ] **T17.0.11** Clear all data → refresh → everything wiped, identity preserved
- [ ] **T17.0.12** Community membership → refresh → communities still in nav rail
- [ ] **T17.0.13** Custom emoji → refresh → emoji still available
- [ ] **T17.0.14** Plugin settings → refresh → plugins still enabled/disabled

---

## 18. Deep Linking
> `__tests__/e2e/deep-linking.spec.ts`

- [ ] **T18.0.1** Navigate to `umbra://invite/CODE` — opens invite handler
- [ ] **T18.0.2** Navigate to `https://umbra.chat/invite/CODE` — opens invite handler
- [ ] **T18.0.3** Valid code — shows community preview + join button
- [ ] **T18.0.4** Invalid code — error message
- [ ] **T18.0.5** Deep link while unauthenticated — stores pending invite, handles after auth
- [ ] **T18.0.6** Vanity invite URL resolves correctly

---

## 19. Install Banner & Updates
> `__tests__/e2e/install-banner.spec.ts`

### 19.1 Desktop/Tauri Updates
- [ ] **T19.1.1** "Available" state: Update & Restart button + Release Notes link
- [ ] **T19.1.2** "Downloading" state: progress bar + percentage
- [ ] **T19.1.3** "Ready" state: "Restart Now" + "Later" buttons
- [ ] **T19.1.4** "Error" state: "Retry" button

### 19.2 Web Updates
- [ ] **T19.2.1** "Available" state: "Update Now" + "Release Notes" buttons
- [ ] **T19.2.2** "Preloading" state: progress bar + percentage
- [ ] **T19.2.3** "Ready" state: "Reload Now" + "Later" buttons
- [ ] **T19.2.4** "Error" state: "Retry" button

### 19.3 Web Install-as-App
- [ ] **T19.3.1** Platform-specific download button (when no update available)
- [ ] **T19.3.2** "More Platforms" dropdown
- [ ] **T19.3.3** Install banner not shown on Tauri desktop

---

## 20. Desktop (Tauri) Features
> `__tests__/e2e/desktop.spec.ts`

- [ ] **T20.0.1** Title bar drag region for window movement (macOS)
- [ ] **T20.0.2** Traffic light buttons have proper clearance
- [ ] **T20.0.3** Window resize — layout adapts
- [ ] **T20.0.4** Install banner NOT shown on Tauri

---

## 21. Edge Cases & Error Handling
> `__tests__/e2e/edge-cases.spec.ts`

### 21.1 Message Edge Cases
- [ ] **T21.1.1** Very long message (10,000+ chars) renders without truncation
- [ ] **T21.1.2** Rapid message sending — no duplicates
- [ ] **T21.1.3** Multiple emoji reactions on same message — all displayed
- [ ] **T21.1.4** Mention non-existent user — no crash, plain text rendered
- [ ] **T21.1.5** Unicode/emoji in display names — renders correctly
- [ ] **T21.1.6** Empty message (whitespace only) — not sendable

### 21.2 Network Edge Cases
- [ ] **T21.2.1** Offline/disconnected — messages queued, sent on reconnect
- [ ] **T21.2.2** Network disconnect during file transfer — graceful handling
- [ ] **T21.2.3** Relay disconnect + reconnect — session restored
- [ ] **T21.2.4** Offline message fetch on reconnect

### 21.3 UI Edge Cases
- [ ] **T21.3.1** Window resize — no overflow/clipping
- [ ] **T21.3.2** Empty conversations list — helpful empty state
- [ ] **T21.3.3** Empty friends list — "No friends yet" message
- [ ] **T21.3.4** Navigate away during operation — no crash
- [ ] **T21.3.5** Concurrent uploads (max 3) — queue excess
- [ ] **T21.3.6** Dialog open + Escape key — dialog closes properly
- [ ] **T21.3.7** Multiple dialogs cannot stack (one at a time)

### 21.4 Community Edge Cases
- [ ] **T21.4.1** Community with 0 channels — empty state
- [ ] **T21.4.2** Community with 100+ channels — renders without lag
- [ ] **T21.4.3** Very long community/channel names — truncated properly
- [ ] **T21.4.4** Delete community as non-owner — action blocked
- [ ] **T21.4.5** Permission denied action — appropriate error UI

### 21.5 Loading & Error States
- [ ] **T21.5.1** All async operations show loading indicators
- [ ] **T21.5.2** All errors show dismissible error banners/toasts
- [ ] **T21.5.3** Retry buttons on failed operations work
- [ ] **T21.5.4** "Saving..." / "Creating..." / "Connecting..." / "Fetching..." / "Uploading..." / "Deleting..." / "Claiming..." states visible

---

## 22. Cross-Feature Integration
> `__tests__/e2e/integration.spec.ts`

- [ ] **T22.0.1** Create identity → add friend → start DM → send message — full E2E flow
- [ ] **T22.0.2** Create group → invite friends → all accept → group messaging works
- [ ] **T22.0.3** Send message → edit → other sees edit → delete → other sees deletion
- [ ] **T22.0.4** React + reply same message — both visible correctly
- [ ] **T22.0.5** Pin message → find in pins panel → unpin
- [ ] **T22.0.6** Change accent color — all components update
- [ ] **T22.0.7** Toggle dark/light mid-conversation — no glitches
- [ ] **T22.0.8** Refresh mid-conversation — all state restored
- [ ] **T22.0.9** Create community → create spaces → add categories → add channels → invite → member joins → sends message
- [ ] **T22.0.10** Upload file in DM → recipient downloads → verify integrity
- [ ] **T22.0.11** Start call → navigate away → PiP shows → return to call
- [ ] **T22.0.12** Command palette → navigate to friends → send request → return to chat
- [ ] **T22.0.13** Community voice channel → join → speak → leave → rejoin
- [ ] **T22.0.14** Upload custom emoji → use in channel message → visible to all members
- [ ] **T22.0.15** Create role → assign permissions → assign to member → verify permission gating works
- [ ] **T22.0.16** Discord import → verify structure → claim seat → send messages in imported channels
- [ ] **T22.0.17** File channel → create folder → upload files → navigate breadcrumbs → download file

---

## Appendix A: Test ID Convention

| Pattern | Meaning |
|---------|---------|
| `T1.1.1` | Section 1 (Auth), Subsection 1 (Creation), Test 1 |
| `T6.19.54` | Section 6 (Communities), Subsection 19 (Roles & Permissions), Test 54 |

Each test ID maps to a Playwright test:
```typescript
test('T1.1.1 — Fresh app shows auth screen', async ({ page }) => { ... });
```

## Appendix B: Playwright Spec File Mapping

| Section | Spec File | Status |
|---------|-----------|--------|
| 1. Auth & Identity | `identity.spec.ts` | Exists (partial) |
| 2. Navigation | `navigation.spec.ts` | To create |
| 3. Friends | `friends.spec.ts` | Exists (partial) |
| 4. Messaging | `messaging.spec.ts` | Exists (partial) |
| 5. Groups | `groups.spec.ts` | Exists (stub) |
| 6. Communities | `communities.spec.ts` | To create |
| 7. Calling | `calling.spec.ts` | Exists (partial) |
| 8. File Sharing | `file-sharing.spec.ts` | Exists (stub) |
| 9. Panels | `panels.spec.ts` | To create |
| 10. Profile | `profile.spec.ts` | To create |
| 11. Settings | `settings.spec.ts` | To create |
| 12. Plugins | `plugins.spec.ts` | To create |
| 13. Command Palette | `command-palette.spec.ts` | To create |
| 14. Notifications | `notifications.spec.ts` | To create |
| 15. Help | `help.spec.ts` | To create |
| 16. Theme | `theme.spec.ts` | To create |
| 17. Persistence | `persistence.spec.ts` | Exists (partial) |
| 18. Deep Linking | `deep-linking.spec.ts` | To create |
| 19. Install Banner | `install-banner.spec.ts` | To create |
| 20. Desktop | `desktop.spec.ts` | To create |
| 21. Edge Cases | `edge-cases.spec.ts` | To create |
| 22. Integration | `integration.spec.ts` | To create |

## Appendix C: Test Management Recommendations

For tracking manual test runs and mapping to automation, consider:

- **[Qase](https://qase.io)** — Free tier, native Playwright reporter (`qase-playwright`), imports from markdown
- **[Allure TestOps](https://qameta.io)** — Rich dashboards, `allure-playwright` reporter, combines manual + automated
- **[TestRail](https://www.testrail.com)** — Industry standard, TestRail CLI imports Playwright results

All three integrate with Playwright via reporters that auto-publish results.

## Appendix D: Interactive Element Summary

| Category | Count |
|----------|-------|
| Toggles | 27+ |
| Dropdowns/Selects | 15+ |
| Sliders | 11+ |
| Text Inputs | 10+ |
| Buttons | 70+ |
| Context Menus | 8 |
| Dialogs/Modals | 12+ |
| Permission Toggles (roles) | 34 |
| Notification Types | 5 categories |
| Sound Categories | 5 |
| Message Action Items | 8 |

---

*Total: ~750+ test cases across 22 sections*
*Generated: 2026-02-26*
