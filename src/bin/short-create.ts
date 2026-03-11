#!/usr/bin/env node
import { exec } from 'child_process';
import { Command, Option } from 'commander';

import client from '../lib/client';
import { loadConfig } from '../lib/configure';
import spinner from '../lib/spinner';
import storyLib from '../lib/stories';

import type { CreateStoryParams, Story } from '@shortcut/client';

type StoryType = NonNullable<CreateStoryParams['story_type']>;

interface CreateOptions {
    description?: string;
    estimate?: string;
    epic?: string;
    gitBranch?: boolean;
    gitBranchShort?: boolean;
    iteration?: string;
    idonly?: boolean;
    label?: string;
    owners?: string;
    open?: boolean;
    project?: string;
    team?: string;
    title?: string;
    state?: string;
    type?: StoryType;
}

const config = loadConfig();
const spin = spinner();
const log = console.log;
const program = new Command()
    .usage('[options]')
    .description('create a story with provided details')
    .option('-d, --description [text]', 'Set description of story', '')
    .option('-e, --estimate [number]', 'Set estimate of story')
    .option('--epic [id|name]', 'Set epic of story')
    .option(
        '--git-branch',
        'Checkout git branch from story slug <mention-name>/ch<id>/<type>-<title>\n' +
            '\t\t\t\tas required by the Git integration: https://bit.ly/2RKO1FF'
    )
    .option(
        '--git-branch-short',
        'Checkout git branch from story slug <mention-name>/ch<id>/<title>'
    )
    .option('-i, --iteration [id|name]', 'Set iteration of story')
    .option('-I, --idonly', 'Print only ID of story result')
    .option('-l, --label [id|name]', 'Stories with label id/name, by regex', '')
    .option('-o, --owners [id|name]', 'Set owners of story, comma-separated', '')
    .option('-O, --open', 'Open story in browser')
    .option('-p, --project [id|name]', 'Set project of story, required if --state is not set', '')
    .option('-T, --team [id|name]', 'Set team of story', '')
    .option('-t, --title [text]', 'Set title of story, required', '')
    .option(
        '-s, --state [id|name]',
        'Set workflow state of story, required if --project is not set',
        ''
    )
    .addOption(
        new Option('-y, --type <name>', 'Set type of story')
            .choices(['feature', 'bug', 'chore'] as const satisfies readonly StoryType[])
            .default('feature' satisfies StoryType)
    )
    .parse(process.argv);

const opts = program.opts<CreateOptions>();

const main = async () => {
    const entities = await storyLib.fetchEntities();
    if (!opts.idonly) spin.start();
    const project = opts.project ? storyLib.findProject(entities, opts.project) : undefined;
    const group = opts.team ? storyLib.findGroup(entities, opts.team) : undefined;
    const state = opts.state ? storyLib.findState(entities, opts.state) : undefined;
    const epic = opts.epic ? storyLib.findEpic(entities, opts.epic) : undefined;
    const iteration = opts.iteration ? storyLib.findIteration(entities, opts.iteration) : undefined;

    const update: CreateStoryParams = {
        name: opts.title ?? '',
        story_type: opts.type,
        description: `${opts.description}`,
    };
    if (project) {
        update.project_id = project.id;
    }
    if (group) {
        update.group_id = group.id;
    }
    if (state) {
        update.workflow_state_id = state.id;
    }
    if (epic) {
        update.epic_id = epic.id;
    }
    if (iteration) {
        update.iteration_id = iteration.id;
    }
    if (opts.estimate) {
        update.estimate = parseInt(opts.estimate, 10);
    }
    if (opts.owners) {
        update.owner_ids = storyLib.findOwnerIds(entities, opts.owners);
    }
    if (opts.label) {
        update.labels = storyLib.findLabelNames(entities, opts.label);
    }
    let story: Story | undefined;
    if (!update.name) {
        if (!opts.idonly) spin.stop(true);
        log('Must provide --title');
    } else if (opts.project && !project) {
        if (!opts.idonly) spin.stop(true);
        log(`Project ${opts.project} not found`);
    } else if (opts.state && !state) {
        if (!opts.idonly) spin.stop(true);
        log(`State ${opts.state} not found`);
    } else if (opts.team && !group) {
        if (!opts.idonly) spin.stop(true);
        log(`Team ${opts.team} not found`);
    } else if (opts.epic && !epic) {
        if (!opts.idonly) spin.stop(true);
        log(`Epic ${opts.epic} not found`);
    } else if (opts.iteration && !iteration) {
        if (!opts.idonly) spin.stop(true);
        log(`Iteration ${opts.iteration} not found`);
    } else if (!update.project_id && !update.workflow_state_id) {
        if (!opts.idonly) spin.stop(true);
        log('Must provide --project or --state');
    } else {
        try {
            story = await client.createStory(update).then((r) => r.data);
        } catch (_e) {
            log('Error creating story');
        }
    }
    if (!opts.idonly) spin.stop(true);
    if (story) {
        const hydrateStory = storyLib.hydrateStory(entities, story);
        storyLib.printDetailedStory(hydrateStory);
        if (opts.gitBranch) {
            storyLib.checkoutStoryBranch(hydrateStory);
        } else if (opts.gitBranchShort) {
            storyLib.checkoutStoryBranch(hydrateStory, `${config.mentionName}/sc-${story.id}/`);
        }
        if (opts.open) {
            exec('open ' + storyLib.storyURL(story));
        }
    }
};

main();
