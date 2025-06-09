#!/usr/bin/env node
import * as commander from 'commander';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../../package.json');

process.on('unhandledRejection', console.log);

commander
    .version(pkg.version)
    .description(pkg.description)
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
    .command('projects [options]', 'list projects and their states')
    .alias('p')
    .command('workspace [NAME] [options]', 'list stories matching saved workspace query', {
        isDefault: true,
    })
    .alias('w')
    .parse(process.argv);
