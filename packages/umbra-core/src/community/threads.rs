//! # Threads & Search
//!
//! Threaded conversations, thread follow/unfollow, message search,
//! and advanced search with filters.

use super::service::generate_id;
use crate::error::{Error, Result};
use crate::storage::{
    CommunityMessageRecord, CommunityThreadFollowerRecord, CommunityThreadRecord,
};

impl super::CommunityService {
    // ── Threads ─────────────────────────────────────────────────────────

    /// Create a thread from a parent message.
    pub fn create_thread(
        &self,
        channel_id: &str,
        parent_message_id: &str,
        name: Option<&str>,
        created_by: &str,
    ) -> Result<CommunityThreadRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        // Verify parent message exists
        let _msg = self
            .db()
            .get_community_message(parent_message_id)?
            .ok_or(Error::MessageNotFound)?;

        self.db().create_community_thread(
            &id,
            channel_id,
            parent_message_id,
            name,
            created_by,
            now,
        )?;

        // Auto-follow the creator
        let _ = self.db().follow_thread(&id, created_by, now);

        Ok(CommunityThreadRecord {
            id,
            channel_id: channel_id.to_string(),
            parent_message_id: parent_message_id.to_string(),
            name: name.map(|s| s.to_string()),
            created_by: created_by.to_string(),
            message_count: 0,
            last_message_at: None,
            created_at: now,
        })
    }

    /// Get a thread by ID.
    pub fn get_thread(&self, id: &str) -> Result<CommunityThreadRecord> {
        self.db()
            .get_community_thread(id)?
            .ok_or(Error::InvalidCommunityOperation(
                "Thread not found".to_string(),
            ))
    }

    /// Get all threads in a channel.
    pub fn get_threads(&self, channel_id: &str) -> Result<Vec<CommunityThreadRecord>> {
        self.db().get_community_threads(channel_id)
    }

    /// Get messages in a thread (direct query by thread_id).
    pub fn get_thread_messages(
        &self,
        thread_id: &str,
        limit: usize,
        before_timestamp: Option<i64>,
    ) -> Result<Vec<CommunityMessageRecord>> {
        self.db()
            .get_thread_messages_direct(thread_id, limit, before_timestamp)
    }

    // ── Thread Follow/Unfollow ──────────────────────────────────────────

    /// Follow a thread (subscribe to notifications).
    pub fn follow_thread(&self, thread_id: &str, member_did: &str) -> Result<()> {
        // Verify thread exists
        let _ = self.get_thread(thread_id)?;
        let now = crate::time::now_timestamp();
        self.db().follow_thread(thread_id, member_did, now)
    }

    /// Unfollow a thread.
    pub fn unfollow_thread(&self, thread_id: &str, member_did: &str) -> Result<()> {
        self.db().unfollow_thread(thread_id, member_did)
    }

    /// Get all followers of a thread.
    pub fn get_thread_followers(
        &self,
        thread_id: &str,
    ) -> Result<Vec<CommunityThreadFollowerRecord>> {
        self.db().get_thread_followers(thread_id)
    }

    /// Check if a member is following a thread.
    pub fn is_following_thread(&self, thread_id: &str, member_did: &str) -> Result<bool> {
        self.db().is_following_thread(thread_id, member_did)
    }

    // ── Search ──────────────────────────────────────────────────────────

    /// Search messages in a channel by content (plaintext only).
    pub fn search_messages(
        &self,
        channel_id: &str,
        query: &str,
        limit: usize,
    ) -> Result<Vec<CommunityMessageRecord>> {
        self.db()
            .search_community_messages(channel_id, query, limit)
    }

    /// Search messages across all channels in a community.
    pub fn search_community_messages(
        &self,
        community_id: &str,
        query: &str,
        limit: usize,
    ) -> Result<Vec<CommunityMessageRecord>> {
        let channels = self.db().get_community_channels(community_id)?;
        let mut results = Vec::new();

        for channel in &channels {
            let mut channel_results =
                self.db()
                    .search_community_messages(&channel.id, query, limit)?;
            results.append(&mut channel_results);
        }

        // Sort by created_at descending, then truncate
        results.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        results.truncate(limit);
        Ok(results)
    }

    /// Advanced search with filters (from:, in:, before:, after:, has:, is:).
    ///
    /// Parameters:
    /// - `community_id`: The community to search in
    /// - `query`: Text content search (optional, None skips content filter)
    /// - `from_did`: Filter by sender DID (from: filter)
    /// - `channel_id`: Filter to specific channel (in: filter)
    /// - `before`: Only messages before this timestamp
    /// - `after`: Only messages after this timestamp
    /// - `has_file`: Filter for messages with attachments (has:file)
    /// - `has_reaction`: Filter for messages with reactions (has:reaction)
    /// - `is_pinned`: Filter for pinned messages (is:pinned)
    /// - `limit`: Max results
    #[allow(clippy::too_many_arguments)]
    pub fn search_advanced(
        &self,
        community_id: &str,
        query: Option<&str>,
        from_did: Option<&str>,
        channel_id: Option<&str>,
        before: Option<i64>,
        after: Option<i64>,
        has_file: Option<bool>,
        has_reaction: Option<bool>,
        is_pinned: Option<bool>,
        limit: usize,
    ) -> Result<Vec<CommunityMessageRecord>> {
        // Determine which channels to search
        let channel_ids: Vec<String> = if let Some(cid) = channel_id {
            vec![cid.to_string()]
        } else {
            let channels = self.db().get_community_channels(community_id)?;
            channels.iter().map(|c| c.id.clone()).collect()
        };

        if channel_ids.is_empty() {
            return Ok(Vec::new());
        }

        // Get pinned message IDs if needed
        let pinned_ids: Vec<String> = if is_pinned == Some(true) {
            let mut all_pinned = Vec::new();
            for cid in &channel_ids {
                let mut pins = self.db().get_pinned_message_ids(cid)?;
                all_pinned.append(&mut pins);
            }
            all_pinned
        } else {
            Vec::new()
        };

        self.db().search_community_messages_advanced(
            &channel_ids,
            query,
            from_did,
            before,
            after,
            has_file,
            has_reaction,
            is_pinned,
            &pinned_ids,
            limit,
        )
    }
}
