#!/usr/bin/env node
import { execSync } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import https from 'https';

import { Command } from 'commander';
import chalk from 'chalk';
import debugging from 'debug';
import type {
    CreateStoryParams,
    History,
    Story,
    StoryComment,
    Task,
    UpdateStory,
    UploadedFile,
} from '@shortcut/client';

import client from '../lib/client';
import storyLib, { type StoryHydrated, type Entities } from '../lib/stories';
import { loadConfig } from '../lib/configure';
import spinner from '../lib/spinner';

const config = loadConfig();
const spin = spinner();
const log = console.log;
const logError = console.error;
const debug = debugging('short');

let handledSubcommand = false;

if (process.argv[2] === 'history') {
    handledSubcommand = true;
    showStoryHistory(process.argv[3]).catch((e) => {
        logError('Error fetching story history', e);
        process.exit(1);
    });
}

if (process.argv[2] === 'comments') {
    handledSubcommand = true;
    showStoryComments(process.argv[3]).catch((e) => {
        logError('Error fetching story comments', e);
        process.exit(1);
    });
}

if (process.argv[2] === 'tasks') {
    handledSubcommand = true;
    showStoryTasks(process.argv[3]).catch((e) => {
        logError('Error fetching story tasks', e);
        process.exit(1);
    });
}

if (process.argv[2] === 'sub-tasks') {
    handledSubcommand = true;
    showStorySubTasks(process.argv[3]).catch((e) => {
        logError('Error fetching story sub-tasks', e);
        process.exit(1);
    });
}

interface StoryOptions {
    archived?: boolean;
    comment?: string;
    description?: string;
    deadline?: string;
    download?: boolean;
    downloadDir?: string;
    estimate?: string;
    epic?: string;
    iteration?: string;
    format?: string;
    fromGit?: boolean;
    follower?: string;
    gitBranch?: boolean;
    gitBranchShort?: boolean;
    idonly?: boolean;
    label?: string;
    moveAfter?: string;
    moveBefore?: string;
    moveDown?: string;
    moveUp?: string;
    owners?: string;
    open?: boolean;
    openEpic?: boolean;
    openIteration?: boolean;
    openProject?: boolean;
    externalLink?: string;
    quiet?: boolean;
    requester?: string;
    state?: string;
    title?: string;
    team?: string;
    task?: string;
    taskComplete?: string;
    type?: string;
}

const program = new Command()
    .usage('[options] <id>')
    .description('Update and/or display story details')
    .option('-a, --archived', 'Update story as archived')
    .option('-c, --comment [text]', 'Add comment to story', '')
    .option('-d, --description [text]', 'Update description of story', '')
    .option('--deadline [date]', 'Update due date of story (YYYY-MM-DD)', '')
    .option('-D, --download', 'Download all attached files', '')
    .option('--download-dir [path]', 'Directory to download files to', '.')
    .option('-e, --estimate [number]', 'Update estimate of story', '')
    .option('--epic [id|name]', 'Set epic of story')
    .option('-i, --iteration [id|name]', 'Set iteration of story')
    .option('-f, --format [template]', 'Format the story output by template', '')
    .option('--from-git', 'Fetch story parsed by ID from current git branch')
    .option('--follower [id|name]', 'Update followers of story, comma-separated', '')
    .option(
        '--git-branch',
        'Checkout git branch from story slug <mention-name>/ch<id>/<type>-<title>\n' +
            '\t\t\t\tas required by the Git integration: https://bit.ly/2RKO1FF'
    )
    .option(
        '--git-branch-short',
        'Checkout git branch from story slug <mention-name>/ch<id>/<title>'
    )
    .option('-I, --idonly', 'Print only ID of story results', '')
    .option('-l, --label [id|name]', 'Stories with label id/name, by regex', '')
    .option('--move-after [id]', 'Move story to position below story ID')
    .option('--move-before [id]', 'Move story to position above story ID')
    .option('--move-down [n]', 'Move story position downward by n stories')
    .option('--move-up [n]', 'Move story position upward by n stories')
    .option('-o, --owners [id|name]', 'Update owners of story, comma-separated', '')
    .option('-O, --open', 'Open story in browser')
    .option('--oe, --open-epic', "Open story's epic in browser")
    .option('--oi, --open-iteration', "Open story's iteration in browser")
    .option('--op, --open-project', "Open story's project in browser")
    .option('--external-link [url]', 'Add external link to story, comma-separated', '')
    .option('-q, --quiet', 'Print only story output, no loading dialog', '')
    .option('--requester [id|name]', 'Update requester of story', '')
    .option('-s, --state [id|name]', 'Update workflow state of story', '')
    .option('-t, --title [text]', 'Update title/name of story', '')
    .option('-T, --team [id|name]', 'Update team/group of story', '')
    .option('--task [text]', 'Create new task on story')
    .option('--task-complete [text]', 'Toggle completion of task on story matching text')
    .option('-y, --type [name]', 'Update type of story', '')
    .parse(process.argv);

const opts = program.opts<StoryOptions>();

const main = async () => {
    if (handledSubcommand) return;
    const entities = await storyLib.fetchEntities();
    if (!(opts.idonly || opts.quiet)) spin.start();
    debug('constructing story update');
    const update: UpdateStory = {};
    if (opts.archived) {
        update.archived = true;
    }
    if (opts.state) {
        update.workflow_state_id = storyLib.findState(entities, opts.state)?.id;
    }
    if (opts.estimate) {
        update.estimate = parseInt(opts.estimate, 10);
    }
    if (opts.title) {
        update.name = opts.title;
    }
    if (opts.description) {
        update.description = `${opts.description}`;
    }
    if (opts.deadline) {
        update.deadline = normalizeDate(opts.deadline);
    }
    if (opts.type) {
        type StoryType = NonNullable<CreateStoryParams['story_type']>;
        const storyTypes = ['feature', 'bug', 'chore'] as const satisfies readonly StoryType[];
        const typeMatch = new RegExp(opts.type, 'i');
        update.story_type = storyTypes.find((t) => t.match(typeMatch));
    }
    if (opts.owners) {
        update.owner_ids = storyLib.findOwnerIds(entities, opts.owners);
    }
    if (opts.follower) {
        update.follower_ids = storyLib.findOwnerIds(entities, opts.follower);
    }
    if (opts.epic) {
        update.epic_id = storyLib.findEpic(entities, opts.epic)?.id;
    }
    if (opts.iteration) {
        update.iteration_id = storyLib.findIteration(entities, opts.iteration)?.id;
    }
    if (opts.label) {
        update.labels = storyLib.findLabelNames(entities, opts.label);
    }
    if (opts.team) {
        update.group_id = storyLib.findGroup(entities, opts.team)?.id;
    }
    if (opts.requester) {
        update.requested_by_id = storyLib.findMember(entities, opts.requester)?.id;
    }
    const hasPositionUpdate =
        opts.moveAfter !== undefined ||
        opts.moveBefore !== undefined ||
        opts.moveDown !== undefined ||
        opts.moveUp !== undefined;
    const hasUpdate = Object.keys(update).length > 0 || hasPositionUpdate || !!opts.externalLink;
    debug('constructed story update', update);
    const gitID: string[] = [];
    if (opts.fromGit || !program.args.length) {
        debug('fetching story ID from git');
        let branch = '';
        try {
            branch = execSync('git branch').toString('utf-8');
        } catch (e) {
            debug(e);
        }
        if (branch.match(/\*.*[0-9]+/)) {
            debug('parsing story ID from git branch:', branch);
            const id = parseInt(branch.match(/\*.*/)[0].match(/\/(ch|sc-)([0-9]+)/)[2], 10);
            debug('parsed story ID from git branch:', id);
            if (id) {
                gitID.push(id.toString());
            }
        } else {
            stopSpinner();
            logError('No story ID argument present or found in git branch');
            process.exit(2);
        }
    }
    const argIDs = program.args.map((a) => (a.match(/\d+/) || [])[0]);
    argIDs.concat(gitID).map(async (_id) => {
        const id = parseInt(_id, 10);
        let story: Story;
        try {
            if (opts.comment) {
                debug('request comment create');
                await client.createStoryComment(id, { text: opts.comment });
                debug('response comment create');
            }
        } catch (e) {
            stopSpinner();
            log('Error creating comment', id);
            process.exit(3);
        }
        try {
            if (opts.task) {
                debug('request task create');
                await client.createTask(id, { description: opts.task });
                debug('response task create');
            }
        } catch (e) {
            stopSpinner();
            log('Error creating task', id);
            process.exit(3);
        }
        try {
            debug('request story');
            story = await client.getStory(id).then((r) => r.data);
            debug('response story');
            if (opts.externalLink) {
                const links = opts.externalLink
                    .split(',')
                    .map((link) => link.trim())
                    .filter(Boolean);
                update.external_links = Array.from(
                    new Set([...(story.external_links || []), ...links])
                );
            }
        } catch (e) {
            stopSpinner();
            logError('Error fetching story', id);
            process.exit(4);
        }
        try {
            if (opts.taskComplete) {
                debug('calculating task(s) to complete');
                const descMatch = new RegExp(opts.taskComplete, 'i');
                const tasks = story.tasks.filter((t: Task) => t.description.match(descMatch));
                const updatedTaskIds = tasks.map((t: Task) => t.id);
                debug('request tasks complete', updatedTaskIds);
                await Promise.all(
                    tasks.map((t: Task) => client.updateTask(id, t.id, { complete: !t.complete }))
                );
                debug('response tasks complete');
                story.tasks = story.tasks.map((t: Task) => {
                    if (updatedTaskIds.indexOf(t.id) > -1) t.complete = !t.complete;
                    return t;
                });
            }
        } catch (e) {
            stopSpinner();
            log('Error updating tasks', e);
            process.exit(3);
        }
        try {
            if (hasUpdate) {
                if (hasPositionUpdate) {
                    debug('calculating move up/down');
                    const siblings: Story[] = await storyLib.listStories({
                        state: story.workflow_state_id.toString(),
                        sort: 'state.position:asc,position:asc',
                    });
                    const siblingIds = siblings.map((s) => s.id);
                    const storyIndex = siblingIds.indexOf(~~id);
                    if (opts.moveAfter) {
                        update.after_id = ~~opts.moveAfter;
                    } else if (opts.moveBefore) {
                        update.before_id = ~~opts.moveBefore;
                    } else if (opts.moveUp) {
                        update.before_id =
                            siblingIds[Math.max(0, storyIndex - (~~opts.moveUp || 1))];
                    } else if (opts.moveDown) {
                        update.after_id =
                            siblingIds[
                                Math.min(siblings.length - 1, storyIndex + (~~opts.moveDown || 1))
                            ];
                    }
                    debug('constructed story position update', update);
                }
                debug('request story update');
                const changed = await client.updateStory(id, update);
                debug('response story update');
                story = Object.assign({}, story, changed);
            }
        } catch (e) {
            stopSpinner();
            logError('Error updating story', id);
            process.exit(5);
        }
        if (story) {
            story = storyLib.hydrateStory(entities, story);
        }
        if (!opts.idonly) spin.stop(true);
        if (story) {
            printStory(story, entities);
            if (opts.open) {
                openURL(storyLib.storyURL(story));
            }
            if (opts.openEpic) {
                if (!story.epic_id) {
                    logError('This story is not part of an epic.');
                    process.exit(21);
                }
                openURL(storyLib.buildURL('epic', story.epic_id));
            }
            if (opts.openIteration) {
                if (!story.iteration_id) {
                    logError('This story is not part of an iteration.');
                    process.exit(22);
                }
                openURL(storyLib.buildURL('iteration', story.iteration_id));
            }
            if (opts.openProject) {
                openURL(storyLib.buildURL('project', story.project_id));
            }
        }
        if (opts.download) {
            downloadFiles(story);
        }
        if (story && opts.gitBranch) {
            if (!config.mentionName) {
                stopSpinner();
                storyLib.checkoutStoryBranch(story, `${story.story_type}-${story.id}-`); // TODO: Remove this deprecation in next release
                logError('Error creating story branch in Shortcut format');
                logError(
                    'Please run: "short install --force" to add your mention name to the config.'
                );
                process.exit(10);
            }
            storyLib.checkoutStoryBranch(story);
        } else if (story && opts.gitBranchShort) {
            storyLib.checkoutStoryBranch(story, `${config.mentionName}/sc-${story.id}/`);
        }
    });
    stopSpinner();
};

async function showStoryHistory(idArg?: string) {
    const id = parseInt(idArg || '', 10);
    if (!id) {
        logError('Usage: short story history <id>');
        process.exit(2);
    }

    spin.start();
    try {
        const history = await client.storyHistory(id).then((r) => r.data);
        spin.stop(true);

        if (history.length === 0) {
            log(`No history found for story #${id}`);
            process.exit(0);
        }

        history.forEach(printHistoryItem);
        process.exit(0);
    } catch (e) {
        spin.stop(true);
        logError(`Error fetching story history ${id}`);
        process.exit(4);
    }
}

async function showStoryComments(idArg?: string) {
    const id = parseInt(idArg || '', 10);
    if (!id) {
        logError('Usage: short story comments <id>');
        process.exit(2);
    }

    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const story = await client.getStory(id).then((r) => r.data);
        spin.stop(true);

        if (!story.comments.length) {
            log(`No comments found for story #${id}`);
            process.exit(0);
        }

        printStoryComments(story.comments, entities);
        process.exit(0);
    } catch (e) {
        spin.stop(true);
        logError(`Error fetching story comments ${id}`);
        process.exit(4);
    }
}

async function showStoryTasks(idArg?: string) {
    const id = parseInt(idArg || '', 10);
    if (!id) {
        logError('Usage: short story tasks <id>');
        process.exit(2);
    }

    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const story = await client.getStory(id).then((r) => r.data);
        spin.stop(true);

        if (!story.tasks.length) {
            log(`No tasks found for story #${id}`);
            process.exit(0);
        }

        printStoryTasks(story.tasks, entities);
        process.exit(0);
    } catch (e) {
        spin.stop(true);
        logError(`Error fetching story tasks ${id}`);
        process.exit(4);
    }
}

async function showStorySubTasks(idArg?: string) {
    const id = parseInt(idArg || '', 10);
    if (!id) {
        logError('Usage: short story sub-tasks <id>');
        process.exit(2);
    }

    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const stories = await client.listStorySubTasks(id).then((r) => r.data);
        spin.stop(true);

        if (!stories.length) {
            log(`No sub-tasks found for story #${id}`);
            process.exit(0);
        }

        stories
            .map((story) => storyLib.hydrateStory(entities, story))
            .forEach(storyLib.printFormattedStory({}));
        process.exit(0);
    } catch (e) {
        spin.stop(true);
        logError(`Error fetching story sub-tasks ${id}`);
        process.exit(4);
    }
}

const openURL = (url: string) => {
    const open = os.platform() === 'darwin' ? 'open' : 'xdg-open';
    execSync(`${open} '${url}'`);
};

const stopSpinner = () => {
    if (!(opts.idonly || opts.quiet)) spin.stop(true);
};

const downloadFiles = (story: Story) =>
    story.files.map((file: UploadedFile) => {
        https.get(storyLib.fileURL(file), (res) => {
            const filePath = path.join(opts.downloadDir ?? '.', file.name);
            log(chalk.bold('Downloading file to: ') + filePath);
            const stream = fs.createWriteStream(filePath);
            res.pipe(stream);
            stream.on('finish', () => stream.close());
        });
    });

const printStory = (story: StoryHydrated, entities: Entities) => {
    if (opts.idonly) {
        return log(story.id);
    }
    if (opts.format) {
        return storyLib.printFormattedStory(opts)(story);
    }
    storyLib.printDetailedStory(story, entities);
};

const printHistoryItem = (item: History) => {
    const actor = item.actor_name || item.member_id || 'Unknown';
    log(chalk.blue.bold(`${item.changed_at}`) + ` ${actor}`);
    item.actions.forEach((action) => {
        log(`- ${summarizeHistoryAction(action as unknown as Record<string, unknown>)}`);
    });
    log();
};

const printStoryComments = (comments: StoryComment[], entities: Entities) => {
    const repliesByParent = new Map<number, StoryComment[]>();
    const roots: StoryComment[] = [];

    comments.forEach((comment) => {
        if (comment.parent_id) {
            const replies = repliesByParent.get(comment.parent_id) || [];
            replies.push(comment);
            repliesByParent.set(comment.parent_id, replies);
        } else {
            roots.push(comment);
        }
    });

    roots
        .sort((a, b) => a.position - b.position)
        .forEach((comment) => printStoryComment(comment, entities, repliesByParent, 0));
};

const printStoryComment = (
    comment: StoryComment,
    entities: Entities,
    repliesByParent: Map<number, StoryComment[]>,
    depth: number
) => {
    const indent = '  '.repeat(depth);
    const author = comment.author_id
        ? entities.membersById?.get(comment.author_id)?.profile
        : undefined;
    const authorText = author
        ? `${author.name} (${author.mention_name})`
        : comment.author_id || 'Unknown';

    log(`${indent}${chalk.bold('#' + comment.id)} ${authorText}`);
    log(`${indent}Created: ${comment.created_at}`);
    if (comment.updated_at && comment.updated_at !== comment.created_at) {
        log(`${indent}Updated: ${comment.updated_at}`);
    }
    if (comment.blocker) {
        log(`${indent}Blocker: true`);
    }
    log(`${indent}${comment.deleted ? '[deleted]' : comment.text || '_'}`);
    log(`${indent}URL: ${comment.app_url}`);
    log();

    const replies = (repliesByParent.get(comment.id) || []).sort((a, b) => a.position - b.position);
    replies.forEach((reply) => printStoryComment(reply, entities, repliesByParent, depth + 1));
};

const printStoryTasks = (tasks: Task[], entities: Entities) => {
    tasks
        .slice()
        .sort((a, b) => a.position - b.position)
        .forEach((task) => printStoryTask(task, entities));
};

const printStoryTask = (task: Task, entities: Entities) => {
    const status = task.complete ? '[x]' : '[ ]';
    const owners = task.owner_ids
        .map((ownerId) => entities.membersById?.get(ownerId)?.profile?.mention_name || ownerId)
        .join(', ');

    log(`${chalk.bold('#' + task.id)} ${status} ${task.description}`);
    if (owners) {
        log(`Owners: ${owners}`);
    }
    if (task.completed_at) {
        log(`Completed: ${task.completed_at}`);
    }
    if (task.updated_at) {
        log(`Updated: ${task.updated_at}`);
    }
    log();
};

const summarizeHistoryAction = (action: Record<string, unknown>): string => {
    const entityType = String(action.entity_type || 'item');
    const actionType = String(action.action || 'changed');
    const name = typeof action.name === 'string' ? action.name : undefined;
    const description = typeof action.description === 'string' ? action.description : undefined;

    if (actionType === 'update' && action.changes && typeof action.changes === 'object') {
        const fields = Object.keys(action.changes as Record<string, unknown>);
        if (fields.length > 0) {
            return `updated ${entityType} ${name ? `"${name}" ` : ''}(fields: ${fields.join(', ')})`;
        }
    }

    if (name) {
        return `${actionType} ${entityType} "${name}"`;
    }
    if (description) {
        return `${actionType} ${entityType} "${description}"`;
    }
    return `${actionType} ${entityType}`;
};

const normalizeDate = (value: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00.000Z`).toISOString();
    }
    return new Date(value).toISOString();
};

main();
