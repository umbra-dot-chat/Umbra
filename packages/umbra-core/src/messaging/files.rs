//! # DM File Management
//!
//! File and folder CRUD for DM shared files between users.

use std::sync::Arc;
use crate::error::{Error, Result};
use crate::storage::{Database, DmSharedFileRecord, DmSharedFolderRecord};

/// Generate a unique ID for DM files.
fn generate_id() -> String {
    let timestamp = crate::time::now_timestamp_millis() as u64;
    let random_part: u64 = {
        #[cfg(not(target_arch = "wasm32"))]
        {
            use std::collections::hash_map::RandomState;
            use std::hash::{BuildHasher, Hasher};
            let s = RandomState::new();
            let mut h = s.build_hasher();
            h.write_u64(timestamp);
            h.finish()
        }
        #[cfg(target_arch = "wasm32")]
        {
            (js_sys::Math::random() * u64::MAX as f64) as u64
        }
    };
    format!("{:016x}{:016x}", timestamp, random_part)
}

/// DM file service — coordinates DM file and folder operations.
pub struct DmFileService {
    db: Arc<Database>,
}

impl DmFileService {
    /// Create a new DM file service backed by the given database.
    pub fn new(db: Arc<Database>) -> Self {
        Self { db }
    }

    fn db(&self) -> &Database {
        &self.db
    }

    // ── Files ────────────────────────────────────────────────────────────

    /// Upload a DM shared file record.
    #[allow(clippy::too_many_arguments)]
    pub fn upload_file(
        &self,
        conversation_id: &str,
        folder_id: Option<&str>,
        filename: &str,
        description: Option<&str>,
        file_size: i64,
        mime_type: Option<&str>,
        storage_chunks_json: &str,
        uploaded_by: &str,
        encrypted_metadata: Option<&str>,
        encryption_nonce: Option<&str>,
    ) -> Result<DmSharedFileRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().store_dm_shared_file(
            &id, conversation_id, folder_id, filename, description,
            file_size, mime_type, storage_chunks_json, uploaded_by,
            encrypted_metadata, encryption_nonce, now,
        )?;

        Ok(DmSharedFileRecord {
            id,
            conversation_id: conversation_id.to_string(),
            folder_id: folder_id.map(|s| s.to_string()),
            filename: filename.to_string(),
            description: description.map(|s| s.to_string()),
            file_size,
            mime_type: mime_type.map(|s| s.to_string()),
            storage_chunks_json: storage_chunks_json.to_string(),
            uploaded_by: uploaded_by.to_string(),
            version: 1,
            download_count: 0,
            encrypted_metadata: encrypted_metadata.map(|s| s.to_string()),
            encryption_nonce: encryption_nonce.map(|s| s.to_string()),
            created_at: now,
        })
    }

    /// Get files in a DM conversation (optionally within a folder).
    pub fn get_files(
        &self,
        conversation_id: &str,
        folder_id: Option<&str>,
        limit: usize,
        offset: usize,
    ) -> Result<Vec<DmSharedFileRecord>> {
        self.db().get_dm_shared_files(conversation_id, folder_id, limit, offset)
    }

    /// Get a DM file by ID.
    pub fn get_file(&self, id: &str) -> Result<DmSharedFileRecord> {
        self.db().get_dm_shared_file(id)?
            .ok_or(Error::InvalidCommunityOperation("DM file not found".to_string()))
    }

    /// Increment download count for a DM file.
    pub fn record_download(&self, id: &str) -> Result<()> {
        self.db().increment_dm_file_download_count(id)
    }

    /// Delete a DM file.
    pub fn delete_file(&self, id: &str) -> Result<()> {
        self.db().delete_dm_shared_file(id)
    }

    /// Move a DM file to a different folder.
    pub fn move_file(&self, id: &str, target_folder_id: Option<&str>) -> Result<()> {
        self.db().move_dm_shared_file(id, target_folder_id)
    }

    // ── Folders ──────────────────────────────────────────────────────────

    /// Create a folder in a DM conversation.
    pub fn create_folder(
        &self,
        conversation_id: &str,
        parent_folder_id: Option<&str>,
        name: &str,
        created_by: &str,
    ) -> Result<DmSharedFolderRecord> {
        let now = crate::time::now_timestamp();
        let id = generate_id();

        self.db().create_dm_shared_folder(
            &id, conversation_id, parent_folder_id, name, created_by, now,
        )?;

        Ok(DmSharedFolderRecord {
            id,
            conversation_id: conversation_id.to_string(),
            parent_folder_id: parent_folder_id.map(|s| s.to_string()),
            name: name.to_string(),
            created_by: created_by.to_string(),
            created_at: now,
        })
    }

    /// Get folders in a DM conversation (optionally within a parent folder).
    pub fn get_folders(
        &self,
        conversation_id: &str,
        parent_folder_id: Option<&str>,
    ) -> Result<Vec<DmSharedFolderRecord>> {
        self.db().get_dm_shared_folders(conversation_id, parent_folder_id)
    }

    /// Delete a DM folder.
    pub fn delete_folder(&self, id: &str) -> Result<()> {
        self.db().delete_dm_shared_folder(id)
    }

    /// Rename a DM folder.
    pub fn rename_folder(&self, id: &str, name: &str) -> Result<()> {
        self.db().rename_dm_shared_folder(id, name)
    }
}
