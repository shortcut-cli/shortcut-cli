# AGENTS.md

Guidance for AI coding agents working in this repository. Human-facing usage docs live in [README.md](README.md).

## Project overview

`shortcut-cli` is a community-driven command line tool for [Shortcut](https://shortcut.com) (stories, epics, iterations, docs, teams, and raw API access). It ships a single `short` binary built with [commander](https://github.com/tj/commander.js), published to npm as `@shortcut-cli/shortcut-cli`.

## Layout

- `src/bin/short.ts` — root command; `src/bin/short-<name>.ts` — one file per subcommand (e.g. `short-story.ts`, `short-search.ts`).
- `src/lib/` — shared code: `client.ts` (Shortcut API client via `@shortcut/client`), `configure.ts` (token/workspace config), `stories.ts`, `spinner.ts`.
- `test/` mirrors `src/`: `test/bin/*.spec.ts`, `test/lib/*.spec.ts`. Tests run against a [Prism](https://github.com/stoplightio/prism) mock server fed by the Shortcut swagger spec in `test/fixtures/` (started in `test/global-setup.ts`).
- `build/` — tsdown output (gitignored); the published artifact.

## Toolchain and commands

pnpm only (version pinned via `packageManager` in package.json), Node >= 20.19.

| Command            | What it does                     |
| ------------------ | -------------------------------- |
| `pnpm install`     | Install dependencies             |
| `pnpm build`       | Bundle with tsdown into `build/` |
| `pnpm test`        | vitest run with coverage         |
| `pnpm test:watch`  | vitest watch mode                |
| `pnpm lint`        | oxlint                           |
| `pnpm format`      | oxfmt (write)                    |
| `pnpm test:format` | oxfmt check (CI mode)            |
| `pnpm type-check`  | tsc --noEmit                     |
| `pnpm ci`          | build + test + format check      |
| `pnpm start`       | Run the built CLI (`short`)      |

Run `pnpm build && pnpm test && pnpm test:format && pnpm lint && pnpm type-check` before pushing — CI runs each of these as a required matrix job on every PR.

## Conventions

- ESM throughout (`"type": "module"`).
- Formatting is owned by oxfmt (`.oxfmtrc.json`): 4-space indent, single quotes, 100-char lines, sorted imports. It also formats markdown and JSON. Don't hand-format; run `pnpm format`.
- Linting rules live in `.oxlintrc.json`.
- No new runtime dependencies without prior discussion in an issue — the dependency footprint is deliberately small.
- Behavior changes require tests. New subcommands get a matching `test/bin/short-<name>.spec.ts` against the Prism mock.
- The Shortcut API surface comes from the swagger spec; refresh it with `pnpm test:update-spec`.
