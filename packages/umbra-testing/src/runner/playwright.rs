use std::path::Path;

/// Build the command and args for running a Playwright test.
///
/// Returns (program, args, env_vars).
pub fn build_command(
    test_path: &Path,
    project_root: &Path,
) -> (String, Vec<String>, Vec<(String, String)>) {
    let program = "npx".to_string();

    let config_path = project_root
        .join("__tests__/e2e/playwright.config.ts")
        .to_string_lossy()
        .to_string();

    let args = vec![
        "playwright".to_string(),
        "test".to_string(),
        format!("--config={}", config_path),
        test_path.to_string_lossy().to_string(),
    ];

    let env_vars = vec![];

    (program, args, env_vars)
}
