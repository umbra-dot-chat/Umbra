//! Community handlers — create, navigate, manage communities.

use crossterm::event::{KeyCode, KeyEvent};

use crate::db::{
    StoredCommunity, StoredSpace, StoredCategory, StoredChannel,
    StoredCommunityMember, StoredCommunityRole, StoredCommunityInvite,
};

use super::*;

impl App {
    // ── Community loading ───────────────────────────────────────────────

    /// Load all communities from DB into the in-memory list.
    pub(super) fn load_communities_from_db(&mut self) {
        let db = match &self.db {
            Some(db) => db,
            None => return,
        };

        let stored = db.load_communities().unwrap_or_default();
        self.communities = stored
            .into_iter()
            .map(|c| {
                let member_count = db.community_member_count(&c.id);
                CommunityEntry {
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    created_by: c.created_by,
                    member_count,
                }
            })
            .collect();
    }

    /// Load the channel tree for a community (spaces > categories > channels).
    pub(super) fn load_community_structure(&mut self, community_id: &str) {
        let db = match &self.db {
            Some(db) => db,
            None => return,
        };

        let spaces = db.load_spaces(community_id).unwrap_or_default();
        let mut space_entries = Vec::new();
        let mut tree_items = Vec::new();

        for space in &spaces {
            tree_items.push(ChannelTreeItem::Space {
                id: space.id.clone(),
                name: space.name.clone(),
            });

            let categories = db.load_categories(&space.id).unwrap_or_default();
            let mut cat_entries = Vec::new();

            for cat in &categories {
                tree_items.push(ChannelTreeItem::Category {
                    id: cat.id.clone(),
                    name: cat.name.clone(),
                });

                let channels = db.load_channels_by_category(&cat.id).unwrap_or_default();
                let mut ch_entries = Vec::new();

                for ch in &channels {
                    tree_items.push(ChannelTreeItem::Channel {
                        id: ch.id.clone(),
                        name: ch.name.clone(),
                        channel_type: ch.channel_type.clone(),
                    });
                    ch_entries.push(ChannelEntry {
                        id: ch.id.clone(),
                        name: ch.name.clone(),
                        channel_type: ch.channel_type.clone(),
                    });
                }

                cat_entries.push(CategoryEntry {
                    id: cat.id.clone(),
                    name: cat.name.clone(),
                    channels: ch_entries,
                });
            }

            space_entries.push(SpaceEntry {
                id: space.id.clone(),
                name: space.name.clone(),
                categories: cat_entries,
            });
        }

        self.community_spaces = space_entries;
        self.channel_tree = tree_items;
        self.selected_channel_item = 0;
    }

    // ── Create community ────────────────────────────────────────────────

    pub(super) fn handle_create_community_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        let (community_name, community_description, field_focus) = match &self.screen {
            Screen::CreateCommunity {
                community_name,
                community_description,
                field_focus,
                ..
            } => (community_name.clone(), community_description.clone(), *field_focus),
            _ => return None,
        };

        match key.code {
            KeyCode::Tab => {
                if let Screen::CreateCommunity { field_focus, .. } = &mut self.screen {
                    *field_focus = match field_focus {
                        CreateCommunityFocus::Name => CreateCommunityFocus::Description,
                        CreateCommunityFocus::Description => CreateCommunityFocus::Name,
                    };
                }
            }
            KeyCode::Enter => {
                let name = community_name.trim().to_string();
                if name.is_empty() {
                    self.error_message = Some("Community name cannot be empty".into());
                    return None;
                }
                self.create_community(&name, &community_description);
                self.return_from_create_community();
            }
            KeyCode::Esc => {
                self.return_from_create_community();
            }
            KeyCode::Backspace => {
                match field_focus {
                    CreateCommunityFocus::Name => {
                        if let Screen::CreateCommunity { community_name, .. } = &mut self.screen {
                            community_name.pop();
                        }
                    }
                    CreateCommunityFocus::Description => {
                        if let Screen::CreateCommunity { community_description, .. } = &mut self.screen {
                            community_description.pop();
                        }
                    }
                }
            }
            KeyCode::Char(c) => {
                match field_focus {
                    CreateCommunityFocus::Name => {
                        if let Screen::CreateCommunity { community_name, .. } = &mut self.screen {
                            if community_name.len() < 48 {
                                community_name.push(c);
                            }
                        }
                    }
                    CreateCommunityFocus::Description => {
                        if let Screen::CreateCommunity { community_description, .. } = &mut self.screen {
                            if community_description.len() < 200 {
                                community_description.push(c);
                            }
                        }
                    }
                }
            }
            _ => {}
        }

        None
    }

    fn create_community(&mut self, name: &str, description: &str) {
        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        let community_id = format!("community_{}", uuid_v4());
        let space_id = format!("space_{}", uuid_v4());
        let category_id = format!("cat_{}", uuid_v4());
        let welcome_channel_id = format!("ch_{}", uuid_v4());
        let general_channel_id = format!("ch_{}", uuid_v4());

        let desc = if description.trim().is_empty() {
            None
        } else {
            Some(description.trim().to_string())
        };

        if let Some(ref db) = self.db {
            // Save the community
            let _ = db.save_community(&StoredCommunity {
                id: community_id.clone(),
                name: name.to_string(),
                description: desc,
                created_by: my_did.clone(),
                created_at: now,
            });

            // Create default space
            let _ = db.save_space(&StoredSpace {
                id: space_id.clone(),
                community_id: community_id.clone(),
                name: "General".to_string(),
                position: 0,
            });

            // Create default category
            let _ = db.save_category(&StoredCategory {
                id: category_id.clone(),
                space_id: space_id.clone(),
                name: "Text Channels".to_string(),
                position: 0,
            });

            // Create default channels
            let _ = db.save_channel(&StoredChannel {
                id: welcome_channel_id.clone(),
                category_id: category_id.clone(),
                community_id: community_id.clone(),
                name: "welcome".to_string(),
                channel_type: "text".to_string(),
                position: 0,
            });

            let _ = db.save_channel(&StoredChannel {
                id: general_channel_id.clone(),
                category_id: category_id.clone(),
                community_id: community_id.clone(),
                name: "general".to_string(),
                channel_type: "text".to_string(),
                position: 1,
            });

            // Add creator as member
            let display_name = self.get_my_display_name();
            let _ = db.add_community_member(&StoredCommunityMember {
                community_id: community_id.clone(),
                did: my_did.clone(),
                display_name: Some(display_name),
                joined_at: now,
            });

            // Create default roles
            let owner_role_id = format!("role_{}", uuid_v4());
            let member_role_id = format!("role_{}", uuid_v4());

            let _ = db.save_role(&StoredCommunityRole {
                id: owner_role_id.clone(),
                community_id: community_id.clone(),
                name: "Owner".to_string(),
                permissions: i64::MAX, // All permissions
                position: 0,
                color: Some("Cyan".to_string()),
            });

            let _ = db.save_role(&StoredCommunityRole {
                id: member_role_id.clone(),
                community_id: community_id.clone(),
                name: "Member".to_string(),
                permissions: (1 << 0) | (1 << 11) | (1 << 14) | (1 << 18), // ViewChannels, SendMessages, AddReactions, ReadMessageHistory
                position: 1,
                color: None,
            });

            // Assign owner role to creator
            let _ = db.assign_role(&community_id, &my_did, &owner_role_id);

            // Send community creation to friends (fan-out) so they can join
            self.send_community_create_relay(&community_id, name, description);
        }

        // Reload communities
        self.load_communities_from_db();
    }

    fn return_from_create_community(&mut self) {
        if let Screen::CreateCommunity { info, .. } = &self.screen {
            let info = info.clone();
            // Reconstruct friends from DB
            let friends = self.load_friends_vec();
            self.screen = Screen::Chat {
                info,
                focus: ChatFocus::Sidebar,
                friends,
                selected_friend: 0,
                active_conversation: None,
            };
        }
    }

    // ── Community members view ──────────────────────────────────────────

    pub(super) fn handle_community_members_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        let (members_len, _selected) = match &self.screen {
            Screen::CommunityMembers { members, selected_member, .. } => {
                (members.len(), *selected_member)
            }
            _ => return None,
        };

        match key.code {
            KeyCode::Up => {
                if let Screen::CommunityMembers { selected_member, .. } = &mut self.screen {
                    if *selected_member > 0 {
                        *selected_member -= 1;
                    }
                }
            }
            KeyCode::Down => {
                if let Screen::CommunityMembers { selected_member, .. } = &mut self.screen {
                    if *selected_member + 1 < members_len {
                        *selected_member += 1;
                    }
                }
            }
            KeyCode::Enter => {
                // Open member actions for the selected member
                let (info, community_id, member_did, member_name) = match &self.screen {
                    Screen::CommunityMembers { info, community_id, members, selected_member, .. } => {
                        if *selected_member < members.len() {
                            let m = &members[*selected_member];
                            let name = m.display_name.clone()
                                .unwrap_or_else(|| m.did[..8.min(m.did.len())].to_string());
                            (info.clone(), community_id.clone(), m.did.clone(), name)
                        } else {
                            return None;
                        }
                    }
                    _ => return None,
                };

                // Don't allow actions on yourself
                if self.my_did.as_deref() == Some(&member_did) {
                    self.error_message = Some("Cannot perform actions on yourself".into());
                    return None;
                }

                self.screen = Screen::MemberActions {
                    info,
                    community_id,
                    member_did,
                    member_name,
                    actions: vec![MemberActionItem::Kick, MemberActionItem::Ban],
                    selected_action: 0,
                };
            }
            KeyCode::Esc => {
                self.return_from_community_members();
            }
            _ => {}
        }

        None
    }

    fn return_from_community_members(&mut self) {
        if let Screen::CommunityMembers { info, .. } = &self.screen {
            let info = info.clone();
            let friends = self.load_friends_vec();
            self.screen = Screen::Chat {
                info,
                focus: ChatFocus::Sidebar,
                friends,
                selected_friend: 0,
                active_conversation: None,
            };
        }
    }

    // ── Community roles view ──────────────────────────────────────────────

    pub(super) fn handle_community_roles_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        let roles_len = match &self.screen {
            Screen::CommunityRoles { roles, .. } => roles.len(),
            _ => return None,
        };

        match key.code {
            KeyCode::Up => {
                if let Screen::CommunityRoles { selected_role, .. } = &mut self.screen {
                    if *selected_role > 0 {
                        *selected_role -= 1;
                    }
                }
            }
            KeyCode::Down => {
                if let Screen::CommunityRoles { selected_role, .. } = &mut self.screen {
                    if *selected_role + 1 < roles_len {
                        *selected_role += 1;
                    }
                }
            }
            KeyCode::Esc => {
                self.return_from_community_roles();
            }
            _ => {}
        }

        None
    }

    fn return_from_community_roles(&mut self) {
        if let Screen::CommunityRoles { info, .. } = &self.screen {
            let info = info.clone();
            let friends = self.load_friends_vec();
            self.screen = Screen::Chat {
                info,
                focus: ChatFocus::Sidebar,
                friends,
                selected_friend: 0,
                active_conversation: None,
            };
        }
    }

    // ── Member actions (kick/ban) ────────────────────────────────────────

    pub(super) fn handle_member_actions_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        let (actions_len, community_id, member_did, member_name) = match &self.screen {
            Screen::MemberActions { actions, community_id, member_did, member_name, .. } => {
                (actions.len(), community_id.clone(), member_did.clone(), member_name.clone())
            }
            _ => return None,
        };

        match key.code {
            KeyCode::Up => {
                if let Screen::MemberActions { selected_action, .. } = &mut self.screen {
                    if *selected_action > 0 {
                        *selected_action -= 1;
                    }
                }
            }
            KeyCode::Down => {
                if let Screen::MemberActions { selected_action, .. } = &mut self.screen {
                    if *selected_action + 1 < actions_len {
                        *selected_action += 1;
                    }
                }
            }
            KeyCode::Enter => {
                let selected = match &self.screen {
                    Screen::MemberActions { actions, selected_action, .. } => {
                        if *selected_action < actions.len() {
                            Some(actions[*selected_action])
                        } else {
                            None
                        }
                    }
                    _ => None,
                };
                if let Some(action) = selected {
                    match action {
                        MemberActionItem::Kick => {
                            self.kick_member(&community_id, &member_did, &member_name);
                        }
                        MemberActionItem::Ban => {
                            self.ban_member(&community_id, &member_did, &member_name);
                        }
                    }
                    self.return_from_member_actions();
                }
            }
            KeyCode::Esc => {
                self.return_from_member_actions();
            }
            _ => {}
        }

        None
    }

    fn return_from_member_actions(&mut self) {
        if let Screen::MemberActions { info, community_id, .. } = &self.screen {
            let info = info.clone();
            let community_id = community_id.clone();
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
                info,
                community_id,
                community_name,
                members,
                selected_member: 0,
            };
        }
    }

    /// Kick a member from a community (remove without ban).
    fn kick_member(&mut self, community_id: &str, member_did: &str, member_name: &str) {
        if let Some(ref db) = self.db {
            let _ = db.remove_community_member(community_id, member_did);
        }

        // Notify the kicked member via relay
        self.send_member_action_relay(community_id, member_did, "kick");
        self.error_message = Some(format!("Kicked {} from community", member_name));

        // Reload communities to update member count
        self.load_communities_from_db();
    }

    /// Ban a member from a community (remove + add to ban list).
    fn ban_member(&mut self, community_id: &str, member_did: &str, member_name: &str) {
        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        if let Some(ref db) = self.db {
            let _ = db.ban_member(community_id, member_did, &my_did, None);
        }

        // Notify the banned member via relay
        self.send_member_action_relay(community_id, member_did, "ban");
        self.error_message = Some(format!("Banned {} from community", member_name));

        // Reload communities to update member count
        self.load_communities_from_db();
    }

    /// Send a kick/ban notification to the affected member.
    fn send_member_action_relay(&self, community_id: &str, target_did: &str, action: &str) {
        let handle = match &self.relay_handle {
            Some(h) => h,
            None => return,
        };

        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        let community_name = self.communities.iter()
            .find(|c| c.id == community_id)
            .map(|c| c.name.clone())
            .unwrap_or_default();

        let payload = serde_json::json!({
            "type": "community_member_action",
            "community_id": community_id,
            "community_name": community_name,
            "action": action,
            "target_did": target_did,
            "actor_did": my_did,
        });

        handle.send(target_did.to_string(), payload.to_string());
    }

    // ── Community navigation (handled in chat.rs for NavRoute) ──────────

    /// Open the selected community — load its structure.
    pub(super) fn open_community(&mut self, community_idx: usize) {
        if community_idx >= self.communities.len() {
            return;
        }

        let community_id = self.communities[community_idx].id.clone();
        self.active_community = Some(community_id.clone());
        self.community_focus = CommunityFocus::ChannelTree;
        self.load_community_structure(&community_id);

        // Auto-select first text channel if available
        self.active_channel = None;
        self.active_channel_name = None;
        let first_text_channel = self.channel_tree.iter().find_map(|item| {
            if let ChannelTreeItem::Channel { id, name, channel_type } = item {
                if channel_type == "text" {
                    return Some((id.clone(), name.clone()));
                }
            }
            None
        });
        if let Some((id, name)) = first_text_channel {
            self.active_channel = Some(id.clone());
            self.active_channel_name = Some(name);
            self.load_channel_messages(&id);
        }
    }

    /// Load messages for a channel into app.messages.
    pub(super) fn load_channel_messages(&mut self, channel_id: &str) {
        let db = match &self.db {
            Some(db) => db,
            None => return,
        };

        let my_did = self.my_did.clone().unwrap_or_default();
        let stored = db.load_community_messages(channel_id, 100).unwrap_or_default();

        self.messages = stored
            .into_iter()
            .map(|m| {
                let sender_name = self.find_community_member_name(&m.sender_did);
                DisplayMessage {
                    id: m.id,
                    sender_did: m.sender_did.clone(),
                    sender_name,
                    content: m.content,
                    timestamp: m.timestamp,
                    is_mine: m.sender_did == my_did,
                    edited_at: m.edited_at,
                    deleted: m.deleted,
                    status: "sent".to_string(),
                    reactions: Vec::new(),
                    pinned: false,
                }
            })
            .collect();

        self.message_scroll = 0;
        self.selected_message = None;
        self.message_action_mode = None;
    }

    /// Find a community member's display name.
    fn find_community_member_name(&self, did: &str) -> String {
        // Check current community members
        if let Some(ref community_id) = self.active_community {
            if let Some(ref db) = self.db {
                let members = db.load_community_members(community_id).unwrap_or_default();
                for m in &members {
                    if m.did == did {
                        return m.display_name.clone().unwrap_or_else(|| did[..8.min(did.len())].to_string());
                    }
                }
            }
        }

        // Fall back to friends
        if let Some(name) = self.find_friend_name(did) {
            return name;
        }

        did[..8.min(did.len())].to_string()
    }

    /// Leave a community.
    pub(super) fn leave_community(&mut self, community_id: &str) {
        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        if let Some(ref db) = self.db {
            let _ = db.remove_community_member(community_id, &my_did);
            // If we're the only member, delete the whole community
            if db.community_member_count(community_id) == 0 {
                let _ = db.delete_community(community_id);
            }
        }

        // Clear active state if we were viewing this community
        if self.active_community.as_deref() == Some(community_id) {
            self.active_community = None;
            self.active_channel = None;
            self.active_channel_name = None;
            self.channel_tree.clear();
            self.community_spaces.clear();
            self.messages.clear();
            self.community_focus = CommunityFocus::CommunityList;
        }

        self.load_communities_from_db();
    }

    // ── Relay helpers ───────────────────────────────────────────────────

    fn send_community_create_relay(&self, community_id: &str, name: &str, description: &str) {
        let handle = match &self.relay_handle {
            Some(h) => h,
            None => return,
        };

        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        let desc = if description.trim().is_empty() {
            serde_json::Value::Null
        } else {
            serde_json::Value::String(description.trim().to_string())
        };

        // Fan-out to all friends so they know about the new community
        let friends = self.load_friends_vec();
        let payload = serde_json::json!({
            "type": "community_create",
            "community_id": community_id,
            "name": name,
            "description": desc,
            "creator_did": my_did,
        });

        let payload_str = payload.to_string();
        for friend in &friends {
            handle.send(friend.did.clone(), payload_str.clone());
        }
    }

    /// Send a community channel message via relay (fan-out to all members).
    pub(super) fn send_community_message(&mut self, content: &str) {
        let channel_id = match &self.active_channel {
            Some(id) => id.clone(),
            None => return,
        };

        let community_id = match &self.active_community {
            Some(id) => id.clone(),
            None => return,
        };

        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        let msg_id = format!("cmsg_{}", uuid_v4());

        // Save locally
        if let Some(ref db) = self.db {
            let _ = db.save_community_message(&crate::db::StoredCommunityMessage {
                id: msg_id.clone(),
                channel_id: channel_id.clone(),
                sender_did: my_did.clone(),
                content: content.to_string(),
                timestamp: now,
                edited_at: None,
                deleted: false,
            });
        }

        // Add to display
        let sender_name = self.get_my_display_name();
        self.messages.push(DisplayMessage {
            id: msg_id.clone(),
            sender_did: my_did.clone(),
            sender_name,
            content: content.to_string(),
            timestamp: now,
            is_mine: true,
            edited_at: None,
            deleted: false,
            status: "sent".to_string(),
            reactions: Vec::new(),
            pinned: false,
        });

        // Fan-out to community members
        if let Some(ref handle) = self.relay_handle {
            if let Some(ref db) = self.db {
                let members = db.load_community_members(&community_id).unwrap_or_default();
                let payload = serde_json::json!({
                    "type": "community_message",
                    "community_id": community_id,
                    "channel_id": channel_id,
                    "message_id": msg_id,
                    "content": content,
                    "sender_did": my_did,
                    "timestamp": now,
                });
                let payload_str = payload.to_string();
                for member in &members {
                    if member.did != my_did {
                        handle.send(member.did.clone(), payload_str.clone());
                    }
                }
            }
        }
    }

    // ── Incoming community messages ─────────────────────────────────────

    pub(super) fn handle_incoming_community_create(&mut self, from_did: &str, envelope: &serde_json::Value) {
        let community_id = envelope["community_id"].as_str().unwrap_or("").to_string();
        let name = envelope["name"].as_str().unwrap_or("Unknown").to_string();
        let description = envelope["description"].as_str().map(|s| s.to_string());
        let creator_did = envelope["creator_did"].as_str().unwrap_or(from_did).to_string();

        if community_id.is_empty() {
            return;
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        if let Some(ref db) = self.db {
            // Save community if we don't have it
            if db.load_community(&community_id).ok().flatten().is_none() {
                let _ = db.save_community(&StoredCommunity {
                    id: community_id.clone(),
                    name,
                    description,
                    created_by: creator_did.clone(),
                    created_at: now,
                });

                // Add ourselves as a member
                if let Some(ref my_did) = self.my_did {
                    let display_name = self.get_my_display_name();
                    let _ = db.add_community_member(&StoredCommunityMember {
                        community_id: community_id.clone(),
                        did: my_did.clone(),
                        display_name: Some(display_name),
                        joined_at: now,
                    });
                }

                // Add the creator as a member
                let creator_name = self.find_friend_name(&creator_did)
                    .unwrap_or_else(|| creator_did[..8.min(creator_did.len())].to_string());
                let _ = db.add_community_member(&StoredCommunityMember {
                    community_id: community_id.clone(),
                    did: creator_did,
                    display_name: Some(creator_name),
                    joined_at: now,
                });
            }
        }

        self.load_communities_from_db();
    }

    pub(super) fn handle_incoming_community_message(&mut self, _from_did: &str, envelope: &serde_json::Value) {
        let community_id = envelope["community_id"].as_str().unwrap_or("").to_string();
        let channel_id = envelope["channel_id"].as_str().unwrap_or("").to_string();
        let msg_id = envelope["message_id"].as_str().unwrap_or("").to_string();
        let content = envelope["content"].as_str().unwrap_or("").to_string();
        let sender_did = envelope["sender_did"].as_str().unwrap_or("").to_string();
        let timestamp = envelope["timestamp"].as_i64().unwrap_or(0);

        if community_id.is_empty() || channel_id.is_empty() || msg_id.is_empty() {
            return;
        }

        // Save to DB
        if let Some(ref db) = self.db {
            let _ = db.save_community_message(&crate::db::StoredCommunityMessage {
                id: msg_id.clone(),
                channel_id: channel_id.clone(),
                sender_did: sender_did.clone(),
                content: content.clone(),
                timestamp,
                edited_at: None,
                deleted: false,
            });
        }

        // If we're viewing this channel, add to display
        if self.active_channel.as_deref() == Some(&channel_id) {
            let sender_name = self.find_community_member_name(&sender_did);
            let my_did = self.my_did.clone().unwrap_or_default();
            self.messages.push(DisplayMessage {
                id: msg_id,
                sender_did: sender_did.clone(),
                sender_name,
                content,
                timestamp,
                is_mine: sender_did == my_did,
                edited_at: None,
                deleted: false,
                status: "sent".to_string(),
                reactions: Vec::new(),
                pinned: false,
            });
        }
    }

    // ── Community message edit/delete ─────────────────────────────────

    pub(super) fn send_community_message_edit(&mut self, msg_id: &str, new_content: &str) {
        let community_id = match &self.active_community {
            Some(id) => id.clone(),
            None => return,
        };

        let channel_id = match &self.active_channel {
            Some(id) => id.clone(),
            None => return,
        };

        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        // Update in DB
        if let Some(ref db) = self.db {
            let _ = db.update_community_message_content(msg_id, new_content, now);
        }

        // Update in display
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == msg_id) {
            msg.content = new_content.to_string();
            msg.edited_at = Some(now);
        }

        // Fan-out to community members
        if let Some(ref handle) = self.relay_handle {
            if let Some(ref db) = self.db {
                let members = db.load_community_members(&community_id).unwrap_or_default();
                let payload = serde_json::json!({
                    "type": "community_message_edit",
                    "community_id": community_id,
                    "channel_id": channel_id,
                    "message_id": msg_id,
                    "new_content": new_content,
                    "timestamp": now,
                });
                let payload_str = payload.to_string();
                for member in &members {
                    if member.did != my_did {
                        handle.send(member.did.clone(), payload_str.clone());
                    }
                }
            }
        }
    }

    pub(super) fn send_community_message_delete(&mut self, msg_id: &str) {
        let community_id = match &self.active_community {
            Some(id) => id.clone(),
            None => return,
        };

        let channel_id = match &self.active_channel {
            Some(id) => id.clone(),
            None => return,
        };

        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        // Soft delete in DB
        if let Some(ref db) = self.db {
            let _ = db.soft_delete_community_message(msg_id);
        }

        // Update in display
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == msg_id) {
            msg.deleted = true;
            msg.content = "[message deleted]".to_string();
        }

        // Fan-out to community members
        if let Some(ref handle) = self.relay_handle {
            if let Some(ref db) = self.db {
                let members = db.load_community_members(&community_id).unwrap_or_default();
                let payload = serde_json::json!({
                    "type": "community_message_delete",
                    "community_id": community_id,
                    "channel_id": channel_id,
                    "message_id": msg_id,
                });
                let payload_str = payload.to_string();
                for member in &members {
                    if member.did != my_did {
                        handle.send(member.did.clone(), payload_str.clone());
                    }
                }
            }
        }
    }

    pub(super) fn handle_incoming_community_message_edit(&mut self, _from_did: &str, envelope: &serde_json::Value) {
        let channel_id = envelope["channel_id"].as_str().unwrap_or("").to_string();
        let msg_id = envelope["message_id"].as_str().unwrap_or("").to_string();
        let new_content = envelope["new_content"].as_str().unwrap_or("").to_string();
        let timestamp = envelope["timestamp"].as_i64().unwrap_or(0);

        if msg_id.is_empty() {
            return;
        }

        // Update in DB
        if let Some(ref db) = self.db {
            let _ = db.update_community_message_content(&msg_id, &new_content, timestamp);
        }

        // Update in display if viewing this channel
        if self.active_channel.as_deref() == Some(&channel_id) {
            if let Some(msg) = self.messages.iter_mut().find(|m| m.id == msg_id) {
                msg.content = new_content;
                msg.edited_at = Some(timestamp);
            }
        }
    }

    pub(super) fn handle_incoming_community_message_delete(&mut self, _from_did: &str, envelope: &serde_json::Value) {
        let channel_id = envelope["channel_id"].as_str().unwrap_or("").to_string();
        let msg_id = envelope["message_id"].as_str().unwrap_or("").to_string();

        if msg_id.is_empty() {
            return;
        }

        // Soft delete in DB
        if let Some(ref db) = self.db {
            let _ = db.soft_delete_community_message(&msg_id);
        }

        // Update in display if viewing this channel
        if self.active_channel.as_deref() == Some(&channel_id) {
            if let Some(msg) = self.messages.iter_mut().find(|m| m.id == msg_id) {
                msg.deleted = true;
                msg.content = "[message deleted]".to_string();
            }
        }
    }

    // ── Community invites ─────────────────────────────────────────────────

    pub(super) fn handle_community_invites_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        let invites_len = match &self.screen {
            Screen::CommunityInvites { invites, .. } => invites.len(),
            _ => return None,
        };

        match key.code {
            KeyCode::Up => {
                if let Screen::CommunityInvites { selected_invite, .. } = &mut self.screen {
                    if *selected_invite > 0 {
                        *selected_invite -= 1;
                    }
                }
            }
            KeyCode::Down => {
                if let Screen::CommunityInvites { selected_invite, .. } = &mut self.screen {
                    if *selected_invite + 1 < invites_len {
                        *selected_invite += 1;
                    }
                }
            }
            KeyCode::Char('n') => {
                // Create a new invite
                self.create_invite();
            }
            KeyCode::Char('d') => {
                // Delete the selected invite
                let (invite_id, invite_code) = match &self.screen {
                    Screen::CommunityInvites { invites, selected_invite, .. } => {
                        if *selected_invite < invites.len() {
                            (invites[*selected_invite].id.clone(), invites[*selected_invite].code.clone())
                        } else {
                            return None;
                        }
                    }
                    _ => return None,
                };
                self.delete_invite(&invite_id, &invite_code);
            }
            KeyCode::Esc => {
                self.return_from_community_invites();
            }
            _ => {}
        }

        None
    }

    fn create_invite(&mut self) {
        let community_id = match &self.screen {
            Screen::CommunityInvites { community_id, .. } => community_id.clone(),
            _ => return,
        };

        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        // Generate a short invite code
        let code = generate_invite_code();
        let invite_id = format!("inv_{}", uuid_v4());

        // Get community info for publishing
        let (community_name, community_desc, member_count) = self.communities.iter()
            .find(|c| c.id == community_id)
            .map(|c| (c.name.clone(), c.description.clone(), c.member_count as u32))
            .unwrap_or_else(|| ("Unknown".to_string(), None, 0));

        // Save to DB
        if let Some(ref db) = self.db {
            let _ = db.save_invite(&StoredCommunityInvite {
                id: invite_id.clone(),
                community_id: community_id.clone(),
                code: code.clone(),
                creator_did: my_did.clone(),
                max_uses: None,
                use_count: 0,
                expires_at: None,
                created_at: now,
            });
        }

        // Publish to relay for resolution
        if let Some(ref handle) = self.relay_handle {
            // Create an invite payload that contains the community data needed to join
            let payload = serde_json::json!({
                "creator_did": my_did,
                "community_id": community_id,
            });
            handle.publish_invite(
                code.clone(),
                community_id.clone(),
                community_name,
                community_desc,
                member_count,
                None,  // max_uses
                None,  // expires_at
                payload.to_string(),
            );
        }

        // Reload invites
        self.reload_invites_on_screen();
        self.error_message = Some(format!("Invite created: {}", code));
    }

    fn delete_invite(&mut self, invite_id: &str, invite_code: &str) {
        if let Some(ref db) = self.db {
            let _ = db.delete_invite(invite_id);
        }

        // Revoke from relay
        if let Some(ref handle) = self.relay_handle {
            handle.revoke_invite(invite_code.to_string());
        }

        self.reload_invites_on_screen();
        self.error_message = Some("Invite deleted".into());
    }

    fn reload_invites_on_screen(&mut self) {
        if let Screen::CommunityInvites { community_id, invites, selected_invite, .. } = &mut self.screen {
            if let Some(ref db) = self.db {
                *invites = db.load_invites(community_id)
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
                    .collect();
                if *selected_invite >= invites.len() && !invites.is_empty() {
                    *selected_invite = invites.len() - 1;
                }
            }
        }
    }

    fn return_from_community_invites(&mut self) {
        if let Screen::CommunityInvites { info, .. } = &self.screen {
            let info = info.clone();
            let friends = self.load_friends_vec();
            self.screen = Screen::Chat {
                info,
                focus: ChatFocus::Sidebar,
                friends,
                selected_friend: 0,
                active_conversation: None,
            };
        }
    }

    // ── Join community by invite code ──────────────────────────────────

    pub(super) fn handle_join_community_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        let (has_resolved, resolving) = match &self.screen {
            Screen::JoinCommunity { resolved_invite, resolving, .. } => {
                (resolved_invite.is_some(), *resolving)
            }
            _ => return None,
        };

        match key.code {
            KeyCode::Enter => {
                if has_resolved {
                    // Join the resolved community
                    self.join_resolved_community();
                } else if !resolving {
                    // Resolve the invite code
                    let code = match &self.screen {
                        Screen::JoinCommunity { invite_code_input, .. } => invite_code_input.trim().to_string(),
                        _ => return None,
                    };
                    if code.is_empty() {
                        self.error_message = Some("Please enter an invite code".into());
                        return None;
                    }
                    // Request resolution from relay
                    if let Some(ref handle) = self.relay_handle {
                        handle.resolve_invite(code);
                        if let Screen::JoinCommunity { resolving, .. } = &mut self.screen {
                            *resolving = true;
                        }
                    } else {
                        self.error_message = Some("Not connected to relay".into());
                    }
                }
            }
            KeyCode::Esc => {
                self.return_from_join_community();
            }
            KeyCode::Backspace => {
                if !has_resolved {
                    if let Screen::JoinCommunity { invite_code_input, .. } = &mut self.screen {
                        invite_code_input.pop();
                    }
                }
            }
            KeyCode::Char(c) => {
                if !has_resolved && !resolving {
                    if let Screen::JoinCommunity { invite_code_input, .. } = &mut self.screen {
                        if invite_code_input.len() < 32 {
                            invite_code_input.push(c);
                        }
                    }
                }
            }
            _ => {}
        }

        None
    }

    pub(super) fn handle_invite_resolved(
        &mut self,
        code: &str,
        community_id: &str,
        community_name: &str,
        community_description: Option<&str>,
        member_count: u32,
        invite_payload: &str,
    ) {
        if let Screen::JoinCommunity { resolved_invite, resolving, .. } = &mut self.screen {
            *resolving = false;
            *resolved_invite = Some(ResolvedInvite {
                code: code.to_string(),
                community_id: community_id.to_string(),
                community_name: community_name.to_string(),
                community_description: community_description.map(|s| s.to_string()),
                member_count,
                invite_payload: invite_payload.to_string(),
            });
        }
    }

    pub(super) fn handle_invite_not_found(&mut self, code: &str) {
        if let Screen::JoinCommunity { resolving, .. } = &mut self.screen {
            *resolving = false;
        }
        self.error_message = Some(format!("Invite code '{}' not found", code));
    }

    fn join_resolved_community(&mut self) {
        let resolved = match &self.screen {
            Screen::JoinCommunity { resolved_invite: Some(resolved), .. } => resolved.clone(),
            _ => return,
        };

        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        // Check if we already have this community
        if let Some(ref db) = self.db {
            if db.is_community_member(&resolved.community_id, &my_did) {
                self.error_message = Some("Already a member of this community".into());
                self.return_from_join_community();
                return;
            }
        }

        // Save the community to DB
        if let Some(ref db) = self.db {
            let _ = db.save_community(&StoredCommunity {
                id: resolved.community_id.clone(),
                name: resolved.community_name.clone(),
                description: resolved.community_description.clone(),
                created_by: String::new(), // We don't know the creator from invite resolution
                created_at: now,
            });

            // Add ourselves as a member
            let display_name = self.get_my_display_name();
            let _ = db.add_community_member(&StoredCommunityMember {
                community_id: resolved.community_id.clone(),
                did: my_did.clone(),
                display_name: Some(display_name),
                joined_at: now,
            });
        }

        // Try to get creator DID from invite payload and notify them
        if let Ok(payload) = serde_json::from_str::<serde_json::Value>(&resolved.invite_payload) {
            if let Some(creator_did) = payload["creator_did"].as_str() {
                // Send join notification to the community creator
                if let Some(ref handle) = self.relay_handle {
                    let join_payload = serde_json::json!({
                        "type": "community_join",
                        "community_id": resolved.community_id,
                        "joiner_did": my_did,
                        "joiner_name": self.get_my_display_name(),
                    });
                    handle.send(creator_did.to_string(), join_payload.to_string());
                }
            }
        }

        self.load_communities_from_db();
        self.error_message = Some(format!("Joined community '{}'", resolved.community_name));
        self.return_from_join_community();
    }

    fn return_from_join_community(&mut self) {
        if let Screen::JoinCommunity { info, .. } = &self.screen {
            let info = info.clone();
            let friends = self.load_friends_vec();
            self.screen = Screen::Chat {
                info,
                focus: ChatFocus::Sidebar,
                friends,
                selected_friend: 0,
                active_conversation: None,
            };
        }
    }

    // ── Incoming member actions ─────────────────────────────────────────

    pub(super) fn handle_incoming_member_action(&mut self, _from_did: &str, envelope: &serde_json::Value) {
        let community_id = envelope["community_id"].as_str().unwrap_or("").to_string();
        let community_name = envelope["community_name"].as_str().unwrap_or("Unknown").to_string();
        let action = envelope["action"].as_str().unwrap_or("").to_string();
        let target_did = envelope["target_did"].as_str().unwrap_or("").to_string();

        if community_id.is_empty() || target_did.is_empty() {
            return;
        }

        // Only process if we are the target
        let my_did = match &self.my_did {
            Some(did) => did.clone(),
            None => return,
        };
        if target_did != my_did {
            return;
        }

        match action.as_str() {
            "kick" => {
                // Remove ourselves from the community
                if let Some(ref db) = self.db {
                    let _ = db.remove_community_member(&community_id, &my_did);
                }
                self.error_message = Some(format!("You were kicked from '{}'", community_name));
            }
            "ban" => {
                // Remove ourselves and note the ban
                if let Some(ref db) = self.db {
                    let _ = db.remove_community_member(&community_id, &my_did);
                }
                self.error_message = Some(format!("You were banned from '{}'", community_name));
            }
            _ => return,
        }

        // Clear active community if we were viewing it
        if self.active_community.as_deref() == Some(&community_id) {
            self.active_community = None;
            self.active_channel = None;
            self.active_channel_name = None;
            self.channel_tree.clear();
            self.community_spaces.clear();
            self.messages.clear();
            self.community_focus = CommunityFocus::CommunityList;
        }

        self.load_communities_from_db();
    }

    // ── Incoming community join ─────────────────────────────────────────

    pub(super) fn handle_incoming_community_join(&mut self, _from_did: &str, envelope: &serde_json::Value) {
        let community_id = envelope["community_id"].as_str().unwrap_or("").to_string();
        let joiner_did = envelope["joiner_did"].as_str().unwrap_or("").to_string();
        let joiner_name = envelope["joiner_name"].as_str().unwrap_or("Unknown").to_string();

        if community_id.is_empty() || joiner_did.is_empty() {
            return;
        }

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);

        // Add the joiner as a member if we have this community
        if let Some(ref db) = self.db {
            if db.load_community(&community_id).ok().flatten().is_some() {
                let _ = db.add_community_member(&StoredCommunityMember {
                    community_id: community_id.clone(),
                    did: joiner_did,
                    display_name: Some(joiner_name.clone()),
                    joined_at: now,
                });
            }
        }

        // Reload to update member count
        self.load_communities_from_db();
    }

    // ── Helpers ─────────────────────────────────────────────────────────

    /// Get our display name from the current screen state.
    fn get_my_display_name(&self) -> String {
        match &self.screen {
            Screen::Chat { info, .. } |
            Screen::CreateCommunity { info, .. } |
            Screen::CommunityMembers { info, .. } |
            Screen::CommunityRoles { info, .. } |
            Screen::MemberActions { info, .. } |
            Screen::CommunityInvites { info, .. } |
            Screen::JoinCommunity { info, .. } |
            Screen::AddFriend { info, .. } |
            Screen::FriendRequests { info, .. } |
            Screen::CreateGroup { info, .. } => info.display_name.clone(),
            _ => "Me".to_string(),
        }
    }

    /// Load friends as a Vec<FriendEntry> from DB.
    pub(super) fn load_friends_vec(&self) -> Vec<FriendEntry> {
        let db = match &self.db {
            Some(db) => db,
            None => return Vec::new(),
        };

        db.load_friends()
            .unwrap_or_default()
            .into_iter()
            .map(|f| FriendEntry {
                did: f.did,
                display_name: f.display_name,
                username: f.username,
                encryption_key: f.encryption_key,
                signing_key: f.signing_key,
            })
            .collect()
    }
}

/// Generate a short, human-friendly invite code (8 chars).
fn generate_invite_code() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let hash = t.wrapping_mul(0x517cc1b727220a95) ^ (t >> 32);
    // Use base36 characters for readability
    let chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let mut code = String::with_capacity(8);
    let mut val = hash as u64;
    for _ in 0..8 {
        let idx = (val % 36) as usize;
        code.push(chars.as_bytes()[idx] as char);
        val /= 36;
    }
    code
}

/// Generate a simple UUID v4-like string.
fn uuid_v4() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let t = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    let r: u64 = (t as u64) ^ (t.wrapping_shr(64) as u64);
    format!("{:016x}{:016x}", r, r.wrapping_mul(0x517cc1b727220a95))
}
