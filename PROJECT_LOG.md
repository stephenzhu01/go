# Project Log

## Purpose

Record changes to the Go project's structure, rules, architecture, workflow, and stable operating decisions.

## Logging Rule

- Use this file for project-level changes
- Do not use it for routine execution notes
- Keep entries short and cumulative

### 2026-03-28

- Type: path governance
- Change: documented the canonical project root under `projects/Go` and the canonical data root under `data/Go`, including default `input / output / temp` directories.
- Impact: the project now has an explicit home for future inputs, outputs, and scratch artifacts instead of relying on ad hoc paths.
- Notes: the old top-level `Codex-Game/Go` path remains only as a compatibility symlink.

- Type: project formalization
- Change: created the project's required `PROJECT_LOG.md` and `WORK_LOG.md`
- Impact: the project now meets the Codex portfolio minimum logging standard
- Notes: initial backfill entry added during portfolio governance cleanup

### 2026-03-30

- Type: path portability governance
- Change: rewrote active path guidance in `README.md` to use portable workspace-relative paths such as `projects/Go` and `data/Go` instead of device-specific Dropbox absolute paths.
- Impact: the synced project docs now remain valid across machines with different local usernames.
- Notes: historical work-log entries were left unchanged as environment-specific records.

### 2026-03-30

- Type: project-rule governance
- Change: promoted portable path writing into an explicit Go project rule, requiring workspace-relative `projects/...` and `data/...` paths in active docs and preferring `~/...` or variables for home-directory paths.
- Impact: future doc updates now have a stable rule that prevents drift back into username-specific absolute paths.
- Notes: historical logs may still preserve machine-specific paths when needed.

### 2026-03-30

- Type: compatibility-entry cleanup
- Change: removed the old root-level `Codex-Game/Go` alias and kept `projects/Go` as the only active project home.
- Impact: future work is less likely to start from an obsolete workspace entry.
- Notes: the real project directory was not modified.
