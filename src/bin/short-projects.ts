#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import type { Project } from '@shortcut/client';

import spinner from '../lib/spinner';
import client from '../lib/client';

interface ProjectsOptions {
    archived?: boolean;
    detailed?: boolean;
    title?: string;
}

const spin = spinner();
const log = console.log;

const program = new Command()
    .description('Display projects available for stories')
    .option('-a, --archived', 'List only projects including archived', '')
    .option('-d, --detailed', 'List more details for each project', '')
    .option('-t, --title [query]', 'List projects with name/title containing query', '')
    .parse(process.argv);

const opts = program.opts<ProjectsOptions>();

const main = async () => {
    spin.start();
    const projects = await client.listProjects().then((r) => r.data);
    spin.stop(true);
    const textMatch = new RegExp(opts.title ?? '', 'i');
    projects
        .filter((o: Project) => {
            return !!`${o.name} ${o.name}`.match(textMatch);
        })
        .map(printItem);
};

const printItem = (proj: Project) => {
    if (proj.archived && !opts.archived) return;
    log(chalk.bold(`#${proj.id}`) + chalk.blue(` ${proj.name}`));
    log(chalk.bold('Points:        ') + ` ${proj.stats.num_points}`);
    log(chalk.bold('Stories:       ') + ` ${proj.stats.num_stories}`);
    log(chalk.bold('Started:       ') + ` ${proj.start_time}`);
    if (proj.archived) {
        log(chalk.bold('Archived:      ') + ` ${proj.archived}`);
    }
    if (opts.detailed) {
        log(chalk.bold('Description:    ') + ` ${proj.description}`);
    }
    log();
};
main();
