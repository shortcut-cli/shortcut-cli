#!/usr/bin/env node
import { Command } from 'commander';

import spinner from '../lib/spinner';
import configure from '../lib/configure';
import storyLib, { type StoryHydrated } from '../lib/stories';

const spin = spinner('Finding... %s ');
const log = console.log;

export interface SearchOptions {
    archived?: boolean;
    created?: string;
    quiet?: boolean;
    label?: string;
    owner?: string;
    project?: string;
    state?: string;
    epic?: string;
    iteration?: string;
    save?: string | boolean;
    text?: string;
    estimate?: string;
    updated?: string;
    type?: string;
    sort?: string;
    format?: string;
}

export const program = new Command()
    .description(
        `Search through Shortcut stories. Arguments (non-flag/options) will be
  passed to Shortcut story search API as search operators. Passing '%self%' as
  a search operator argument will be replaced by your mention name. Note that
  passing search operators and options (e.g. --owner foobar) will use the
  options as extra filtering in the client.

  Refer to https://help.shortcut.com/hc/en-us/articles/360000046646-Search-Operators
  for more details about search operators.`
    )
    .usage('[options] [SEARCH OPERATORS]')
    .option('-a, --archived', 'Include archived Stories')
    .option(
        '-c, --created [operator][date]',
        'Stories created within criteria (operator is one of <|>|=)',
        ''
    )
    .option('-q, --quiet', 'Print only story output, no loading dialog', '')
    .option('-l, --label [id|name]', 'Stories with label id/name, by regex', '')
    .option('-o, --owner [name]', 'Stories with owner, by regex', '')
    .option('-p, --project [id]', 'Stories in project', '')
    .option('-s, --state [id|name]', 'Stories in workflow state id/name, by regex', '')
    .option('--epic [id|name]', 'Stories in epic id/name, by regex', '')
    .option('-i, --iteration [id|name]', 'Stories in iteration id/name, by regex', '')
    .option('-S, --save [name]', 'Save search configuration as workspace')
    .option('-t, --text [name]', 'Stories with text in name, by regex', '')
    .option(
        '-e, --estimate [operator][number]',
        'Stories estimated within criteria (operator is one of <|>|=)',
        ''
    )
    .option(
        '-u, --updated [operator][date]',
        'Stories updated within criteria (operator is one of <|>|=)',
        ''
    )
    .option('-y, --type [name]', 'Stories of type, by regex', '')
    .option(
        '-r, --sort [field]',
        'Sort stories by field (accessor[:asc|desc][,next])',
        'state.position:asc,position:asc'
    )
    .option('-f, --format [template]', 'Format each story output by template', '');

const getWorkspaceOptions = (opts: SearchOptions) => {
    const blacklistedKeys = ['save'];
    return Object.entries(opts)
        .filter(([key]) => !blacklistedKeys.includes(key))
        .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {});
};

export const main = async () => {
    program.parse(process.argv);
    const opts = program.opts<SearchOptions>();
    if (!opts.quiet) {
        if (!program.args.length) {
            log('Fetching all stories for search since no search operators were passed ...');
        }
        spin.start();
    }
    let stories: StoryHydrated[] = [];
    try {
        stories = await storyLib.listStories({ ...opts, args: program.args });
    } catch (e) {
        log('Error fetching stories:', e);
    }
    if (!opts.quiet) spin.stop(true);

    stories.map(storyLib.printFormattedStory(opts));

    if (!opts.save) {
        return;
    }

    const name = opts.save === true ? 'default' : opts.save;
    if (configure.saveWorkspace(name, getWorkspaceOptions(opts))) {
        log('Saved query as %s workspace', name);
    }
};

// We previously used `require.main === module` to check if this file was run directly,
// but now we check if the script name includes 'short-search' to ensure it runs only when intended,
// because our bundle doesn't support `require.main` in the same way.
if (process.argv[1]?.includes('short-search')) {
    main();
}
