const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = "3234108650748087bb9fed7096170350";
const API = "https://api.notion.com/v1";
const HEADERS = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

async function apiCall(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${data.code}: ${data.message}`);
  return data;
}

function h2(t) { return { object: "block", type: "heading_2", heading_2: { rich_text: [{ text: { content: t } }] } }; }
function h3(t) { return { object: "block", type: "heading_3", heading_3: { rich_text: [{ text: { content: t } }] } }; }
function para(t) { return { object: "block", type: "paragraph", paragraph: { rich_text: [{ text: { content: t } }] } }; }
function code(t, l = "typescript") { return { object: "block", type: "code", code: { rich_text: [{ text: { content: t } }], language: l } }; }
function bullet(t) { return { object: "block", type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ text: { content: t } }] } }; }
function numbered(t) { return { object: "block", type: "numbered_list_item", numbered_list_item: { rich_text: [{ text: { content: t } }] } }; }
function todo(t, c = false) { return { object: "block", type: "to_do", to_do: { rich_text: [{ text: { content: t } }], checked: c } }; }
function divider() { return { object: "block", type: "divider", divider: {} }; }
function callout(t, e = "💡") { return { object: "block", type: "callout", callout: { rich_text: [{ text: { content: t } }], icon: { emoji: e } } }; }

async function createTicket(icon, name, type, priority, areas, children) {
  await apiCall("POST", "/pages", {
    parent: { database_id: DATABASE_ID },
    icon: { emoji: icon },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Type: { select: { name: type } },
      Status: { select: { name: "Inbox" } },
      Priority: { select: { name: priority } },
      Area: { multi_select: areas.map((a) => ({ name: a })) },
    },
    children,
  });
  console.log(`  ${icon} Created: ${name}`);
}

async function main() {
  console.log("Creating tickets...\n");

  // ─── TICKET: Group System Rework ───
  await createTicket(
    "✨",
    "Rework group invite system — notifications integration and improved invite UX",
    "Feature",
    "High",
    ["Frontend - Social", "Frontend - Chat"],
    [
      h2("Feature Summary"),
      para("Rework the group invite experience. Currently, group invites show as a small banner section in the sidebar that's easy to miss and provides minimal information. Invites should integrate with the notification system (with a Join button in notifications) and the sidebar invite banner should be redesigned for a more intuitive flow."),

      h2("Current Problems"),

      h3("1. Invites Are Easy to Miss"),
      para("Group invites only appear as a collapsible 'Group Invites' section in the ChatSidebar, above conversations. There's no sound, no browser notification, no badge on the nav rail, and no entry in the notification panel. If the user isn't looking at the sidebar when the invite arrives, they'll miss it entirely."),

      h3("2. Notification System Exists But Is Unused"),
      para("The NotificationContext already defines a 'group_invite' notification type and maps it to the 'social' category — but no notification record is ever created when a group invite arrives. The infrastructure is there, just not wired up."),
      code(`// SidebarNotificationsPanel.tsx:43 — mapping exists but unused
const TYPE_TO_CATEGORY = {
  group_invite: 'social',      // ← Never actually receives these
  community_invite: 'social',  // ← Never actually receives these
  friend_request_received: 'social',
  // ...
};`, "typescript"),

      h3("3. Invite Card Shows Minimal Information"),
      para("The current invite card only shows group name and inviter name. Missing:"),
      bullet("Group description (field exists in PendingGroupInvite but not rendered)"),
      bullet("Member count or member list preview"),
      bullet("Group avatar"),
      bullet("When the invite was received (timestamp)"),
      bullet("Group activity indicator (active group vs dead group)"),

      h3("4. No Feedback During Accept/Decline"),
      para("When the user clicks Accept or Decline, nothing visually changes. The relay roundtrip takes 1-3 seconds, during which the button looks unchanged. No loading state, no confirmation toast, no transition animation."),

      h3("5. No Undo or History"),
      para("Once an invite is accepted or declined, it vanishes completely. There's no record of past invites, no 'undo decline' option, and no way to see what groups you were invited to."),

      h3("6. Mobile Layout Issues"),
      para("Two full-width buttons (Accept/Decline) waste vertical space on mobile. The cards are visually heavy for the small sidebar width."),

      h2("Current Architecture"),

      h3("Invite Storage & Flow"),
      code(`// End-to-end flow:
Sender: createGroup/addMember → WASM builds invite envelope → relay sends

Receiver: relay delivers → WASM stores in SQLite → GroupsProvider refetches
  → pendingInvites state updates → ChatSidebar re-renders invite section

Accept: WASM decrypts group key via ECDH → creates group + conversation
  → sends acceptance ack to inviter → invite removed from sidebar

Decline: WASM builds decline envelope → deletes invite from DB
  → sends decline ack to inviter → invite removed from sidebar`, "plain text"),

      h3("Key Data Structure"),
      code(`interface PendingGroupInvite {
  id: string;
  groupId: string;
  groupName: string;
  description?: string;     // EXISTS but not displayed
  inviterDid: string;
  inviterName: string;
  encryptedGroupKey: string;
  nonce: string;
  membersJson: string;      // EXISTS — could show member count
  status: string;
  createdAt: number;        // EXISTS but not displayed
}`, "typescript"),

      h2("Proposed Changes"),

      h3("Part 1: Integrate with Notification System"),
      para("When a group invite arrives, create a NotificationRecord in addition to storing the PendingGroupInvite."),
      todo("In the group invite handler (useNetwork.ts or service event listener), call createNotification() with type 'group_invite'"),
      todo("Notification title: '{inviterName} invited you to {groupName}'"),
      todo("Notification description: group description or member count"),
      todo("Set relatedId to inviteId for action routing"),
      todo("Play a notification sound when invite arrives"),
      todo("Show unread badge on notification bell in NavigationRail"),

      h3("Part 2: Add Join Button to Notification Item"),
      todo("Extend NotificationItem in SidebarNotificationsPanel to render action buttons for group_invite type"),
      todo("Show 'Join' primary button and 'Decline' secondary button inline on the notification"),
      todo("On Join click: call acceptInvite(relatedId), mark notification as actioned"),
      todo("On Decline click: call declineInvite(relatedId), mark notification as actioned"),
      todo("After action: notification stays in history (marked as 'accepted' or 'declined')"),

      code(`// Proposed notification rendering for group_invite:
// ┌──────────────────────────────────────────────────────┐
// │ 👥  Alice invited you to ProjectChat        2m ago  │
// │     "A group for discussing the new project"        │
// │     5 members                                       │
// │     ┌────────────┐  ┌─────────────┐                 │
// │     │  ✓ Join    │  │  ✗ Decline  │                 │
// │     └────────────┘  └─────────────┘                 │
// └──────────────────────────────────────────────────────┘`, "plain text"),

      h3("Part 3: Redesign Sidebar Invite Banner"),
      todo("Replace current flat card with a richer invite preview"),
      todo("Show: group avatar, group name, inviter name, member count (parse membersJson), timestamp"),
      todo("Show group description if available (truncated to 2 lines)"),
      todo("Add loading state to Accept/Decline buttons (spinner during relay roundtrip)"),
      todo("Add success animation/toast when invite accepted ('Joined {groupName}!')"),
      todo("Consider swipe-to-accept on mobile (swipe right = accept, swipe left = decline)"),
      todo("Show invite age ('2 hours ago', 'Yesterday')"),

      h3("Part 4: Invite Preview Modal (Optional Enhancement)"),
      todo("Add 'Preview' action to invite card — opens a modal with full group info"),
      todo("Show: group name, description, full member list with avatars, inviter profile"),
      todo("Join/Decline buttons in the modal"),
      todo("Helps users make informed decisions before joining"),

      h2("Key Files to Modify"),
      bullet("src/components/sidebar/ChatSidebar.tsx — Redesign invite banner (lines 283-333)"),
      bullet("src/components/sidebar/SidebarNotificationsPanel.tsx — Add group invite rendering with action buttons"),
      bullet("src/contexts/NotificationContext.tsx — Wire up group invite notification creation"),
      bullet("src/contexts/GroupsContext.tsx — Emit notification on inviteReceived event"),
      bullet("src/hooks/useNetwork.ts — May need to trigger notification creation here"),
      bullet("packages/umbra-service/src/notifications.ts — Verify createNotification supports group_invite"),
      bullet("packages/umbra-service/src/types.ts — PendingGroupInvite (already has description, membersJson)"),
      bullet("app/(main)/_layout.tsx — Wire accept/decline handlers from notifications panel"),

      h2("Acceptance Criteria"),
      todo("Group invites appear in the notification panel under 'Social' category"),
      todo("Notification shows group name, inviter, description, and member count"),
      todo("Join and Decline buttons work directly from the notification item"),
      todo("Notification bell shows unread badge when invite arrives"),
      todo("Sound plays when group invite received"),
      todo("Sidebar invite banner shows richer information (description, member count, timestamp)"),
      todo("Accept/Decline buttons show loading state during relay roundtrip"),
      todo("Success feedback shown after accepting (toast or animation)"),
      todo("Invite history preserved in notifications (even after accept/decline)"),
      todo("Mobile layout is improved (compact buttons, less wasted space)"),
      todo("No regression in existing group functionality (create, message, leave)"),
    ]
  );

  console.log("\n=== Ticket created! ===");
}

main().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
