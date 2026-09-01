# AGENTS.md

## Scope

These instructions apply to the entire repository.

## Production safety

- Treat `main` as the production deployment branch for `techa.kr`.
- Never commit or push changes directly to `main`.
- Create and use a dedicated working branch for every change.
- Do not merge into `main` or create a pull request unless the user explicitly requests it.

## Change safety

- Keep changes strictly within the scope requested by the user.
- Preserve the existing site structure, routes, deployment configuration, and production behavior unless the user explicitly requests changes to them.
- Do not modify, remove, rename, or replace existing Claude automation, including `.claude/`, `CLAUDE.md`, and related automation files, unless the user explicitly requests it.
- Inspect relevant repository instructions and existing files before editing.
- Avoid unrelated formatting, cleanup, dependency, or generated-file changes.
- Before committing, verify that only intended files changed and report the branch and commit.
