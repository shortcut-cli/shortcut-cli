#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import type { Objective, ObjectiveSearchResult } from '@shortcut/client';

import client from '../lib/client';
import spinner from '../lib/spinner';

interface ObjectivesOptions {
    archived?: boolean;
    completed?: boolean;
    detailed?: boolean;
    format?: string;
    started?: boolean;
    state?: string;
    title?: string;
}

type ObjectiveLike = Objective | ObjectiveSearchResult;

const log = console.log;
const spin = spinner();

const program = new Command()
    .description(
        `List and search Shortcut objectives. By default, lists all objectives.
  Passing search operators will use the Shortcut objective search API and page through all results.`
    )
    .usage('[options] [SEARCH OPERATORS]')
    .option('-a, --archived', 'List only objectives including archived', '')
    .option('-c, --completed', 'List only objectives that have been completed', '')
    .option('-d, --detailed', 'List more details for each objective', '')
    .option('-f, --format [template]', 'Format each objective output by template', '')
    .option('-s, --started', 'List objectives that have been started', '')
    .option('-S, --state [state]', 'Filter objectives by state', '')
    .option('-t, --title [query]', 'Filter objectives with name/title containing query', '');

program.parse(process.argv);

const opts = program.opts<ObjectivesOptions>();

const main = async () => {
    spin.start();
    let objectives: ObjectiveLike[] = [];

    try {
        objectives = program.args.length
            ? await searchObjectives(program.args)
            : await listObjectives();
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { message?: string };
        log('Error fetching objectives:', error.message ?? String(e));
        process.exit(1);
    }

    spin.stop(true);

    const textMatch = new RegExp(opts.title ?? '', 'i');
    const stateMatch = new RegExp(opts.state ?? '', 'i');

    objectives
        .filter((objective) => {
            const haystack = `${objective.name} ${objective.description ?? ''}`;
            return haystack.match(textMatch) && objective.state.match(stateMatch);
        })
        .forEach(printItem);
};

async function listObjectives(): Promise<Objective[]> {
    return client.listObjectives().then((r) => r.data);
}

async function searchObjectives(args: string[]): Promise<ObjectiveSearchResult[]> {
    const query = args.join(' ');
    let result = await client.searchObjectives({ query, detail: 'full' });
    let objectives = result.data.data;

    while (result.data.next) {
        const nextCursor = new URLSearchParams(result.data.next).get('next');
        result = await client.searchObjectives({
            query,
            detail: 'full',
            next: nextCursor ?? undefined,
        });
        objectives = objectives.concat(result.data.data);
    }

    return objectives;
}

const printItem = (objective: ObjectiveLike) => {
    if (objective.archived && !opts.archived) return;
    if (!objective.started && opts.started) return;
    if (!objective.completed && opts.completed) return;

    let defaultFormat = `#%id %t\nState:\t\t%s\nStarted:\t%st\nCompleted:\t%co\n`;

    if (opts.detailed) {
        defaultFormat += `Updated:\t%u\nCategories:\t%cat\nURL:\t\t%url\nDescription:\t%d\n`;
    }

    const format = opts.format || defaultFormat;
    const categories =
        'categories' in objective
            ? objective.categories.map((category) => category.name).join(', ') || '_'
            : '_';

    log(
        format
            .replace(/%id/g, chalk.bold(`${objective.id}`))
            .replace(/%t/g, chalk.blue(`${objective.name}`))
            .replace(/%st/g, `${objective.started ? 'yes' : 'no'}`)
            .replace(/%co/g, `${objective.completed ? 'yes' : 'no'}`)
            .replace(/%s/g, `${objective.state}`)
            .replace(/%u/g, `${objective.updated_at}`)
            .replace(/%cat/g, categories)
            .replace(/%url/g, `${objective.app_url}`)
            .replace(/%d/g, `${objective.description || '_'}`)
    );
};

main();
