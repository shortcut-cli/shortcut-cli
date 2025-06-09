#!/usr/bin/env node
import * as commander from 'commander';
import chalk from 'chalk';
import { Epic } from '@shortcut/client';

import client from '../lib/client';
import spinner from '../lib/spinner';

const log = console.log;
const spin = spinner();

const program = commander
    .description('Display epics available for stories')
    .option('-a, --archived', 'List only epics including archived', '')
    .option('-c, --completed', 'List only epics that have been completed', '')
    .option('-d, --detailed', 'List more details for each epic', '')
    .option('-f, --format [template]', 'Format each epic output by template', '')
    .option('-M, --milestone [ID]', 'List epics in milestone matching id', '')
    .option('-t, --title [query]', 'List epics with name/title containing query', '')
    .option('-s, --started', 'List epics that have been started', '')
    .parse(process.argv);

const main = async () => {
    spin.start();
    const epics = await client.listEpics(null).then((r) => r.data);
    spin.stop(true);
    const textMatch = new RegExp(program.title, 'i');
    epics
        .filter((epic: Epic) => {
            return (
                !!`${epic.name} ${epic.name}`.match(textMatch) &&
                !!(program.milestone ? epic.milestone_id == program.milestone : true)
            );
        })
        .map(printItem);
};

const printItem = (epic: Epic) => {
    if (epic.archived && !program.archived) return;
    if (!epic.started && program.started) return;
    if (!epic.completed && program.completed) return;

    let defaultFormat = `#%id %t\nMilestone:\t%m\nState:\t\t%s\nDeadline:\t%dl\n`;
    defaultFormat += `Points:\t\t%p\nPoints Started: %ps\nPoints Done:\t%pd\nCompletion:\t%c\n`;
    if (epic.archived) {
        defaultFormat += `Archived:\t%ar\n`;
    }
    if (epic.started) {
        defaultFormat += `Started:\t%st\n`;
    }
    if (epic.completed) {
        defaultFormat += `Completed:\t%co\n`;
    }
    if (program.detailed) {
        defaultFormat += `Description:\t%d\n`;
    }

    const format = program.format || defaultFormat;
    log(
        format
            .replace(/%id/, chalk.bold(`${epic.id}`))
            .replace(/%t/, chalk.blue(`${epic.name}`))
            .replace(/%m/, `${epic.milestone_id || '_'}`)
            .replace(/%s/, `${epic.state}`)
            .replace(/%dl/, `${epic.deadline || '_'}`)
            .replace(/%d/, `${epic.description}`)
            .replace(/%p/, `${epic.stats.num_points}`)
            .replace(/%ps/, `${epic.stats.num_points_started}`)
            .replace(/%pd/, `${epic.stats.num_points_done}`)
            .replace(
                /%c/,
                `${Math.round((epic.stats.num_points_done / (epic.stats.num_points || 1)) * 100)}%`
            )
            .replace(/%a/, `${epic.archived}`)
            .replace(/%st/, `${epic.started_at}`)
            .replace(/%co/, `${epic.completed_at}`)
    );
};
main();
