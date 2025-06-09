#!/usr/bin/env node

import * as commander from 'commander';
import chalk from 'chalk';
import { Project } from '@shortcut/client';

import spinner from '../lib/spinner';
import client from '../lib/client';

const spin = spinner();
const log = console.log;

const program = commander
    .description('Display projects available for stories')
    .option('-a, --archived', 'List only projects including archived', '')
    .option('-d, --detailed', 'List more details for each project', '')
    .option('-t, --title [query]', 'List projects with name/title containing query', '')
    .parse(process.argv);

const main = async () => {
    spin.start();
    const projects = await client.listProjects().then((r) => r.data);
    spin.stop(true);
    const textMatch = new RegExp(program.title, 'i');
    projects
        .filter((o: Project) => {
            return !!`${o.name} ${o.name}`.match(textMatch);
        })
        .map(printItem);
};

const printItem = (proj: Project) => {
    if (proj.archived && !program.archived) return;
    log(chalk.bold(`#${proj.id}`) + chalk.blue(` ${proj.name}`));
    log(chalk.bold('Points:        ') + ` ${proj.stats.num_points}`);
    log(chalk.bold('Stories:       ') + ` ${proj.stats.num_stories}`);
    log(chalk.bold('Started:       ') + ` ${proj.start_time}`);
    if (proj.archived) {
        log(chalk.bold('Archived:      ') + ` ${proj.archived}`);
    }
    if (program.detailed) {
        log(chalk.bold('Description:    ') + ` ${proj.description}`);
    }
    log();
};
main();
