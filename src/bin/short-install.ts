#!/usr/bin/env node

import prompt from 'prompt';
import { Command } from 'commander';
import { ShortcutClient } from '@shortcut/client';

import { type Config, loadCachedConfig, updateConfig } from '../lib/configure';
import { version } from '../../package.json';

const extant = loadCachedConfig();
const log = console.log;

const program = new Command()
    .version(version)
    .description('Install access token and other settings for the Shortcut API')
    .option('-f, --force', 'Force install/reinstall')
    .option('-r, --refresh', 'Refresh the configuration with details from Shortcut.')
    .parse(process.argv);

const opts = program.opts<{ force?: boolean; refresh?: boolean }>();

const enrichConfigWithMemberDetails = async (config: Config) => {
    log('Fetching user/member details from Shortcut...');
    const member = await new ShortcutClient(config.token)
        .getCurrentMemberInfo()
        .then((r) => r.data);
    return {
        mentionName: member.mention_name,
        urlSlug: member.workspace2.url_slug,
        ...config,
    };
};

const main = async () => {
    if (opts.refresh) {
        updateConfig(await enrichConfigWithMemberDetails(extant));
    } else if (!extant.token || opts.force) {
        const schema = {
            properties: {
                token: {
                    message:
                        'API Token -> https://app.shortcut.com/xxxx/settings/account/api-tokens',
                    required: true,
                },
            },
        };
        prompt.start({ message: 'Shortcut' });
        prompt.get(schema, async (err: Error | null, result: { token: string }) => {
            if (err) return log(err);
            const config = await enrichConfigWithMemberDetails(result);
            log('Saving config...');
            const success = updateConfig(config);
            if (success) {
                log('Saved config');
            } else {
                log('Error saving config');
            }
        });
    } else if (extant.token) {
        log('A configuration/token is already saved. To override, re-run with --force');
    }
};

main();
