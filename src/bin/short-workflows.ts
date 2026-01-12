#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import type { Workflow, WorkflowState } from '@shortcut/client';

import client from '../lib/client';
import spinner from '../lib/spinner';

interface WorkflowsOptions {
    search?: string;
}

const spin = spinner();
const log = console.log;

const program = new Command()
    .description('Display workflows/states available for stories')
    .option('-s, --search [query]', 'List states containing query', '')
    .parse(process.argv);

const opts = program.opts<WorkflowsOptions>();

const main = async () => {
    spin.start();
    const wfs = await client.listWorkflows().then((r) => r.data);
    spin.stop(true);
    wfs.map(printWf);
};

const printWf = (wf: Workflow) => {
    log(chalk.bold(`#${wf.id}`) + ` ${wf.name}`);
    log('    == States:');
    wf.states.map(printWfState);
};

const printWfState = (state: WorkflowState) => {
    if (!state.name.match(new RegExp(opts.search ?? '', 'i'))) {
        return;
    }
    log(chalk.bold(`    #${state.id}`) + ` ${state.name}`);
    log(`         Type:   \t${state.type}`);
    log(`         Stories:\t${state.num_stories}`);
};

main();
