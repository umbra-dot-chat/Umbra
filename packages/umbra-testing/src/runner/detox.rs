use std::path::{Path, PathBuf};
use std::time::Duration;

use tokio::process::{Child, Command};
use tokio::sync::mpsc;

use crate::app::types::DetoxConfig;
use crate::config::RelayConfig;
use crate::event::AppEvent;

/// Build the command and args for running a Detox test.
///
/// Returns (program, args, env_vars).
pub fn build_command(
    test_path: &Path,
    detox_config: DetoxConfig,
    _project_root: &Path,
) -> (String, Vec<String>, Vec<(String, String)>) {
    let program = "npx".to_string();
    let config_str = detox_config.as_str();

    let args = vec![
        "detox".to_string(),
        "test".to_string(),
        "-c".to_string(),
        config_str.to_string(),
        test_path.to_string_lossy().to_string(),
        "--cleanup".to_string(),
    ];

    let env_vars = vec![];

    (program, args, env_vars)
}

/// Get the artifacts directory for a Detox test.
pub fn artifacts_dir(project_root: &Path) -> PathBuf {
    project_root.join("__tests__/e2e-ios/artifacts")
}

// ── Managed processes for Detox lifecycle ────────────────────────────────────

/// Holds references to managed child processes (relay + Metro).
pub struct DetoxLifecycle {
    relay_child: Option<Child>,
    metro_child: Option<Child>,
    relay_port: u16,
}

impl DetoxLifecycle {
    /// Start the relay and (for debug builds) Metro, waiting for health checks.
    ///
    /// Returns `Ok(Self)` if everything started successfully.
    pub async fn start(
        project_root: &Path,
        relay_config: &RelayConfig,
        detox_config: DetoxConfig,
        event_tx: &mpsc::UnboundedSender<AppEvent>,
    ) -> Result<Self, String> {
        let relay_port = relay_config.port;
        let mut lifecycle = DetoxLifecycle {
            relay_child: None,
            metro_child: None,
            relay_port,
        };

        if !relay_config.auto_start {
            return Ok(lifecycle);
        }

        // --- Kill any existing processes on the relay and Metro ports ---
        kill_port(relay_port).await;
        kill_port(8081).await;

        // --- Start the relay binary ---
        let relay_bin = project_root.join(&relay_config.binary_path);
        if !relay_bin.exists() {
            // Try building it first.
            let _ = event_tx.send(AppEvent::OutputLine(
                "Building relay binary...".to_string(),
            ));

            let build_result = Command::new("cargo")
                .args(["build", "--release"])
                .current_dir(project_root.join("packages/umbra-relay"))
                .output()
                .await;

            match build_result {
                Ok(output) if !output.status.success() => {
                    return Err("Failed to build relay binary".to_string());
                }
                Err(e) => {
                    return Err(format!("Failed to build relay: {}", e));
                }
                _ => {}
            }
        }

        let _ = event_tx.send(AppEvent::OutputLine(format!(
            "Starting relay on port {}...",
            relay_port
        )));

        let relay_child = Command::new(&relay_bin)
            .arg("--port")
            .arg(relay_port.to_string())
            .env("RELAY_PORT", relay_port.to_string())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .kill_on_drop(true)
            .spawn()
            .map_err(|e| format!("Failed to start relay: {}", e))?;

        lifecycle.relay_child = Some(relay_child);

        // Wait for relay health check.
        if !wait_for_health(
            &format!("http://localhost:{}/health", relay_port),
            Duration::from_secs(30),
            Duration::from_secs(1),
        )
        .await
        {
            lifecycle.stop().await;
            return Err("Relay failed health check after 30s".to_string());
        }

        let _ = event_tx.send(AppEvent::OutputLine("Relay is ready.".to_string()));

        // --- Start Metro (only for debug builds) ---
        if detox_config == DetoxConfig::Debug {
            let _ = event_tx.send(AppEvent::OutputLine(
                "Starting Metro bundler on port 8081...".to_string(),
            ));

            let metro_child = Command::new("npx")
                .args(["expo", "start", "--port", "8081", "--clear"])
                .current_dir(project_root)
                .env(
                    "EXPO_PUBLIC_RELAY_URL",
                    format!("http://localhost:{}", relay_port),
                )
                .stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null())
                .kill_on_drop(true)
                .spawn()
                .map_err(|e| format!("Failed to start Metro: {}", e))?;

            lifecycle.metro_child = Some(metro_child);

            // Wait for Metro health check.
            if !wait_for_metro_health(Duration::from_secs(120), Duration::from_secs(2)).await {
                lifecycle.stop().await;
                return Err("Metro failed health check after 120s".to_string());
            }

            let _ = event_tx.send(AppEvent::OutputLine(
                "Metro bundler is ready.".to_string(),
            ));
        }

        Ok(lifecycle)
    }

    /// Stop all managed processes.
    pub async fn stop(&mut self) {
        if let Some(mut child) = self.metro_child.take() {
            let _ = child.kill().await;
        }
        if let Some(mut child) = self.relay_child.take() {
            let _ = child.kill().await;
        }
        // Clean up ports.
        kill_port(self.relay_port).await;
        kill_port(8081).await;
    }
}

/// Kill any process listening on the given port.
async fn kill_port(port: u16) {
    #[cfg(unix)]
    {
        let _ = Command::new("sh")
            .args(["-c", &format!("lsof -ti:{} | xargs kill 2>/dev/null || true", port)])
            .output()
            .await;
    }
}

/// Wait for an HTTP health endpoint to return 200.
async fn wait_for_health(url: &str, timeout: Duration, interval: Duration) -> bool {
    let start = std::time::Instant::now();
    while start.elapsed() < timeout {
        if let Ok(output) = Command::new("curl")
            .args(["-sf", url])
            .output()
            .await
        {
            if output.status.success() {
                return true;
            }
        }
        tokio::time::sleep(interval).await;
    }
    false
}

/// Wait for Metro bundler to be ready.
async fn wait_for_metro_health(timeout: Duration, interval: Duration) -> bool {
    let start = std::time::Instant::now();
    while start.elapsed() < timeout {
        if let Ok(output) = Command::new("curl")
            .args(["-sf", "http://localhost:8081/status"])
            .output()
            .await
        {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if stdout.contains("packager-status:running") {
                    return true;
                }
            }
        }
        tokio::time::sleep(interval).await;
    }
    false
}
