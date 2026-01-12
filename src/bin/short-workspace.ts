#!/usr/bin/env node
import { Command } from 'commander';

import configure from '../lib/configure';
import storyLib from '../lib/stories';
import type { StoryHydrated } from '../lib/stories';

import { program as searchProgram, type SearchOptions } from './short-search';

interface WorkspaceOptions {
    list?: boolean;
    quiet?: boolean;
    name?: string;
    unset?: string;
}

const config = configure.loadConfig();
const log = console.log;

const program = new Command()
    .description('List stories matching saved workspace query')
    .option('-l, --list', 'List saved workspaces')
    .option('-q, --quiet', 'Print only workspace story output, no loading dialog', '')
    .option('-n, --name [name]', 'Load named workspace', '')
    .option('-u, --unset [name]', 'Force unset saved workspace')
    .parse(process.argv);

const opts = program.opts<WorkspaceOptions>();

const toArgs = (obj: object): string =>
    Object.entries(obj)
        .map(([k, v]) => `--${k} '${v}'`)
        .join(' ');

const main = async () => {
    if (!config || !config.token) {
        log('Not installed yet.');
        log('Please run: short install');
        return;
    } else if (!config.workspaces) {
        log('No workspace saved.');
        log('Please run:');
        log('  short search [options] --save');
        log('to create your first one.');
        return;
    } else if (opts.list) {
        log('Workspaces:');
        Object.keys(config.workspaces).map((w) => {
            log(' ', w + ':', toArgs(config.workspaces[w]));
        });
        return;
    } else if (opts.unset) {
        const success = configure.removeWorkspace(opts.unset);
        if (success) {
            log('Successfully removed %s workspace', opts.unset);
        } else {
            log('Failed to remove %s workspace', opts.unset);
        }
        return;
    }
    const name: string = `${opts.name || program.args[0] || 'default'}`;
    const workspace = config.workspaces[name];
    if (!workspace) {
        log('No workspace saved with name', name);
        log('Please run:');
        log('  short search [options] --save', name);
        log('to create it.');
        return;
    }
    const found = searchProgram.parse(process.argv);
    const foundOpts = found.opts<SearchOptions>();
    // Merge workspace defaults with command-line overrides
    const additionalArgs: SearchOptions = {
        ...workspace,
        ...Object.fromEntries(Object.entries(foundOpts).filter(([, v]) => v !== undefined)),
    };
    if (!opts.quiet) {
        log('Loading %s workspace ...', name);
        log();
    }
    let stories: StoryHydrated[] = [];
    try {
        stories = await storyLib.listStories(additionalArgs);
    } catch (e) {
        log('Error fetching stories:', e);
    }
    stories.map(storyLib.printFormattedStory(additionalArgs));
};

main();
