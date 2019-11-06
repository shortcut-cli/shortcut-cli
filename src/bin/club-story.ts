#!/usr/bin/env node
import { execSync } from 'child_process';
import * as commander from 'commander';

import fetch from 'node-fetch';
import * as path from 'path';
import * as fs from 'fs';
import chalk from 'chalk';
import { loadConfig } from '../lib/configure';

import debugging from 'debug';
import client from '../lib/client';
import storyLib, { StoryHydrated, Entities } from '../lib/stories';
import {
    Epic,
    File,
    Iteration,
    Story,
    StoryChange,
    Task,
    WorkflowState,
    StoryType,
} from 'clubhouse-lib';
import spinner from '../lib/spinner';

const config = loadConfig();
const spin = spinner();
const log = console.log;
const logError = console.error;
const debug = debugging('club');

const program = commander
    .usage('[options] <id>')
    .description('Update and/or display story details')
    .option('-a, --archived', 'Update story as archived')
    .option('-c, --comment [text]', 'Add comment to story', '')
    .option('-d, --description [text]', 'Update description of story', '')
    .option('-D, --download', 'Download all attached files', '')
    .option('--download-dir [path]', 'Directory to download files to', '.')
    .option('-e, --estimate [number]', 'Update estimate of story', '')
    .option('--epic [id|name]', 'Set epic of story')
    .option('-i, --iteration [id|name]', 'Set iteration of story')
    .option('-f, --format [template]', 'Format the story output by template', '')
    .option('--from-git', 'Fetch story parsed by ID from current git branch')
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
    .option('-q, --quiet', 'Print only story output, no loading dialog', '')
    .option('-s, --state [id|name]', 'Update workflow state of story', '')
    .option('-t, --title [text]', 'Update title/name of story', '')
    .option('--task [text]', 'Create new task on story')
    .option('--task-complete [text]', 'Toggle completion of task on story matching text')
    .option('-y, --type [name]', 'Update type of story', '')
    .parse(process.argv);

const main = async () => {
    const entities = await storyLib.fetchEntities();
    if (!(program.idonly || program.quiet)) spin.start();
    debug('constructing story update');
    let update = {} as StoryChange;
    if (program.archived) {
        update.archived = true;
    }
    if (program.state) {
        update.workflow_state_id = (
            storyLib.findState(entities, program.state) || ({} as WorkflowState)
        ).id;
    }
    if (program.estimate) {
        update.estimate = parseInt(program.estimate, 10);
    }
    if (program.title) {
        update.name = program.title;
    }
    if (program.description) {
        update.description = `${program.description}`;
    }
    if (program.type) {
        const typeMatch = new RegExp(program.type, 'i');
        update.story_type = ['feature', 'bug', 'chore'].filter(t => {
            return !!t.match(typeMatch);
        })[0] as StoryType;
    }
    if (program.owners) {
        update.owner_ids = storyLib.findOwnerIds(entities, program.owners);
    }
    if (program.epic) {
        update.epic_id = (storyLib.findEpic(entities, program.epic) || ({} as Epic)).id;
    }
    if (program.iteration) {
        update.iteration_id = (
            storyLib.findIteration(entities, program.iteration) || ({} as Iteration)
        ).id;
    }
    if (program.label) {
        update.labels = storyLib.findLabelNames(entities, program.label);
    }
    const hasPositionUpdate =
        program.moveAfter !== undefined ||
        program.moveBefore !== undefined ||
        program.moveDown !== undefined ||
        program.moveUp !== undefined;
    const hasUpdate = Object.keys(update).length > 0 || hasPositionUpdate;
    debug('constructed story update', update);
    let gitID: string[] = [];
    if (program.fromGit || !program.args.length) {
        debug('fetching story ID from git');
        var branch = '';
        try {
            branch = execSync('git branch').toString('utf-8');
        } catch (e) {
            debug(e);
        }
        if (branch.match(/\*.*[0-9]+/)) {
            debug('parsing story ID from git branch:', branch);
            let id = parseInt(branch.match(/\*.*/)[0].match(/[0-9]+/)[0], 10);
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
    let argIDs = program.args.map(a => (a.match(/\d+/) || [])[0]);
    argIDs.concat(gitID).map(async id => {
        let story;
        try {
            if (program.comment) {
                debug('request comment create');
                await client.createStoryComment(id, program.comment);
                debug('response comment create');
            }
        } catch (e) {
            stopSpinner();
            log('Error creating comment', id);
            process.exit(3);
        }
        try {
            if (program.task) {
                debug('request task create');
                await client.createTask(id, { description: program.task });
                debug('response task create');
            }
        } catch (e) {
            stopSpinner();
            log('Error creating task', id);
            process.exit(3);
        }
        try {
            debug('request story');
            story = await client.getStory(id);
            debug('response story');
        } catch (e) {
            stopSpinner();
            logError('Error fetching story', id);
            process.exit(4);
        }
        try {
            if (program.taskComplete) {
                debug('calculating task(s) to complete');
                const descMatch = new RegExp(program.taskComplete, 'i');
                let tasks = story.tasks.filter((t: Task) => t.description.match(descMatch));
                let updatedTaskIds = tasks.map((t: Task) => t.id);
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
                    let siblings: Story[] = await storyLib.listStories({
                        state: story.workflow_state_id.toString(),
                        sort: 'state.position:asc,position:asc',
                    });
                    let siblingIds = siblings.map(s => s.id);
                    let storyIndex = siblingIds.indexOf(~~id);
                    if (program.moveAfter) {
                        update.after_id = ~~program.moveAfter;
                    } else if (program.moveBefore) {
                        update.before_id = ~~program.moveBefore;
                    } else if (program.moveUp) {
                        update.before_id =
                            siblingIds[Math.max(0, storyIndex - (~~program.moveUp || 1))];
                    } else if (program.moveDown) {
                        update.after_id =
                            siblingIds[
                                Math.min(
                                    siblings.length - 1,
                                    storyIndex + (~~program.moveDown || 1)
                                )
                            ];
                    }
                    debug('constructed story position update', update);
                }
                debug('request story update');
                let changed = await client.updateStory(id, update);
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
        if (!program.idonly) spin.stop(true);
        if (story) {
            printStory(story, entities);
            if (program.open) execSync('open ' + storyLib.storyURL(story));
        }
        if (program.download) {
            downloadFiles(story);
        }
        if (story && program.gitBranch) {
            if (!config.mentionName) {
                stopSpinner();
                storyLib.checkoutStoryBranch(story, `${story.story_type}-${story.id}-`); // TODO: Remove this deprecation in next release
                logError('Error creating story branch in Clubhouse format');
                logError(
                    'Please run: "club install --force" to add your mention name to the config.'
                );
                process.exit(10);
            }
            storyLib.checkoutStoryBranch(story);
        } else if (story && program.gitBranchShort) {
            storyLib.checkoutStoryBranch(story, `${config.mentionName}/ch${story.id}/`);
        }
    });
    stopSpinner();
};

const stopSpinner = () => {
    if (!(program.idonly || program.quiet)) spin.stop(true);
};

const downloadFiles = (story: Story) => {
    story.files.map((file: File) => {
        const filePath = path.join(program.downloadDir, file.name);
        log(chalk.bold('Downloading file to: ') + filePath);
        return fetch(storyLib.fileURL(file)).then(res =>
            res.body.pipe(fs.createWriteStream(filePath))
        );
    });
};

const printStory = (story: StoryHydrated, entities: Entities) => {
    if (program.idonly) {
        return log(story.id);
    }
    if (program.format) {
        return storyLib.printFormattedStory(program)(story);
    }
    storyLib.printDetailedStory(story, entities);
};

main();
