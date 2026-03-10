#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';
import storyLib from '../lib/stories';

import type { Epic, Objective } from '@shortcut/client';

interface EpicsOptions {
    archived?: boolean;
    completed?: boolean;
    detailed?: boolean;
    format?: string;
    milestone?: string;
    objectives?: string;
    title?: string;
    started?: boolean;
}

const log = console.log;
const spin = spinner();

const program = new Command()
    .description('Display epics available for stories')
    .option('-a, --archived', 'List only epics including archived', '')
    .option('-c, --completed', 'List only epics that have been completed', '')
    .option('-d, --detailed', 'List more details for each epic', '')
    .option('-f, --format [template]', 'Format each epic output by template', '')
    .option('-M, --milestone [ID]', 'List epics in milestone matching id', '')
    .option('--objectives [id|name]', 'List epics linked to objective id/name, comma-separated', '')
    .option('-t, --title [query]', 'List epics with name/title containing query', '')
    .option('-s, --started', 'List epics that have been started', '')
    .parse(process.argv);

const opts = program.opts<EpicsOptions>();

const main = async () => {
    spin.start();
    const [epics, entities] = await Promise.all([
        client.listEpics(null).then((r) => r.data),
        storyLib.fetchEntities(),
    ]);
    spin.stop(true);

    const textMatch = new RegExp(opts.title ?? '', 'i');
    const objectiveIds = opts.objectives
        ? storyLib.findObjectiveIds(entities, opts.objectives)
        : [];

    epics
        .filter((epic: Epic) => {
            const matchesObjectives =
                objectiveIds.length === 0 ||
                objectiveIds.some((objectiveId) => epic.objective_ids.includes(objectiveId));

            return (
                !!`${epic.name} ${epic.name}`.match(textMatch) &&
                !!(opts.milestone ? String(epic.milestone_id) === opts.milestone : true) &&
                matchesObjectives
            );
        })
        .forEach((epic: Epic) => printItem(epic, entities.objectivesById));
};

const printItem = (epic: Epic, objectivesById?: Map<number, Objective>) => {
    if (epic.archived && !opts.archived) return;
    if (!epic.started && opts.started) return;
    if (!epic.completed && opts.completed) return;

    let defaultFormat = `#%id %t\nMilestone:\t%m\nObjectives:\t%obj\nState:\t\t%s\nArchived:\t%ar\nDeadline:\t%dl\n`;
    defaultFormat += `Points:\t\t%p\nPoints Started: %ps\nPoints Done:\t%pd\nCompletion:\t%c\n`;
    if (epic.started) {
        defaultFormat += `Started:\t%st\n`;
    }
    if (epic.completed) {
        defaultFormat += `Completed:\t%co\n`;
    }
    if (opts.detailed) {
        defaultFormat += `Description:\t%d\n`;
    }

    const objectiveNames =
        epic.objective_ids
            ?.map((objectiveId) => objectivesById?.get(objectiveId)?.name || String(objectiveId))
            .join(', ') || '_';

    const format = opts.format || defaultFormat;
    log(
        format
            .replace(/%id/, chalk.bold(`${epic.id}`))
            .replace(/%t/, chalk.blue(`${epic.name}`))
            .replace(/%m/, `${epic.milestone_id || '_'}`)
            .replace(/%obj/, objectiveNames)
            .replace(/%s/, `${epic.state}`)
            .replace(/%dl/, `${epic.deadline || '_'}`)
            .replace(/%d/, `${epic.description}`)
            .replace(/%p/, `${epic.stats.num_points}`)
            .replace(/%ps/, `${epic.stats.num_points_started}`)
            .replace(/%pd/, `${epic.stats.num_points_done}`)
            .replace(/%ar/, `${epic.archived}`)
            .replace(
                /%c/,
                `${Math.round((epic.stats.num_points_done / (epic.stats.num_points || 1)) * 100)}%`
            )
            .replace(/%st/, `${epic.started_at}`)
            .replace(/%co/, `${epic.completed_at}`)
    );
};

main();
