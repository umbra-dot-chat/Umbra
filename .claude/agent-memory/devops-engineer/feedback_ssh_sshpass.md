---
name: SSH password auth requires bash script wrapper
description: sshpass commands to 45.77.149.94 fail in zsh inline but work in bash scripts using sshpass -f (file-based password)
type: feedback
---

When running sshpass commands to the Ghost AI server (45.77.149.94), inline commands in zsh fail with "Permission denied" even with correct password. The password contains special characters (brackets, exclamation mark) that get mangled by zsh.

**Why:** The password `b3V]!Dxk+x4BxXcX` contains `]` and `!` which zsh interprets differently than bash, even inside single quotes. The `sshpass -f` (file-based) approach works but only when run from a bash script, not when chained with `&&` in a zsh shell.

**How to apply:** Always write SSH commands to a `/tmp/*.sh` bash script and run with `bash /tmp/script.sh`. Use the existing `scripts/deploy-ghost-finish.sh` when possible. Never try inline sshpass commands in the tool's zsh shell.
