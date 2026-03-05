use std::path::Path;

/// Build the command and args for running tests in a Rust package.
///
/// Returns (program, args, env_vars).
pub fn build_command(
    _package_name: &str,
    manifest_path: &Path,
) -> (String, Vec<String>, Vec<(String, String)>) {
    let program = "cargo".to_string();

    let args = vec![
        "test".to_string(),
        "--manifest-path".to_string(),
        manifest_path.to_string_lossy().to_string(),
        "--".to_string(),
        "--nocapture".to_string(),
    ];

    let env_vars = vec![];

    (program, args, env_vars)
}
