//! # File Management
//!
//! File and folder CRUD for file-type channels.

use crate::error::{Error, Result};
use crate::storage::{CommunityFileRecord, CommunityFileFolderRecord};
use super::service::generate_id;

impl super::CommunityService {
    // ── Files ───────────────────────────────────────────────────────────

    /// Upload a file record (metadata + chunk references).
    #[allow(clippy::too_many_arguments)]
    pub fn upload_file(
        &self,
        channel_id: &str,
        folder_id: Option<&str>,
        filename: &str,
        description: Option<&str>,
        file_size: i64,
        mime_type: Option<&str>,
        storage_chunks_json: &str,
        uploaded_by: &str,
    ) -> Result<CommunityFileRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        // Verify channel exists
        let _channel = self.db().get_community_channel(channel_id)?
            .ok_or(Error::ChannelNotFound)?;

        self.db().store_community_file(
            &id, channel_id, folder_id, filename, description,
            file_size, mime_type, storage_chunks_json, uploaded_by, now,
        )?;

        Ok(CommunityFileRecord {
            id,
            channel_id: channel_id.to_string(),
            folder_id: folder_id.map(|s| s.to_string()),
            filename: filename.to_string(),
            description: description.map(|s| s.to_string()),
            file_size,
            mime_type: mime_type.map(|s| s.to_string()),
            storage_chunks_json: storage_chunks_json.to_string(),
            uploaded_by: uploaded_by.to_string(),
            version: 1,
            download_count: 0,
            created_at: now,
        })
    }

    /// Get files in a channel (optionally within a folder).
    pub fn get_files(
        &self,
        channel_id: &str,
        folder_id: Option<&str>,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<CommunityFileRecord>> {
        self.db().get_community_files(channel_id, folder_id, limit, offset)
    }

    /// Get a file by ID.
    pub fn get_file(&self, id: &str) -> Result<CommunityFileRecord> {
        self.db().get_community_file(id)?
            .ok_or(Error::InvalidCommunityOperation("File not found".to_string()))
    }

    /// Increment download count for a file.
    pub fn record_file_download(&self, id: &str) -> Result<()> {
        self.db().increment_file_download_count(id)
    }

    /// Delete a file.
    pub fn delete_file(&self, id: &str, actor_did: &str) -> Result<()> {
        let file = self.get_file(id)?;
        self.db().delete_community_file(id)?;

        // Audit log — we need the channel to get community_id
        if let Some(channel) = self.db().get_community_channel(&file.channel_id)? {
            let now = crate::time::now_timestamp();
            self.db().insert_audit_log(
                &generate_id(), &channel.community_id, actor_did, "file_delete",
                Some("file"), Some(id),
                Some(&serde_json::json!({"filename": file.filename}).to_string()),
                now,
            )?;
        }

        Ok(())
    }

    // ── Folders ─────────────────────────────────────────────────────────

    /// Create a folder in a file channel.
    pub fn create_folder(
        &self,
        channel_id: &str,
        parent_folder_id: Option<&str>,
        name: &str,
        created_by: &str,
    ) -> Result<CommunityFileFolderRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().create_community_file_folder(
            &id, channel_id, parent_folder_id, name, created_by, now,
        )?;

        Ok(CommunityFileFolderRecord {
            id,
            channel_id: channel_id.to_string(),
            parent_folder_id: parent_folder_id.map(|s| s.to_string()),
            name: name.to_string(),
            created_by: created_by.to_string(),
            created_at: now,
        })
    }

    /// Get folders in a channel (optionally within a parent folder).
    pub fn get_folders(
        &self,
        channel_id: &str,
        parent_folder_id: Option<&str>,
    ) -> Result<Vec<CommunityFileFolderRecord>> {
        self.db().get_community_file_folders(channel_id, parent_folder_id)
    }

    /// Delete a folder (cascades to subfolders and files).
    pub fn delete_folder(&self, id: &str) -> Result<()> {
        self.db().delete_community_file_folder(id)
    }
}
