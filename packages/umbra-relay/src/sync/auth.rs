//! Sync auth helpers — Ed25519 signature verification and Bearer token extraction.

use axum::http::{HeaderMap, StatusCode};
use base64::Engine;
use ed25519_dalek::{Signature, Verifier, VerifyingKey};

/// Extract a Bearer token from the Authorization header.
pub fn extract_bearer_token(headers: &HeaderMap) -> Result<String, (StatusCode, &'static str)> {
    let auth = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .ok_or((StatusCode::UNAUTHORIZED, "Missing Authorization header"))?;

    if !auth.starts_with("Bearer ") {
        return Err((StatusCode::UNAUTHORIZED, "Invalid Authorization format"));
    }

    Ok(auth[7..].to_string())
}

/// Verify an Ed25519 signature over a nonce.
/// `public_key_b64` and `signature_b64` are base64-encoded.
/// Returns `true` if the signature is valid.
pub fn verify_ed25519_signature(
    nonce: &str,
    public_key_b64: &str,
    signature_b64: &str,
) -> Result<bool, String> {
    let b64 = base64::engine::general_purpose::STANDARD;

    let pk_bytes = b64
        .decode(public_key_b64)
        .map_err(|e| format!("Invalid public key encoding: {}", e))?;

    let sig_bytes = b64
        .decode(signature_b64)
        .map_err(|e| format!("Invalid signature encoding: {}", e))?;

    let pk_array: [u8; 32] = pk_bytes
        .try_into()
        .map_err(|_| "Public key must be 32 bytes".to_string())?;

    let sig_array: [u8; 64] = sig_bytes
        .try_into()
        .map_err(|_| "Signature must be 64 bytes".to_string())?;

    let verifying_key =
        VerifyingKey::from_bytes(&pk_array).map_err(|e| format!("Invalid public key: {}", e))?;

    let signature = Signature::from_bytes(&sig_array);

    Ok(verifying_key.verify(nonce.as_bytes(), &signature).is_ok())
}
