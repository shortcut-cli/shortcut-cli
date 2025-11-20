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

const program = commander
    .usage('[ID|command] [options]')
    .description('create or view epics')
    .option('-f, --format [template]', 'Format epic output by template', '')
    .option('-O, --open', 'Open epic in browser')
    .option('-q, --quiet', 'Print only epic output, no loading dialog');

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

// Handle viewing an epic by ID (default action when no subcommand matches)
if (program.args.length > 0 && typeof program.args[0] === 'string') {
    const epicId = parseInt(program.args[0], 10);
    if (!isNaN(epicId)) {
        viewEpic(epicId, program);
    }
}

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

async function viewEpic(epicId: number, options: any) {
    if (!options.quiet) spin.start();

    let epic: Epic;
    try {
        epic = await client.getEpic(epicId).then((r) => r.data);
    } catch (e: any) {
        if (!options.quiet) spin.stop(true);
        log('Error fetching epic:', e.message || e);
        process.exit(1);
    }

    if (!options.quiet) spin.stop(true);

    if (epic) {
        printEpic(epic, options.format);
        if (options.open) {
            const url = `https://app.shortcut.com/${config.urlSlug}/epic/${epic.id}`;
            exec('open ' + url);
        }
    }
}

function printEpic(epic: Epic, format?: string) {
    if (format) {
        // Custom formatting
        const output = format
            .replace(/%id/g, `${epic.id}`)
            .replace(/%t/g, `${epic.name}`)
            .replace(/%d/g, `${epic.description || ''}`)
            .replace(/%s/g, `${epic.state}`)
            .replace(/%m/g, `${epic.milestone_id || '_'}`)
            .replace(/%dl/g, `${epic.deadline || '_'}`)
            .replace(/%ps/g, `${epic.planned_start_date || '_'}`)
            .replace(/%p/g, `${epic.stats?.num_points || 0}`)
            .replace(/%pp/g, `${epic.stats?.num_points_started || 0}`)
            .replace(/%pd/g, `${epic.stats?.num_points_done || 0}`)
            .replace(
                /%c/g,
                `${Math.round(((epic.stats?.num_points_done || 0) / (epic.stats?.num_points || 1)) * 100)}%`
            )
            .replace(/%a/g, `${epic.archived}`)
            .replace(/%st/g, `${epic.started_at || '_'}`)
            .replace(/%co/g, `${epic.completed_at || '_'}`)
            .replace(/%cr/g, `${epic.created_at || '_'}`)
            .replace(/%u/g, `${epic.updated_at || '_'}`)
            .replace(/%url/g, `https://app.shortcut.com/${config.urlSlug}/epic/${epic.id}`);
        log(output);
    } else {
        // Default formatting
        log(`#${epic.id} ${epic.name}`);
        if (epic.description) {
            log(`Description:\t${epic.description}`);
        }
        log(`State:\t\t${epic.state}`);
        if (epic.stats) {
            log(`Points:\t\t${epic.stats.num_points || 0}`);
            log(`Points Started:\t${epic.stats.num_points_started || 0}`);
            log(`Points Done:\t${epic.stats.num_points_done || 0}`);
            const completion = Math.round(
                ((epic.stats.num_points_done || 0) / (epic.stats.num_points || 1)) * 100
            );
            log(`Completion:\t${completion}%`);
        }
        if (epic.milestone_id) {
            log(`Milestone:\t${epic.milestone_id}`);
        }
        if (epic.deadline) {
            log(`Deadline:\t${epic.deadline}`);
        }
        if (epic.planned_start_date) {
            log(`Planned Start:\t${epic.planned_start_date}`);
        }
        if (epic.started_at) {
            log(`Started:\t${epic.started_at}`);
        }
        if (epic.completed_at) {
            log(`Completed:\t${epic.completed_at}`);
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
        if (epic.objective_ids && epic.objective_ids.length > 0) {
            log(`Objectives:\t${epic.objective_ids.join(', ')}`);
        }
        if (epic.archived) {
            log(`Archived:\t${epic.archived}`);
        }
        log(`Created:\t${epic.created_at}`);
        if (epic.updated_at && epic.updated_at !== epic.created_at) {
            log(`Updated:\t${epic.updated_at}`);
        }
        log(`URL:\t\thttps://app.shortcut.com/${config.urlSlug}/epic/${epic.id}`);
    }
}
