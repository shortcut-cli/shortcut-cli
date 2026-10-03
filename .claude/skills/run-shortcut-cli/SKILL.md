---
name: run-shortcut-cli
description: Build, run, test, and drive the shortcut-cli (`short`) — against the live Shortcut API or a deterministic local mock. Use when asked to run shortcut-cli, start it, smoke-test it, try a `short` command with or without real credentials, or verify a change works in the real CLI.
---

shortcut-cli is a commander-based CLI (`short`) for shortcut.com. Drive it via `.claude/skills/run-shortcut-cli/driver.mjs`, which boots the repo's own Prism mock server (spec-generated responses, fully deterministic — no token, no network) and runs the built CLI against it. All paths are relative to the repo root.

## Prerequisites

Node >= 20.19. pnpm is pinned via `packageManager`; if pnpm is not on PATH, `npx -y pnpm@10.32.0` works identically.

## Setup + Build

```bash
npx -y pnpm@10.32.0 install --frozen-lockfile
npx -y pnpm@10.32.0 run build
```

Build output lands in `build/` (entry: `build/bin/short.js`).

## Run (agent path)

The driver is the primary handle. Three modes:

```bash
# Full smoke sweep: boots the mock, runs 15 representative commands
# (lists, story view/update, create, search, raw api GET/POST, missing-token
# exit code), asserts on exit codes + output, prints PASS/FAIL per check.
node .claude/skills/run-shortcut-cli/driver.mjs smoke
# → "[driver] smoke: all checks passed", exit 0
```

```bash
# Read-only sweep against the LIVE Shortcut API (auth, reads, server-side search).
# Needs a real token; never creates or updates anything:
SHORTCUT_API_TOKEN=<token> node .claude/skills/run-shortcut-cli/driver.mjs smoke --live
```

```bash
# Run ONE CLI command against the mock (boots + tears down around it):
node .claude/skills/run-shortcut-cli/driver.mjs run -- story 123 -f '%j'
node .claude/skills/run-shortcut-cli/driver.mjs run -- api /member

# Or against the LIVE API — no read-only guard, this runs exactly what you pass:
SHORTCUT_API_TOKEN=<token> node .claude/skills/run-shortcut-cli/driver.mjs run --live -- api /member
```

```bash
# Keep the mock in the foreground (port 4013; override with PRISM_PORT),
# then in another shell point the CLI at it yourself:
node .claude/skills/run-shortcut-cli/driver.mjs mock
SHORTCUT_API_TOKEN=x SHORTCUT_URL_SLUG=w SHORTCUT_MENTION_NAME=m \
  SHORTCUT_API_BASE_URL=http://127.0.0.1:4013 node build/bin/short.js epics
```

The driver injects a fake token, slug, and mention name, points `SHORTCUT_API_BASE_URL` at the mock, and isolates `XDG_CONFIG_HOME` so a real `~/.config/shortcut-cli` never leaks in.

## Run (human path)

Against the real API — set a real token (get one at Shortcut → Settings → API Tokens):

```bash
SHORTCUT_API_TOKEN=<token> node build/bin/short.js search -t 'some title' -q
```

For day-to-day _usage_ recipes (search operators, create/update, raw API), see the `shortcut` skill (`.claude/skills/shortcut/SKILL.md`).

## Test

```bash
npx -y pnpm@10.32.0 run test          # vitest + coverage, boots its own mock on port 4010
npx -y pnpm@10.32.0 run ci            # build + test + format check — what CI runs
```

## Gotchas

- **Even subcommand `--help` exits 11 without a token** — subcommand entrypoints import `src/lib/client.ts`, which loads config at import time, before commander parses. Bare `short --help` (root help) works tokenless. Prefix with `SHORTCUT_API_TOKEN=x` to read subcommand help: `SHORTCUT_API_TOKEN=x node build/bin/short.js create --help`.
- **`short members` / `short teams` print nothing against the mock** — the spec's canned member is `disabled: true` and the canned team `archived: true`, and the CLI hides both by default. Use `members -d` and `teams -a`.
- **`*SearchResults.next` needs a patched spec** — Prism's static sampler ignores `x-nullable` on required fields and synthesizes the literal string `"string"` for `next`, which is truthy and makes pagination (`while (result.data.next)` in `src/lib/stories.ts`) loop forever. `test/scripts/patch-spec.mjs` sets `example: null` on every `*SearchResults.next` field (5 as of writing) so a single mock page terminates pagination; this runs automatically via `pnpm test:update-spec` and has already been applied to the committed fixture.
- **Mock ids are all `1`** — the canned workflow state id is `1`, so `create -t Title -s 1` is the working create invocation. `create -s 500000` prints `State 500000 not found` **and still exits 0**.
- **Search's text flag is `-t/--text`** (regex), not `--title`. Positional args are Shortcut search operators (e.g. `state:started`); `%self%` in a query expands to your mention name.
- **Port 4010 belongs to vitest** — its global setup boots the same mock there. The driver uses 4013 so `smoke` and `pnpm test` can run side by side.
- **oxfmt formats markdown** — any `.md` you add must pass `npx -y pnpm@10.32.0 run test:format` or CI fails.

## Troubleshooting

- **`Please run 'short install' to configure Shortcut API access` (exit 11)**: no token in env or `~/.config/shortcut-cli/config.json`. Set `SHORTCUT_API_TOKEN`.
- **`error: unknown option '--title'`**: search filters by `-t/--text`; run `SHORTCUT_API_TOKEN=x node build/bin/short.js search --help` for the flag list.
