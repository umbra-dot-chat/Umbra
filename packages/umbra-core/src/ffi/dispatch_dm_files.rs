//! DM file sharing dispatch handlers.

use super::dispatcher::{
    dm_file_json, dm_file_service, dm_folder_json, emit_event, err, json_parse, ok_json,
    ok_success, require_str, DResult,
};

pub fn dm_upload_file(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conversation_id = require_str(&data, "conversation_id")?;
    let folder_id = data["folder_id"].as_str();
    let filename = require_str(&data, "filename")?;
    let description = data["description"].as_str();
    let file_size = data["file_size"].as_i64().unwrap_or(0);
    let mime_type = data["mime_type"].as_str();
    let storage_chunks_json = data["storage_chunks_json"].as_str().unwrap_or("[]");
    let uploaded_by = require_str(&data, "uploaded_by")?;
    let encrypted_metadata = data["encrypted_metadata"].as_str();
    let encryption_nonce = data["encryption_nonce"].as_str();

    let svc = dm_file_service()?;
    let f = svc
        .upload_file(
            conversation_id,
            folder_id,
            filename,
            description,
            file_size,
            mime_type,
            storage_chunks_json,
            uploaded_by,
            encrypted_metadata,
            encryption_nonce,
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "fileUploaded", "file_id": f.id}),
    );
    ok_json(dm_file_json(&f))
}

pub fn dm_get_files(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conversation_id = require_str(&data, "conversation_id")?;
    let folder_id = data["folder_id"].as_str();
    let limit = data["limit"].as_u64().unwrap_or(50) as usize;
    let offset = data["offset"].as_u64().unwrap_or(0) as usize;
    let svc = dm_file_service()?;
    let files = svc
        .get_files(conversation_id, folder_id, limit, offset)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = files.iter().map(dm_file_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn dm_get_file(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = dm_file_service()?;
    let f = svc.get_file(id).map_err(|e| err(e.code(), e))?;
    ok_json(dm_file_json(&f))
}

pub fn dm_delete_file(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = dm_file_service()?;
    svc.delete_file(id).map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "fileDeleted", "file_id": id}),
    );
    ok_success()
}

pub fn dm_record_file_download(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = dm_file_service()?;
    svc.record_download(id).map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn dm_move_file(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let target_folder_id = data["target_folder_id"].as_str();
    let svc = dm_file_service()?;
    svc.move_file(id, target_folder_id)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn dm_create_folder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conversation_id = require_str(&data, "conversation_id")?;
    let parent_folder_id = data["parent_folder_id"].as_str();
    let name = require_str(&data, "name")?;
    let created_by = require_str(&data, "created_by")?;
    let svc = dm_file_service()?;
    let f = svc
        .create_folder(conversation_id, parent_folder_id, name, created_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "folderCreated", "folder_id": f.id}),
    );
    ok_json(dm_folder_json(&f))
}

pub fn dm_get_folders(args: &str) -> DResult {
    let data = json_parse(args)?;
    let conversation_id = require_str(&data, "conversation_id")?;
    let parent_folder_id = data["parent_folder_id"].as_str();
    let svc = dm_file_service()?;
    let folders = svc
        .get_folders(conversation_id, parent_folder_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = folders.iter().map(dm_folder_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn dm_delete_folder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = dm_file_service()?;
    svc.delete_folder(id).map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "folderDeleted", "folder_id": id}),
    );
    ok_success()
}

pub fn dm_rename_folder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let name = require_str(&data, "name")?;
    let svc = dm_file_service()?;
    svc.rename_folder(id, name).map_err(|e| err(e.code(), e))?;
    ok_success()
}
