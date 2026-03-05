use std::path::PathBuf;

use regex::Regex;

use crate::app::types::{OutputLine, TestOutput};

/// Analyze output lines to detect pass/fail and extract artifacts.
pub fn analyze_output(lines: &[OutputLine], success: bool) -> TestOutput {
    let screenshot_paths = extract_screenshot_paths(lines);

    TestOutput {
        lines: lines.to_vec(),
        passed: success,
        duration_secs: 0.0, // Will be set by the coordinator.
        screenshot_paths,
    }
}

/// Extract screenshot file paths from Detox output.
fn extract_screenshot_paths(lines: &[OutputLine]) -> Vec<PathBuf> {
    let mut paths = Vec::new();

    // Detox artifacts are typically logged with paths like:
    //   Artifacts saved to: __tests__/e2e-ios/artifacts/...
    let re = Regex::new(r"(?:screenshot|artifact|png|jpg).*?([/\w.-]+\.(?:png|jpg|jpeg))")
        .unwrap_or_else(|_| Regex::new(r"x{0}").unwrap());

    for line in lines {
        if let Some(caps) = re.captures(&line.text) {
            if let Some(path_match) = caps.get(1) {
                paths.push(PathBuf::from(path_match.as_str()));
            }
        }
    }

    paths
}
