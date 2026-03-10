#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';

import type { Label } from '@shortcut/client';

interface LabelsOptions {
    archived?: boolean;
    search?: string;
}

const spin = spinner();
const log = console.log;

const program = new Command()
    .description('Display labels available for stories and epics')
    .option('-a, --archived', 'List labels including archived', '')
    .option('-s, --search [query]', 'List labels with name containing query', '')
    .parse(process.argv);

const opts = program.opts<LabelsOptions>();

async function main() {
    spin.start();
    const labels = await client.listLabels(null).then((r) => r.data);
    spin.stop(true);

    const searchMatch = new RegExp(opts.search ?? '', 'i');
    labels.filter((label) => !!`${label.id} ${label.name}`.match(searchMatch)).forEach(printLabel);
}

function printLabel(label: Label) {
    if (label.archived && !opts.archived) return;
    log(chalk.bold(`#${label.id}`) + chalk.blue(` ${label.name}`));
    if (label.color) {
        log(chalk.bold('Color:         ') + ` ${label.color}`);
    }
    if (label.description) {
        log(chalk.bold('Description:   ') + ` ${label.description}`);
    }
    if (label.archived) {
        log(chalk.bold('Archived:      ') + ` ${label.archived}`);
    }
    log();
}

main();
