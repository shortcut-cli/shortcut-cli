import { ShortcutClient } from '@shortcut/client';

import { loadConfig } from './configure';

const config = loadConfig();

const clientConfig: Record<string, unknown> = {};
if (process.env.SHORTCUT_API_BASE_URL) {
    clientConfig.baseURL = process.env.SHORTCUT_API_BASE_URL;
}

const client = new ShortcutClient(config.token, clientConfig);

export default client;
