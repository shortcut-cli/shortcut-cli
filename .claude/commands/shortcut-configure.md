# Configure Shortcut for this repo

Interactive wizard that writes `.shortcut.json` at the repo root — per-repo defaults the `shortcut` skill applies to its recipes. Follow these steps in order; team, workflow, and state names come verbatim from the live API — never guessed. Only the workspace slug and story type come from the user.

1. **Check the CLI and token.** Run `short --help` (root help needs no token). If `short` is not on PATH, tell the user to run `npm install -g @shortcut-cli/shortcut-cli` and stop. Then run `short api /member`: exit code 11 means no token — tell the user to set `SHORTCUT_API_TOKEN` or create `~/.config/shortcut-cli/config.json` with `{"token": "..."}` and stop. Any other non-zero exit means the token was rejected or the API is unreachable — show the error output (a 401 body means the token is invalid or revoked; have the user issue a fresh one) and stop. On success, note the `mention_name` from the JSON and suggest the user export it as `SHORTCUT_MENTION_NAME` — it is personal, so it belongs in their env rather than `.shortcut.json`, and it enables `%self%` searches and silences the config warning.
2. **Fetch live options.** Run `short teams -a` and `short workflows`. These list the real team names and the workflows with their state names and ids.
3. **Ask the user** (AskUserQuestion, one question per topic, options taken verbatim from step 2's output):
    - which team is this repo's default,
    - which workflow the team uses,
    - which state new stories start in (offer that workflow's states),
    - the default story type (`feature`, `bug`, or `chore`).
4. **Determine the workspace slug.** Use `SHORTCUT_URL_SLUG` if set; otherwise ask the user (it is the `<slug>` in `https://app.shortcut.com/<slug>/...`).
5. **Write `.shortcut.json`** at the repo root, exactly this shape, and show it to the user:

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

No secrets go in this file — the token stays in env or `~/.config/shortcut-cli/config.json`. The file is meant to be committed. Personal settings (`SHORTCUT_MENTION_NAME`) stay in the user's env, not here.
