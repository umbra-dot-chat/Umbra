use std::path::Path;

/// Build the command and args for running a Jest test.
///
/// Returns (program, args, env_vars).
pub fn build_command(
    test_path: &Path,
    _project_root: &Path,
) -> (String, Vec<String>, Vec<(String, String)>) {
    let program = "npx".to_string();

    let args = vec![
        "jest".to_string(),
        test_path.to_string_lossy().to_string(),
        "--no-coverage".to_string(),
    ];

    let env_vars = vec![];

    (program, args, env_vars)
}
