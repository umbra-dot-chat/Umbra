//! Relay API client for discovery services.
//!
//! Thin HTTP wrapper over the Umbra relay endpoints for profile import,
//! username registration, account linking, and friend discovery.

use serde::{Deserialize, Serialize};

/// Base URL for the Umbra relay.
const RELAY_URL: &str = "https://relay.umbra.chat";

// ── Response types ──────────────────────────────────────────────────────

/// Response from starting an OAuth profile import flow.
#[derive(Debug, Deserialize)]
pub struct StartAuthResponse {
    pub redirect_url: String,
    pub state: String,
}

/// Profile data imported from an external platform.
#[derive(Debug, Clone, Deserialize)]
#[allow(dead_code)]
pub struct ImportedProfile {
    pub platform: String,
    pub platform_id: String,
    pub display_name: String,
    pub username: String,
    #[serde(default)]
    pub avatar_base64: Option<String>,
}

/// Full result from polling the profile import endpoint.
#[derive(Debug, Deserialize)]
pub struct ImportResult {
    pub success: bool,
    pub profile: Option<ImportedProfile>,
}

/// Response from username registration.
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct UsernameResponse {
    pub did: String,
    pub username: Option<String>,
    pub name: Option<String>,
    pub tag: Option<String>,
}

/// Response from discovery settings update.
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct DiscoveryStatus {
    pub did: String,
    pub discoverable: bool,
}

// ── Request types ───────────────────────────────────────────────────────

#[derive(Serialize)]
struct ProfileImportStartRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    did: Option<String>,
}

#[derive(Serialize)]
struct LinkAccountRequest {
    did: String,
    platform: String,
    platform_id: String,
    username: String,
}

#[derive(Serialize)]
struct RegisterUsernameRequest {
    did: String,
    name: String,
}

#[derive(Serialize)]
struct DiscoverySettingsRequest {
    did: String,
    discoverable: bool,
}

/// Response from a user search query.
#[derive(Debug, Deserialize)]
pub struct SearchUserResult {
    pub found: bool,
    pub did: Option<String>,
    pub username: Option<String>,
}

/// A single item from a username search.
#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct UsernameSearchItem {
    pub did: String,
    pub username: String,
}

/// Response from the username search endpoint.
#[derive(Debug, Deserialize)]
pub struct UsernameSearchResponse {
    pub results: Vec<UsernameSearchItem>,
}

// ── API functions ───────────────────────────────────────────────────────

/// Start OAuth profile import flow for a platform.
///
/// Returns the redirect URL (to open in a browser) and a state token
/// for polling the result.
pub async fn start_profile_import(
    platform: &str,
    did: Option<&str>,
) -> Result<StartAuthResponse, String> {
    let client = reqwest::Client::new();
    let url = format!("{RELAY_URL}/profile/import/{platform}/start");

    let mut req = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json");

    if let Some(did) = did {
        req = req.json(&ProfileImportStartRequest {
            did: Some(did.to_string()),
        });
    }

    let response = req.send().await.map_err(|e| format!("Network error: {e}"))?;

    if !response.status().is_success() {
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to start {platform} import: {text}"));
    }

    response
        .json::<StartAuthResponse>()
        .await
        .map_err(|e| format!("Failed to parse response: {e}"))
}

/// Poll for the result of an OAuth profile import.
///
/// Returns `Ok(Some(profile))` when the user has completed sign-in,
/// `Ok(None)` if still waiting, or `Err` on failure.
pub async fn poll_profile_import(state: &str) -> Result<Option<ImportedProfile>, String> {
    let client = reqwest::Client::new();
    let url = format!("{RELAY_URL}/profile/import/result/{state}");

    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    if !response.status().is_success() {
        // Not ready yet — relay returns 404 or similar while waiting
        return Ok(None);
    }

    let result: ImportResult = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {e}"))?;

    if result.success {
        Ok(result.profile)
    } else {
        Ok(None)
    }
}

/// Link a platform account to a DID for friend discovery.
pub async fn link_account(
    did: &str,
    platform: &str,
    platform_id: &str,
    username: &str,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("{RELAY_URL}/discovery/link");

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&LinkAccountRequest {
            did: did.to_string(),
            platform: platform.to_string(),
            platform_id: platform_id.to_string(),
            username: username.to_string(),
        })
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    if !response.status().is_success() {
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to link {platform} account: {text}"));
    }

    Ok(())
}

/// Register a username (Name#Tag) for a DID.
///
/// The relay auto-assigns a 5-digit numeric tag for uniqueness.
pub async fn register_username(did: &str, name: &str) -> Result<UsernameResponse, String> {
    let client = reqwest::Client::new();
    let url = format!("{RELAY_URL}/discovery/username/register");

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&RegisterUsernameRequest {
            did: did.to_string(),
            name: name.to_string(),
        })
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    if !response.status().is_success() {
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to register username: {text}"));
    }

    response
        .json::<UsernameResponse>()
        .await
        .map_err(|e| format!("Failed to parse response: {e}"))
}

/// Update discoverability setting for a DID.
pub async fn enable_discovery(did: &str, discoverable: bool) -> Result<(), String> {
    let client = reqwest::Client::new();
    let url = format!("{RELAY_URL}/discovery/settings");

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&DiscoverySettingsRequest {
            did: did.to_string(),
            discoverable,
        })
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    if !response.status().is_success() {
        let text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to update discovery settings: {text}"));
    }

    Ok(())
}

/// Search for users by username or DID, returning multiple results.
///
/// If the query contains `#`, attempts an exact username lookup (0 or 1 result).
/// If it starts with `did:`, returns it directly as a single result.
/// Otherwise, does a partial search by name (up to 10 results).
pub async fn search_users(query: &str) -> Result<Vec<SearchUserResult>, String> {
    let client = reqwest::Client::new();

    if query.contains('#') {
        // Exact username lookup
        let url = format!("{RELAY_URL}/discovery/username/lookup");
        let response = client
            .get(&url)
            .query(&[("username", query)])
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| format!("Network error: {e}"))?;

        if !response.status().is_success() {
            return Ok(Vec::new());
        }

        match response.json::<UsernameResponse>().await {
            Ok(resp) => Ok(vec![SearchUserResult {
                found: true,
                did: Some(resp.did),
                username: resp.username,
            }]),
            Err(_) => Ok(Vec::new()),
        }
    } else if query.starts_with("did:") {
        // DID provided directly — treat as found
        Ok(vec![SearchUserResult {
            found: true,
            did: Some(query.to_string()),
            username: None,
        }])
    } else {
        // Partial name search — up to 10 results
        let url = format!("{RELAY_URL}/discovery/username/search");
        let response = client
            .get(&url)
            .query(&[("name", query), ("limit", "10")])
            .header("Accept", "application/json")
            .send()
            .await
            .map_err(|e| format!("Network error: {e}"))?;

        if !response.status().is_success() {
            return Ok(Vec::new());
        }

        match response.json::<UsernameSearchResponse>().await {
            Ok(resp) => Ok(resp
                .results
                .into_iter()
                .map(|item| SearchUserResult {
                    found: true,
                    did: Some(item.did),
                    username: Some(item.username),
                })
                .collect()),
            Err(_) => Ok(Vec::new()),
        }
    }
}
