//! Group DM handlers — create, message, receive group messages.

use crossterm::event::{KeyCode, KeyEvent};

use super::*;

impl App {
    /// Handle keys on the CreateGroup screen.
    pub(super) fn handle_create_group_key(&mut self, key: KeyEvent) -> Option<AsyncAction> {
        let (field_focus, group_name, selected_members, _member_cursor, friends_len) =
            match &self.screen {
                Screen::CreateGroup {
                    field_focus,
                    group_name,
                    selected_members,
                    member_cursor,
                    friends,
                    ..
                } => (
                    *field_focus,
                    group_name.clone(),
                    selected_members.clone(),
                    *member_cursor,
                    friends.len(),
                ),
                _ => return None,
            };

        match key.code {
            KeyCode::Tab => {
                // Toggle between Name and Members fields
                if let Screen::CreateGroup { field_focus, .. } = &mut self.screen {
                    *field_focus = match field_focus {
                        CreateGroupFocus::Name => CreateGroupFocus::Members,
                        CreateGroupFocus::Members => CreateGroupFocus::Name,
                    };
                }
            }
            KeyCode::Esc => {
                // Return to chat
                self.return_from_create_group();
            }
            KeyCode::Enter => {
                if field_focus == CreateGroupFocus::Name {
                    // Move to members selection
                    if let Screen::CreateGroup { field_focus, .. } = &mut self.screen {
                        *field_focus = CreateGroupFocus::Members;
                    }
                } else {
                    // Confirm group creation
                    let name = group_name.trim().to_string();
                    if name.is_empty() {
                        self.error_message = Some("Group name is required".into());
                        return None;
                    }

                    let has_members = selected_members.iter().any(|&s| s);
                    if !has_members {
                        self.error_message =
                            Some("Select at least one friend to add".into());
                        return None;
                    }

                    // Create the group
                    self.create_group(&name, &selected_members);
                }
            }
            KeyCode::Up => {
                if field_focus == CreateGroupFocus::Members {
                    if let Screen::CreateGroup { member_cursor, .. } = &mut self.screen {
                        if *member_cursor > 0 {
                            *member_cursor -= 1;
                        }
                    }
                }
            }
            KeyCode::Down => {
                if field_focus == CreateGroupFocus::Members && friends_len > 0 {
                    if let Screen::CreateGroup {
                        member_cursor,
                        friends,
                        ..
                    } = &mut self.screen
                    {
                        if *member_cursor < friends.len() - 1 {
                            *member_cursor += 1;
                        }
                    }
                }
            }
            KeyCode::Char(' ') => {
                // Toggle member selection
                if field_focus == CreateGroupFocus::Members {
                    if let Screen::CreateGroup {
                        selected_members,
                        member_cursor,
                        ..
                    } = &mut self.screen
                    {
                        if *member_cursor < selected_members.len() {
                            selected_members[*member_cursor] = !selected_members[*member_cursor];
                        }
                    }
                } else {
                    // Space in name field
                    if let Screen::CreateGroup { group_name, .. } = &mut self.screen {
                        if group_name.len() < 50 {
                            group_name.push(' ');
                        }
                    }
                }
            }
            KeyCode::Backspace => {
                if field_focus == CreateGroupFocus::Name {
                    if let Screen::CreateGroup { group_name, .. } = &mut self.screen {
                        group_name.pop();
                    }
                }
            }
            KeyCode::Char(c) => {
                if field_focus == CreateGroupFocus::Name {
                    if let Screen::CreateGroup { group_name, .. } = &mut self.screen {
                        if group_name.len() < 50 {
                            group_name.push(c);
                        }
                    }
                }
            }
            _ => {}
        }
        None
    }

    /// Create a group and notify all members via relay.
    fn create_group(&mut self, name: &str, selected_members: &[bool]) {
        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => {
                self.error_message = Some("Identity not loaded".into());
                return;
            }
        };

        let my_name = self
            .identity
            .as_ref()
            .map(|id| id.profile().display_name.clone())
            .unwrap_or_else(|| "Me".to_string());

        // Gather selected friend DIDs
        let friends = match &self.screen {
            Screen::CreateGroup { friends, .. } => friends.clone(),
            _ => return,
        };

        let mut member_dids: Vec<(String, String)> = Vec::new(); // (did, display_name)
        for (i, selected) in selected_members.iter().enumerate() {
            if *selected && i < friends.len() {
                member_dids.push((
                    friends[i].did.clone(),
                    friends[i].display_name.clone(),
                ));
            }
        }

        if member_dids.is_empty() {
            self.error_message = Some("Select at least one friend".into());
            return;
        }

        let group_id = uuid::Uuid::new_v4().to_string();
        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        // Save group to local DB
        if let Some(ref db) = self.db {
            let _ = db.save_group(&group_id, name, None, &my_did, ts);
            // Add ourselves as a member
            let _ = db.add_group_member(&group_id, &my_did, Some(&my_name), ts);
            // Add selected friends as members
            for (did, display_name) in &member_dids {
                let _ = db.add_group_member(&group_id, did, Some(display_name), ts);
            }
        }

        // Build member list for the relay invite
        let all_member_dids: Vec<String> = std::iter::once(my_did.clone())
            .chain(member_dids.iter().map(|(did, _)| did.clone()))
            .collect();

        // Send group_create to each invited member
        let payload = serde_json::json!({
            "type": "group_create",
            "group_id": group_id,
            "name": name,
            "members": all_member_dids,
            "creator_did": my_did,
            "creator_name": my_name,
            "timestamp": ts,
        })
        .to_string();

        if let Some(ref relay) = self.relay_handle {
            for (did, _) in &member_dids {
                relay.send(did.clone(), payload.clone());
            }
        }

        // Reload groups from DB
        self.load_groups_from_db();

        let member_count = member_dids.len();
        self.error_message = Some(format!(
            "Group '{}' created with {} member{}",
            name,
            member_count,
            if member_count != 1 { "s" } else { "" }
        ));

        // Return to chat with groups sidebar
        self.sidebar_mode = SidebarMode::Groups;
        self.return_from_create_group();
    }

    /// Return from CreateGroup screen back to Chat.
    fn return_from_create_group(&mut self) {
        if let Screen::CreateGroup {
            info,
            friends,
            selected_friend,
            ..
        } = &self.screen
        {
            self.screen = Screen::Chat {
                info: info.clone(),
                focus: ChatFocus::Sidebar,
                friends: friends.clone(),
                selected_friend: *selected_friend,
                active_conversation: None,
            };
        }
    }

    // ── Group messaging ─────────────────────────────────────────────────

    /// Send a message to a group (fan-out to all members).
    pub(super) fn send_group_message(&mut self, text: &str) {
        let group_id = match &self.active_group {
            Some(id) => id.clone(),
            None => return,
        };

        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => {
                self.error_message = Some("Identity not loaded".into());
                return;
            }
        };

        let my_name = self
            .identity
            .as_ref()
            .map(|id| id.profile().display_name.clone())
            .unwrap_or_else(|| "Me".to_string());

        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let msg_id = uuid::Uuid::new_v4().to_string();

        // Save to local DB
        if let Some(ref db) = self.db {
            let _ = db.save_group_message(&msg_id, &group_id, &my_did, text, ts);
        }

        // Build payload
        let payload = serde_json::json!({
            "type": "group_chat",
            "group_id": group_id,
            "message_id": msg_id,
            "content": text,
            "sender_did": my_did,
            "sender_name": my_name,
            "timestamp": ts,
        })
        .to_string();

        // Fan-out: send to each group member (except ourselves)
        if let Some(group) = self.groups.iter().find(|g| g.id == group_id) {
            if let Some(ref relay) = self.relay_handle {
                for member in &group.members {
                    if member.did != my_did {
                        relay.send(member.did.clone(), payload.clone());
                    }
                }
            }
        }

        // Add to displayed messages
        self.messages.push(DisplayMessage {
            id: msg_id,
            sender_did: my_did,
            sender_name: my_name,
            content: text.to_string(),
            timestamp: ts,
            is_mine: true,
            edited_at: None,
            deleted: false,
            status: "sent".to_string(),
            reactions: Vec::new(),
            pinned: false,
        });
        self.message_scroll = 0;
    }

    /// Load group messages from the database.
    pub(super) fn load_group_messages_from_db(&self, group_id: &str) -> Vec<DisplayMessage> {
        let db = match &self.db {
            Some(db) => db,
            None => return Vec::new(),
        };

        let my_did = self.my_did.as_deref().unwrap_or("");
        let my_name = self
            .identity
            .as_ref()
            .map(|id| id.profile().display_name.clone())
            .unwrap_or_else(|| "Me".to_string());

        db.load_group_messages(group_id, 100)
            .unwrap_or_default()
            .into_iter()
            .map(|m| {
                let is_mine = m.sender_did == my_did;
                let sender_name = if is_mine {
                    my_name.clone()
                } else {
                    self.find_group_member_name(group_id, &m.sender_did)
                        .unwrap_or_else(|| {
                            m.sender_did[..16.min(m.sender_did.len())].to_string()
                        })
                };

                DisplayMessage {
                    id: m.id,
                    sender_did: m.sender_did,
                    sender_name,
                    content: m.content,
                    timestamp: m.timestamp,
                    is_mine,
                    edited_at: m.edited_at,
                    deleted: m.deleted,
                    status: "sent".to_string(),
                    reactions: Vec::new(),
                    pinned: false,
                }
            })
            .collect()
    }

    /// Find a member's display name within a group.
    fn find_group_member_name(&self, group_id: &str, did: &str) -> Option<String> {
        if let Some(group) = self.groups.iter().find(|g| g.id == group_id) {
            if let Some(member) = group.members.iter().find(|m| m.did == did) {
                return member.display_name.clone();
            }
        }
        // Fallback: check friends list
        self.find_friend_name(did)
    }

    // ── Incoming group message handlers ──────────────────────────────────

    /// Handle an incoming group_create message.
    pub(super) fn handle_incoming_group_create(
        &mut self,
        from_did: &str,
        envelope: &serde_json::Value,
    ) {
        let group_id = match envelope.get("group_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };
        let name = match envelope.get("name").and_then(|v| v.as_str()) {
            Some(n) => n,
            None => return,
        };
        let creator_did = envelope
            .get("creator_did")
            .and_then(|v| v.as_str())
            .unwrap_or(from_did);
        let creator_name = envelope
            .get("creator_name")
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown");
        let ts = envelope
            .get("timestamp")
            .and_then(|v| v.as_i64())
            .unwrap_or_else(|| {
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs() as i64
            });

        let members: Vec<String> = envelope
            .get("members")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        // Save group to local DB
        if let Some(ref db) = self.db {
            let _ = db.save_group(group_id, name, None, creator_did, ts);

            // Add all members
            for member_did in &members {
                let display_name = if member_did == creator_did {
                    Some(creator_name.to_string())
                } else {
                    self.find_friend_name(member_did)
                };
                let _ = db.add_group_member(
                    group_id,
                    member_did,
                    display_name.as_deref(),
                    ts,
                );
            }
        }

        // Reload groups
        self.load_groups_from_db();

        self.error_message = Some(format!("Added to group '{}'", name));
    }

    /// Handle an incoming group_chat message.
    pub(super) fn handle_incoming_group_chat(
        &mut self,
        _from_did: &str,
        envelope: &serde_json::Value,
    ) {
        let group_id = match envelope.get("group_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };
        let msg_id = match envelope.get("message_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };
        let content = match envelope.get("content").and_then(|v| v.as_str()) {
            Some(c) => c,
            None => return,
        };
        let sender_did = match envelope.get("sender_did").and_then(|v| v.as_str()) {
            Some(d) => d,
            None => return,
        };
        let sender_name = envelope
            .get("sender_name")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .or_else(|| self.find_group_member_name(group_id, sender_did))
            .unwrap_or_else(|| sender_did[..16.min(sender_did.len())].to_string());
        let ts = envelope
            .get("timestamp")
            .and_then(|v| v.as_i64())
            .unwrap_or_else(|| {
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs() as i64
            });

        // Skip if we sent this message
        if let Some(ref my_did) = self.my_did {
            if sender_did == my_did {
                return;
            }
        }

        // Verify we're a member
        if let Some(ref db) = self.db {
            if let Some(ref my_did) = self.my_did {
                if !db.is_group_member(group_id, my_did).unwrap_or(false) {
                    return;
                }
            }
        }

        // Save to DB
        if let Some(ref db) = self.db {
            let _ = db.save_group_message(msg_id, group_id, sender_did, content, ts);
        }

        // If this group is currently active, add to displayed messages
        if self.active_group.as_deref() == Some(group_id) {
            self.messages.push(DisplayMessage {
                id: msg_id.to_string(),
                sender_did: sender_did.to_string(),
                sender_name,
                content: content.to_string(),
                timestamp: ts,
                is_mine: false,
                edited_at: None,
                deleted: false,
                status: "sent".to_string(),
                reactions: Vec::new(),
                pinned: false,
            });
            self.message_scroll = 0;
        }
    }

    /// Handle an incoming group_leave message.
    pub(super) fn handle_incoming_group_leave(
        &mut self,
        _from_did: &str,
        envelope: &serde_json::Value,
    ) {
        let group_id = match envelope.get("group_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };
        let member_did = match envelope.get("member_did").and_then(|v| v.as_str()) {
            Some(d) => d,
            None => return,
        };

        // Remove member from local DB
        if let Some(ref db) = self.db {
            let _ = db.remove_group_member(group_id, member_did);
        }

        // If the leaver is us, remove the group entirely
        if self.my_did.as_deref() == Some(member_did) {
            if let Some(ref db) = self.db {
                let _ = db.delete_group(group_id);
            }
            if self.active_group.as_deref() == Some(group_id) {
                self.active_group = None;
                self.messages.clear();
            }
        }

        // Reload groups
        self.load_groups_from_db();
    }

    /// Handle an incoming group message edit.
    pub(super) fn handle_incoming_group_edit(
        &mut self,
        _from_did: &str,
        envelope: &serde_json::Value,
    ) {
        let message_id = match envelope.get("message_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };
        let new_content = match envelope.get("content").and_then(|v| v.as_str()) {
            Some(c) => c,
            None => return,
        };
        let edited_at = envelope
            .get("edited_at")
            .and_then(|v| v.as_i64())
            .unwrap_or_else(|| {
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default()
                    .as_secs() as i64
            });

        // Update DB
        if let Some(ref db) = self.db {
            let _ = db.update_group_message_content(message_id, new_content, edited_at);
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.content = new_content.to_string();
            msg.edited_at = Some(edited_at);
        }
    }

    /// Handle an incoming group message delete.
    pub(super) fn handle_incoming_group_delete(
        &mut self,
        _from_did: &str,
        envelope: &serde_json::Value,
    ) {
        let message_id = match envelope.get("message_id").and_then(|v| v.as_str()) {
            Some(id) => id,
            None => return,
        };

        // Update DB
        if let Some(ref db) = self.db {
            let _ = db.soft_delete_group_message(message_id);
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.deleted = true;
        }
    }

    // ── Group relay senders ─────────────────────────────────────────────

    /// Send an edit for a group message.
    pub(super) fn send_group_message_edit(
        &mut self,
        message_id: &str,
        new_content: &str,
        group_id: &str,
    ) {
        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => return,
        };

        let ts = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        let payload = serde_json::json!({
            "type": "group_message_edit",
            "group_id": group_id,
            "message_id": message_id,
            "content": new_content,
            "edited_at": ts,
        })
        .to_string();

        // Fan-out to all group members
        if let Some(group) = self.groups.iter().find(|g| g.id == group_id) {
            if let Some(ref relay) = self.relay_handle {
                for member in &group.members {
                    if member.did != my_did {
                        relay.send(member.did.clone(), payload.clone());
                    }
                }
            }
        }

        // Update local DB
        if let Some(ref db) = self.db {
            let _ = db.update_group_message_content(message_id, new_content, ts);
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.content = new_content.to_string();
            msg.edited_at = Some(ts);
        }
    }

    /// Send a delete for a group message.
    pub(super) fn send_group_message_delete(&mut self, message_id: &str, group_id: &str) {
        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => return,
        };

        let payload = serde_json::json!({
            "type": "group_message_delete",
            "group_id": group_id,
            "message_id": message_id,
        })
        .to_string();

        // Fan-out to all group members
        if let Some(group) = self.groups.iter().find(|g| g.id == group_id) {
            if let Some(ref relay) = self.relay_handle {
                for member in &group.members {
                    if member.did != my_did {
                        relay.send(member.did.clone(), payload.clone());
                    }
                }
            }
        }

        // Update local DB
        if let Some(ref db) = self.db {
            let _ = db.soft_delete_group_message(message_id);
        }

        // Update in-memory
        if let Some(msg) = self.messages.iter_mut().find(|m| m.id == message_id) {
            msg.deleted = true;
        }
    }

    /// Leave a group.
    pub(super) fn leave_group(&mut self, group_id: &str) {
        let my_did = match &self.my_did {
            Some(d) => d.clone(),
            None => return,
        };

        let payload = serde_json::json!({
            "type": "group_leave",
            "group_id": group_id,
            "member_did": my_did,
        })
        .to_string();

        // Notify all group members
        if let Some(group) = self.groups.iter().find(|g| g.id == group_id) {
            if let Some(ref relay) = self.relay_handle {
                for member in &group.members {
                    if member.did != my_did {
                        relay.send(member.did.clone(), payload.clone());
                    }
                }
            }
        }

        // Remove from local DB
        if let Some(ref db) = self.db {
            let _ = db.delete_group(group_id);
        }

        // Clear active group if it was this one
        if self.active_group.as_deref() == Some(group_id) {
            self.active_group = None;
            self.messages.clear();
        }

        // Reload groups
        self.load_groups_from_db();
    }
}
