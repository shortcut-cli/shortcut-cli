---
name: shortcut
description: Query and update Shortcut (shortcut.com) deterministically via the `short` CLI — search stories, view/create/update stories, epics, iterations, teams, members, labels, workflows, or call any Shortcut REST v3 endpoint. Use instead of a Shortcut MCP server whenever asked to look something up in Shortcut or change it.
---

The `short` CLI is a full replacement for a Shortcut MCP server: env-only auth, a typed command per resource, and a raw-API escape hatch that covers every REST v3 endpoint with JSON output. Every recipe below is deterministic — fixed flags, parseable output, meaningful exit codes.

## Auth (no interactive setup needed)

```bash
export SHORTCUT_API_TOKEN=<token>        # required — Shortcut → Settings → API Tokens
                                         # (alternative: {"token": "..."} in ~/.config/shortcut-cli/config.json)
export SHORTCUT_URL_SLUG=<workspace>     # optional — used to build story URLs
export SHORTCUT_MENTION_NAME=<mention>   # optional — enables %self% in search queries
```

Missing token → exit code **11** on every subcommand (including `<subcommand> --help`; bare `short --help` works tokenless). Missing slug/mention-name still works but prints a `shortcut-cli: … not configured` warning to **stderr** per missing value on every invocation — set them (or their config-file equivalents) to keep script output clean.

`short` comes from a global install (`npm install -g @shortcut-cli/shortcut-cli`). Only when working inside the shortcut-cli repo itself, `node build/bin/short.js` (after `pnpm build`) is the equivalent dev fallback.

## Per-repo defaults (`.shortcut.json`)

If the repo root has a `.shortcut.json`, read it and apply its values to every recipe below:

```json
{
    "urlSlug": "<workspace-slug>",
    "team": "<team name>",
    "workflow": "<workflow name>",
    "defaultState": "<state name>",
    "defaultStateId": <state id>,
    "defaultStoryType": "feature"
}
```

- Pass `urlSlug` as `SHORTCUT_URL_SLUG` in the command's env (correct story URLs, no stderr warning) — note this only takes effect when `~/.config/shortcut-cli/config.json` has no `urlSlug`; for slug and mention name the config file wins and env fills gaps. (`SHORTCUT_API_TOKEN` is the opposite: env beats the config file.)
- Default `create` to `-T <team> -s <defaultStateId> -y <defaultStoryType>` (the numeric id — name matching is regex-based and can hit the wrong state) unless the request says otherwise; scope searches to the team when it makes sense.
- Precedence: explicit request > `.shortcut.json` defaults > CLI config. This holds unconditionally for `team`/`defaultStateId`/`defaultStoryType` (applied as command flags, which always win); `urlSlug` is applied via env and therefore subject to the caveat above (a `urlSlug` in the user's config file still wins).
- The file is committed and secret-free (the token never goes in it). To create or update it, run the `/shortcut-cli:shortcut-configure` wizard.

## The universal tool: `short api`

Any endpoint, always JSON on stdout — when no typed command fits, this is the answer:

```bash
short api /member                                              # GET, current member
short api /search/stories -f query='state:started' -f page_size=2   # GET with query params
short api /stories -X POST -f name='My story' -f workflow_state_id=1  # write (POST/PUT/DELETE)
```

`-f key=value` becomes query params on GET and the JSON body on POST/PUT/PATCH. Pipe to `jq` for extraction. Paths are relative to `/api/v3`.

## Stories

```bash
short story 123 -f '%j'                    # full story as JSON (%j = JSON template token)
short story 123 -c 'comment text' -f '%id' # add comment; print only the id
short create -t 'Title' -s <state-id-or-name>   # create (also: -d desc, -e estimate, -o owners, --epic, -i iteration, -y bug|feature|chore)
```

`short story` also updates: `-s state`, `-o owners`, `-e estimate`, `--epic`, `-i iteration`, `-a` (archive), `--move-up/--move-down`. Run `SHORTCUT_API_TOKEN=x short story --help` for the full list.

## Search

```bash
short search -q -t 'title regex' -f '%j'   # client-side filters (-t text, -o owner, -s state, -l label), JSON per story
short search -q 'state:started'            # positional args = Shortcut search operators, incl. owner:%self%
```

`-q` suppresses the loading spinner — always pass it in scripts. For server-side search with exact JSON, prefer `short api /search/stories -f query='...'` (same operators).

## Other resources

```bash
# list
short epics          # epics with ids and states
short iterations     # iterations
short teams          # teams (groups)
short members -d     # members; -d includes disabled ones (omitting it silently hides them)
short labels         # labels
short workflows      # workflows and their state ids (needed for create -s)

# view one resource (human-readable — prefer over `api /<x>/<id>` + jq)
short epic view <id>         # also: epic stories <id>, epic comments <id>, epic update <id>
short iteration view <id>    # also: iteration stories <id>, create/update/delete
short objective view <id>    # also: objective epics <id>, create/update
short doc view <id>          # also: doc create/update/delete
short team view <idOrName>   # `view` is the default: `short team <idOrName>` works too
short label stories <idOrName>   # stories for a label (no bare label view; also: label epics <idOrName>)
short custom-field <id>      # positional, no subcommand
```

The list commands print human-formatted text; when you need JSON from them, use the `api` equivalents: `/epics`, `/iterations`, `/groups`, `/members`, `/labels`, `/workflows`. For a **single** epic/iteration/objective/doc/team, reach for the `view <id>` command first — it needs no JSON parsing; use `short api /<x>/<id>` only when you need fields the view output omits.

## Verifying the toolchain

Everything above targets the **live API** — that is the normal mode of this skill. To confirm auth and connectivity before real work, run the read-only live sweep:

```bash
SHORTCUT_API_TOKEN=<token> node .claude/skills/run-shortcut-cli/driver.mjs smoke --live
```

Without credentials (CI, development on the CLI itself), the repo's Prism mock serves the whole API from the swagger spec:

```bash
node .claude/skills/run-shortcut-cli/driver.mjs smoke            # hermetic sweep vs mock
node .claude/skills/run-shortcut-cli/driver.mjs run -- epics     # one command vs mock
```

See the `run-shortcut-cli` skill for building the CLI and mock quirks.

## Gotchas

- Exit code **11** = missing token (even for subcommand `--help`). Exit 0 does **not** always mean success: `create` with an unknown state prints `State … not found` and exits 0 — check output, not just the code.
- `%j` on `story`/`search` gives JSON; most list commands don't have a JSON flag — use `short api` when output must be parsed.
- Capture **stdout only** — the spinner and `… not configured` warnings go to stderr, and merging with `2>&1` mixes spinner control codes into the data. `-q` (where supported) suppresses the spinner.
- Story/epic/iteration/state/label flags accept id **or** name (matched by regex) — ids are unambiguous, prefer them in automation.
