#!/usr/bin/env node
import { exec } from 'child_process';

import type { CreateEpic, Epic } from '@shortcut/client';
import commander from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';
import { loadConfig } from '../lib/configure';
import storyLib from '../lib/stories';

const config = loadConfig();
const spin = spinner();
const log = console.log;

const program = commander.usage('[command] [options]').description('create or view epics');

// Create subcommand
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
    .option('-I, --idonly', 'Print only ID of epic result')
    .option('-O, --open', 'Open epic in browser')
    .action(createEpic);

program.parse(process.argv);

async function createEpic(options: any) {
    const entities = await storyLib.fetchEntities();
    if (!options.idonly) spin.start();

    const epicData: CreateEpic = {
        name: options.name,
    };

    if (options.description) {
        epicData.description = options.description;
    }

    if (options.state) {
        const stateMap: { [key: string]: 'to do' | 'in progress' | 'done' } = {
            todo: 'to do',
            'to do': 'to do',
            inprogress: 'in progress',
            'in progress': 'in progress',
            done: 'done',
        };
        const normalizedState = options.state.toLowerCase().replace(/[^a-z]/g, '');
        const mappedState = stateMap[normalizedState] || stateMap[options.state.toLowerCase()];
        if (mappedState) {
            epicData.state = mappedState;
        }
    }

    if (options.deadline) {
        // Convert YYYY-MM-DD to ISO date-time
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

    let epic: Epic;
    if (!epicData.name) {
        if (!options.idonly) spin.stop(true);
        log('Must provide --name');
        process.exit(1);
    } else {
        try {
            epic = await client.createEpic(epicData).then((r) => r.data);
        } catch (e: any) {
            if (!options.idonly) spin.stop(true);
            log('Error creating epic:', e.message || e);
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
                const url = `https://app.shortcut.com/${config.urlSlug}/epic/${epic.id}`;
                exec('open ' + url);
            }
        }
    }
}

function printEpic(epic: Epic) {
    log(`#${epic.id} ${epic.name}`);
    if (epic.description) {
        log(`Description:\t${epic.description}`);
    }
    log(`State:\t\t${epic.state}`);
    if (epic.milestone_id) {
        log(`Milestone:\t${epic.milestone_id}`);
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
        log(`Labels:\t\t${epic.labels.map((l) => l.name).join(', ')}`);
    }
    log(`URL:\t\thttps://app.shortcut.com/epic/${epic.id}`);
}
