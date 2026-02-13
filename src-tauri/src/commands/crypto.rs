use crate::state::AppState;

/// Sign data with the current identity's Ed25519 key.
///
/// Returns the signature as a hex string (since Tauri IPC uses JSON).
#[tauri::command]
pub async fn sign(
    data: Vec<u8>,
    state: tauri::State<'_, AppState>,
) -> Result<Vec<u8>, String> {
    let identity_guard = state.identity.read().await;
    let identity = identity_guard.as_ref()
        .ok_or("No identity loaded")?;

    let signature = umbra_core::crypto::sign(&identity.keypair().signing, &data);
    Ok(signature.0.to_vec())
}

/// Verify a signature against a public key.
///
/// Returns true if valid, false otherwise.
#[tauri::command]
pub async fn verify(
    public_key_hex: String,
    data: Vec<u8>,
    signature: Vec<u8>,
) -> Result<bool, String> {
    let public_key_bytes = hex::decode(&public_key_hex)
        .map_err(|e| format!("Invalid hex: {}", e))?;

    if public_key_bytes.len() != 32 {
        return Err("Public key must be 32 bytes".to_string());
    }

    let mut key_array = [0u8; 32];
    key_array.copy_from_slice(&public_key_bytes);

    if signature.len() != 64 {
        return Err("Signature must be 64 bytes".to_string());
    }

    let mut sig_array = [0u8; 64];
    sig_array.copy_from_slice(&signature);
    let sig = umbra_core::crypto::Signature(sig_array);

    match umbra_core::crypto::verify(&key_array, &data, &sig) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
