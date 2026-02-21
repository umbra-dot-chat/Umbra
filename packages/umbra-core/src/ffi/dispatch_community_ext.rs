//! Community extras dispatch handlers:
//! emoji, stickers, sticker packs, files, folders, seats, audit log.

use super::dispatcher::{
    DResult, err, json_parse, require_str, ok_json, ok_success, community_service,
    community_file_json, community_folder_json, seat_json, emit_event,
};

// ── Emoji ───────────────────────────────────────────────────────────────────

pub fn community_emoji_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let name = require_str(&data, "name")?;
    let image_url = require_str(&data, "image_url")?;
    let animated = data["animated"].as_bool().unwrap_or(false);
    let uploaded_by = require_str(&data, "uploaded_by")?;
    let svc = community_service()?;
    let emoji = svc.create_emoji(community_id, name, image_url, animated, uploaded_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "emojiCreated", "emoji_id": emoji.id}));
    ok_json(serde_json::json!({
        "id": emoji.id, "community_id": emoji.community_id,
        "name": emoji.name, "image_url": emoji.image_url,
        "animated": emoji.animated, "uploaded_by": emoji.uploaded_by,
        "created_at": emoji.created_at,
    }))
}

pub fn community_emoji_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let emojis = svc.get_emoji(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = emojis.iter().map(|e| serde_json::json!({
        "id": e.id, "community_id": e.community_id,
        "name": e.name, "image_url": e.image_url,
        "animated": e.animated, "uploaded_by": e.uploaded_by,
        "created_at": e.created_at,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_emoji_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let emoji_id = require_str(&data, "emoji_id")?;
    let actor_did = data["actor_did"].as_str().unwrap_or("");
    let svc = community_service()?;
    svc.delete_emoji(emoji_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "emojiDeleted", "emoji_id": emoji_id}));
    ok_success()
}

pub fn community_emoji_rename(args: &str) -> DResult {
    let data = json_parse(args)?;
    let emoji_id = require_str(&data, "emoji_id")?;
    let new_name = require_str(&data, "new_name")?;
    let svc = community_service()?;
    svc.rename_emoji(emoji_id, new_name).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "emojiRenamed", "emoji_id": emoji_id}));
    ok_success()
}

// ── Stickers ────────────────────────────────────────────────────────────────

pub fn community_sticker_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let pack_id = data["pack_id"].as_str();
    let name = require_str(&data, "name")?;
    let image_url = require_str(&data, "image_url")?;
    let animated = data["animated"].as_bool().unwrap_or(false);
    let format = data["format"].as_str().unwrap_or("png");
    let uploaded_by = require_str(&data, "uploaded_by")?;
    let svc = community_service()?;
    let sticker = svc.create_sticker(community_id, pack_id, name, image_url, animated, format, uploaded_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "stickerCreated", "sticker_id": sticker.id}));
    ok_json(serde_json::json!({
        "id": sticker.id, "community_id": sticker.community_id,
        "pack_id": sticker.pack_id, "name": sticker.name,
        "image_url": sticker.image_url, "animated": sticker.animated,
        "format": sticker.format, "uploaded_by": sticker.uploaded_by,
        "created_at": sticker.created_at,
    }))
}

pub fn community_sticker_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let stickers = svc.get_stickers(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = stickers.iter().map(|s| serde_json::json!({
        "id": s.id, "community_id": s.community_id,
        "pack_id": s.pack_id, "name": s.name,
        "image_url": s.image_url, "animated": s.animated,
        "format": s.format, "uploaded_by": s.uploaded_by,
        "created_at": s.created_at,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_sticker_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let sticker_id = require_str(&data, "sticker_id")?;
    let svc = community_service()?;
    svc.delete_sticker(sticker_id).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "stickerDeleted", "sticker_id": sticker_id}));
    ok_success()
}

// ── Sticker Packs ───────────────────────────────────────────────────────────

pub fn community_sticker_pack_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let name = require_str(&data, "name")?;
    let description = data["description"].as_str();
    let cover_sticker_id = data["cover_sticker_id"].as_str();
    let created_by = require_str(&data, "created_by")?;
    let svc = community_service()?;
    let pack = svc.create_sticker_pack(community_id, name, description, cover_sticker_id, created_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "stickerPackCreated", "pack_id": pack.id}));
    ok_json(serde_json::json!({
        "id": pack.id, "community_id": pack.community_id,
        "name": pack.name, "description": pack.description,
        "cover_sticker_id": pack.cover_sticker_id,
        "created_by": pack.created_by, "created_at": pack.created_at,
    }))
}

pub fn community_sticker_pack_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let packs = svc.get_sticker_packs(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = packs.iter().map(|p| serde_json::json!({
        "id": p.id, "community_id": p.community_id,
        "name": p.name, "description": p.description,
        "cover_sticker_id": p.cover_sticker_id,
        "created_by": p.created_by, "created_at": p.created_at,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_sticker_pack_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let pack_id = require_str(&data, "pack_id")?;
    let svc = community_service()?;
    svc.delete_sticker_pack(pack_id).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "stickerPackDeleted", "pack_id": pack_id}));
    ok_success()
}

pub fn community_sticker_pack_rename(args: &str) -> DResult {
    let data = json_parse(args)?;
    let pack_id = require_str(&data, "pack_id")?;
    let new_name = require_str(&data, "new_name")?;
    let svc = community_service()?;
    svc.rename_sticker_pack(pack_id, new_name).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "stickerPackRenamed", "pack_id": pack_id}));
    ok_success()
}

// ── Community Files ─────────────────────────────────────────────────────────

pub fn community_upload_file(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let folder_id = data["folder_id"].as_str();
    let filename = require_str(&data, "filename")?;
    let description = data["description"].as_str();
    let file_size = data["file_size"].as_i64().unwrap_or(0);
    let mime_type = data["mime_type"].as_str();
    let storage_chunks_json = data["storage_chunks_json"].as_str().unwrap_or("[]");
    let uploaded_by = require_str(&data, "uploaded_by")?;
    let svc = community_service()?;
    let f = svc.upload_file(channel_id, folder_id, filename, description, file_size, mime_type, storage_chunks_json, uploaded_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "fileUploaded", "file_id": f.id}));
    ok_json(community_file_json(&f))
}

pub fn community_get_files(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let folder_id = data["folder_id"].as_str();
    let limit = data["limit"].as_u64().unwrap_or(50) as usize;
    let offset = data["offset"].as_u64().unwrap_or(0) as usize;
    let svc = community_service()?;
    let files = svc.get_files(channel_id, folder_id, limit, offset)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = files.iter().map(community_file_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_get_file(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = community_service()?;
    let f = svc.get_file(id).map_err(|e| err(e.code(), e))?;
    ok_json(community_file_json(&f))
}

pub fn community_delete_file(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_file(id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "fileDeleted", "file_id": id}));
    ok_success()
}

pub fn community_record_file_download(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = community_service()?;
    svc.record_file_download(id).map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_create_folder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let parent_folder_id = data["parent_folder_id"].as_str();
    let name = require_str(&data, "name")?;
    let created_by = require_str(&data, "created_by")?;
    let svc = community_service()?;
    let f = svc.create_folder(channel_id, parent_folder_id, name, created_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "folderCreated", "folder_id": f.id}));
    ok_json(community_folder_json(&f))
}

pub fn community_get_folders(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let parent_folder_id = data["parent_folder_id"].as_str();
    let svc = community_service()?;
    let folders = svc.get_folders(channel_id, parent_folder_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = folders.iter().map(community_folder_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_delete_folder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = community_service()?;
    svc.delete_folder(id).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "folderDeleted", "folder_id": id}));
    ok_success()
}

// ── Seats ───────────────────────────────────────────────────────────────────

pub fn community_seat_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let seats = svc.get_community_seats(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = seats.iter().map(seat_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_seat_list_unclaimed(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let seats = svc.get_unclaimed_seats(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = seats.iter().map(seat_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_seat_find_match(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let platform = require_str(&data, "platform")?;
    let platform_user_id = require_str(&data, "platform_user_id")?;
    let svc = community_service()?;
    match svc.find_seat_by_platform(community_id, platform, platform_user_id)
        .map_err(|e| err(e.code(), e))? {
        Some(seat) => ok_json(seat_json(&seat)),
        None => ok_json(serde_json::json!(null)),
    }
}

pub fn community_seat_claim(args: &str) -> DResult {
    let data = json_parse(args)?;
    let seat_id = require_str(&data, "seat_id")?;
    let claimer_did = require_str(&data, "claimer_did")?;
    let svc = community_service()?;
    let seat = svc.claim_seat(seat_id, claimer_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "seatClaimed", "seat_id": seat_id}));
    ok_json(seat_json(&seat))
}

pub fn community_seat_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let seat_id = require_str(&data, "seat_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_seat(seat_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "seatDeleted", "seat_id": seat_id}));
    ok_success()
}

pub fn community_seat_create_batch(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let seats_arr = data["seats"].as_array()
        .ok_or_else(|| err(2, "Missing seats array"))?;

    let seats: Vec<crate::community::SeatInput> = seats_arr.iter().map(|s| {
        crate::community::SeatInput {
            platform: s["platform"].as_str().unwrap_or("").to_string(),
            platform_user_id: s["platform_user_id"].as_str().unwrap_or("").to_string(),
            platform_username: s["platform_username"].as_str().unwrap_or("").to_string(),
            nickname: s["nickname"].as_str().map(|x| x.to_string()),
            avatar_url: s["avatar_url"].as_str().map(|x| x.to_string()),
            role_ids: s["role_ids"].as_array()
                .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
                .unwrap_or_default(),
        }
    }).collect();

    let svc = community_service()?;
    let count = svc.create_seats_batch(community_id, seats).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "seatsBatchCreated", "community_id": community_id, "count": count}));
    ok_json(serde_json::json!({ "created": count }))
}

pub fn community_seat_count(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let (total, claimed) = svc.count_seats(community_id).map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "total": total, "claimed": claimed, "unclaimed": total - claimed }))
}

// ── Audit Log ───────────────────────────────────────────────────────────────

pub fn community_audit_log_create_batch(args: &str) -> DResult {
    let data = json_parse(args)?;
    let entries = data["entries"].as_array()
        .ok_or_else(|| err(2, "Missing entries array"))?;

    let svc = community_service()?;
    let now = crate::time::now_timestamp();
    for entry in entries {
        let community_id = entry["community_id"].as_str().unwrap_or("");
        let actor_did = entry["actor_did"].as_str().unwrap_or("");
        let action = entry["action"].as_str().unwrap_or("");
        let target_type = entry["target_type"].as_str();
        let target_id = entry["target_id"].as_str();
        let metadata = entry["metadata"].as_str();
        let id = crate::community::generate_id();
        svc.db().insert_audit_log(&id, community_id, actor_did, action, target_type, target_id, metadata, now)
            .map_err(|e| err(e.code(), e))?;
    }
    emit_event("community", &serde_json::json!({"type": "auditLogBatchCreated"}));
    ok_success()
}

pub fn community_audit_log_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let limit = data["limit"].as_u64().unwrap_or(50) as usize;
    let offset = data["offset"].as_u64().unwrap_or(0) as usize;
    let svc = community_service()?;
    let logs = svc.db().get_audit_log(community_id, limit, offset)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = logs.iter().map(|l| serde_json::json!({
        "id": l.id, "community_id": l.community_id, "actor_did": l.actor_did,
        "action_type": l.action_type, "target_type": l.target_type, "target_id": l.target_id,
        "metadata_json": l.metadata_json, "content_detail": l.content_detail, "created_at": l.created_at,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}
