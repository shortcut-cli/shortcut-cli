#!/usr/bin/env node

// @ts-ignore
import * as prompt from 'prompt';

import configure from '../lib/configure';

const extant = configure.loadConfig();
const log = console.log;

import * as commander from 'commander';
const program = commander
    .version(require('../../package').version)
    .description('Install access token and other settings for the Clubhouse API')
    .option('-f, --force', 'Force install/reinstall')
    .parse(process.argv);

if (!extant || program.force) {
    const schema = {
        properties: {
            mentionName: {
                message: 'Mention Name -> https://app.clubhouse.io/xxxx/settings/account/',
                required: true,
            },
            token: {
                message: 'API Token -> https://app.clubhouse.io/xxxx/settings/account/api-tokens',
                required: true,
            },
        },
    };
    prompt.start({ message: 'clubhouse' });
    prompt.get(schema, (err: Error, result: any) => {
        if (err) return log(err);
        log('Saving config...');
        const success = configure.updateConfig(result);
        if (success) {
            log('Saved config');
        } else {
            log('Error saving config');
        }
    });
} else if (extant) {
    log('A configuration/token is already saved. To override, re-run with --force');
}
