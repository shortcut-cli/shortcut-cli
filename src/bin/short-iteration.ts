#!/usr/bin/env node
import { exec } from 'child_process';

import type { CreateIteration, Iteration, StorySlim, UpdateIteration } from '@shortcut/client';
import { Command } from 'commander';
import chalk from 'chalk';

import client from '../lib/client';
import spinner from '../lib/spinner';
import { loadConfig } from '../lib/configure';
import storyLib from '../lib/stories';

interface IterationCreateOptions {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    team?: string;
    idonly?: boolean;
    open?: boolean;
}

interface IterationUpdateOptions {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    team?: string;
    open?: boolean;
}

interface IterationStoriesOptions {
    format?: string;
}

const config = loadConfig();
const spin = spinner();
const log = console.log;

const program = new Command()
    .usage('[command] [options]')
    .description('view, create, update, or delete iterations');

program
    .command('view <id>')
    .description('view an iteration by id')
    .option('-O, --open', 'Open iteration in browser')
    .action(viewIteration);

program
    .command('create')
    .description('create a new iteration')
    .option('-n, --name [text]', 'Set name of iteration, required', '')
    .option('-d, --description [text]', 'Set description of iteration', '')
    .option('--start-date [date]', 'Set start date (YYYY-MM-DD), required', '')
    .option('--end-date [date]', 'Set end date (YYYY-MM-DD), required', '')
    .option('-T, --team [id|name]', 'Set team/group of iteration', '')
    .option('-I, --idonly', 'Print only ID of iteration result')
    .option('-O, --open', 'Open iteration in browser')
    .action(createIteration);

program
    .command('update <id>')
    .description('update an existing iteration')
    .option('-n, --name [text]', 'Set name of iteration', '')
    .option('-d, --description [text]', 'Set description of iteration', '')
    .option('--start-date [date]', 'Set start date (YYYY-MM-DD)', '')
    .option('--end-date [date]', 'Set end date (YYYY-MM-DD)', '')
    .option('-T, --team [id|name]', 'Set team/group of iteration', '')
    .option('-O, --open', 'Open iteration in browser')
    .action(updateIteration);

program.command('delete <id>').description('delete an iteration').action(deleteIteration);

program
    .command('stories <id>')
    .description('list stories in an iteration')
    .option('-f, --format [template]', 'Format each story output by template', '')
    .action(listIterationStories);

program.parse(process.argv);

async function viewIteration(id: string, options: { open?: boolean }) {
    spin.start();
    try {
        const iteration = await client.getIteration(parseInt(id, 10)).then((r) => r.data);
        spin.stop(true);
        printIteration(iteration);

        if (options.open) {
            const url = `https://app.shortcut.com/${config.urlSlug}/iteration/${iteration.id}`;
            exec('open ' + url);
        }
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Iteration #${id} not found`);
        } else {
            log('Error fetching iteration:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

async function createIteration(options: IterationCreateOptions) {
    const entities = await storyLib.fetchEntities();
    if (!options.idonly) spin.start();

    const iterationData: CreateIteration = {
        name: options.name || '',
        start_date: options.startDate || '',
        end_date: options.endDate || '',
    };

    if (options.description) {
        iterationData.description = options.description;
    }

    if (options.team) {
        const group = storyLib.findGroup(entities, options.team);
        if (group?.id) {
            iterationData.group_ids = [group.id];
        }
    }

    if (!iterationData.name) {
        if (!options.idonly) spin.stop(true);
        log('Must provide --name');
        process.exit(1);
    }
    if (!iterationData.start_date) {
        if (!options.idonly) spin.stop(true);
        log('Must provide --start-date');
        process.exit(1);
    }
    if (!iterationData.end_date) {
        if (!options.idonly) spin.stop(true);
        log('Must provide --end-date');
        process.exit(1);
    }

    let iteration: Iteration;
    try {
        iteration = await client.createIteration(iterationData).then((r) => r.data);
    } catch (e: unknown) {
        if (!options.idonly) spin.stop(true);
        const error = e as { message?: string };
        log('Error creating iteration:', error.message ?? String(e));
        process.exit(1);
    }

    if (!options.idonly) spin.stop(true);

    if (iteration) {
        if (options.idonly) {
            log(iteration.id);
        } else {
            printIteration(iteration);
            if (options.open) {
                const url = `https://app.shortcut.com/${config.urlSlug}/iteration/${iteration.id}`;
                exec('open ' + url);
            }
        }
    }
}

async function updateIteration(id: string, options: IterationUpdateOptions) {
    const entities = await storyLib.fetchEntities();
    spin.start();

    const updateData: UpdateIteration = {};

    if (options.name) {
        updateData.name = options.name;
    }
    if (options.description) {
        updateData.description = options.description;
    }
    if (options.startDate) {
        updateData.start_date = options.startDate;
    }
    if (options.endDate) {
        updateData.end_date = options.endDate;
    }
    if (options.team) {
        const group = storyLib.findGroup(entities, options.team);
        if (group?.id) {
            updateData.group_ids = [group.id];
        }
    }

    if (Object.keys(updateData).length === 0) {
        spin.stop(true);
        log('No updates provided. Use --name, --description, --start-date, --end-date, or --team');
        process.exit(1);
    }

    let iteration: Iteration;
    try {
        iteration = await client.updateIteration(parseInt(id, 10), updateData).then((r) => r.data);
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Iteration #${id} not found`);
        } else {
            log('Error updating iteration:', error.message ?? String(e));
        }
        process.exit(1);
    }

    spin.stop(true);

    if (iteration) {
        printIteration(iteration);
        if (options.open) {
            const url = `https://app.shortcut.com/${config.urlSlug}/iteration/${iteration.id}`;
            exec('open ' + url);
        }
    }
}

async function deleteIteration(id: string) {
    spin.start();
    try {
        await client.deleteIteration(parseInt(id, 10));
        spin.stop(true);
        log(`Iteration #${id} deleted successfully`);
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Iteration #${id} not found`);
        } else {
            log('Error deleting iteration:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

async function listIterationStories(id: string, options: IterationStoriesOptions) {
    spin.start();
    try {
        const [stories, entities] = await Promise.all([
            client.listIterationStories(parseInt(id, 10)).then((r) => r.data),
            storyLib.fetchEntities(),
        ]);
        spin.stop(true);

        if (stories.length === 0) {
            log(`No stories found in iteration #${id}`);
            return;
        }

        log(chalk.bold(`Stories in iteration #${id}:`));
        log();

        stories.forEach((story: StorySlim) => {
            const hydrated = storyLib.hydrateStory(entities, story);
            if (options.format) {
                storyLib.printFormattedStory({ format: options.format })(hydrated);
            } else {
                const state = hydrated.state?.name ?? 'Unknown';
                const owners = hydrated.owners
                    ?.map((o) => o?.profile.mention_name)
                    .filter(Boolean)
                    .join(', ');
                log(`${chalk.bold('#' + story.id)} ${chalk.blue(story.name)}`);
                log(`  Type: ${story.story_type} | State: ${state} | Owners: ${owners || '_'}`);
                log(`  Points: ${story.estimate ?? '_'}`);
                log();
            }
        });
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Iteration #${id} not found`);
        } else {
            log('Error fetching stories:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

function printIteration(iteration: Iteration) {
    const stats = iteration.stats;
    const totalStories =
        stats.num_stories_done +
        stats.num_stories_started +
        stats.num_stories_unstarted +
        stats.num_stories_backlog;

    const completionPct =
        stats.num_points > 0 ? Math.round((stats.num_points_done / stats.num_points) * 100) : 0;

    log(chalk.blue.bold(`#${iteration.id}`) + chalk.blue(` ${iteration.name}`));
    if (iteration.description) {
        log(chalk.bold('Description:') + ` ${iteration.description}`);
    }
    log(chalk.bold('Status:') + `      ${formatStatus(iteration.status)}`);
    log(chalk.bold('Start Date:') + `  ${iteration.start_date}`);
    log(chalk.bold('End Date:') + `    ${iteration.end_date}`);

    if (iteration.group_ids && iteration.group_ids.length > 0) {
        log(chalk.bold('Teams:') + `       ${iteration.group_ids.join(', ')}`);
    }

    log(chalk.bold('Stories:') + `     ${totalStories} (${stats.num_stories_done} done)`);
    log(chalk.bold('Points:') + `      ${stats.num_points} (${stats.num_points_done} done)`);
    log(chalk.bold('Completion:') + `  ${completionPct}%`);
    log(chalk.bold('URL:') + `         ${iteration.app_url}`);
    log();
}

function formatStatus(status: string): string {
    switch (status) {
        case 'started':
            return chalk.green(status);
        case 'done':
            return chalk.gray(status);
        case 'unstarted':
        default:
            return chalk.yellow(status);
    }
}
