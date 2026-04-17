# Go Project Rules

This project follows the workspace standard data boundary.

## Paths

- project code/docs/rules:
  - projects/Go
- project data root:
  - data/Go
- default input:
  - data/Go/input
- default output:
  - data/Go/output
- default temp:
  - data/Go/temp

## Default Behavior

1. Read external and raw source materials from `data/Go/input`.
2. Save final results and deliverables to `data/Go/output`.
3. Save cache and temporary intermediates to `data/Go/temp`.
4. Keep project logic, specs, and rules in `projects/Go`.

Unless user explicitly overrides, do not write result data outside this project's data root.
