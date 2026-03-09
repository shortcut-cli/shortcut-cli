#!/usr/bin/env node
import type { Group } from '@shortcut/client';
import chalk from 'chalk';
import { Command } from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';

interface TeamsOptions {
    archived?: boolean;
    search?: string;
}

const spin = spinner();
const log = console.log;

const program = new Command()
    .description('Display teams available for stories and epics')
    .option('-a, --archived', 'List teams including archived', '')
    .option('-s, --search [query]', 'List teams with name containing query', '')
    .parse(process.argv);

const opts = program.opts<TeamsOptions>();

async function main() {
    spin.start();
    const teams = await client.listGroups().then((r) => r.data);
    spin.stop(true);

    const searchMatch = new RegExp(opts.search ?? '', 'i');
    teams
        .filter((team) => !!`${team.id} ${team.name} ${team.mention_name}`.match(searchMatch))
        .forEach(printTeamSummary);
}

function printTeamSummary(team: Group) {
    if (team.archived && !opts.archived) return;
    log(chalk.bold(`#${team.id}`) + chalk.blue(` ${team.name}`));
    log(chalk.bold('Mention:       ') + ` ${team.mention_name}`);
    log(chalk.bold('Stories:       ') + ` ${team.num_stories}`);
    log(chalk.bold('Started:       ') + ` ${team.num_stories_started}`);
    if (team.archived) {
        log(chalk.bold('Archived:      ') + ` ${team.archived}`);
    }
    log();
}

main();
