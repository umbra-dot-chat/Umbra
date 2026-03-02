use std::collections::HashMap;
use std::time::Instant;

use base64::Engine as _;
use crossterm::event::{KeyCode, KeyEvent};
use umbra_core::messaging::Conversation;

use crate::relay::RelayEvent;

use super::*;

impl App {
    pub(super) fn handle_chat_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        // Get the current focus
        let focus = if let Screen::Chat { focus, .. } = &self.screen {
            *focus
        } else {
            return None;
        };

        // Input mode — all keys go to message editing
        if focus == ChatFocus::Input {
            return self.handle_input_mode_key(key);
        }

        // ── Message action modes (react picker, delete confirm, edit) ──
        if let Some(action) = self.message_action_mode {
            match action {
                MessageAction::React => {
                    let emoji = match key.code {
                        KeyCode::Char('1') => Some("\u{1F44D}"), // thumbs up
                        KeyCode::Char('2') => Some("\u{2764}\u{FE0F}"), // heart
                        KeyCode::Char('3') => Some("\u{1F602}"), // face with tears of joy
                        KeyCode::Char('4') => Some("\u{1F525}"), // fire
                        KeyCode::Char('5') => Some("\u{1F4AF}"), // 100
                        KeyCode::Esc => {
                            self.message_action_mode = None;
                            return None;
                        }
                        _ => None,
                    };
                    if let Some(emoji) = emoji {
                        if let Some(sel) = self.selected_message {
                            if sel < self.messages.len() {
                                let msg_id = self.messages[sel].id.clone();
                                let conv_id = self.get_active_conversation_id();
                                if let Some(conv_id) = conv_id {
                                    self.send_reaction(&msg_id, emoji, &conv_id, true);
                                }
                            }
                        }
                        self.message_action_mode = None;
                    }
                    return None;
                }
                MessageAction::Delete => {
                    match key.code {
                        KeyCode::Char('y') | KeyCode::Enter => {
                            if let Some(sel) = self.selected_message {
                                if sel < self.messages.len() && self.messages[sel].is_mine {
                                    let msg_id = self.messages[sel].id.clone();
                                    if let Some(ref group_id) = self.active_group.clone() {
                                        self.send_group_message_delete(&msg_id, group_id);
                                    } else if self.active_channel.is_some() {
                                        self.send_community_message_delete(&msg_id);
                                    } else {
                                        let conv_id = self.get_active_conversation_id();
                                        if let Some(conv_id) = conv_id {
                                            self.send_message_delete(&msg_id, &conv_id);
                                        }
                                    }
                                }
                            }
                            self.message_action_mode = None;
                            self.selected_message = None;
                        }
                        KeyCode::Char('n') | KeyCode::Esc => {
                            self.message_action_mode = None;
                        }
                        _ => {}
                    }
                    return None;
                }
                MessageAction::Edit => {
                    match key.code {
                        KeyCode::Enter => {
                            let new_content = self.edit_buffer.trim().to_string();
                            if !new_content.is_empty() {
                                if let Some(sel) = self.selected_message {
                                    if sel < self.messages.len() && self.messages[sel].is_mine {
                                        let msg_id = self.messages[sel].id.clone();
                                        if let Some(ref group_id) = self.active_group.clone() {
                                            self.send_group_message_edit(&msg_id, &new_content, group_id);
                                        } else if self.active_channel.is_some() {
                                            self.send_community_message_edit(&msg_id, &new_content);
                                        } else {
                                            let conv_id = self.get_active_conversation_id();
                                            if let Some(conv_id) = conv_id {
                                                self.send_message_edit(&msg_id, &new_content, &conv_id);
                                            }
                                        }
                                    }
                                }
                            }
                            self.message_action_mode = None;
                            self.selected_message = None;
                            self.edit_buffer.clear();
                            self.edit_cursor = 0;
                        }
                        KeyCode::Esc => {
                            self.message_action_mode = None;
                            self.edit_buffer.clear();
                            self.edit_cursor = 0;
                        }
                        KeyCode::Backspace => {
                            if self.edit_cursor > 0 {
                                self.edit_buffer.remove(self.edit_cursor - 1);
                                self.edit_cursor -= 1;
                            }
                        }
                        KeyCode::Left => {
                            self.edit_cursor = self.edit_cursor.saturating_sub(1);
                        }
                        KeyCode::Right => {
                            if self.edit_cursor < self.edit_buffer.len() {
                                self.edit_cursor += 1;
                            }
                        }
                        KeyCode::Char(c) => {
                            self.edit_buffer.insert(self.edit_cursor, c);
                            self.edit_cursor += 1;
                        }
                        _ => {}
                    }
                    return None;
                }
                MessageAction::Pin => {
                    // Pin action is immediate, shouldn't linger
                    self.message_action_mode = None;
                }
            }
        }

        // ── Message selection mode navigation ──
        if self.selected_message.is_some() && focus == ChatFocus::MainArea {
            match key.code {
                KeyCode::Up => {
                    if let Some(sel) = self.selected_message {
                        if sel > 0 {
                            self.selected_message = Some(sel - 1);
                        }
                    }
                    return None;
                }
                KeyCode::Down => {
                    if let Some(sel) = self.selected_message {
                        if sel + 1 < self.messages.len() {
                            self.selected_message = Some(sel + 1);
                        }
                    }
                    return None;
                }
                KeyCode::Esc => {
                    self.selected_message = None;
                    return None;
                }
                KeyCode::Char('e') => {
                    // Enter edit mode for selected own message
                    if let Some(sel) = self.selected_message {
                        if sel < self.messages.len() && self.messages[sel].is_mine && !self.messages[sel].deleted {
                            self.edit_buffer = self.messages[sel].content.clone();
                            self.edit_cursor = self.edit_buffer.len();
                            self.message_action_mode = Some(MessageAction::Edit);
                        }
                    }
                    return None;
                }
                KeyCode::Char('d') => {
                    // Delete selected own message (show confirm)
                    if let Some(sel) = self.selected_message {
                        if sel < self.messages.len() && self.messages[sel].is_mine && !self.messages[sel].deleted {
                            self.message_action_mode = Some(MessageAction::Delete);
                        }
                    }
                    return None;
                }
                KeyCode::Char('+') => {
                    // React to selected message
                    if let Some(sel) = self.selected_message {
                        if sel < self.messages.len() && !self.messages[sel].deleted {
                            self.message_action_mode = Some(MessageAction::React);
                        }
                    }
                    return None;
                }
                KeyCode::Char('p') => {
                    // Pin/unpin selected message
                    if let Some(sel) = self.selected_message {
                        if sel < self.messages.len() && !self.messages[sel].deleted {
                            let msg_id = self.messages[sel].id.clone();
                            let conv_id = self.get_active_conversation_id();
                            if let Some(conv_id) = conv_id {
                                self.send_pin_toggle(&msg_id, &conv_id);
                            }
                        }
                    }
                    return None;
                }
                _ => {
                    // Other keys fall through to normal handling
                }
            }
        }

        match key.code {
            KeyCode::Char('q') => {
                if focus != ChatFocus::Input {
                    self.should_quit = true;
                }
            }
            KeyCode::Char('a') => {
                // Navigate to Add Friend modal
                if let Screen::Chat { info, friends, selected_friend, .. } = &self.screen {
                    self.input.clear();
                    self.cursor_pos = 0;
                    self.search_results.clear();
                    self.selected_result = 0;
                    self.searching = false;
                    self.screen = Screen::AddFriend {
                        info: info.clone(),
                        friends: friends.clone(),
                        selected_friend: *selected_friend,
                    };
                }
            }
            KeyCode::Char('r') => {
                // Navigate to Friend Requests modal — load from local DB
                if let Screen::Chat { info, friends, selected_friend, .. } = &self.screen {
                    let requests = self.load_requests_from_db();
                    let blocked = self.load_blocked_from_db();
                    self.screen = Screen::FriendRequests {
                        info: info.clone(),
                        friends: friends.clone(),
                        selected_friend: *selected_friend,
                        requests,
                        selected_request: 0,
                        active_tab: RequestTab::Incoming,
                        blocked,
                    };
                }
            }
            KeyCode::Char('x') => {
                // Remove selected friend
                if let Screen::Chat { focus: ChatFocus::Sidebar, friends, selected_friend, .. } = &self.screen {
                    if !friends.is_empty() {
                        let friend = &friends[*selected_friend];
                        if let Some(ref db) = self.db {
                            let _ = db.remove_friend(&friend.did);
                        }
                        if let Screen::Chat { friends, selected_friend, active_conversation, .. } = &mut self.screen {
                            friends.remove(*selected_friend);
                            if *selected_friend > 0 && *selected_friend >= friends.len() {
                                *selected_friend = friends.len().saturating_sub(1);
                            }
                            *active_conversation = None;
                        }
                    }
                }
            }
            KeyCode::Char('b') => {
                // Block selected friend
                if let Screen::Chat { focus: ChatFocus::Sidebar, friends, selected_friend, .. } = &self.screen {
                    if !friends.is_empty() {
                        let friend = &friends[*selected_friend];
                        if let Some(ref db) = self.db {
                            let _ = db.block_user(
                                &friend.did,
                                Some(&friend.display_name),
                                friend.username.as_deref(),
                            );
                        }
                        if let Screen::Chat { friends, selected_friend, active_conversation, .. } = &mut self.screen {
                            friends.remove(*selected_friend);
                            if *selected_friend > 0 && *selected_friend >= friends.len() {
                                *selected_friend = friends.len().saturating_sub(1);
                            }
                            *active_conversation = None;
                        }
                    }
                }
            }
            KeyCode::Char('g') => {
                // Toggle sidebar mode between DMs and Groups
                if focus == ChatFocus::Sidebar {
                    self.sidebar_mode = match self.sidebar_mode {
                        SidebarMode::DMs => {
                            // Load/refresh groups when switching to Groups mode
                            self.load_groups_from_db();
                            SidebarMode::Groups
                        }
                        SidebarMode::Groups => SidebarMode::DMs,
                    };
                    // Clear active conversation/group when switching modes
                    if let Screen::Chat { active_conversation, .. } = &mut self.screen {
                        *active_conversation = None;
                    }
                    self.active_group = None;
                    self.messages.clear();
                    self.message_scroll = 0;
                }
            }
            KeyCode::Char('n') => {
                if self.nav_route == NavRoute::Communities && focus == ChatFocus::Sidebar {
                    // Create a new community
                    if let Screen::Chat { info, .. } = &self.screen {
                        self.screen = Screen::CreateCommunity {
                            info: info.clone(),
                            community_name: String::new(),
                            community_description: String::new(),
                            field_focus: CreateCommunityFocus::Name,
                        };
                    }
                } else if focus == ChatFocus::Sidebar && self.sidebar_mode == SidebarMode::Groups {
                    // Create a new group (only when in Groups sidebar mode)
                    if let Screen::Chat { info, friends, selected_friend, .. } = &self.screen {
                        let member_count = friends.len();
                        self.screen = Screen::CreateGroup {
                            info: info.clone(),
                            friends: friends.clone(),
                            selected_friend: *selected_friend,
                            group_name: String::new(),
                            selected_members: vec![false; member_count],
                            member_cursor: 0,
                            field_focus: CreateGroupFocus::Name,
                        };
                    }
                }
            }
            KeyCode::Char('m') => {
                // Show community members (only when in Communities route with active community)
                if self.nav_route == NavRoute::Communities && self.active_community.is_some() {
                    if let Screen::Chat { info, .. } = &self.screen {
                        let community_id = self.active_community.clone().unwrap();
                        let community_name = self.communities.iter()
                            .find(|c| c.id == community_id)
                            .map(|c| c.name.clone())
                            .unwrap_or_default();
                        let members = if let Some(ref db) = self.db {
                            db.load_community_members(&community_id)
                                .unwrap_or_default()
                                .into_iter()
                                .map(|m| CommunityMemberEntry {
                                    did: m.did,
                                    display_name: m.display_name,
                                })
                                .collect()
                        } else {
                            Vec::new()
                        };
                        self.screen = Screen::CommunityMembers {
                            info: info.clone(),
                            community_id,
                            community_name,
                            members,
                            selected_member: 0,
                        };
                    }
                }
            }
            KeyCode::Char('I') => {
                // Show community invites (only when in Communities route with active community)
                if self.nav_route == NavRoute::Communities && self.active_community.is_some() {
                    if let Screen::Chat { info, .. } = &self.screen {
                        let community_id = self.active_community.clone().unwrap();
                        let community_name = self.communities.iter()
                            .find(|c| c.id == community_id)
                            .map(|c| c.name.clone())
                            .unwrap_or_default();
                        let invites = if let Some(ref db) = self.db {
                            db.load_invites(&community_id)
                                .unwrap_or_default()
                                .into_iter()
                                .map(|inv| InviteEntry {
                                    id: inv.id,
                                    community_id: inv.community_id,
                                    code: inv.code,
                                    creator_did: inv.creator_did,
                                    max_uses: inv.max_uses,
                                    use_count: inv.use_count,
                                    expires_at: inv.expires_at,
                                    created_at: inv.created_at,
                                })
                                .collect()
                        } else {
                            Vec::new()
                        };
                        self.screen = Screen::CommunityInvites {
                            info: info.clone(),
                            community_id,
                            community_name,
                            invites,
                            selected_invite: 0,
                        };
                    }
                }
            }
            KeyCode::Char('j') => {
                // Join community by invite code (from Communities sidebar, no active community)
                if self.nav_route == NavRoute::Communities && focus == ChatFocus::Sidebar && self.active_community.is_none() {
                    if let Screen::Chat { info, .. } = &self.screen {
                        self.screen = Screen::JoinCommunity {
                            info: info.clone(),
                            invite_code_input: String::new(),
                            resolved_invite: None,
                            resolving: false,
                        };
                    }
                }
            }
            KeyCode::Char('R') => {
                // Show community roles (only when in Communities route with active community)
                if self.nav_route == NavRoute::Communities && self.active_community.is_some() {
                    if let Screen::Chat { info, .. } = &self.screen {
                        let community_id = self.active_community.clone().unwrap();
                        let community_name = self.communities.iter()
                            .find(|c| c.id == community_id)
                            .map(|c| c.name.clone())
                            .unwrap_or_default();
                        let roles = if let Some(ref db) = self.db {
                            db.load_roles(&community_id)
                                .unwrap_or_default()
                                .into_iter()
                                .map(|r| RoleEntry {
                                    id: r.id,
                                    name: r.name,
                                    permissions: r.permissions,
                                    position: r.position,
                                    color: r.color,
                                })
                                .collect()
                        } else {
                            Vec::new()
                        };
                        self.screen = Screen::CommunityRoles {
                            info: info.clone(),
                            community_id,
                            community_name,
                            roles,
                            selected_role: 0,
                        };
                    }
                }
            }
            KeyCode::Char('l') => {
                if self.nav_route == NavRoute::Communities && focus == ChatFocus::Sidebar {
                    // Leave selected community
                    if self.active_community.is_none() {
                        // In community list — leave selected community
                        if !self.communities.is_empty() && self.selected_community < self.communities.len() {
                            let comm_id = self.communities[self.selected_community].id.clone();
                            let comm_name = self.communities[self.selected_community].name.clone();
                            self.leave_community(&comm_id);
                            self.error_message = Some(format!("Left community '{}'", comm_name));
                        }
                    }
                } else if focus == ChatFocus::Sidebar && self.sidebar_mode == SidebarMode::Groups {
                    // Leave selected group (only in Groups sidebar mode)
                    if !self.groups.is_empty() && self.selected_group < self.groups.len() {
                        let group_id = self.groups[self.selected_group].id.clone();
                        let group_name = self.groups[self.selected_group].name.clone();
                        self.leave_group(&group_id);
                        self.error_message = Some(format!("Left group '{}'", group_name));
                    }
                }
            }
            KeyCode::Char('e') => {
                // Enter message selection mode (select last message)
                if focus == ChatFocus::MainArea && self.selected_message.is_none() {
                    let has_active = if self.active_group.is_some() {
                        true
                    } else if self.active_channel.is_some() {
                        true
                    } else if let Screen::Chat { active_conversation, .. } = &self.screen {
                        active_conversation.is_some()
                    } else {
                        false
                    };
                    if has_active && !self.messages.is_empty() {
                        self.selected_message = Some(self.messages.len() - 1);
                    }
                }
            }
            KeyCode::Char('i') | KeyCode::Char('/') => {
                // Enter input mode when in main area with active conversation/group/channel
                if focus == ChatFocus::MainArea {
                    let has_active = if self.active_group.is_some() {
                        true
                    } else if self.active_channel.is_some() {
                        true
                    } else if let Screen::Chat { active_conversation, .. } = &self.screen {
                        active_conversation.is_some()
                    } else {
                        false
                    };
                    if has_active {
                        if let Screen::Chat { focus: f, .. } = &mut self.screen {
                            *f = ChatFocus::Input;
                            self.message_input.clear();
                            self.message_cursor = 0;
                        }
                    }
                }
            }
            KeyCode::Tab => {
                if let Screen::Chat { focus, active_conversation, .. } = &mut self.screen {
                    let has_active = active_conversation.is_some() || self.active_group.is_some() || self.active_channel.is_some();
                    *focus = match focus {
                        ChatFocus::TabBar => ChatFocus::Sidebar,
                        ChatFocus::Sidebar => ChatFocus::MainArea,
                        ChatFocus::MainArea => {
                            if has_active {
                                ChatFocus::Input
                            } else {
                                ChatFocus::TabBar
                            }
                        }
                        ChatFocus::Input => ChatFocus::TabBar,
                    };
                }
            }
            KeyCode::BackTab => {
                if let Screen::Chat { focus, active_conversation, .. } = &mut self.screen {
                    let has_active = active_conversation.is_some() || self.active_group.is_some() || self.active_channel.is_some();
                    *focus = match focus {
                        ChatFocus::TabBar => {
                            if has_active {
                                ChatFocus::Input
                            } else {
                                ChatFocus::MainArea
                            }
                        }
                        ChatFocus::Sidebar => ChatFocus::TabBar,
                        ChatFocus::MainArea => ChatFocus::Sidebar,
                        ChatFocus::Input => ChatFocus::MainArea,
                    };
                }
            }
            KeyCode::Left => {
                if focus == ChatFocus::TabBar {
                    self.nav_route = match self.nav_route {
                        NavRoute::Home => NavRoute::Home,
                        NavRoute::Messages => NavRoute::Home,
                        NavRoute::Communities => NavRoute::Messages,
                        NavRoute::Settings => NavRoute::Communities,
                    };
                }
            }
            KeyCode::Right => {
                if focus == ChatFocus::TabBar {
                    self.nav_route = match self.nav_route {
                        NavRoute::Home => NavRoute::Messages,
                        NavRoute::Messages => NavRoute::Communities,
                        NavRoute::Communities => NavRoute::Settings,
                        NavRoute::Settings => NavRoute::Settings,
                    };
                }
            }
            KeyCode::Up => {
                match focus {
                    ChatFocus::Sidebar => {
                        if self.nav_route == NavRoute::Communities {
                            // Community sidebar navigation
                            if self.active_community.is_some() {
                                // Navigate channel tree
                                if self.selected_channel_item > 0 {
                                    self.selected_channel_item -= 1;
                                }
                            } else {
                                // Navigate community list
                                if self.selected_community > 0 {
                                    self.selected_community -= 1;
                                }
                            }
                        } else if self.sidebar_mode == SidebarMode::Groups {
                            if self.selected_group > 0 {
                                self.selected_group -= 1;
                            }
                        } else if let Screen::Chat { selected_friend, friends, .. } = &mut self.screen {
                            if !friends.is_empty() && *selected_friend > 0 {
                                *selected_friend -= 1;
                            }
                        }
                    }
                    ChatFocus::MainArea => {
                        // Scroll up in messages
                        if !self.messages.is_empty() {
                            self.message_scroll = self.message_scroll.saturating_add(1)
                                .min(self.messages.len().saturating_sub(1));
                        }
                    }
                    _ => {}
                }
            }
            KeyCode::Down => {
                match focus {
                    ChatFocus::Sidebar => {
                        if self.nav_route == NavRoute::Communities {
                            // Community sidebar navigation
                            if self.active_community.is_some() {
                                // Navigate channel tree
                                if !self.channel_tree.is_empty() && self.selected_channel_item < self.channel_tree.len() - 1 {
                                    self.selected_channel_item += 1;
                                }
                            } else {
                                // Navigate community list
                                if !self.communities.is_empty() && self.selected_community < self.communities.len() - 1 {
                                    self.selected_community += 1;
                                }
                            }
                        } else if self.sidebar_mode == SidebarMode::Groups {
                            if !self.groups.is_empty() && self.selected_group < self.groups.len() - 1 {
                                self.selected_group += 1;
                            }
                        } else if let Screen::Chat { selected_friend, friends, .. } = &mut self.screen {
                            if !friends.is_empty() && *selected_friend < friends.len() - 1 {
                                *selected_friend += 1;
                            }
                        }
                    }
                    ChatFocus::MainArea => {
                        // Scroll down in messages
                        self.message_scroll = self.message_scroll.saturating_sub(1);
                    }
                    _ => {}
                }
            }
            KeyCode::Enter => {
                match focus {
                    ChatFocus::TabBar => {
                        // Selecting a route already set by Up/Down
                        if let Screen::Chat { focus, .. } = &mut self.screen {
                            *focus = ChatFocus::Sidebar;
                        }
                        // When entering Communities route, load fresh data
                        if self.nav_route == NavRoute::Communities {
                            self.load_communities_from_db();
                        }
                    }
                    ChatFocus::Sidebar => {
                        if self.nav_route == NavRoute::Communities {
                            // Community sidebar Enter handling
                            if self.active_community.is_some() {
                                // In channel tree: select a channel
                                if self.selected_channel_item < self.channel_tree.len() {
                                    let item = self.channel_tree[self.selected_channel_item].clone();
                                    if let ChannelTreeItem::Channel { id, name, channel_type } = item {
                                        if channel_type == "text" {
                                            self.active_channel = Some(id.clone());
                                            self.active_channel_name = Some(name);
                                            self.load_channel_messages(&id);
                                            if let Screen::Chat { focus, .. } = &mut self.screen {
                                                *focus = ChatFocus::MainArea;
                                            }
                                        }
                                    }
                                }
                            } else {
                                // In community list: open a community
                                if !self.communities.is_empty() && self.selected_community < self.communities.len() {
                                    self.open_community(self.selected_community);
                                    if let Screen::Chat { focus, .. } = &mut self.screen {
                                        *focus = ChatFocus::Sidebar;
                                    }
                                }
                            }
                        } else if self.sidebar_mode == SidebarMode::Groups {
                            // Open a group conversation
                            if !self.groups.is_empty() && self.selected_group < self.groups.len() {
                                let group_id = self.groups[self.selected_group].id.clone();
                                self.active_group = Some(group_id.clone());

                                // Clear DM active conversation
                                if let Screen::Chat { active_conversation, focus, .. } = &mut self.screen {
                                    *active_conversation = None;
                                    *focus = ChatFocus::MainArea;
                                }

                                // Clear message selection state
                                self.selected_message = None;
                                self.message_action_mode = None;

                                // Load group messages
                                self.messages = self.load_group_messages_from_db(&group_id);
                                self.message_scroll = 0;
                            }
                        } else {
                            if let Screen::Chat { selected_friend, friends, active_conversation, focus, .. } = &mut self.screen {
                                if !friends.is_empty() {
                                    let friend_did = friends[*selected_friend].did.clone();
                                    *active_conversation = Some(*selected_friend);
                                    *focus = ChatFocus::MainArea;

                                    // Clear group active state
                                    self.active_group = None;

                                    // Clear message selection state
                                    self.selected_message = None;
                                    self.message_action_mode = None;

                                    // Load messages for this conversation
                                    if let Some(ref my_did) = self.my_did {
                                        let conv_id = Conversation::generate_id(my_did, &friend_did);
                                        self.messages = self.load_messages_from_db(&conv_id);
                                        self.message_scroll = 0;

                                        // Clear unread count
                                        if let Some(ref db) = self.db {
                                            let _ = db.clear_unread(&conv_id);
                                        }

                                        // Auto-send read receipt for last message
                                        if let Some(last) = self.messages.last() {
                                            if !last.is_mine {
                                                let msg_id = last.id.clone();
                                                self.send_read_receipt(&msg_id, &conv_id);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    ChatFocus::MainArea => {
                        // Enter input mode
                        let has_active = if self.active_group.is_some() {
                            true
                        } else if self.active_channel.is_some() {
                            true
                        } else if let Screen::Chat { active_conversation, .. } = &self.screen {
                            active_conversation.is_some()
                        } else {
                            false
                        };
                        if has_active {
                            if let Screen::Chat { focus, .. } = &mut self.screen {
                                *focus = ChatFocus::Input;
                                self.message_input.clear();
                                self.message_cursor = 0;
                            }
                        }
                    }
                    _ => {}
                }
            }
            KeyCode::Esc => {
                match focus {
                    ChatFocus::MainArea => {
                        if self.nav_route == NavRoute::Communities {
                            // Go back to channel tree sidebar
                            if let Screen::Chat { focus, .. } = &mut self.screen {
                                *focus = ChatFocus::Sidebar;
                            }
                            self.active_channel = None;
                            self.active_channel_name = None;
                            self.messages.clear();
                            self.message_scroll = 0;
                        } else {
                            if let Screen::Chat { active_conversation, focus, .. } = &mut self.screen {
                                *active_conversation = None;
                                *focus = ChatFocus::Sidebar;
                                self.active_group = None;
                                self.messages.clear();
                                self.message_scroll = 0;
                            }
                        }
                    }
                    ChatFocus::Sidebar => {
                        if self.nav_route == NavRoute::Communities && self.active_community.is_some() {
                            // Go back to community list
                            self.active_community = None;
                            self.active_channel = None;
                            self.active_channel_name = None;
                            self.channel_tree.clear();
                            self.community_spaces.clear();
                            self.messages.clear();
                            self.message_scroll = 0;
                        } else {
                            if let Screen::Chat { focus, .. } = &mut self.screen {
                                *focus = ChatFocus::TabBar;
                            }
                        }
                    }
                    _ => {}
                }
            }
            _ => {}
        }
        None
    }

    /// Handle keys when in message input mode.
    pub(super) fn handle_input_mode_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Esc => {
                if let Screen::Chat { focus, .. } = &mut self.screen {
                    *focus = ChatFocus::MainArea;
                }
            }
            KeyCode::Enter => {
                let text = self.message_input.trim().to_string();
                if !text.is_empty() {
                    if self.active_group.is_some() {
                        self.send_group_message(&text);
                    } else if self.active_channel.is_some() {
                        self.send_community_message(&text);
                    } else {
                        self.send_message(&text);
                    }
                    self.message_input.clear();
                    self.message_cursor = 0;
                }
            }
            KeyCode::Backspace => {
                if self.message_cursor > 0 {
                    self.message_input.remove(self.message_cursor - 1);
                    self.message_cursor -= 1;
                }
            }
            KeyCode::Delete => {
                if self.message_cursor < self.message_input.len() {
                    self.message_input.remove(self.message_cursor);
                }
            }
            KeyCode::Left => {
                self.message_cursor = self.message_cursor.saturating_sub(1);
            }
            KeyCode::Right => {
                if self.message_cursor < self.message_input.len() {
                    self.message_cursor += 1;
                }
            }
            KeyCode::Home => {
                self.message_cursor = 0;
            }
            KeyCode::End => {
                self.message_cursor = self.message_input.len();
            }
            KeyCode::Char(c) => {
                self.message_input.insert(self.message_cursor, c);
                self.message_cursor += 1;

                // Auto-send typing indicator (debounced — every 3s)
                let should_send = match self.last_typing_sent {
                    Some(last) => last.elapsed().as_secs() >= 3,
                    None => true,
                };
                if should_send {
                    if let Some(conv_id) = self.get_active_conversation_id() {
                        self.send_typing_indicator(&conv_id);
                        self.last_typing_sent = Some(Instant::now());
                    }
                }
            }
            _ => {}
        }
        None
    }

    pub(super) fn handle_add_friend_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Enter => {
                if !self.search_results.is_empty() {
                    // Send a friend request to the selected result
                    let result = self.search_results[self.selected_result].clone();
                    let display_name = result
                        .username
                        .as_deref()
                        .unwrap_or(result.did.as_str())
                        .to_string();

                    // Check if already a friend
                    if let Screen::AddFriend { friends, .. } = &self.screen {
                        if friends.iter().any(|f| f.did == result.did) {
                            self.error_message = Some("Already in your friends list".into());
                            return None;
                        }
                    }

                    // Check if blocked
                    if let Some(ref db) = self.db {
                        if db.is_blocked(&result.did).unwrap_or(false) {
                            self.error_message = Some("This user is blocked".into());
                            return None;
                        }
                        // Check if already has a pending request
                        if db.has_pending_request(&result.did).unwrap_or(false) {
                            self.error_message = Some("Request already pending".into());
                            return None;
                        }
                    }

                    // Generate request ID and save
                    let request_id = uuid::Uuid::new_v4().to_string();

                    if let Some(ref db) = self.db {
                        let _ = db.save_friend_request(
                            &request_id,
                            &result.did,
                            &display_name,
                            result.username.as_deref(),
                            "outgoing",
                        );
                    }

                    // Send friend_request envelope over relay
                    if let (Some(ref relay), Some(ref identity), Some(ref my_did)) =
                        (&self.relay_handle, &self.identity, &self.my_did)
                    {
                        let keys = identity.public_keys();
                        let ts = std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs() as i64;

                        let envelope = serde_json::json!({
                            "envelope": "friend_request",
                            "version": 1,
                            "payload": {
                                "id": request_id,
                                "fromDid": my_did,
                                "fromDisplayName": identity.profile().display_name,
                                "fromAvatar": serde_json::Value::Null,
                                "fromSigningKey": hex::encode(keys.signing),
                                "fromEncryptionKey": hex::encode(keys.encryption),
                                "message": serde_json::Value::Null,
                                "createdAt": ts,
                            }
                        });

                        relay.send(result.did.clone(), envelope.to_string());
                    }

                    self.error_message = Some(format!("Friend request sent to {display_name}"));

                    // Return to chat
                    if let Screen::AddFriend { info, friends, selected_friend } = &self.screen {
                        self.search_results.clear();
                        self.selected_result = 0;
                        self.searching = false;
                        self.screen = Screen::Chat {
                            info: info.clone(),
                            focus: ChatFocus::Sidebar,
                            friends: friends.clone(),
                            selected_friend: *selected_friend,
                            active_conversation: None,
                        };
                    }
                } else {
                    // Fire search
                    let query = self.input.trim().to_string();
                    if query.is_empty() {
                        self.error_message = Some("Enter a username or DID".into());
                        return None;
                    }
                    self.searching = true;
                    return Some(AsyncAction::SearchUser { query });
                }
            }
            KeyCode::Up => {
                if !self.search_results.is_empty() && self.selected_result > 0 {
                    self.selected_result -= 1;
                }
            }
            KeyCode::Down => {
                if !self.search_results.is_empty()
                    && self.selected_result < self.search_results.len() - 1
                {
                    self.selected_result += 1;
                }
            }
            KeyCode::Esc => {
                if !self.search_results.is_empty() {
                    // Clear results, go back to input mode
                    self.search_results.clear();
                    self.selected_result = 0;
                } else {
                    // Return to chat
                    if let Screen::AddFriend { info, friends, selected_friend } = &self.screen {
                        self.screen = Screen::Chat {
                            info: info.clone(),
                            focus: ChatFocus::Sidebar,
                            friends: friends.clone(),
                            selected_friend: *selected_friend,
                            active_conversation: None,
                        };
                    }
                }
            }
            _ => {
                // Any typing clears results to go back to input mode
                if !self.search_results.is_empty() {
                    self.search_results.clear();
                    self.selected_result = 0;
                }
                self.handle_text_input(key);
            }
        }
        None
    }

    pub(super) fn handle_friend_requests_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        match key.code {
            KeyCode::Tab => {
                if let Screen::FriendRequests { active_tab, selected_request, .. } = &mut self.screen {
                    *active_tab = match active_tab {
                        RequestTab::Incoming => RequestTab::Outgoing,
                        RequestTab::Outgoing => RequestTab::Blocked,
                        RequestTab::Blocked => RequestTab::Incoming,
                    };
                    *selected_request = 0;
                }
            }
            KeyCode::Up => {
                if let Screen::FriendRequests { selected_request, .. } = &mut self.screen {
                    if *selected_request > 0 {
                        *selected_request -= 1;
                    }
                }
            }
            KeyCode::Down => {
                if let Screen::FriendRequests { selected_request, requests, active_tab, blocked, .. } = &mut self.screen {
                    let count = match active_tab {
                        RequestTab::Blocked => blocked.len(),
                        _ => requests.iter().filter(|r| r.direction == *active_tab).count(),
                    };
                    if count > 0 && *selected_request < count - 1 {
                        *selected_request += 1;
                    }
                }
            }
            KeyCode::Enter | KeyCode::Char('a') => {
                // Accept incoming request
                if let Screen::FriendRequests { active_tab: RequestTab::Incoming, requests, selected_request, friends: _, .. } = &self.screen {
                    let incoming: Vec<_> = requests.iter().filter(|r| r.direction == RequestTab::Incoming).collect();
                    if let Some(req) = incoming.get(*selected_request) {
                        let req = (*req).clone();
                        // Add to friends with their keys
                        if let Some(ref db) = self.db {
                            let _ = db.save_friend_with_keys(
                                &req.did,
                                &req.display_name,
                                req.username.as_deref(),
                                req.encryption_key.as_deref(),
                                req.signing_key.as_deref(),
                            );
                            let _ = db.delete_friend_request(&req.id);
                        }

                        // Send friend_accept envelope over relay
                        if let (Some(ref relay), Some(ref identity), Some(ref my_did)) =
                            (&self.relay_handle, &self.identity, &self.my_did)
                        {
                            let keys = identity.public_keys();
                            let accept_envelope = serde_json::json!({
                                "envelope": "friend_accept",
                                "version": 1,
                                "payload": {
                                    "requestId": req.id,
                                    "fromDid": my_did,
                                    "fromDisplayName": identity.profile().display_name,
                                    "fromAvatar": serde_json::Value::Null,
                                    "fromSigningKey": hex::encode(keys.signing),
                                    "fromEncryptionKey": hex::encode(keys.encryption),
                                }
                            });
                            relay.send(req.did.clone(), accept_envelope.to_string());
                        }

                        // Update screen
                        if let Screen::FriendRequests { requests, friends, selected_request, .. } = &mut self.screen {
                            friends.insert(0, FriendEntry {
                                did: req.did,
                                display_name: req.display_name.clone(),
                                username: req.username,
                                encryption_key: req.encryption_key,
                                signing_key: req.signing_key,
                            });
                            requests.retain(|r| r.id != req.id);
                            *selected_request = 0;
                        }
                        self.error_message = Some(format!("{} added as friend", req.display_name));
                    }
                }
            }
            KeyCode::Char('x') => {
                // Reject incoming or cancel outgoing
                if let Screen::FriendRequests { active_tab, requests, selected_request, .. } = &self.screen {
                    if *active_tab == RequestTab::Incoming || *active_tab == RequestTab::Outgoing {
                        let filtered: Vec<_> = requests.iter().filter(|r| r.direction == *active_tab).collect();
                        if let Some(req) = filtered.get(*selected_request) {
                            let req_id = req.id.clone();
                            let display = req.display_name.clone();
                            let is_incoming = *active_tab == RequestTab::Incoming;
                            if let Some(ref db) = self.db {
                                let _ = db.delete_friend_request(&req_id);
                            }
                            if let Screen::FriendRequests { requests, selected_request, .. } = &mut self.screen {
                                requests.retain(|r| r.id != req_id);
                                *selected_request = 0;
                            }
                            self.error_message = Some(if is_incoming {
                                format!("Rejected request from {display}")
                            } else {
                                format!("Cancelled request to {display}")
                            });
                        }
                    }
                }
            }
            KeyCode::Char('b') => {
                // Block user from incoming or outgoing tab
                if let Screen::FriendRequests { active_tab, requests, selected_request, .. } = &self.screen {
                    if *active_tab == RequestTab::Incoming || *active_tab == RequestTab::Outgoing {
                        let filtered: Vec<_> = requests.iter().filter(|r| r.direction == *active_tab).collect();
                        if let Some(req) = filtered.get(*selected_request) {
                            let did = req.did.clone();
                            let display = req.display_name.clone();
                            let username = req.username.clone();
                            if let Some(ref db) = self.db {
                                let _ = db.block_user(&did, Some(&display), username.as_deref());
                            }
                            if let Screen::FriendRequests { requests, selected_request, blocked, friends, .. } = &mut self.screen {
                                requests.retain(|r| r.did != did);
                                friends.retain(|f| f.did != did);
                                blocked.push(BlockedEntry {
                                    did,
                                    display_name: Some(display.clone()),
                                    username,
                                });
                                *selected_request = 0;
                            }
                            self.error_message = Some(format!("Blocked {display}"));
                        }
                    }
                }
            }
            KeyCode::Char('u') => {
                // Unblock user from blocked tab
                if let Screen::FriendRequests { active_tab: RequestTab::Blocked, blocked, selected_request, .. } = &self.screen {
                    if let Some(entry) = blocked.get(*selected_request) {
                        let did = entry.did.clone();
                        let display = entry.display_name.clone().unwrap_or_else(|| did[..16.min(did.len())].to_string());
                        if let Some(ref db) = self.db {
                            let _ = db.unblock_user(&did);
                        }
                        if let Screen::FriendRequests { blocked, selected_request, .. } = &mut self.screen {
                            blocked.retain(|b| b.did != did);
                            if *selected_request > 0 && *selected_request >= blocked.len() {
                                *selected_request = blocked.len().saturating_sub(1);
                            }
                        }
                        self.error_message = Some(format!("Unblocked {display}"));
                    }
                }
            }
            KeyCode::Esc => {
                if let Screen::FriendRequests { info, friends, selected_friend, .. } = &self.screen {
                    self.screen = Screen::Chat {
                        info: info.clone(),
                        focus: ChatFocus::Sidebar,
                        friends: friends.clone(),
                        selected_friend: *selected_friend,
                        active_conversation: None,
                    };
                }
            }
            _ => {}
        }
        None
    }

    // ── Relay event handling ───────────────────────────────────────────

    /// Handle an event from the relay WebSocket connection.
    pub fn handle_relay_event(&mut self, event: RelayEvent) {
        match event {
            RelayEvent::Connected => {
                self.relay_connected = true;
            }
            RelayEvent::Disconnected => {
                self.relay_connected = false;
            }
            RelayEvent::Message { from_did, payload, timestamp } => {
                self.handle_incoming_message(&from_did, &payload, timestamp);
            }
            RelayEvent::OfflineMessages { messages } => {
                for msg in messages {
                    self.handle_incoming_message(
                        &msg.from_did,
                        &msg.payload,
                        msg.timestamp,
                    );
                }
            }
            RelayEvent::InviteResolved {
                code, community_id, community_name,
                community_description, member_count, invite_payload,
            } => {
                self.handle_invite_resolved(
                    &code, &community_id, &community_name,
                    community_description.as_deref(), member_count, &invite_payload,
                );
            }
            RelayEvent::InviteNotFound { code } => {
                self.handle_invite_not_found(&code);
            }
            RelayEvent::Error(err) => {
                self.error_message = Some(format!("Relay: {err}"));
            }
        }
    }

    /// Process a single incoming message from the relay.
    pub(super) fn handle_incoming_message(
        &mut self,
        from_did: &str,
        payload: &str,
        timestamp: Option<u64>,
    ) {
        // Try to parse the payload as a message envelope
        let envelope: serde_json::Value = match serde_json::from_str(payload) {
            Ok(v) => v,
            Err(_) => return,
        };

        // Check for friend-related envelope types (use "envelope" field, not "type")
        if let Some(env_type) = envelope.get("envelope").and_then(|v| v.as_str()) {
            match env_type {
                "friend_request" => {
                    self.handle_incoming_friend_request(from_did, &envelope);
                    return;
                }
                "friend_accept" => {
                    self.handle_incoming_friend_accept(from_did, &envelope);
                    return;
                }
                "friend_accept_ack" => {
                    // Two-phase confirmation — friendship already established
                    return;
                }
                "chat_message" => {
                    // Standard envelope format from mobile/web clients
                    self.handle_incoming_chat_envelope(from_did, &envelope);
                    return;
                }
                _ => {}
            }
        }

        // Check the "type" field for non-chat payload types
        let msg_type = envelope.get("type").and_then(|v| v.as_str()).unwrap_or("");

        match msg_type {
            "message_edit" => {
                self.handle_incoming_edit(from_did, &envelope);
                return;
            }
            "message_delete" => {
                self.handle_incoming_delete(from_did, &envelope);
                return;
            }
            "reaction_add" => {
                self.handle_incoming_reaction(from_did, &envelope, true);
                return;
            }
            "reaction_remove" => {
                self.handle_incoming_reaction(from_did, &envelope, false);
                return;
            }
            "typing" => {
                self.handle_incoming_typing(from_did);
                return;
            }
            "read_receipt" => {
                self.handle_incoming_read_receipt(&envelope);
                return;
            }
            "message_pin" => {
                self.handle_incoming_pin(&envelope, true);
                return;
            }
            "message_unpin" => {
                self.handle_incoming_pin(&envelope, false);
                return;
            }
            // Group DM message types
            "group_create" => {
                self.handle_incoming_group_create(from_did, &envelope);
                return;
            }
            "group_chat" => {
                self.handle_incoming_group_chat(from_did, &envelope);
                return;
            }
            "group_leave" => {
                self.handle_incoming_group_leave(from_did, &envelope);
                return;
            }
            "group_message_edit" => {
                self.handle_incoming_group_edit(from_did, &envelope);
                return;
            }
            "group_message_delete" => {
                self.handle_incoming_group_delete(from_did, &envelope);
                return;
            }
            // Community message types
            "community_create" => {
                self.handle_incoming_community_create(from_did, &envelope);
                return;
            }
            "community_message" => {
                self.handle_incoming_community_message(from_did, &envelope);
                return;
            }
            "community_message_edit" => {
                self.handle_incoming_community_message_edit(from_did, &envelope);
                return;
            }
            "community_message_delete" => {
                self.handle_incoming_community_message_delete(from_did, &envelope);
                return;
            }
            "community_member_action" => {
                self.handle_incoming_member_action(from_did, &envelope);
                return;
            }
            "community_join" => {
                self.handle_incoming_community_join(from_did, &envelope);
                return;
            }
            _ => {} // "chat", "text", or unknown — continue to content extraction
        }

        // Extract message content — support both encrypted and plaintext
        let content = if let Some(text) = envelope.get("text").and_then(|v| v.as_str()) {
            text.to_string()
        } else if let Some(content) = envelope.get("content").and_then(|v| v.as_str()) {
            content.to_string()
        } else if let Some(ct) = envelope.get("ciphertext").and_then(|v| v.as_str()) {
            // Try to decrypt
            match self.try_decrypt_message(from_did, ct, &envelope) {
                Some(text) => text,
                None => return, // Decryption failed silently
            }
        } else {
            return; // Unknown format
        };

        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => return,
        };

        let conv_id = Conversation::generate_id(&my_did, from_did);
        let ts = timestamp.unwrap_or_else(|| {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs()
        }) as i64;

        let msg_id = uuid::Uuid::new_v4().to_string();

        // Find sender display name
        let sender_name = self.find_friend_name(from_did)
            .unwrap_or_else(|| from_did[..16.min(from_did.len())].to_string());

        // Save to database
        if let Some(ref db) = self.db {
            let _ = db.ensure_conversation(&conv_id, from_did);
            let _ = db.save_message(&msg_id, &conv_id, from_did, &content, ts);
            let _ = db.update_conversation_timestamp(&conv_id, ts);
        }

        // Check if this conversation is currently active
        let is_active_conv = self.is_active_conversation(from_did);

        if is_active_conv {
            // Add to displayed messages
            self.messages.push(DisplayMessage {
                id: msg_id.clone(),
                sender_did: from_did.to_string(),
                sender_name,
                content,
                timestamp: ts,
                is_mine: false,
                edited_at: None,
                deleted: false,
                status: "sent".to_string(),
                reactions: Vec::new(),
                pinned: false,
            });
            self.message_scroll = 0; // Snap to bottom

            // Auto-send read receipt for incoming message in active conversation
            self.send_read_receipt(&msg_id, &conv_id);
        } else {
            // Increment unread count
            if let Some(ref db) = self.db {
                let _ = db.increment_unread(&conv_id);
            }
        }
    }

    /// Try to decrypt an encrypted message (legacy format with hex-encoded ciphertext).
    pub(super) fn try_decrypt_message(
        &self,
        from_did: &str,
        _ciphertext_hex: &str,
        envelope: &serde_json::Value,
    ) -> Option<String> {
        let identity = self.identity.as_ref()?;
        let my_did = self.my_did.as_ref()?;

        let nonce_str = envelope.get("nonce").and_then(|v| v.as_str())?;
        let ct_str = envelope.get("ciphertext").and_then(|v| v.as_str())?;
        let ts = envelope.get("timestamp").and_then(|v| v.as_i64());

        let nonce_bytes = hex::decode(nonce_str).ok()?;
        let ciphertext = hex::decode(ct_str).ok()?;

        // Find the friend's encryption key
        let friend_enc_key = self.find_friend_encryption_key(from_did)?;

        let conv_id = Conversation::generate_id(my_did, from_did);

        // Build the nonce
        if nonce_bytes.len() != 12 {
            return None;
        }
        let mut nonce_arr = [0u8; 12];
        nonce_arr.copy_from_slice(&nonce_bytes);
        let nonce = umbra_core::crypto::Nonce::from_bytes(nonce_arr);

        // Try standard AAD format first (senderDid + receiverDid + timestamp)
        if let Some(ts) = ts {
            let aad = format!("{}{}{}", from_did, my_did, ts);
            if let Ok(plaintext) = umbra_core::crypto::decrypt_from_sender(
                &identity.keypair().encryption,
                &friend_enc_key,
                conv_id.as_bytes(),
                &nonce,
                &ciphertext,
                aad.as_bytes(),
            ) {
                return String::from_utf8(plaintext).ok();
            }
        }

        // Fallback to legacy AAD
        let plaintext = umbra_core::crypto::decrypt_from_sender(
            &identity.keypair().encryption,
            &friend_enc_key,
            conv_id.as_bytes(),
            &nonce,
            &ciphertext,
            b"umbra-chat",
        ).ok()?;

        String::from_utf8(plaintext).ok()
    }

    /// Handle an incoming `chat_message` envelope (standard format from mobile/web).
    fn handle_incoming_chat_envelope(&mut self, from_did: &str, envelope: &serde_json::Value) {
        let payload = match envelope.get("payload") {
            Some(p) => p,
            None => return,
        };

        let msg_id = payload.get("messageId").and_then(|v| v.as_str())
            .unwrap_or(&uuid::Uuid::new_v4().to_string()).to_string();
        let conv_id_from_payload = payload.get("conversationId").and_then(|v| v.as_str());
        let sender_did = payload.get("senderDid").and_then(|v| v.as_str()).unwrap_or(from_did);
        let ct_b64 = match payload.get("contentEncrypted").and_then(|v| v.as_str()) {
            Some(ct) => ct,
            None => return,
        };
        let nonce_hex = match payload.get("nonce").and_then(|v| v.as_str()) {
            Some(n) => n,
            None => return,
        };
        let ts = payload.get("timestamp").and_then(|v| v.as_i64()).unwrap_or_else(|| {
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64
        });

        let identity = match &self.identity {
            Some(id) => id,
            None => return,
        };
        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => return,
        };

        let conv_id = conv_id_from_payload
            .map(|s| s.to_string())
            .unwrap_or_else(|| Conversation::generate_id(&my_did, sender_did));

        // Decode base64 ciphertext and hex nonce
        let ciphertext = match base64::engine::general_purpose::STANDARD.decode(ct_b64) {
            Ok(ct) => ct,
            Err(_) => return,
        };
        let nonce_bytes = match hex::decode(nonce_hex) {
            Ok(n) if n.len() == 12 => n,
            _ => return,
        };
        let mut nonce_arr = [0u8; 12];
        nonce_arr.copy_from_slice(&nonce_bytes);
        let nonce = umbra_core::crypto::Nonce::from_bytes(nonce_arr);

        let friend_enc_key = match self.find_friend_encryption_key(sender_did) {
            Some(k) => k,
            None => return,
        };

        // Try decryption with the standard AAD format: senderDid + receiverDid + timestamp
        let aad = format!("{}{}{}", sender_did, my_did, ts);
        let content = match umbra_core::crypto::decrypt_from_sender(
            &identity.keypair().encryption,
            &friend_enc_key,
            conv_id.as_bytes(),
            &nonce,
            &ciphertext,
            aad.as_bytes(),
        ) {
            Ok(plaintext) => match String::from_utf8(plaintext) {
                Ok(s) => s,
                Err(_) => return,
            },
            Err(_) => return,
        };

        let sender_name = self.find_friend_name(sender_did)
            .unwrap_or_else(|| sender_did[..16.min(sender_did.len())].to_string());

        // Save to database
        if let Some(ref db) = self.db {
            let _ = db.ensure_conversation(&conv_id, sender_did);
            let _ = db.save_message(&msg_id, &conv_id, sender_did, &content, ts);
            let _ = db.update_conversation_timestamp(&conv_id, ts);
        }

        let is_active_conv = self.is_active_conversation(sender_did);

        if is_active_conv {
            self.messages.push(DisplayMessage {
                id: msg_id.clone(),
                sender_did: sender_did.to_string(),
                sender_name,
                content,
                timestamp: ts,
                is_mine: false,
                edited_at: None,
                deleted: false,
                status: "sent".to_string(),
                reactions: Vec::new(),
                pinned: false,
            });
            self.message_scroll = 0;
            self.send_read_receipt(&msg_id, &conv_id);
        } else {
            if let Some(ref db) = self.db {
                let _ = db.increment_unread(&conv_id);
            }
        }
    }

    /// Send a message to the currently active conversation friend.
    pub(super) fn send_message(&mut self, text: &str) {
        let (friend_did, _friend_name) = match self.get_active_friend() {
            Some((did, name)) => (did, name),
            None => return,
        };

        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => {
                self.error_message = Some("Identity not loaded".into());
                return;
            }
        };

        let conv_id = Conversation::generate_id(&my_did, &friend_did);
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let msg_id = uuid::Uuid::new_v4().to_string();

        // Build the payload using the standard envelope format (compatible with mobile/web)
        let payload = if let Some(ref identity) = self.identity {
            if let Some(friend_enc_key) = self.find_friend_encryption_key(&friend_did) {
                // AAD must match the mobile/web format: senderDid + friendDid + timestamp
                let aad = format!("{}{}{}", my_did, friend_did, ts);
                // Encrypt the message
                match umbra_core::crypto::encrypt_for_recipient(
                    &identity.keypair().encryption,
                    &friend_enc_key,
                    conv_id.as_bytes(),
                    text.as_bytes(),
                    aad.as_bytes(),
                ) {
                    Ok((nonce, ciphertext)) => {
                        let ct_b64 = base64::engine::general_purpose::STANDARD.encode(&ciphertext);
                        serde_json::json!({
                            "envelope": "chat_message",
                            "version": 1,
                            "payload": {
                                "messageId": msg_id,
                                "conversationId": conv_id,
                                "senderDid": my_did,
                                "contentEncrypted": ct_b64,
                                "nonce": hex::encode(nonce.as_bytes()),
                                "timestamp": ts,
                            }
                        }).to_string()
                    }
                    Err(_) => {
                        // Fallback to plaintext if encryption fails
                        serde_json::json!({
                            "type": "chat",
                            "text": text,
                            "conversation_id": conv_id,
                            "timestamp": ts,
                        }).to_string()
                    }
                }
            } else {
                // No encryption key — send plaintext with warning
                serde_json::json!({
                    "type": "chat",
                    "text": text,
                    "conversation_id": conv_id,
                    "timestamp": ts,
                }).to_string()
            }
        } else {
            serde_json::json!({
                "type": "chat",
                "text": text,
                "conversation_id": conv_id,
                "timestamp": ts,
            }).to_string()
        };

        // Send via relay
        if let Some(ref relay) = self.relay_handle {
            relay.send(friend_did.clone(), payload);
        }

        // Save to local DB
        if let Some(ref db) = self.db {
            let _ = db.ensure_conversation(&conv_id, &friend_did);
            let _ = db.save_message(&msg_id, &conv_id, &my_did, text, ts);
            let _ = db.update_conversation_timestamp(&conv_id, ts);
        }

        // Add to displayed messages
        let display_name = match &self.identity {
            Some(id) => id.profile().display_name.clone(),
            None => "Me".to_string(),
        };

        self.messages.push(DisplayMessage {
            id: msg_id,
            sender_did: my_did,
            sender_name: display_name,
            content: text.to_string(),
            timestamp: ts,
            is_mine: true,
            edited_at: None,
            deleted: false,
            status: "sent".to_string(),
            reactions: Vec::new(),
            pinned: false,
        });
        self.message_scroll = 0; // Snap to bottom
    }

    // ── Conversation helpers ────────────────────────────────────────────

    /// Check if the given DID has the currently active conversation.
    pub(super) fn is_active_conversation(&self, did: &str) -> bool {
        if let Screen::Chat { friends, active_conversation: Some(idx), .. } = &self.screen {
            if let Some(friend) = friends.get(*idx) {
                return friend.did == did;
            }
        }
        false
    }

    /// Get the DID and display name of the currently active friend.
    pub(super) fn get_active_friend(&self) -> Option<(String, String)> {
        if let Screen::Chat { friends, active_conversation: Some(idx), .. } = &self.screen {
            if let Some(friend) = friends.get(*idx) {
                return Some((friend.did.clone(), friend.display_name.clone()));
            }
        }
        None
    }

    /// Find a friend's display name by DID.
    pub fn find_friend_name(&self, did: &str) -> Option<String> {
        if let Screen::Chat { friends, .. } = &self.screen {
            return friends.iter()
                .find(|f| f.did == did)
                .map(|f| f.display_name.clone());
        }
        None
    }

    /// Find a friend's encryption public key by DID.
    pub(super) fn find_friend_encryption_key(&self, did: &str) -> Option<[u8; 32]> {
        if let Screen::Chat { friends, .. } = &self.screen {
            if let Some(friend) = friends.iter().find(|f| f.did == did) {
                if let Some(ref key_hex) = friend.encryption_key {
                    if let Ok(bytes) = hex::decode(key_hex) {
                        if bytes.len() == 32 {
                            let mut arr = [0u8; 32];
                            arr.copy_from_slice(&bytes);
                            return Some(arr);
                        }
                    }
                }
            }
        }
        None
    }

    /// Load messages from the database for a conversation.
    pub(super) fn load_messages_from_db(&self, conv_id: &str) -> Vec<DisplayMessage> {
        let db = match &self.db {
            Some(db) => db,
            None => return Vec::new(),
        };

        let my_did = self.my_did.as_deref().unwrap_or("");
        let my_name = self.identity.as_ref()
            .map(|id| id.profile().display_name.clone())
            .unwrap_or_else(|| "Me".to_string());

        // Load pinned message IDs for this conversation
        let pinned_ids: Vec<String> = db.load_pinned_messages(conv_id).unwrap_or_default();

        db.load_messages(conv_id, 100)
            .unwrap_or_default()
            .into_iter()
            .map(|m| {
                let is_mine = m.sender_did == my_did;
                let sender_name = if is_mine {
                    my_name.clone()
                } else {
                    self.find_friend_name(&m.sender_did)
                        .unwrap_or_else(|| m.sender_did[..16.min(m.sender_did.len())].to_string())
                };

                // Load reactions and aggregate by emoji
                let reactions = self.load_reactions_aggregated(&m.id);

                let pinned = pinned_ids.contains(&m.id);

                DisplayMessage {
                    id: m.id,
                    sender_did: m.sender_did,
                    sender_name,
                    content: m.content,
                    timestamp: m.timestamp,
                    is_mine,
                    edited_at: m.edited_at,
                    deleted: m.deleted,
                    status: m.status,
                    reactions,
                    pinned,
                }
            })
            .collect()
    }

    /// Load reactions for a message and aggregate into (emoji, count) pairs.
    fn load_reactions_aggregated(&self, message_id: &str) -> Vec<(String, usize)> {
        let db = match &self.db {
            Some(db) => db,
            None => return Vec::new(),
        };

        let reactions = db.load_reactions(message_id).unwrap_or_default();
        let mut counts: HashMap<String, usize> = HashMap::new();
        for r in &reactions {
            *counts.entry(r.emoji.clone()).or_insert(0) += 1;
        }

        let mut result: Vec<(String, usize)> = counts.into_iter().collect();
        result.sort_by(|a, b| a.0.cmp(&b.0));
        result
    }

    /// Get the conversation ID for the currently active conversation.
    pub(super) fn get_active_conversation_id(&self) -> Option<String> {
        let (friend_did, _) = self.get_active_friend()?;
        let my_did = self.my_did.as_ref()?;
        Some(Conversation::generate_id(my_did, &friend_did))
    }

    // ── Relay message senders ────────────────────────────────────────────

    /// Send a message edit to the relay and update local DB.
    pub(super) fn send_message_edit(&mut self, message_id: &str, new_content: &str, conversation_id: &str) {
        let (friend_did, _) = match self.get_active_friend() {
            Some(f) => f,
            None => return,
        };

        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let payload = serde_json::json!({
            "type": "message_edit",
            "message_id": message_id,
            "content": new_content,
            "conversation_id": conversation_id,
            "edited_at": ts,
        }).to_string();

        if let Some(ref relay) = self.relay_handle {
            relay.send(friend_did, payload);
        }

        // Update local DB
        if let Some(ref db) = self.db {
            let _ = db.update_message_content(message_id, new_content, ts);
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.content = new_content.to_string();
            msg.edited_at = Some(ts);
        }
    }

    /// Send a message delete to the relay and update local DB.
    pub(super) fn send_message_delete(&mut self, message_id: &str, conversation_id: &str) {
        let (friend_did, _) = match self.get_active_friend() {
            Some(f) => f,
            None => return,
        };

        let payload = serde_json::json!({
            "type": "message_delete",
            "message_id": message_id,
            "conversation_id": conversation_id,
        }).to_string();

        if let Some(ref relay) = self.relay_handle {
            relay.send(friend_did, payload);
        }

        // Update local DB
        if let Some(ref db) = self.db {
            let _ = db.soft_delete_message(message_id);
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.deleted = true;
        }
    }

    /// Send a reaction add/remove to the relay and update local DB.
    pub(super) fn send_reaction(&mut self, message_id: &str, emoji: &str, conversation_id: &str, add: bool) {
        let (friend_did, _) = match self.get_active_friend() {
            Some(f) => f,
            None => return,
        };

        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => return,
        };

        let msg_type = if add { "reaction_add" } else { "reaction_remove" };

        let payload = serde_json::json!({
            "type": msg_type,
            "message_id": message_id,
            "emoji": emoji,
            "conversation_id": conversation_id,
        }).to_string();

        if let Some(ref relay) = self.relay_handle {
            relay.send(friend_did, payload);
        }

        // Update local DB
        if let Some(ref db) = self.db {
            if add {
                let _ = db.add_reaction(message_id, &my_did, emoji);
            } else {
                let _ = db.remove_reaction(message_id, &my_did, emoji);
            }
        }

        // Update in-memory reactions
        let updated_reactions = self.load_reactions_aggregated(message_id);
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.reactions = updated_reactions;
        }
    }

    /// Send a typing indicator to the relay.
    pub(super) fn send_typing_indicator(&self, conversation_id: &str) {
        let (friend_did, _) = match self.get_active_friend() {
            Some(f) => f,
            None => return,
        };

        let payload = serde_json::json!({
            "type": "typing",
            "conversation_id": conversation_id,
        }).to_string();

        if let Some(ref relay) = self.relay_handle {
            relay.send(friend_did, payload);
        }
    }

    /// Send a read receipt to the relay.
    pub(super) fn send_read_receipt(&mut self, message_id: &str, conversation_id: &str) {
        let (friend_did, _) = match self.get_active_friend() {
            Some(f) => f,
            None => return,
        };

        let payload = serde_json::json!({
            "type": "read_receipt",
            "message_id": message_id,
            "conversation_id": conversation_id,
        }).to_string();

        if let Some(ref relay) = self.relay_handle {
            relay.send(friend_did, payload);
        }
    }

    /// Send pin/unpin toggle to the relay and update local DB.
    pub(super) fn send_pin_toggle(&mut self, message_id: &str, conversation_id: &str) {
        let (friend_did, _) = match self.get_active_friend() {
            Some(f) => f,
            None => return,
        };

        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => return,
        };

        // Check current pin status
        let is_pinned = if let Some(ref db) = self.db {
            db.is_pinned(conversation_id, message_id).unwrap_or(false)
        } else {
            false
        };

        let msg_type = if is_pinned { "message_unpin" } else { "message_pin" };

        let payload = serde_json::json!({
            "type": msg_type,
            "message_id": message_id,
            "conversation_id": conversation_id,
        }).to_string();

        if let Some(ref relay) = self.relay_handle {
            relay.send(friend_did, payload);
        }

        // Update local DB
        if let Some(ref db) = self.db {
            if is_pinned {
                let _ = db.unpin_message(conversation_id, message_id);
            } else {
                let _ = db.pin_message(conversation_id, message_id, &my_did);
            }
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.pinned = !is_pinned;
        }
    }

    // ── Incoming message type handlers ───────────────────────────────────

    /// Handle incoming message edit.
    fn handle_incoming_edit(&mut self, _from_did: &str, envelope: &serde_json::Value) {
        let message_id = match envelope.get("message_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };
        let new_content = match envelope.get("content").and_then(|v| v.as_str()) {
            Some(c) => c,
            None => return,
        };
        let edited_at = envelope.get("edited_at").and_then(|v| v.as_i64())
            .unwrap_or_else(|| {
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs() as i64
            });

        // Update DB
        if let Some(ref db) = self.db {
            let _ = db.update_message_content(message_id, new_content, edited_at);
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.content = new_content.to_string();
            msg.edited_at = Some(edited_at);
        }
    }

    /// Handle incoming message delete.
    fn handle_incoming_delete(&mut self, _from_did: &str, envelope: &serde_json::Value) {
        let message_id = match envelope.get("message_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };

        // Update DB
        if let Some(ref db) = self.db {
            let _ = db.soft_delete_message(message_id);
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.deleted = true;
        }
    }

    /// Handle incoming reaction add/remove.
    fn handle_incoming_reaction(&mut self, from_did: &str, envelope: &serde_json::Value, add: bool) {
        let message_id = match envelope.get("message_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };
        let emoji = match envelope.get("emoji").and_then(|v| v.as_str()) {
            Some(e) => e,
            None => return,
        };

        // Update DB
        if let Some(ref db) = self.db {
            if add {
                let _ = db.add_reaction(message_id, from_did, emoji);
            } else {
                let _ = db.remove_reaction(message_id, from_did, emoji);
            }
        }

        // Update in-memory
        let updated_reactions = self.load_reactions_aggregated(message_id);
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.reactions = updated_reactions;
        }
    }

    /// Handle incoming typing indicator.
    fn handle_incoming_typing(&mut self, from_did: &str) {
        // Only track typing if this is the active conversation peer
        if self.is_active_conversation(from_did) {
            self.typing_peers.insert(from_did.to_string(), Instant::now());
        }
    }

    /// Handle incoming read receipt.
    fn handle_incoming_read_receipt(&mut self, envelope: &serde_json::Value) {
        let message_id = match envelope.get("message_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };

        // Update DB
        if let Some(ref db) = self.db {
            let _ = db.update_message_status(message_id, "read");
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.status = "read".to_string();
        }
    }

    /// Handle incoming pin/unpin.
    fn handle_incoming_pin(&mut self, envelope: &serde_json::Value, pin: bool) {
        let message_id = match envelope.get("message_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };
        let conversation_id = match envelope.get("conversation_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };

        // Update DB
        if let Some(ref db) = self.db {
            if pin {
                let my_did = self.my_did.as_deref().unwrap_or("");
                let _ = db.pin_message(conversation_id, message_id, my_did);
            } else {
                let _ = db.unpin_message(conversation_id, message_id);
            }
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.pinned = pin;
        }
    }

    // ── Friend request envelope handlers ──────────────────────────────

    /// Handle incoming friend_request envelope from the relay.
    fn handle_incoming_friend_request(&mut self, from_did: &str, envelope: &serde_json::Value) {
        let payload = match envelope.get("payload") {
            Some(p) => p,
            None => return,
        };

        let request_id = payload.get("id").and_then(|v| v.as_str()).unwrap_or("");
        let from_display = payload.get("fromDisplayName").and_then(|v| v.as_str()).unwrap_or("");
        let signing_key = payload.get("fromSigningKey").and_then(|v| v.as_str());
        let encryption_key = payload.get("fromEncryptionKey").and_then(|v| v.as_str());

        if request_id.is_empty() {
            return;
        }

        // Skip if blocked
        if let Some(ref db) = self.db {
            if db.is_blocked(from_did).unwrap_or(false) {
                return;
            }
            // Skip if already friends
            let friends = db.load_friends().unwrap_or_default();
            if friends.iter().any(|f| f.did == from_did) {
                return;
            }
            // Skip if already has a pending request from this DID
            if db.has_pending_request(from_did).unwrap_or(false) {
                return;
            }
        }

        // Save as incoming friend request with keys
        if let Some(ref db) = self.db {
            let _ = db.save_friend_request_with_keys(
                request_id,
                from_did,
                from_display,
                None,
                "incoming",
                encryption_key,
                signing_key,
            );
        }

        let name = if from_display.is_empty() {
            &from_did[..16.min(from_did.len())]
        } else {
            from_display
        };
        self.error_message = Some(format!("Friend request from {name}"));
    }

    /// Handle incoming friend_accept envelope — our request was accepted.
    fn handle_incoming_friend_accept(&mut self, from_did: &str, envelope: &serde_json::Value) {
        let payload = match envelope.get("payload") {
            Some(p) => p,
            None => return,
        };

        let request_id = payload.get("requestId").and_then(|v| v.as_str()).unwrap_or("");
        let from_display = payload.get("fromDisplayName").and_then(|v| v.as_str()).unwrap_or("");
        let signing_key = payload.get("fromSigningKey").and_then(|v| v.as_str());
        let encryption_key = payload.get("fromEncryptionKey").and_then(|v| v.as_str());

        // Save as friend with keys
        if let Some(ref db) = self.db {
            let _ = db.save_friend_with_keys(
                from_did,
                from_display,
                None,
                encryption_key,
                signing_key,
            );
            // Delete the outgoing request
            if !request_id.is_empty() {
                let _ = db.delete_friend_request(request_id);
            }
        }

        // Update in-memory friends list on Chat screen
        if let Screen::Chat { friends, .. } = &mut self.screen {
            if !friends.iter().any(|f| f.did == from_did) {
                friends.insert(0, FriendEntry {
                    did: from_did.to_string(),
                    display_name: from_display.to_string(),
                    username: None,
                    encryption_key: encryption_key.map(|s| s.to_string()),
                    signing_key: signing_key.map(|s| s.to_string()),
                });
            }
        }

        // Send friend_accept_ack back
        if let (Some(ref relay), Some(ref my_did)) = (&self.relay_handle, &self.my_did) {
            let ack = serde_json::json!({
                "envelope": "friend_accept_ack",
                "version": 1,
                "payload": {
                    "fromDid": my_did,
                    "toDid": from_did,
                }
            });
            relay.send(from_did.to_string(), ack.to_string());
        }

        let name = if from_display.is_empty() {
            &from_did[..16.min(from_did.len())]
        } else {
            from_display
        };
        self.error_message = Some(format!("{name} accepted your friend request"));
    }
}
