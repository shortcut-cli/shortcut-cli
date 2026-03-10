#!/usr/bin/env node
import chalk from 'chalk';
import { exec } from 'child_process';
import { Command } from 'commander';
import os from 'os';

import client from '../lib/client';
import spinner from '../lib/spinner';

import type { CreateObjective, EpicSlim, Objective, UpdateObjective } from '@shortcut/client';

interface ObjectiveCreateOptions {
    name?: string;
    description?: string;
    state?: string;
    startedAt?: string;
    completedAt?: string;
    idonly?: boolean;
    open?: boolean;
}

interface ObjectiveUpdateOptions {
    name?: string;
    description?: string;
    state?: string;
    startedAt?: string;
    completedAt?: string;
    archived?: boolean;
    open?: boolean;
}

const spin = spinner();
const log = console.log;

const program = new Command()
    .usage('[command] [options]')
    .description('view, create, or update objectives');

program
    .command('view <id>')
    .description('view an objective by id')
    .option('-O, --open', 'Open objective in browser')
    .action(viewObjective);

program
    .command('create')
    .description('create a new objective')
    .option('-n, --name [text]', 'Set name of objective, required', '')
    .option('-d, --description [text]', 'Set description of objective', '')
    .option('-s, --state [name]', 'Set state of objective (to do, in progress, done)', '')
    .option('--started-at [date]', 'Set started override (ISO date or YYYY-MM-DD)', '')
    .option('--completed-at [date]', 'Set completed override (ISO date or YYYY-MM-DD)', '')
    .option('-I, --idonly', 'Print only ID of objective result')
    .option('-O, --open', 'Open objective in browser')
    .action(createObjective);

program
    .command('update <id>')
    .description('update an existing objective')
    .option('-n, --name [text]', 'Set name of objective', '')
    .option('-d, --description [text]', 'Set description of objective', '')
    .option('-s, --state [name]', 'Set state of objective (to do, in progress, done)', '')
    .option('--started-at [date]', 'Set started override (ISO date or YYYY-MM-DD)', '')
    .option('--completed-at [date]', 'Set completed override (ISO date or YYYY-MM-DD)', '')
    .option('-a, --archived', 'Archive objective')
    .option('-O, --open', 'Open objective in browser')
    .action(updateObjective);

program.command('epics <id>').description('list epics in an objective').action(listObjectiveEpics);

const args = process.argv.slice(2);
if (args.length > 0 && /^\d+$/.test(args[0])) {
    process.argv.splice(2, 0, 'view');
}

program.parse(process.argv);

if (args.length === 0) {
    program.outputHelp();
    process.exit(1);
}

async function viewObjective(id: string, options: { open?: boolean }) {
    spin.start();
    try {
        const objective = await client.getObjective(parseInt(id, 10)).then((r) => r.data);
        spin.stop(true);
        printObjective(objective);
        if (options.open) {
            openURL(objective.app_url);
        }
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Objective #${id} not found`);
        } else {
            log('Error fetching objective:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

async function createObjective(options: ObjectiveCreateOptions) {
    if (!options.name) {
        log('Must provide --name');
        process.exit(1);
    }

    if (!options.idonly) spin.start();

    const objectiveData: CreateObjective = {
        name: options.name,
    };

    if (options.description) {
        objectiveData.description = options.description;
    }

    const state = normalizeObjectiveState(options.state);
    if (state) {
        objectiveData.state = state;
    }

    if (options.startedAt) {
        objectiveData.started_at_override = normalizeDate(options.startedAt);
    }

    if (options.completedAt) {
        objectiveData.completed_at_override = normalizeDate(options.completedAt);
    }

    let objective: Objective;
    try {
        objective = await client.createObjective(objectiveData).then((r) => r.data);
    } catch (e: unknown) {
        if (!options.idonly) spin.stop(true);
        const error = e as { message?: string };
        log('Error creating objective:', error.message ?? String(e));
        process.exit(1);
    }

    if (!options.idonly) spin.stop(true);

    if (options.idonly) {
        log(objective.id);
        return;
    }

    printObjective(objective);
    if (options.open) {
        openURL(objective.app_url);
    }
}

async function updateObjective(id: string, options: ObjectiveUpdateOptions) {
    const updateData: UpdateObjective = {};

    if (options.name) {
        updateData.name = options.name;
    }
    if (options.description) {
        updateData.description = options.description;
    }

    const state = normalizeObjectiveState(options.state);
    if (state) {
        updateData.state = state;
    }

    if (options.startedAt) {
        updateData.started_at_override = normalizeDate(options.startedAt);
    }
    if (options.completedAt) {
        updateData.completed_at_override = normalizeDate(options.completedAt);
    }
    if (options.archived) {
        updateData.archived = true;
    }

    if (Object.keys(updateData).length === 0) {
        log(
            'No updates provided. Use --name, --description, --state, --started-at, --completed-at, or --archived'
        );
        process.exit(1);
    }

    spin.start();
    try {
        const objective = await client
            .updateObjective(parseInt(id, 10), updateData)
            .then((r) => r.data);
        spin.stop(true);
        printObjective(objective);
        if (options.open) {
            openURL(objective.app_url);
        }
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Objective #${id} not found`);
        } else {
            log('Error updating objective:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

async function listObjectiveEpics(id: string) {
    spin.start();
    try {
        const epics = await client.listObjectiveEpics(parseInt(id, 10)).then((r) => r.data);
        spin.stop(true);
        if (epics.length === 0) {
            log(`No epics found in objective #${id}`);
            return;
        }

        log(chalk.bold(`Epics in objective #${id}:`));
        log();
        epics.forEach(printEpic);
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Objective #${id} not found`);
        } else {
            log('Error fetching objective epics:', error.message ?? String(e));
        }
        process.exit(1);
    }
}

function normalizeObjectiveState(state?: string): CreateObjective['state'] | undefined {
    if (!state) return undefined;

    const stateMap: Record<string, NonNullable<CreateObjective['state']>> = {
        todo: 'to do',
        'to do': 'to do',
        inprogress: 'in progress',
        'in progress': 'in progress',
        done: 'done',
    };

    const normalizedState = state.toLowerCase().replace(/[^a-z]/g, '');
    return stateMap[normalizedState] || stateMap[state.toLowerCase()];
}

function normalizeDate(value: string): string {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T00:00:00.000Z`).toISOString();
    }
    return new Date(value).toISOString();
}

function printObjective(objective: Objective) {
    log(`#${objective.id} ${objective.name}`);
    log(`State:\t\t${objective.state}`);
    log(`Started:\t${objective.started ? 'yes' : 'no'}`);
    log(`Completed:\t${objective.completed ? 'yes' : 'no'}`);
    log(`Archived:\t${objective.archived ? 'yes' : 'no'}`);
    if (objective.description) {
        log(`Description:\t${objective.description}`);
    }
    if (objective.categories.length > 0) {
        log(`Categories:\t${objective.categories.map((category) => category.name).join(', ')}`);
    }
    if (objective.started_at) {
        log(`Started At:\t${objective.started_at}`);
    }
    if (objective.completed_at) {
        log(`Completed At:\t${objective.completed_at}`);
    }
    log(`Updated:\t${objective.updated_at}`);
    log(`URL:\t\t${objective.app_url}`);
}

function printEpic(epic: EpicSlim) {
    log(`${chalk.bold('#' + epic.id)} ${chalk.blue(epic.name)}`);
    log(
        `  State: ${epic.state} | Started: ${epic.started ? 'yes' : 'no'} | Completed: ${epic.completed ? 'yes' : 'no'}`
    );
    log(`  URL: ${epic.app_url}`);
    log();
}

function openURL(url: string) {
    const open = os.platform() === 'darwin' ? 'open' : 'xdg-open';
    exec(`${open} '${url}'`);
}
