//! Community extras dispatch handlers:
//! emoji, stickers, sticker packs, files, folders, seats, audit log,
//! search, warnings, webhooks, channel overrides, boost nodes, timeouts,
//! thread follow, member status, notification settings, mentions, vanity URL.

use super::dispatcher::{
    boost_node_json, community_file_json, community_folder_json, community_msg_json,
    community_service, emit_event, err, json_parse, member_status_json,
    notification_setting_json, ok_json, ok_success, require_str, seat_json, timeout_json,
    warning_json, webhook_json, DResult,
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
    let emoji = svc
        .create_emoji(community_id, name, image_url, animated, uploaded_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "emojiCreated", "emoji_id": emoji.id}),
    );
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
    let arr: Vec<serde_json::Value> = emojis
        .iter()
        .map(|e| {
            serde_json::json!({
                "id": e.id, "community_id": e.community_id,
                "name": e.name, "image_url": e.image_url,
                "animated": e.animated, "uploaded_by": e.uploaded_by,
                "created_at": e.created_at,
            })
        })
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_emoji_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let emoji_id = require_str(&data, "emoji_id")?;
    let actor_did = data["actor_did"].as_str().unwrap_or("");
    let svc = community_service()?;
    svc.delete_emoji(emoji_id, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "emojiDeleted", "emoji_id": emoji_id}),
    );
    ok_success()
}

pub fn community_emoji_rename(args: &str) -> DResult {
    let data = json_parse(args)?;
    let emoji_id = require_str(&data, "emoji_id")?;
    let new_name = require_str(&data, "new_name")?;
    let svc = community_service()?;
    svc.rename_emoji(emoji_id, new_name)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "emojiRenamed", "emoji_id": emoji_id}),
    );
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
    let sticker = svc
        .create_sticker(
            community_id,
            pack_id,
            name,
            image_url,
            animated,
            format,
            uploaded_by,
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "stickerCreated", "sticker_id": sticker.id}),
    );
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
    let stickers = svc
        .get_stickers(community_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = stickers
        .iter()
        .map(|s| {
            serde_json::json!({
                "id": s.id, "community_id": s.community_id,
                "pack_id": s.pack_id, "name": s.name,
                "image_url": s.image_url, "animated": s.animated,
                "format": s.format, "uploaded_by": s.uploaded_by,
                "created_at": s.created_at,
            })
        })
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_sticker_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let sticker_id = require_str(&data, "sticker_id")?;
    let svc = community_service()?;
    svc.delete_sticker(sticker_id)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "stickerDeleted", "sticker_id": sticker_id}),
    );
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
    let pack = svc
        .create_sticker_pack(
            community_id,
            name,
            description,
            cover_sticker_id,
            created_by,
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "stickerPackCreated", "pack_id": pack.id}),
    );
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
    let packs = svc
        .get_sticker_packs(community_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = packs
        .iter()
        .map(|p| {
            serde_json::json!({
                "id": p.id, "community_id": p.community_id,
                "name": p.name, "description": p.description,
                "cover_sticker_id": p.cover_sticker_id,
                "created_by": p.created_by, "created_at": p.created_at,
            })
        })
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_sticker_pack_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let pack_id = require_str(&data, "pack_id")?;
    let svc = community_service()?;
    svc.delete_sticker_pack(pack_id)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "stickerPackDeleted", "pack_id": pack_id}),
    );
    ok_success()
}

pub fn community_sticker_pack_rename(args: &str) -> DResult {
    let data = json_parse(args)?;
    let pack_id = require_str(&data, "pack_id")?;
    let new_name = require_str(&data, "new_name")?;
    let svc = community_service()?;
    svc.rename_sticker_pack(pack_id, new_name)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "stickerPackRenamed", "pack_id": pack_id}),
    );
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
    let f = svc
        .upload_file(
            channel_id,
            folder_id,
            filename,
            description,
            file_size,
            mime_type,
            storage_chunks_json,
            uploaded_by,
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "fileUploaded", "file_id": f.id}),
    );
    ok_json(community_file_json(&f))
}

pub fn community_get_files(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let folder_id = data["folder_id"].as_str();
    let limit = data["limit"].as_u64().unwrap_or(50) as usize;
    let offset = data["offset"].as_u64().unwrap_or(0) as usize;
    let svc = community_service()?;
    let files = svc
        .get_files(channel_id, folder_id, limit, offset)
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
    svc.delete_file(id, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "fileDeleted", "file_id": id}),
    );
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
    let f = svc
        .create_folder(channel_id, parent_folder_id, name, created_by)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "folderCreated", "folder_id": f.id}),
    );
    ok_json(community_folder_json(&f))
}

pub fn community_get_folders(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let parent_folder_id = data["parent_folder_id"].as_str();
    let svc = community_service()?;
    let folders = svc
        .get_folders(channel_id, parent_folder_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = folders.iter().map(community_folder_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_delete_folder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = community_service()?;
    svc.delete_folder(id).map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "folderDeleted", "folder_id": id}),
    );
    ok_success()
}

// ── Seats ───────────────────────────────────────────────────────────────────

pub fn community_seat_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let seats = svc
        .get_community_seats(community_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = seats.iter().map(seat_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_seat_list_unclaimed(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let seats = svc
        .get_unclaimed_seats(community_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = seats.iter().map(seat_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_seat_find_match(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let platform = require_str(&data, "platform")?;
    let platform_user_id = require_str(&data, "platform_user_id")?;
    let svc = community_service()?;
    match svc
        .find_seat_by_platform(community_id, platform, platform_user_id)
        .map_err(|e| err(e.code(), e))?
    {
        Some(seat) => ok_json(seat_json(&seat)),
        None => ok_json(serde_json::json!(null)),
    }
}

pub fn community_seat_claim(args: &str) -> DResult {
    let data = json_parse(args)?;
    let seat_id = require_str(&data, "seat_id")?;
    let claimer_did = require_str(&data, "claimer_did")?;
    let svc = community_service()?;
    let seat = svc
        .claim_seat(seat_id, claimer_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "seatClaimed", "seat_id": seat_id}),
    );
    ok_json(seat_json(&seat))
}

pub fn community_seat_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let seat_id = require_str(&data, "seat_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_seat(seat_id, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "seatDeleted", "seat_id": seat_id}),
    );
    ok_success()
}

pub fn community_seat_create_batch(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let seats_arr = data["seats"]
        .as_array()
        .ok_or_else(|| err(2, "Missing seats array"))?;

    let seats: Vec<crate::community::SeatInput> = seats_arr
        .iter()
        .map(|s| crate::community::SeatInput {
            platform: s["platform"].as_str().unwrap_or("").to_string(),
            platform_user_id: s["platform_user_id"].as_str().unwrap_or("").to_string(),
            platform_username: s["platform_username"].as_str().unwrap_or("").to_string(),
            nickname: s["nickname"].as_str().map(|x| x.to_string()),
            avatar_url: s["avatar_url"].as_str().map(|x| x.to_string()),
            role_ids: s["role_ids"]
                .as_array()
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default(),
        })
        .collect();

    let svc = community_service()?;
    let count = svc
        .create_seats_batch(community_id, seats)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "seatsBatchCreated", "community_id": community_id, "count": count}),
    );
    ok_json(serde_json::json!({ "created": count }))
}

pub fn community_seat_count(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let (total, claimed) = svc
        .count_seats(community_id)
        .map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({ "total": total, "claimed": claimed, "unclaimed": total - claimed }))
}

// ── Audit Log ───────────────────────────────────────────────────────────────

pub fn community_audit_log_create_batch(args: &str) -> DResult {
    let data = json_parse(args)?;
    let entries = data["entries"]
        .as_array()
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
        svc.db()
            .insert_audit_log(
                &id,
                community_id,
                actor_did,
                action,
                target_type,
                target_id,
                metadata,
                now,
            )
            .map_err(|e| err(e.code(), e))?;
    }
    emit_event(
        "community",
        &serde_json::json!({"type": "auditLogBatchCreated"}),
    );
    ok_success()
}

pub fn community_audit_log_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let limit = data["limit"].as_u64().unwrap_or(50) as usize;
    let offset = data["offset"].as_u64().unwrap_or(0) as usize;
    let svc = community_service()?;
    let logs = svc
        .db()
        .get_audit_log(community_id, limit, offset)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = logs.iter().map(|l| serde_json::json!({
        "id": l.id, "community_id": l.community_id, "actor_did": l.actor_did,
        "action_type": l.action_type, "target_type": l.target_type, "target_id": l.target_id,
        "metadata_json": l.metadata_json, "content_detail": l.content_detail, "created_at": l.created_at,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Search ──────────────────────────────────────────────────────────────────

pub fn community_search_channel(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let query = require_str(&data, "query")?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let svc = community_service()?;
    let msgs = svc
        .search_messages(channel_id, query, limit)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = msgs.iter().map(community_msg_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_search(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let query = require_str(&data, "query")?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let svc = community_service()?;
    let msgs = svc
        .search_community_messages(community_id, query, limit)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = msgs.iter().map(community_msg_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_search_advanced(args: &str) -> DResult {
    let v = json_parse(args)?;
    let svc = community_service()?;
    let results = svc
        .search_advanced(
            v["community_id"].as_str().unwrap_or(""),
            v["query"].as_str(),
            v["from_did"].as_str(),
            v["channel_id"].as_str(),
            v["before"].as_i64(),
            v["after"].as_i64(),
            v["has_file"].as_bool(),
            v["has_reaction"].as_bool(),
            v["is_pinned"].as_bool(),
            v["limit"].as_u64().unwrap_or(50) as usize,
        )
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = results.iter().map(community_msg_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Warnings / Moderation ───────────────────────────────────────────────────

pub fn community_warn_member(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let reason = require_str(&data, "reason")?;
    let warned_by = require_str(&data, "warned_by")?;
    let expires_at = data["expires_at"].as_i64();
    let svc = community_service()?;
    let warning = svc
        .warn_member(community_id, member_did, reason, warned_by, expires_at)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({
            "type": "communityMemberWarned",
            "community_id": community_id,
            "member_did": member_did,
            "warning_id": warning.id,
        }),
    );
    ok_json(warning_json(&warning))
}

pub fn community_member_warnings(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let warnings = svc
        .get_member_warnings(community_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = warnings.iter().map(|w| warning_json(w)).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_warnings(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let limit = data["limit"].as_i64().unwrap_or(50) as usize;
    let offset = data["offset"].as_i64().unwrap_or(0) as usize;
    let svc = community_service()?;
    let warnings = svc
        .get_all_warnings(community_id, limit, offset)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = warnings.iter().map(|w| warning_json(w)).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_active_warning_count(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let count = svc
        .get_active_warning_count(community_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({"count": count}))
}

pub fn community_warning_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let warning_id = require_str(&data, "warning_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_warning(warning_id, actor_did)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_check_escalation(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let timeout_threshold = data["timeout_threshold"].as_i64().map(|v| v as i32);
    let ban_threshold = data["ban_threshold"].as_i64().map(|v| v as i32);
    let svc = community_service()?;
    let action = svc
        .check_warning_escalation(community_id, member_did, timeout_threshold, ban_threshold)
        .map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({"action": action}))
}

pub fn community_check_keyword_filter(args: &str) -> DResult {
    let data = json_parse(args)?;
    let content = require_str(&data, "content")?;
    let filters_arr = data["filters"]
        .as_array()
        .ok_or_else(|| err(2, "Missing filters array"))?;
    let filters: Vec<(String, String)> = filters_arr
        .iter()
        .map(|f| {
            let pattern = f["pattern"].as_str().unwrap_or("").to_string();
            let action = f["action"].as_str().unwrap_or("delete").to_string();
            (pattern, action)
        })
        .collect();
    let filter_refs: Vec<(&str, &str)> = filters
        .iter()
        .map(|(p, a)| (p.as_str(), a.as_str()))
        .collect();
    let svc = community_service()?;
    let action = svc.check_keyword_filter(content, &filter_refs);
    ok_json(serde_json::json!({"action": action}))
}

pub fn community_check_ban_evasion(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let device_fingerprint = require_str(&data, "device_fingerprint")?;
    let svc = community_service()?;
    let result = svc
        .check_ban_evasion(community_id, device_fingerprint)
        .map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({"banned_did": result}))
}

// ── Webhooks ────────────────────────────────────────────────────────────────

pub fn community_webhook_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let name = require_str(&data, "name")?;
    let avatar_url = data["avatar_url"].as_str();
    let creator_did = require_str(&data, "creator_did")?;
    let svc = community_service()?;
    let webhook = svc
        .create_webhook(channel_id, name, avatar_url, creator_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({
            "type": "communityWebhookCreated",
            "channel_id": channel_id,
            "webhook_id": webhook.id,
        }),
    );
    ok_json(webhook_json(&webhook))
}

pub fn community_webhook_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let svc = community_service()?;
    let webhooks = svc
        .get_webhooks(channel_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = webhooks.iter().map(|w| webhook_json(w)).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_webhook_get(args: &str) -> DResult {
    let data = json_parse(args)?;
    let webhook_id = require_str(&data, "webhook_id")?;
    let svc = community_service()?;
    let webhook = svc
        .get_webhook(webhook_id)
        .map_err(|e| err(e.code(), e))?;
    ok_json(webhook_json(&webhook))
}

pub fn community_webhook_update(args: &str) -> DResult {
    let data = json_parse(args)?;
    let webhook_id = require_str(&data, "webhook_id")?;
    let name = data["name"].as_str();
    let avatar_url = data["avatar_url"].as_str();
    let svc = community_service()?;
    svc.update_webhook(webhook_id, name, avatar_url)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_webhook_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let webhook_id = require_str(&data, "webhook_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_webhook(webhook_id, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "communityWebhookDeleted", "webhook_id": webhook_id}),
    );
    ok_success()
}

// ── Channel Permission Overrides ────────────────────────────────────────────

pub fn community_channel_override_set(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let target_type = require_str(&data, "target_type")?;
    let target_id = require_str(&data, "target_id")?;
    let allow_bitfield = require_str(&data, "allow_bitfield")?;
    let deny_bitfield = require_str(&data, "deny_bitfield")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.set_channel_override(channel_id, target_type, target_id, allow_bitfield, deny_bitfield, actor_did)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_channel_override_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let svc = community_service()?;
    let overrides = svc
        .get_channel_overrides(channel_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = overrides
        .iter()
        .map(|o| serde_json::json!({
            "id": o.id, "channel_id": o.channel_id,
            "target_type": o.target_type, "target_id": o.target_id,
            "allow_bitfield": o.allow_bitfield, "deny_bitfield": o.deny_bitfield,
        }))
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_channel_override_remove(args: &str) -> DResult {
    let data = json_parse(args)?;
    let override_id = require_str(&data, "override_id")?;
    let svc = community_service()?;
    svc.remove_channel_override(override_id)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

// ── Boost Nodes ─────────────────────────────────────────────────────────────

pub fn community_boost_node_register(args: &str) -> DResult {
    let data = json_parse(args)?;
    let owner_did = require_str(&data, "owner_did")?;
    let node_type = require_str(&data, "node_type")?;
    let node_public_key = require_str(&data, "node_public_key")?;
    let name = require_str(&data, "name")?;
    let max_storage_bytes = data["max_storage_bytes"]
        .as_i64()
        .ok_or_else(|| err(2, "Missing max_storage_bytes"))?;
    let max_bandwidth_mbps = data["max_bandwidth_mbps"]
        .as_i64()
        .ok_or_else(|| err(2, "Missing max_bandwidth_mbps"))? as i32;
    let auto_start = data["auto_start"].as_bool().unwrap_or(true);
    let prioritized_communities = data["prioritized_communities"].as_str();
    let pairing_token = data["pairing_token"].as_str();
    let remote_address = data["remote_address"].as_str();
    let svc = community_service()?;
    let node = svc
        .register_boost_node(
            owner_did, node_type, node_public_key, name,
            max_storage_bytes, max_bandwidth_mbps, auto_start,
            prioritized_communities, pairing_token, remote_address,
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({
            "type": "boostNodeRegistered",
            "node_id": node.id,
            "owner_did": owner_did,
        }),
    );
    ok_json(boost_node_json(&node))
}

pub fn community_boost_node_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let owner_did = require_str(&data, "owner_did")?;
    let svc = community_service()?;
    let nodes = svc
        .get_boost_nodes(owner_did)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = nodes.iter().map(|n| boost_node_json(n)).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_boost_node_get(args: &str) -> DResult {
    let data = json_parse(args)?;
    let node_id = require_str(&data, "node_id")?;
    let svc = community_service()?;
    let node = svc
        .get_boost_node(node_id)
        .map_err(|e| err(e.code(), e))?;
    ok_json(boost_node_json(&node))
}

pub fn community_boost_node_update(args: &str) -> DResult {
    let data = json_parse(args)?;
    let node_id = require_str(&data, "node_id")?;
    let name = data["name"].as_str();
    let enabled = data["enabled"].as_bool();
    let max_storage_bytes = data["max_storage_bytes"].as_i64();
    let max_bandwidth_mbps = data["max_bandwidth_mbps"].as_i64().map(|v| v as i32);
    let auto_start = data["auto_start"].as_bool();
    let prioritized_communities = data["prioritized_communities"].as_str();
    let svc = community_service()?;
    svc.update_boost_node(
        node_id, name, enabled, max_storage_bytes,
        max_bandwidth_mbps, auto_start, prioritized_communities,
    )
    .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "boostNodeUpdated", "node_id": node_id}),
    );
    ok_success()
}

pub fn community_boost_node_heartbeat(args: &str) -> DResult {
    let data = json_parse(args)?;
    let node_id = require_str(&data, "node_id")?;
    let svc = community_service()?;
    svc.update_boost_node_heartbeat(node_id)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_boost_node_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let node_id = require_str(&data, "node_id")?;
    let svc = community_service()?;
    svc.delete_boost_node(node_id)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "boostNodeDeleted", "node_id": node_id}),
    );
    ok_success()
}

// ── Timeouts ────────────────────────────────────────────────────────────────

pub fn community_timeout_member(args: &str) -> DResult {
    let v = json_parse(args)?;
    let svc = community_service()?;
    let record = svc
        .timeout_member(
            v["community_id"].as_str().unwrap_or(""),
            v["member_did"].as_str().unwrap_or(""),
            v["reason"].as_str(),
            v["timeout_type"].as_str().unwrap_or("mute"),
            v["duration_seconds"].as_i64().unwrap_or(3600),
            v["issued_by"].as_str().unwrap_or(""),
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({
            "type": "memberTimedOut",
            "community_id": record.community_id,
            "member_did": record.member_did,
            "timeout_type": record.timeout_type,
            "expires_at": record.expires_at,
        }),
    );
    ok_json(timeout_json(&record))
}

pub fn community_remove_timeout(args: &str) -> DResult {
    let data = json_parse(args)?;
    let timeout_id = require_str(&data, "timeout_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.remove_timeout(timeout_id, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "timeoutRemoved", "timeout_id": timeout_id}),
    );
    ok_success()
}

pub fn community_get_active_timeouts(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let timeouts = svc
        .get_active_timeouts(community_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = timeouts.iter().map(|t| timeout_json(t)).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_get_timeouts(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let timeouts = svc
        .get_community_timeouts(community_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = timeouts.iter().map(|t| timeout_json(t)).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_is_member_muted(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let muted = svc
        .is_member_muted(community_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({"muted": muted}))
}

// ── Thread Follow ───────────────────────────────────────────────────────────

pub fn community_follow_thread(args: &str) -> DResult {
    let data = json_parse(args)?;
    let thread_id = require_str(&data, "thread_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    svc.follow_thread(thread_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "threadFollowed", "thread_id": thread_id, "member_did": member_did}),
    );
    ok_success()
}

pub fn community_unfollow_thread(args: &str) -> DResult {
    let data = json_parse(args)?;
    let thread_id = require_str(&data, "thread_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    svc.unfollow_thread(thread_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({"type": "threadUnfollowed", "thread_id": thread_id, "member_did": member_did}),
    );
    ok_success()
}

pub fn community_get_thread_followers(args: &str) -> DResult {
    let data = json_parse(args)?;
    let thread_id = require_str(&data, "thread_id")?;
    let svc = community_service()?;
    let followers = svc
        .get_thread_followers(thread_id)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = followers
        .iter()
        .map(|f| serde_json::json!({
            "thread_id": f.thread_id,
            "member_did": f.member_did,
            "followed_at": f.followed_at,
        }))
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_is_following_thread(args: &str) -> DResult {
    let data = json_parse(args)?;
    let thread_id = require_str(&data, "thread_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let following = svc
        .is_following_thread(thread_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    ok_json(serde_json::json!({"following": following}))
}

// ── Member Status ───────────────────────────────────────────────────────────

pub fn community_set_member_status(args: &str) -> DResult {
    let v = json_parse(args)?;
    let svc = community_service()?;
    let record = svc
        .set_member_status(
            v["community_id"].as_str().unwrap_or(""),
            v["member_did"].as_str().unwrap_or(""),
            v["status_text"].as_str(),
            v["status_emoji"].as_str(),
            v["expires_at"].as_i64(),
        )
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({
            "type": "memberStatusChanged",
            "community_id": record.community_id,
            "member_did": record.member_did,
        }),
    );
    ok_json(member_status_json(&record))
}

pub fn community_get_member_status(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let status = svc
        .get_member_status(community_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    match status {
        Some(s) => ok_json(member_status_json(&s)),
        None => ok_json(serde_json::json!(null)),
    }
}

pub fn community_clear_member_status(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    svc.clear_member_status(community_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event(
        "community",
        &serde_json::json!({
            "type": "memberStatusCleared",
            "community_id": community_id,
            "member_did": member_did,
        }),
    );
    ok_success()
}

// ── Notification Settings ───────────────────────────────────────────────────

pub fn community_set_notification_settings(args: &str) -> DResult {
    let v = json_parse(args)?;
    let svc = community_service()?;
    let record = svc
        .set_notification_settings(
            v["community_id"].as_str().unwrap_or(""),
            v["member_did"].as_str().unwrap_or(""),
            v["target_type"].as_str().unwrap_or("community"),
            v["target_id"].as_str().unwrap_or(""),
            v["mute_until"].as_i64(),
            v["suppress_everyone"].as_bool().unwrap_or(false),
            v["suppress_roles"].as_bool().unwrap_or(false),
            v["level"].as_str().unwrap_or("all"),
        )
        .map_err(|e| err(e.code(), e))?;
    ok_json(notification_setting_json(&record))
}

pub fn community_get_notification_settings(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let settings = svc
        .get_notification_settings(community_id, member_did)
        .map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = settings.iter().map(|s| notification_setting_json(s)).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_delete_notification_setting(args: &str) -> DResult {
    let data = json_parse(args)?;
    let setting_id = require_str(&data, "setting_id")?;
    let svc = community_service()?;
    svc.delete_notification_setting(setting_id)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

// ── Mentions ────────────────────────────────────────────────────────────────

pub fn community_parse_mentions(args: &str) -> DResult {
    let data = json_parse(args)?;
    let content = require_str(&data, "content")?;
    let mentions = crate::community::parse_mentions(content);
    let arr: Vec<serde_json::Value> = mentions
        .iter()
        .map(|m| match m {
            crate::community::MentionType::Everyone => serde_json::json!({"type": "everyone"}),
            crate::community::MentionType::Here => serde_json::json!({"type": "here"}),
            crate::community::MentionType::Role(id) => serde_json::json!({"type": "role", "id": id}),
            crate::community::MentionType::User(did) => serde_json::json!({"type": "user", "did": did}),
        })
        .collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Vanity URL ──────────────────────────────────────────────────────────────

pub fn community_set_vanity_url(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let vanity_url = require_str(&data, "vanity_url")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.set_vanity_url(community_id, vanity_url, actor_did)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

// ── Find by Origin ──────────────────────────────────────────────────────────

pub fn community_find_by_origin(args: &str) -> DResult {
    let data = json_parse(args)?;
    let origin_id = require_str(&data, "origin_id")?;
    use super::state::get_state;
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let db = state
        .database
        .as_ref()
        .ok_or_else(|| err(400, "Database not initialized"))?;
    let result = db
        .find_community_by_origin(origin_id)
        .map_err(|e| err(e.code(), e))?;
    match result {
        Some(id) => ok_json(serde_json::json!(id)),
        None => ok_json(serde_json::json!(null)),
    }
}
