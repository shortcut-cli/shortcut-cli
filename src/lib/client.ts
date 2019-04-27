import * as Clubhouse from 'clubhouse-lib';

import { loadConfig } from './configure';

const config = loadConfig();

if (!config) {
    console.error('Please run install to configure API access');
    process.exit(1);
}

const client = Clubhouse.create(config.token);

export default client;
