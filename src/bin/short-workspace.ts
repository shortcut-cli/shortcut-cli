#!/usr/bin/env node
import configure from '../lib/configure';
import * as commander from 'commander';
import storyLib from '../lib/stories';

import { program as searchProgram } from './short-search';
import { StoryHydrated } from '../lib/stories';

const config = configure.loadConfig();
const log = console.log;

const program = commander
    .description('List stories matching saved workspace query')
    .option('-l, --list', 'List saved workspaces')
    .option('-q, --quiet', 'Print only workspace story output, no loading dialog', '')
    .option('-n, --name [name]', 'Load named workspace', '')
    .option('-u, --unset [name]', 'Force unset saved workspace')
    .parse(process.argv);

const main = async () => {
    if (!config || !config.token) {
        log('Not installed yet.');
        log('Please run: short install');
        return;
    } else if (!config.workspaces) {
        log('No workspace saved.');
        log('Please run:');
        log('  club search [options] --save');
        log('to create your first one.');
        return;
    } else if (program.list) {
        log('Workspaces:');
        Object.keys(config.workspaces).map((w) => {
            log(' ', w + ':', toArgs(config.workspaces[w]));
        });
        return;
    } else if (program.unset) {
        const success = configure.removeWorkspace(program.unset);
        if (success) {
            log('Successfully removed %s workspace', program.unset);
        } else {
            log('Failed to remove %s workspace', program.unset);
        }
        return;
    }
    const name: string = `${program.name || program.args[0] || 'default'}`;
    const workspace = config.workspaces[name];
    if (!workspace) {
        log('No workspace saved with name', name);
        log('Please run:');
        log('  club search [options] --save', name);
        log('to create it.');
        return;
    }
    const found = searchProgram.parse(process.argv);
    const findOpts = found.options.map((o: any) => o.name());
    const additionalArgs = findOpts.reduce((acc: any, val: any) => {
        acc[val] = found[val] || acc[val] || found[val];
        return acc;
    }, workspace);
    if (!program.quiet) {
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

const toArgs = (obj: any) =>
    Object.keys(obj)
        .map((k) => `--${k} '${obj[k]}'`)
        .join(' ');
