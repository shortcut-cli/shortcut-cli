/**
 * Vitest Per-File Setup
 *
 * Sets environment variables so that the CLI modules can import without
 * crashing (they expect an API token to be configured).
 * Points the ShortcutClient at the Prism mock server.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

// Isolate tests from the real user config (~/.config/shortcut-cli/config.json).
// Without this, loadConfig() reads the developer's actual config file and ignores
// the SHORTCUT_URL_SLUG env var (env vars are only used as fallbacks).
const tmpConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shortcut-cli-test-'));
process.env.XDG_CONFIG_HOME = tmpConfigDir;

// Provide a fake token so `loadConfig()` in client.ts doesn't call process.exit
process.env.SHORTCUT_API_TOKEN = 'test-token-for-prism-mock';
process.env.SHORTCUT_URL_SLUG = 'test-workspace';
process.env.SHORTCUT_MENTION_NAME = 'test-user';

// Point the ShortcutClient at the Prism mock server
process.env.SHORTCUT_API_BASE_URL = 'http://127.0.0.1:4010';
