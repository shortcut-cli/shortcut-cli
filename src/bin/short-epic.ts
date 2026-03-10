#!/usr/bin/env node
import { exec } from 'child_process';
import { Command } from 'commander';
import os from 'os';

import client from '../lib/client';
import { loadConfig } from '../lib/configure';
import spinner from '../lib/spinner';
import storyLib from '../lib/stories';

import type { CreateEpic, Epic, Member, ThreadedComment, UpdateEpic } from '@shortcut/client';

interface EpicCreateOptions {
    name?: string;
    description?: string;
    state?: string;
    deadline?: string;
    plannedStart?: string;
    owners?: string;
    team?: string;
    label?: string;
    milestone?: string;
    objectives?: string;
    idonly?: boolean;
    open?: boolean;
}

interface EpicUpdateOptions {
    name?: string;
    description?: string;
    state?: string;
    deadline?: string;
    plannedStart?: string;
    owners?: string;
    team?: string;
    label?: string;
    milestone?: string;
    objectives?: string;
    archived?: boolean;
    open?: boolean;
}

interface EpicStoriesOptions {
    detailed?: boolean;
    format?: string;
}

interface EpicCommentsOptions {
    detailed?: boolean;
}

const config = loadConfig();
const spin = spinner();
const log = console.log;

const program = new Command()
    .usage('[command] [options]')
    .description('create, view, or update epics');

program
    .command('create')
    .description('create a new epic')
    .option('-n, --name [text]', 'Set name of epic, required', '')
    .option('-d, --description [text]', 'Set description of epic', '')
    .option('-s, --state [name]', 'Set state of epic (to do, in progress, done)', '')
    .option('--deadline [date]', 'Set deadline for epic (YYYY-MM-DD)', '')
    .option('--planned-start [date]', 'Set planned start date (YYYY-MM-DD)', '')
    .option('-o, --owners [id|name]', 'Set owners of epic, comma-separated', '')
    .option('-T, --team [id|name]', 'Set team of epic', '')
    .option('-l, --label [id|name]', 'Set labels of epic, comma-separated', '')
    .option('-M, --milestone [id]', 'Set milestone of epic (deprecated, use objectives)', '')
    .option('--objectives [id|name]', 'Set objectives of epic, comma-separated', '')
    .option('-I, --idonly', 'Print only ID of epic result')
    .option('-O, --open', 'Open epic in browser')
    .action(createEpic);

program
    .command('view <id>')
    .description('view an epic by id')
    .option('-O, --open', 'Open epic in browser')
    .action(viewEpic);

program
    .command('update <id>')
    .description('update an existing epic')
    .option('-n, --name [text]', 'Set name of epic', '')
    .option('-d, --description [text]', 'Set description of epic', '')
    .option('-s, --state [name]', 'Set state of epic (to do, in progress, done)', '')
    .option('--deadline [date]', 'Set deadline for epic (YYYY-MM-DD)', '')
    .option('--planned-start [date]', 'Set planned start date (YYYY-MM-DD)', '')
    .option('-o, --owners [id|name]', 'Set owners of epic, comma-separated', '')
    .option('-T, --team [id|name]', 'Set team of epic', '')
    .option('-l, --label [id|name]', 'Set labels of epic, comma-separated', '')
    .option('-M, --milestone [id]', 'Set milestone of epic (deprecated, use objectives)', '')
    .option('--objectives [id|name]', 'Set objectives of epic, comma-separated', '')
    .option('-a, --archived', 'Archive epic')
    .option('-O, --open', 'Open epic in browser')
    .action(updateEpic);

program
    .command('stories <id>')
    .description('list stories in an epic')
    .option('-d, --detailed', 'Show more details for each story')
    .option('-f, --format [template]', 'Format each story output by template', '')
    .action(listEpicStories);

program
    .command('comments <id>')
    .description('list comments on an epic')
    .option('-d, --detailed', 'Show nested replies for each comment')
    .action(listEpicComments);

program.parse(process.argv);

async function createEpic(options: EpicCreateOptions) {
    const entities = await storyLib.fetchEntities();
    if (!options.idonly) spin.start();

    const epicData: CreateEpic = {
        name: options.name ?? '',
    };

    if (options.description) {
        epicData.description = options.description;
    }

    const state = normalizeEpicState(options.state);
    if (state) {
        epicData.state = state;
    }

    if (options.deadline) {
        epicData.deadline = new Date(options.deadline).toISOString();
    }

    if (options.plannedStart) {
        epicData.planned_start_date = new Date(options.plannedStart).toISOString();
    }

    if (options.owners) {
        epicData.owner_ids = storyLib.findOwnerIds(entities, options.owners);
    }

    if (options.team) {
        const group = storyLib.findGroup(entities, options.team);
        if (group?.id) {
            epicData.group_ids = [group.id];
        }
    }

    if (options.label) {
        epicData.labels = storyLib.findLabelNames(entities, options.label);
    }

    if (options.milestone) {
        epicData.milestone_id = parseInt(options.milestone, 10);
    }

    if (options.objectives) {
        epicData.objective_ids = storyLib.findObjectiveIds(entities, options.objectives);
    }

    let epic: Epic;
    if (!epicData.name) {
        if (!options.idonly) spin.stop(true);
        log('Must provide --name');
        process.exit(1);
    } else {
        try {
            epic = await client.createEpic(epicData).then((r) => r.data);
        } catch (e: unknown) {
            if (!options.idonly) spin.stop(true);
            const error = e as { message?: string };
            log('Error creating epic:', error.message ?? String(e));
            process.exit(1);
        }
    }

    if (!options.idonly) spin.stop(true);

    if (epic) {
        if (options.idonly) {
            log(epic.id);
        } else {
            printEpic(epic);
            if (options.open) {
                openURL(`https://app.shortcut.com/${config.urlSlug}/epic/${epic.id}`);
            }
        }
    }
}

async function viewEpic(id: string, options: { open?: boolean }) {
    spin.start();
    try {
        const epic = await client.getEpic(parseInt(id, 10)).then((r) => r.data);
        spin.stop(true);
        printEpic(epic);
        if (options.open) {
            openURL(epic.app_url);
        }
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Epic #${id} not found`);
        } else {
            log('Error fetching epic:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

async function updateEpic(id: string, options: EpicUpdateOptions) {
    const entities = await storyLib.fetchEntities();
    const updateData: UpdateEpic = {};

    if (options.name) {
        updateData.name = options.name;
    }
    if (options.description) {
        updateData.description = options.description;
    }

    const state = normalizeEpicState(options.state);
    if (state) {
        updateData.state = state;
    }

    if (options.deadline) {
        updateData.deadline = new Date(options.deadline).toISOString();
    }
    if (options.plannedStart) {
        updateData.planned_start_date = new Date(options.plannedStart).toISOString();
    }
    if (options.owners) {
        updateData.owner_ids = storyLib.findOwnerIds(entities, options.owners);
    }
    if (options.team) {
        const group = storyLib.findGroup(entities, options.team);
        if (group?.id) {
            updateData.group_ids = [group.id];
        }
    }
    if (options.label) {
        updateData.labels = storyLib.findLabelNames(entities, options.label);
    }
    if (options.milestone) {
        updateData.milestone_id = parseInt(options.milestone, 10);
    }
    if (options.objectives) {
        updateData.objective_ids = storyLib.findObjectiveIds(entities, options.objectives);
    }
    if (options.archived) {
        updateData.archived = true;
    }

    if (Object.keys(updateData).length === 0) {
        log(
            'No updates provided. Use --name, --description, --state, --deadline, --planned-start, --owners, --team, --label, --milestone, --objectives, or --archived'
        );
        process.exit(1);
    }

    spin.start();
    try {
        const epic = await client.updateEpic(parseInt(id, 10), updateData).then((r) => r.data);
        spin.stop(true);
        printEpic(epic);
        if (options.open) {
            openURL(epic.app_url);
        }
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Epic #${id} not found`);
        } else {
            log('Error updating epic:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

async function listEpicStories(id: string, options: EpicStoriesOptions) {
    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const stories = await client
            .listEpicStories(parseInt(id, 10), {
                includes_description: !!options.detailed,
            })
            .then((r) => r.data);
        spin.stop(true);

        if (stories.length === 0) {
            log(`No stories found in epic #${id}`);
            return;
        }

        stories
            .map((story) => storyLib.hydrateStory(entities, story))
            .forEach(
                options.detailed
                    ? (story) => storyLib.printDetailedStory(story, entities)
                    : storyLib.printFormattedStory({ format: options.format })
            );
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Epic #${id} not found`);
        } else {
            log('Error fetching epic stories:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

async function listEpicComments(id: string, options: EpicCommentsOptions) {
    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const comments = await client.listEpicComments(parseInt(id, 10)).then((r) => r.data);
        spin.stop(true);

        if (comments.length === 0) {
            log(`No comments found on epic #${id}`);
            return;
        }

        comments.forEach((comment) =>
            printEpicComment(comment, entities.membersById, options.detailed)
        );
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Epic #${id} not found`);
        } else {
            log('Error fetching epic comments:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

function normalizeEpicState(state?: string): CreateEpic['state'] | undefined {
    if (!state) return undefined;

    const stateMap: Record<string, NonNullable<CreateEpic['state']>> = {
        todo: 'to do',
        'to do': 'to do',
        inprogress: 'in progress',
        'in progress': 'in progress',
        done: 'done',
    };
    const normalizedState = state.toLowerCase().replace(/[^a-z]/g, '');
    return stateMap[normalizedState] || stateMap[state.toLowerCase()];
}

function printEpic(epic: Epic) {
    log(`#${epic.id} ${epic.name}`);
    if (epic.description) {
        log(`Description:\t${epic.description}`);
    }
    log(`State:\t\t${epic.state}`);
    log(`Archived:\t${epic.archived ? 'yes' : 'no'}`);
    if (epic.milestone_id) {
        log(`Milestone:\t${epic.milestone_id}`);
    }
    if (epic.objective_ids && epic.objective_ids.length > 0) {
        log(`Objectives:\t${epic.objective_ids.join(', ')}`);
    }
    if (epic.deadline) {
        log(`Deadline:\t${epic.deadline}`);
    }
    if (epic.planned_start_date) {
        log(`Planned Start:\t${epic.planned_start_date}`);
    }
    if (epic.owner_ids && epic.owner_ids.length > 0) {
        log(`Owners:\t\t${epic.owner_ids.join(', ')}`);
    }
    if (epic.group_ids && epic.group_ids.length > 0) {
        log(`Teams:\t\t${epic.group_ids.join(', ')}`);
    }
    if (epic.labels && epic.labels.length > 0) {
        log(`Labels:\t\t${epic.labels.map((label) => label.name).join(', ')}`);
    }
    log(`URL:\t\t${epic.app_url}`);
}

function printEpicComment(
    comment: ThreadedComment,
    membersById?: Map<string, Member>,
    detailed?: boolean,
    depth: number = 0
) {
    const indent = '  '.repeat(depth);
    const author = membersById?.get(comment.author_id)?.profile;
    const authorName = author ? `${author.name} (${author.mention_name})` : comment.author_id;

    log(`${indent}#${comment.id} ${authorName}`);
    log(`${indent}Created: ${comment.created_at}`);
    if (comment.updated_at !== comment.created_at) {
        log(`${indent}Updated: ${comment.updated_at}`);
    }
    log(`${indent}${comment.deleted ? '[deleted]' : comment.text || '_'}`);
    log(`${indent}URL: ${comment.app_url}`);
    log();

    if (detailed) {
        comment.comments.forEach((reply) =>
            printEpicComment(reply, membersById, detailed, depth + 1)
        );
    }
}

function openURL(url: string) {
    const open = os.platform() === 'darwin' ? 'open' : 'xdg-open';
    exec(`${open} '${url}'`);
}
