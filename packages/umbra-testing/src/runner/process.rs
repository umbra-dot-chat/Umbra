use std::path::Path;
use std::process::Stdio;

use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::{Child, Command};
use tokio::sync::mpsc;

use crate::event::AppEvent;

/// A managed subprocess with streaming output.
pub struct TestProcess {
    child: Child,
}

impl TestProcess {
    /// Spawn a new subprocess with the given command and args.
    ///
    /// Output lines are streamed via the event sender.
    /// Returns a handle that can be used to kill the process.
    pub async fn spawn(
        program: &str,
        args: &[&str],
        cwd: &Path,
        env_vars: &[(String, String)],
        event_tx: mpsc::UnboundedSender<AppEvent>,
        _test_id: String,
    ) -> Result<Self, std::io::Error> {
        let mut cmd = Command::new(program);
        cmd.args(args)
            .current_dir(cwd)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .kill_on_drop(true);

        for (key, val) in env_vars {
            cmd.env(key, val);
        }

        let mut child = cmd.spawn()?;

        // Stream stdout.
        if let Some(stdout) = child.stdout.take() {
            let tx = event_tx.clone();
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    // Strip ANSI escape codes for cleaner output.
                    let clean = strip_ansi(&line);
                    let _ = tx.send(AppEvent::OutputLine(clean));
                }
            });
        }

        // Stream stderr.
        //
        // Many test frameworks (Jest, Playwright, cargo test) write
        // their normal output to stderr, so we do NOT prefix these
        // lines with "ERR:".  Instead we send them as regular output
        // and let the output pane's heuristic coloring (PASS/FAIL/✓/✗)
        // handle display styling.
        if let Some(stderr) = child.stderr.take() {
            let tx = event_tx.clone();
            tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let clean = strip_ansi(&line);
                    let _ = tx.send(AppEvent::OutputLine(clean));
                }
            });
        }

        Ok(Self { child })
    }

    /// Wait for the process to exit. Returns true if successful (exit code 0).
    pub async fn wait(&mut self) -> bool {
        match self.child.wait().await {
            Ok(status) => status.success(),
            Err(_) => false,
        }
    }

    /// Kill the running process.
    pub async fn kill(&mut self) {
        let _ = self.child.kill().await;
    }

    /// Get the process ID.
    pub fn pid(&self) -> Option<u32> {
        self.child.id()
    }
}

/// Strip ANSI escape sequences from a string.
fn strip_ansi(s: &str) -> String {
    let bytes = strip_ansi_escapes::strip(s.as_bytes());
    String::from_utf8_lossy(&bytes).to_string()
}
