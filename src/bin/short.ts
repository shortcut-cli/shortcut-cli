#!/usr/bin/env node
import { Command } from 'commander';

import { version, description } from '../../package.json';

process.on('unhandledRejection', console.log);

const program = new Command();

program
    .version(version)
    .description(description)
    .command('install [options]', 'install and configure API access')
    .command('search [options] [SEARCH OPERATORS]', 'search stories with optional query')
    .alias('s')
    .command('find [options] [SEARCH OPERATORS]', '[DEPRECATED] search stories with optional query')
    .command('story ID [options]', 'view or manipulate stories')
    .alias('st')
    .command('create [options]', 'create a story')
    .alias('c')
    .command('members [options]', 'list members')
    .alias('m')
    .command('workflows [options]', 'list workflows and their states')
    .alias('wf')
    .command('epics [options]', 'list epics and their states')
    .alias('e')
    .command('epic [command] [options]', 'create or view an epic')
    .command('docs [options]', 'list and search docs')
    .alias('d')
    .command('doc [command] [options]', 'view, create, or update a doc')
    .command('projects [options]', 'list projects and their states')
    .alias('p')
    .command('workspace [NAME] [options]', 'list stories matching saved workspace query', {
        isDefault: true,
    })
    .alias('w')
    .command('api <path> [options]', 'make a request to the Shortcut API')
    .parse(process.argv);
