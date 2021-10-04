#!/usr/bin/env node
import spinner from '../lib/spinner';
import * as commander from 'commander';

import configure from '../lib/configure';
import storyLib, { StoryHydrated } from '../lib/stories';

const spin = spinner('Finding... %s ');
const log = console.log;

export const program = commander
    .description(
        `Search through clubhouse stories. Arguments (non-flag/options) will be
  passed to Shortcut story search API as search operators. Passing '%self%' as
  a search operator argument will be replaced by your mention name. Note that
  passing search operators and options (e.g. --owner foobar) will use the
  options as extra filtering in the client.

  Refer to https://help.clubhouse.io/hc/en-us/articles/360000046646-Search-Operators
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

const getWorkspaceOptions = (program: any) => {
    const blacklistedKeys = ['Command', 'commands', 'Option', 'options', 'rawArgs', 'save'];
    return Object.entries(program)
        .filter(([key]) => !(blacklistedKeys.includes(key) || key.startsWith('_')))
        .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {});
};

export const main = async () => {
    program.parse(process.argv);
    if (!program.quiet) {
        if (!program.args.length) {
            log('Fetching all stories for search since no search operators were passed ...');
        }
        spin.start();
    }
    let stories: StoryHydrated[] = [];
    try {
        stories = await storyLib.listStories(program);
    } catch (e) {
        log('Error fetching stories:', e);
    }
    if (!program.quiet) spin.stop(true);

    stories.map(storyLib.printFormattedStory(program));

    if (!program.save) {
        return;
    }

    const name = program.save === true ? 'default' : program.save;
    if (configure.saveWorkspace(name, getWorkspaceOptions(program))) {
        log('Saved query as %s workspace', name);
    }
};

if (require.main === module) {
    main();
}
