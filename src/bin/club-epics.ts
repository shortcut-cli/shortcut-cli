#!/usr/bin/env node
import client from '../lib/client';
import * as commander from 'commander';
import chalk from 'chalk';

import { Epic } from 'clubhouse-lib';
import spinner from '../lib/spinner';

const log = console.log;
const spin = spinner();

const program = commander
    .description('Display epics available for stories')
    .option('-a, --archived', 'List only epics including archived', '')
    .option('-c, --completed', 'List only epics that have been completed', '')
    .option('-d, --detailed', 'List more details for each epic', '')
    .option('-t, --title [query]', 'List epics with name/title containing query', '')
    .option('-s, --started', 'List epics that have been started', '')
    .parse(process.argv);

const main = async () => {
    spin.start();
    const epics = await client.listEpics();
    spin.stop(true);
    const textMatch = new RegExp(program.title, 'i');
    epics.filter((epic: Epic) => !!`${epic.name} ${epic.name}`.match(textMatch)).map(printItem);
};

const printItem = (epic: Epic) => {
    if (epic.archived && !program.archived) return;
    if (!epic.started && program.started) return;
    if (!epic.completed && program.completed) return;
    log(chalk.bold(`#${epic.id}`) + chalk.blue(` ${epic.name}`));
    log(chalk.bold('State:         ') + ` ${epic.state}`);
    log(chalk.bold('Deadline:      ') + ` ${epic.deadline || '_'}`);
    log(chalk.bold('Points:        ') + ` ${epic.stats.num_points}`);
    log(chalk.bold('Points Started:') + ` ${epic.stats.num_points_started}`);
    log(chalk.bold('Points Done:   ') + ` ${epic.stats.num_points_done}`);
    log(
        chalk.bold('Completion:    ') +
            ` ${Math.round((epic.stats.num_points_done / (epic.stats.num_points || 1)) * 100)}%`
    );
    if (epic.archived) {
        log(chalk.bold('Archived:      ') + ` ${epic.archived}`);
    }
    if (epic.started) {
        log(chalk.bold('Started:       ') + ` ${epic.started_at}`);
    }
    if (epic.completed) {
        log(chalk.bold('Completed:     ') + ` ${epic.completed_at}`);
    }
    if (program.detailed) {
        log(chalk.bold('Description:    ') + ` ${epic.description}`);
    }
    log();
};
main();
