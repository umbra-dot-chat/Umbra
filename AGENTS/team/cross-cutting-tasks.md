# Cross-Cutting Tasks — Sequential vs Parallel

## Decision Framework

When a task spans multiple domains, the tech-lead decides how to route it.

### Run in PARALLEL When

- Changes are in **completely separate files/packages**
- No data dependency between the changes
- No shared types or interfaces being modified

**Examples:**
- Ghost AI audio fix + frontend settings UI change (different packages, no shared interface)
- Rust relay improvement + mobile Detox test addition (completely independent)
- Backend CLI feature + frontend component styling (no overlap)

**How to run parallel:**
```
Agent(frontend-engineer, run_in_background: true, prompt: "...")
Agent(ghost-ai-engineer, prompt: "...")
# Wait for both, then run QA once covering all changes
```

### Run SEQUENTIALLY When

- One change depends on another (API contract, shared types)
- Both agents would edit the same files
- Integration testing requires a specific order

**Examples:**
- Plugin SDK type change → plugin runtime update → frontend plugin UI (dependency chain)
- Backend API endpoint → frontend data fetching (frontend needs the API to exist first)
- New shared type in umbra-core → service layer bridge → frontend consumption

**How to run sequential:**
```
Agent(backend-engineer, prompt: "Build the API endpoint...")
# Wait for completion + commit
Agent(frontend-engineer, prompt: "Consume the new API at /api/...")
# Wait for completion + commit
Agent(qa-automated, prompt: "Test both changes...")
```

### Hybrid Approach

When a task has both independent and dependent parts:

1. **Run independent parts in parallel** (e.g., Ghost AI fix + unrelated frontend fix)
2. **Wait for parallel agents to complete**
3. **Run dependent parts sequentially** (e.g., types first, then consumers)
4. **QA runs once at the end covering everything**

## File Ownership Conflicts

When two agents might edit the same file, the tech-lead MUST:

1. **Identify the conflict upfront** (both agents touching `package.json`, `tsconfig.json`, etc.)
2. **Route sequentially** — first agent commits, second agent reads the committed version
3. **Never run parallel agents on the same file** — this creates merge conflicts

## Common Cross-Cutting Patterns

| Pattern | Route |
|---------|-------|
| New feature with UI + API | Backend first → Frontend second |
| Plugin SDK change | backend-engineer (SDK types) → frontend-engineer (runtime/UI) |
| Ghost AI + client call UI | Parallel (different packages) |
| Rust core + WASM bridge | backend-engineer handles both (same domain) |
| New test + code fix | Developer first → qa-automated validates |
| Deploy after feature | Developer → qa-automated → qa-manual → devops-engineer |
