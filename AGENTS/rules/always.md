# Always-Active Rules

These rules apply to EVERY agent session, regardless of task area. They are non-negotiable.

## Commit Discipline — The Ratchet Effect

> Giant diffs are the enemy. Every successful validation is a checkpoint. Progress must never be lost.

1. **Commit after every logical unit of work.** One feature addition = one commit. One bug fix = one commit. Never bundle unrelated changes.
2. **Commit immediately after tests pass.** This creates a "ratchet effect" — progress is locked in and cannot be lost. If the next change breaks something, `git bisect` pinpoints it instantly.
3. **Target <100 lines per commit, 3-10 commits per feature.** If your diff exceeds 200 lines, you waited too long. Split it.
4. **Commit BEFORE switching tasks.** About to investigate a different bug? Commit current work first. About to refactor? Commit the working state.
5. **End-of-session commits are MANDATORY.** The commit message must include what was done, what's next, and any warnings for the next agent.
6. **Use feature branches for multi-session work.** Isolate agent-generated changes. If the whole approach fails, the branch is disposable.
7. **Never use `--amend` on published commits.** Create new commits. History is sacred.

## Strict Testing — You Can't See, Hear, or Touch What the User Sees

> An agent without verification is guessing. Tests are your eyes, ears, and hands. Iterate until confident.

8. **Define verification criteria BEFORE writing code.** What does "done" look like? What commands prove it works? Write this down first.
9. **Use the iterative verification loop.** `Write code → Run tests → Check results → Fix issues → Re-test → Repeat`. Never ship after a single pass. Minimum TWO verification cycles.
10. **Iterate to improve results.** If tests pass but results are mediocre (e.g., score 82/100), investigate WHY and try to improve. Don't settle for "barely passing."
11. **For UI changes, verify with accessibility snapshots first** (`preview_snapshot`), then **DOM inspection** (`preview_inspect`) for CSS properties, and **screenshots** (`preview_screenshot`) only for overall visual sanity. Screenshots alone are NOT reliable for colors, fonts, or spacing.
12. **Check console errors after EVERY UI change.** `preview_console_logs(level: 'error')` — silent JS errors break functionality invisibly.
13. **Check network requests after API changes.** `preview_network(filter: 'failed')` — broken API calls may not surface visually.
14. **For WebRTC/media changes, use real-pipeline tests.** Synthetic tests with generated frames are supplementary only. They scored 97/100 while production was completely broken.
15. **Inspect server logs after every deploy.** `grep -E 'ERROR|WARN|overflow|underrun|byteLength|drop'` — errors can be invisible to automated tests.
16. **Ask: "Does this test exercise the EXACT code path production uses?"** If not, it supplements but does not replace a real-pipeline test.
17. **After 2 failed fix attempts, `/clear` and rewrite the prompt.** A clean session with a better prompt beats a long session with accumulated corrections.

## Context Management

18. **Read `AGENTS/ONBOARDING.md` first** in every new session.
19. **Load domain files just-in-time** — only read the one relevant to your task.
20. **Write findings to disk** before context gets full. Use `AGENTS/history/`.
21. **Use `/compact Focus on [area]`** to guide what survives compaction.
22. **Use `/clear` between unrelated tasks** to prevent context bleed.
23. **Use subagents for exploration** to preserve main context window. File reads in the main context add up fast.

## Code Quality

24. **Type-check before committing AND before deploying.** `npx tsc --noEmit` must pass. No exceptions.
25. **Never use `StyleSheet.create()`.** All UI uses Wisp components exclusively.
26. **Never implement crypto in JavaScript.** All crypto goes through umbra-core (Rust).
27. **Check existing hooks** (49 in `src/hooks/`) before creating new ones.
28. **Check existing contexts** (19 in `src/contexts/`) before creating new state management.
29. **Use strongly-worded constraints for critical rules.** "It is unacceptable to remove tests" > "Try not to remove tests."

## Deployment

30. **Follow the full deploy sequence.** Build → sync → restart → verify startup → real-pipeline test → log inspection. All steps required.
31. **Know your rollback plan** before deploying.

## Session Hygiene

32. **Write a handoff file** at the end of meaningful sessions. Use `templates/session-handoff.md`. Drop in `AGENTS/history/`.
33. **Update domain files** when you discover something important about a subsystem. This is how institutional knowledge accumulates.
