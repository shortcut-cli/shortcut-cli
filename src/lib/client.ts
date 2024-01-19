import { ShortcutClient } from '@shortcut/client';

import { loadConfig } from './configure';

const config = loadConfig();

const client = new ShortcutClient(config.token);

export default client;
