//! Community core + spaces + categories + channels + members + roles + invites dispatch handlers.

use super::dispatcher::{DResult, err, json_parse, require_str, ok_json, ok_success, community_service, emit_event};

// ── Community — Core ────────────────────────────────────────────────────────

pub fn community_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let name = require_str(&data, "name")?;
    let description = data["description"].as_str();
    let owner_did = require_str(&data, "owner_did")?;
    let owner_nickname = data["owner_nickname"].as_str();

    let svc = community_service()?;
    let result = svc.create_community(name, description, owner_did, owner_nickname)
        .map_err(|e| err(e.code(), e))?;

    emit_event("community", &serde_json::json!({"type": "communityCreated", "community_id": result.community_id}));

    ok_json(serde_json::json!({
        "community_id": result.community_id,
        "space_id": result.space_id,
        "welcome_channel_id": result.welcome_channel_id,
        "general_channel_id": result.general_channel_id,
        "role_ids": {
            "owner": result.role_ids.owner,
            "admin": result.role_ids.admin,
            "moderator": result.role_ids.moderator,
            "member": result.role_ids.member,
        }
    }))
}

pub fn community_get(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let svc = community_service()?;
    let c = svc.get_community(id).map_err(|e| err(e.code(), e))?;
    ok_json(community_record_json(&c))
}

pub fn community_get_mine(args: &str) -> DResult {
    let data = json_parse(args)?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let communities = svc.get_my_communities(member_did).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = communities.iter().map(community_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_update(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let name = data["name"].as_str();
    let description = data["description"].as_str();
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.update_community(id, name, description, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "communityUpdated", "id": id}));
    ok_success()
}

pub fn community_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let id = require_str(&data, "id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_community(id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "communityDeleted", "id": id}));
    ok_success()
}

pub fn community_transfer_ownership(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let current_owner_did = require_str(&data, "current_owner_did")?;
    let new_owner_did = require_str(&data, "new_owner_did")?;
    let svc = community_service()?;
    svc.transfer_ownership(community_id, current_owner_did, new_owner_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "ownershipTransferred", "community_id": community_id, "new_owner_did": new_owner_did}));
    ok_success()
}

pub fn community_update_branding(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let icon_url = data["icon_url"].as_str();
    let banner_url = data["banner_url"].as_str();
    let splash_url = data["splash_url"].as_str();
    let accent_color = data["accent_color"].as_str();
    let custom_css = data["custom_css"].as_str();
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.update_branding(community_id, icon_url, banner_url, splash_url, accent_color, custom_css, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "brandingUpdated", "community_id": community_id}));
    ok_success()
}

// ── Community — Spaces ──────────────────────────────────────────────────────

pub fn community_space_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let name = require_str(&data, "name")?;
    let position = data["position"].as_i64().unwrap_or(0) as i32;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    let space = svc.create_space(community_id, name, position, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "spaceCreated", "space_id": space.id}));
    ok_json(space_record_json(&space))
}

pub fn community_space_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let spaces = svc.get_spaces(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = spaces.iter().map(space_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_space_update(args: &str) -> DResult {
    let data = json_parse(args)?;
    let space_id = require_str(&data, "space_id")?;
    let name = require_str(&data, "name")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.update_space(space_id, name, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "spaceUpdated", "space_id": space_id}));
    ok_success()
}

pub fn community_space_reorder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let space_ids: Vec<String> = data["space_ids"].as_array()
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();
    let svc = community_service()?;
    svc.reorder_spaces(community_id, &space_ids, actor_did).map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_space_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let space_id = require_str(&data, "space_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_space(space_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "spaceDeleted", "space_id": space_id}));
    ok_success()
}

// ── Community — Categories ──────────────────────────────────────────────────

pub fn community_category_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let space_id = require_str(&data, "space_id")?;
    let name = require_str(&data, "name")?;
    let position = data["position"].as_i64().unwrap_or(0) as i32;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    let cat = svc.create_category(community_id, space_id, name, position, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "categoryCreated", "category_id": cat.id}));
    ok_json(category_record_json(&cat))
}

pub fn community_category_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let space_id = require_str(&data, "space_id")?;
    let svc = community_service()?;
    let cats = svc.get_categories(space_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = cats.iter().map(category_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_category_list_all(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let cats = svc.get_all_categories(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = cats.iter().map(category_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_category_update(args: &str) -> DResult {
    let data = json_parse(args)?;
    let category_id = require_str(&data, "category_id")?;
    let name = require_str(&data, "name")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.update_category(category_id, name, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "categoryUpdated", "category_id": category_id}));
    ok_success()
}

pub fn community_category_reorder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let space_id = require_str(&data, "space_id")?;
    let category_ids: Vec<String> = data["category_ids"].as_array()
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();
    let svc = community_service()?;
    svc.reorder_categories(space_id, &category_ids).map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_category_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let category_id = require_str(&data, "category_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_category(category_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "categoryDeleted", "category_id": category_id}));
    ok_success()
}

pub fn community_channel_move_category(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let category_id = data["category_id"].as_str();
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.move_channel_to_category(channel_id, category_id, actor_did)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

// ── Community — Channels ────────────────────────────────────────────────────

pub fn community_channel_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let space_id = require_str(&data, "space_id")?;
    let name = require_str(&data, "name")?;
    let channel_type = data["channel_type"].as_str().unwrap_or("text");
    let topic = data["topic"].as_str();
    let position = data["position"].as_i64().unwrap_or(0) as i32;
    let actor_did = require_str(&data, "actor_did")?;
    let category_id = data["category_id"].as_str();
    let svc = community_service()?;
    let ch = svc.create_channel(community_id, space_id, name, channel_type, topic, position, actor_did, category_id)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "channelCreated", "channel_id": ch.id}));
    ok_json(channel_record_json(&ch))
}

pub fn community_channel_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let space_id = require_str(&data, "space_id")?;
    let svc = community_service()?;
    let chs = svc.get_channels(space_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = chs.iter().map(channel_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_channel_list_all(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let chs = svc.get_all_channels(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = chs.iter().map(channel_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_channel_get(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let svc = community_service()?;
    let ch = svc.get_channel(channel_id).map_err(|e| err(e.code(), e))?;
    ok_json(channel_record_json(&ch))
}

pub fn community_channel_update(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let name = data["name"].as_str();
    let topic = data["topic"].as_str();
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.update_channel(channel_id, name, topic, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "channelUpdated", "channel_id": channel_id}));
    ok_success()
}

pub fn community_channel_set_slow_mode(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let seconds = data["seconds"].as_i64().unwrap_or(0) as i32;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.set_slow_mode(channel_id, seconds, actor_did).map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_channel_set_e2ee(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let enabled = data["enabled"].as_bool().unwrap_or(false);
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.set_channel_e2ee(channel_id, enabled, actor_did).map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_channel_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let channel_id = require_str(&data, "channel_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_channel(channel_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "channelDeleted", "channel_id": channel_id}));
    ok_success()
}

pub fn community_channel_reorder(args: &str) -> DResult {
    let data = json_parse(args)?;
    let space_id = require_str(&data, "space_id")?;
    let channel_ids: Vec<String> = data["channel_ids"].as_array()
        .map(|arr| arr.iter().filter_map(|v| v.as_str().map(String::from)).collect())
        .unwrap_or_default();
    let svc = community_service()?;
    svc.reorder_channels(space_id, &channel_ids).map_err(|e| err(e.code(), e))?;
    ok_success()
}

// ── Community — Members ─────────────────────────────────────────────────────

pub fn community_join(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let nickname = data["nickname"].as_str();
    let svc = community_service()?;
    svc.join_community(community_id, member_did, nickname).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "memberJoined", "community_id": community_id, "member_did": member_did}));
    ok_success()
}

pub fn community_leave(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    svc.leave_community(community_id, member_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "memberLeft", "community_id": community_id, "member_did": member_did}));
    ok_success()
}

pub fn community_kick(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let target_did = require_str(&data, "target_did")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.kick_member(community_id, target_did, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "memberKicked", "community_id": community_id, "target_did": target_did}));
    ok_success()
}

pub fn community_ban(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let target_did = require_str(&data, "target_did")?;
    let reason = data["reason"].as_str();
    let expires_at = data["expires_at"].as_i64();
    let device_fingerprint = data["device_fingerprint"].as_str();
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.ban_member(community_id, target_did, reason, expires_at, device_fingerprint, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "memberBanned", "community_id": community_id, "target_did": target_did}));
    ok_success()
}

pub fn community_unban(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let target_did = require_str(&data, "target_did")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.unban_member(community_id, target_did, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "memberUnbanned", "community_id": community_id, "target_did": target_did}));
    ok_success()
}

pub fn community_member_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let members = svc.get_members(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = members.iter().map(member_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_member_get(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let m = svc.get_member(community_id, member_did).map_err(|e| err(e.code(), e))?;
    ok_json(member_record_json(&m))
}

pub fn community_member_update_profile(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let nickname = data["nickname"].as_str();
    let avatar_url = data["avatar_url"].as_str();
    let bio = data["bio"].as_str();
    let svc = community_service()?;
    svc.update_member_profile(community_id, member_did, nickname, avatar_url, bio)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_ban_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let bans = svc.get_bans(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = bans.iter().map(|b| serde_json::json!({
        "community_id": b.community_id, "banned_did": b.banned_did,
        "reason": b.reason, "banned_by": b.banned_by,
        "expires_at": b.expires_at, "device_fingerprint": b.device_fingerprint,
        "created_at": b.created_at,
    })).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

// ── Community — Roles ───────────────────────────────────────────────────────

pub fn community_role_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let roles = svc.get_roles(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = roles.iter().map(role_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_member_roles(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let svc = community_service()?;
    let roles = svc.get_member_roles(community_id, member_did).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = roles.iter().map(role_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_role_assign(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let role_id = require_str(&data, "role_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.assign_role(community_id, member_did, role_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "roleAssigned", "community_id": community_id, "member_did": member_did, "role_id": role_id}));
    ok_success()
}

pub fn community_role_unassign(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let member_did = require_str(&data, "member_did")?;
    let role_id = require_str(&data, "role_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.unassign_role(community_id, member_did, role_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "roleUnassigned", "community_id": community_id, "member_did": member_did, "role_id": role_id}));
    ok_success()
}

pub fn community_custom_role_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let name = require_str(&data, "name")?;
    let color = data["color"].as_str();
    let position = data["position"].as_i64().unwrap_or(0) as i32;
    let hoisted = data["hoisted"].as_bool().unwrap_or(false);
    let mentionable = data["mentionable"].as_bool().unwrap_or(true);
    let permissions_bitfield = data["permissions_bitfield"].as_str().unwrap_or("0");
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    let role = svc.create_custom_role(community_id, name, color, position, hoisted, mentionable, permissions_bitfield, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "roleCreated", "role_id": role.id}));
    ok_json(role_record_json(&role))
}

pub fn community_role_update(args: &str) -> DResult {
    let data = json_parse(args)?;
    let role_id = require_str(&data, "role_id")?;
    let name = data["name"].as_str();
    let color = data["color"].as_str();
    let hoisted = data["hoisted"].as_bool();
    let mentionable = data["mentionable"].as_bool();
    let position = data["position"].as_i64().map(|v| v as i32);
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.update_role(role_id, name, color, hoisted, mentionable, position, actor_did)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "roleUpdated", "role_id": role_id}));
    ok_success()
}

pub fn community_role_update_permissions(args: &str) -> DResult {
    let data = json_parse(args)?;
    let role_id = require_str(&data, "role_id")?;
    let permissions_bitfield = require_str(&data, "permissions_bitfield")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.update_role_permissions(role_id, permissions_bitfield, actor_did)
        .map_err(|e| err(e.code(), e))?;
    ok_success()
}

pub fn community_role_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let role_id = require_str(&data, "role_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_role(role_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "roleDeleted", "role_id": role_id}));
    ok_success()
}

// ── Community — Invites ─────────────────────────────────────────────────────

pub fn community_invite_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let creator_did = require_str(&data, "creator_did")?;
    let max_uses = data["max_uses"].as_i64().map(|v| v as i32);
    let expires_at = data["expires_at"].as_i64();
    let svc = community_service()?;
    let invite = svc.create_invite(community_id, creator_did, max_uses, expires_at)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "inviteCreated", "invite_id": invite.id}));
    ok_json(invite_record_json(&invite))
}

pub fn community_invite_use(args: &str) -> DResult {
    let data = json_parse(args)?;
    let code = require_str(&data, "code")?;
    let member_did = require_str(&data, "member_did")?;
    let nickname = data["nickname"].as_str();
    let svc = community_service()?;
    let community_id = svc.use_invite(code, member_did, nickname)
        .map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "inviteUsed", "community_id": community_id, "member_did": member_did}));
    ok_json(serde_json::json!({ "community_id": community_id }))
}

pub fn community_invite_list(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let svc = community_service()?;
    let invites = svc.get_invites(community_id).map_err(|e| err(e.code(), e))?;
    let arr: Vec<serde_json::Value> = invites.iter().map(invite_record_json).collect();
    Ok(serde_json::to_string(&arr).unwrap_or_default())
}

pub fn community_invite_delete(args: &str) -> DResult {
    let data = json_parse(args)?;
    let invite_id = require_str(&data, "invite_id")?;
    let actor_did = require_str(&data, "actor_did")?;
    let svc = community_service()?;
    svc.delete_invite(invite_id, actor_did).map_err(|e| err(e.code(), e))?;
    emit_event("community", &serde_json::json!({"type": "inviteDeleted", "invite_id": invite_id}));
    ok_success()
}

pub fn community_invite_set_vanity(args: &str) -> DResult {
    let data = json_parse(args)?;
    let community_id = require_str(&data, "community_id")?;
    let vanity_code = require_str(&data, "vanity_code")?;
    let creator_did = require_str(&data, "creator_did")?;
    let svc = community_service()?;
    let invite = svc.set_vanity_invite(community_id, vanity_code, creator_did)
        .map_err(|e| err(e.code(), e))?;
    ok_json(invite_record_json(&invite))
}

// ── JSON helpers ────────────────────────────────────────────────────────────

fn community_record_json(c: &crate::storage::CommunityRecord) -> serde_json::Value {
    serde_json::json!({
        "id": c.id, "name": c.name, "description": c.description,
        "owner_did": c.owner_did, "icon_url": c.icon_url,
        "banner_url": c.banner_url, "splash_url": c.splash_url,
        "accent_color": c.accent_color, "vanity_url": c.vanity_url,
        "created_at": c.created_at, "updated_at": c.updated_at,
    })
}

fn space_record_json(s: &crate::storage::CommunitySpaceRecord) -> serde_json::Value {
    serde_json::json!({
        "id": s.id, "community_id": s.community_id,
        "name": s.name, "position": s.position, "created_at": s.created_at,
    })
}

fn category_record_json(c: &crate::storage::CommunityCategoryRecord) -> serde_json::Value {
    serde_json::json!({
        "id": c.id, "community_id": c.community_id, "space_id": c.space_id,
        "name": c.name, "position": c.position, "created_at": c.created_at,
    })
}

fn channel_record_json(ch: &crate::storage::CommunityChannelRecord) -> serde_json::Value {
    serde_json::json!({
        "id": ch.id, "community_id": ch.community_id, "space_id": ch.space_id,
        "category_id": ch.category_id, "name": ch.name,
        "channel_type": ch.channel_type, "topic": ch.topic,
        "position": ch.position, "slow_mode_seconds": ch.slow_mode_seconds,
        "e2ee_enabled": ch.e2ee_enabled, "created_at": ch.created_at,
    })
}

fn member_record_json(m: &crate::storage::CommunityMemberRecord) -> serde_json::Value {
    serde_json::json!({
        "community_id": m.community_id, "member_did": m.member_did,
        "nickname": m.nickname, "avatar_url": m.avatar_url, "bio": m.bio,
        "joined_at": m.joined_at,
    })
}

fn role_record_json(r: &crate::storage::CommunityRoleRecord) -> serde_json::Value {
    serde_json::json!({
        "id": r.id, "community_id": r.community_id, "name": r.name,
        "color": r.color, "position": r.position, "hoisted": r.hoisted,
        "mentionable": r.mentionable, "permissions_bitfield": r.permissions_bitfield,
        "is_preset": r.is_preset, "created_at": r.created_at,
    })
}

fn invite_record_json(i: &crate::storage::CommunityInviteRecord) -> serde_json::Value {
    serde_json::json!({
        "id": i.id, "community_id": i.community_id, "code": i.code,
        "creator_did": i.creator_did, "max_uses": i.max_uses,
        "use_count": i.use_count, "expires_at": i.expires_at,
        "vanity": i.vanity, "created_at": i.created_at,
    })
}
