//! Identity dispatch handlers.

use super::dispatcher::{DResult, err, json_parse, require_str, ok_json, ok_success};
use super::state::get_state;
use crate::identity::{Identity, RecoveryPhrase, ProfileUpdate};

pub fn identity_create(args: &str) -> DResult {
    let data = json_parse(args)?;
    let name = require_str(&data, "display_name")?;
    let state = get_state().map_err(|e| err(100, e))?;

    match Identity::create(name.to_string()) {
        Ok((identity, recovery_phrase)) => {
            let did = identity.did_string();
            let phrase = recovery_phrase.phrase();
            state.write().identity = Some(identity);
            ok_json(serde_json::json!({ "did": did, "recovery_phrase": phrase }))
        }
        Err(e) => Err(err(e.code(), e)),
    }
}

pub fn identity_restore(args: &str) -> DResult {
    let data = json_parse(args)?;
    let phrase_str = require_str(&data, "recovery_phrase")?;
    let name = require_str(&data, "display_name")?;
    let state = get_state().map_err(|e| err(100, e))?;

    let recovery = RecoveryPhrase::from_phrase(phrase_str)
        .map_err(|e| err(202, format!("Invalid recovery phrase: {}", e)))?;

    match Identity::from_recovery_phrase(&recovery, name.to_string()) {
        Ok(identity) => {
            let did = identity.did_string();
            state.write().identity = Some(identity);
            Ok(did)
        }
        Err(e) => Err(err(e.code(), e)),
    }
}

pub fn identity_get_did() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    match &state.identity {
        Some(id) => Ok(id.did_string()),
        None => Err(err(200, "No identity loaded")),
    }
}

pub fn identity_get_profile() -> DResult {
    let state = get_state().map_err(|e| err(100, e))?;
    let state = state.read();
    let id = state.identity.as_ref().ok_or_else(|| err(200, "No identity loaded"))?;
    let p = id.profile();
    ok_json(serde_json::json!({
        "did": id.did_string(), "display_name": p.display_name,
        "status": p.status, "avatar": p.avatar,
        "signing_key": hex::encode(&id.keypair().signing.public_bytes()),
        "encryption_key": hex::encode(&id.keypair().encryption.public_bytes()),
    }))
}

pub fn identity_update_profile(args: &str) -> DResult {
    let updates = json_parse(args)?;
    let state = get_state().map_err(|e| err(100, e))?;
    let mut state = state.write();
    let id = state.identity.as_mut().ok_or_else(|| err(200, "No identity loaded"))?;
    let profile = id.profile_mut();

    if let Some(n) = updates.get("display_name").and_then(|v| v.as_str()) {
        profile.apply_update(ProfileUpdate::DisplayName(n.to_string())).map_err(|e| err(205, e))?;
    }
    if let Some(s) = updates.get("status") {
        let sv = if s.is_null() { None } else { s.as_str().map(|x| x.to_string()) };
        profile.apply_update(ProfileUpdate::Status(sv)).map_err(|e| err(205, e))?;
    }
    if let Some(a) = updates.get("avatar") {
        let av = if a.is_null() { None } else { a.as_str().map(|x| x.to_string()) };
        profile.apply_update(ProfileUpdate::Avatar(av)).map_err(|e| err(205, e))?;
    }
    ok_success()
}
