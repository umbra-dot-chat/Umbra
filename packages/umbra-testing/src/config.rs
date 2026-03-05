use std::path::{Path, PathBuf};

use serde::Deserialize;

/// Configuration loaded from `.umbra-test.toml` at the project root.
#[derive(Debug, Clone, Deserialize)]
#[serde(default)]
pub struct Config {
    pub paths: PathsConfig,
    pub detox: DetoxConfig,
    pub relay: RelayConfig,
    pub env: std::collections::HashMap<String, String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default)]
pub struct PathsConfig {
    pub detox_dir: String,
    pub playwright_dir: String,
    pub jest_root: String,
    pub rust_packages: String,
    pub jest_exclude: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default)]
pub struct DetoxConfig {
    pub default_config: String,
    pub always_prompt: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(default)]
pub struct RelayConfig {
    pub auto_start: bool,
    pub binary_path: String,
    pub port: u16,
}

// ── Defaults ────────────────────────────────────────────────────────────────

impl Default for Config {
    fn default() -> Self {
        Self {
            paths: PathsConfig::default(),
            detox: DetoxConfig::default(),
            relay: RelayConfig::default(),
            env: std::collections::HashMap::new(),
        }
    }
}

impl Default for PathsConfig {
    fn default() -> Self {
        Self {
            detox_dir: "__tests__/e2e-ios".into(),
            playwright_dir: "__tests__/e2e".into(),
            jest_root: "__tests__".into(),
            rust_packages: "packages".into(),
            jest_exclude: vec!["e2e-ios".into(), "e2e".into(), "shared".into()],
        }
    }
}

impl Default for DetoxConfig {
    fn default() -> Self {
        Self {
            default_config: "ios.debug".into(),
            always_prompt: true,
        }
    }
}

impl Default for RelayConfig {
    fn default() -> Self {
        Self {
            auto_start: true,
            binary_path: "packages/umbra-relay/target/release/umbra-relay".into(),
            port: 9090,
        }
    }
}

impl Config {
    /// Load config from `.umbra-test.toml` in the given project root.
    /// Returns default config if the file doesn't exist.
    pub fn load(project_root: &Path) -> Self {
        let config_path = project_root.join(".umbra-test.toml");
        if config_path.exists() {
            match std::fs::read_to_string(&config_path) {
                Ok(contents) => match toml::from_str(&contents) {
                    Ok(config) => config,
                    Err(e) => {
                        eprintln!("Warning: Failed to parse .umbra-test.toml: {e}");
                        Self::default()
                    }
                },
                Err(e) => {
                    eprintln!("Warning: Failed to read .umbra-test.toml: {e}");
                    Self::default()
                }
            }
        } else {
            Self::default()
        }
    }

    /// Resolve the Detox test directory relative to the project root.
    pub fn detox_dir(&self, root: &Path) -> PathBuf {
        root.join(&self.paths.detox_dir)
    }

    /// Resolve the Playwright test directory relative to the project root.
    pub fn playwright_dir(&self, root: &Path) -> PathBuf {
        root.join(&self.paths.playwright_dir)
    }

    /// Resolve the Jest root directory relative to the project root.
    pub fn jest_root(&self, root: &Path) -> PathBuf {
        root.join(&self.paths.jest_root)
    }

    /// Resolve the Rust packages directory relative to the project root.
    pub fn rust_packages_dir(&self, root: &Path) -> PathBuf {
        root.join(&self.paths.rust_packages)
    }
}
