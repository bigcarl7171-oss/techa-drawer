# AGENTS.md

## Scope

These instructions apply to the entire repository.

## Production safety

- `main` is the production deployment branch for `techa.kr`; never commit or push to it directly.
- Use a dedicated working branch, and do not create a PR or merge unless explicitly requested.
- Claude magazine automation may update `main` while work is in progress. Check the latest `main` at task start and again immediately before the final commit or PR.

## Change safety

- Keep changes strictly in scope. Preserve site structure, routes, deployment behavior, and Claude automation unless explicitly requested.
- Treat `index.html`, `blog/index.html`, `sitemap.xml`, `ko/gift-finder/index.html`, and `docs/drafts/**` as shared hotspots that may conflict with Claude publishing or content work.
- If a shared hotspot changed, recheck it against the latest `main` before final submission.
- Do not manually edit generated data such as `assets/data/search-index.json` without first checking its generation script.
- Inspect relevant instructions before editing; avoid unrelated cleanup, dependency, formatting, or generated-file changes.
- Before committing, verify only intended files changed and report the branch, commit, changed files, and tests.
