#!/usr/bin/env node

import { ShortcutClient } from '@shortcut/client';
import { Command } from 'commander';
import { createInterface } from 'readline/promises';
import { Writable } from 'stream';

import { version } from '../../package.json';
import { type Config, loadCachedConfig, updateConfig } from '../lib/configure';

const extant = loadCachedConfig();
const log = console.log;
const TOKEN_PROMPT =
    'Enter your Shortcut API token. You can get one at https://app.shortcut.com/settings/account/api-tokens\nAPI token: ';

const program = new Command()
    .version(version)
    .description('Install access token and other settings for the Shortcut API')
    .option('-f, --force', 'Force install/reinstall')
    .option('-r, --refresh', 'Refresh the configuration with details from Shortcut.')
    .option('-t, --token <token>', 'Shortcut API token to save without prompting')
    .parse(process.argv);

const opts = program.opts<{ force?: boolean; refresh?: boolean; token?: string }>();

const enrichConfigWithMemberDetails = async (config: Config) => {
    log('Fetching user/member details from Shortcut...');
    const clientConfig: Record<string, unknown> = {};
    if (process.env.SHORTCUT_API_BASE_URL) {
        clientConfig.baseURL = process.env.SHORTCUT_API_BASE_URL;
    }
    const member = await new ShortcutClient(config.token ?? '', clientConfig)
        .getCurrentMemberInfo()
        .then((r) => r.data);
    return {
        ...config,
        mentionName: member.mention_name,
        urlSlug: member.workspace2.url_slug,
    };
};

class MaskedWritable extends Writable {
    muted = false;

    override _write(
        chunk: Buffer | string,
        encoding: BufferEncoding,
        callback: (error?: Error | null) => void
    ) {
        const text = typeof chunk === 'string' ? chunk : chunk.toString();

        if (!this.muted) {
            process.stdout.write(text);
            callback();
            return;
        }

        if (text.includes('\n')) {
            process.stdout.write('\n');
        }

        callback();
    }
}

const promptForToken = async () => {
    const output = new MaskedWritable();
    const rl = createInterface({
        input: process.stdin,
        output,
        terminal: true,
    });

    try {
        process.stdout.write(TOKEN_PROMPT);
        output.muted = true;
        const token = (await rl.question('')).trim();
        output.muted = false;
        process.stdout.write('\n');
        return token;
    } catch (error) {
        output.muted = false;
        process.stdout.write('\n');

        if (error instanceof Error && 'code' in error && error.code === 'ABORT_ERR') {
            process.exit(130);
        }

        throw error;
    } finally {
        rl.close();
    }
};

const resolveToken = async () => {
    if (opts.token) {
        return opts.token.trim();
    }

    if (!process.stdin.isTTY || !process.stdout.isTTY) {
        console.error('No API token provided. Pass --token when running non-interactively.');
        process.exit(1);
    }

    return promptForToken();
};

const main = async () => {
    if (opts.refresh) {
        updateConfig(await enrichConfigWithMemberDetails(extant));
    } else if (!extant.token || opts.force) {
        const token = await resolveToken();
        if (!token) {
            console.error('No API token provided.');
            process.exit(1);
        }

        const config = await enrichConfigWithMemberDetails({ ...extant, token });
        log('Saving config...');
        const success = updateConfig(config);
        if (success) {
            log('Saved config');
        } else {
            log('Error saving config');
        }
    } else if (extant.token) {
        log('A configuration/token is already saved. To override, re-run with --force');
    }
};

main();
