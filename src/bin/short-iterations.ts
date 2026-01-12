#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import type { IterationSlim } from '@shortcut/client';

import client from '../lib/client';
import spinner from '../lib/spinner';
import { loadConfig } from '../lib/configure';

interface IterationsOptions {
    status?: string;
    team?: string;
    current?: boolean;
    title?: string;
    detailed?: boolean;
    format?: string;
}

const config = loadConfig();
const log = console.log;
const spin = spinner();

const program = new Command()
    .description('Display iterations available for stories')
    .option('-S, --status [status]', 'Filter by status (unstarted, started, done)', '')
    .option('-T, --team [id|name]', 'Filter by team/group id or name', '')
    .option('-C, --current', 'Show only current/active iterations', false)
    .option('-t, --title [query]', 'Filter iterations with name containing query', '')
    .option('-d, --detailed', 'Show more details for each iteration', false)
    .option('-f, --format [template]', 'Format each iteration output by template', '')
    .parse(process.argv);

const opts = program.opts<IterationsOptions>();

const main = async () => {
    spin.start();

    const [iterations, groups] = await Promise.all([
        client.listIterations(null).then((r) => r.data),
        client.listGroups().then((r) => r.data),
    ]);

    spin.stop(true);

    const textMatch = new RegExp(opts.title ?? '', 'i');
    const statusMatch = opts.status ? new RegExp(opts.status, 'i') : null;
    const groupsById = new Map(groups.map((g) => [g.id, g]));
    const now = new Date();

    iterations
        .filter((iteration: IterationSlim) => {
            if (!iteration.name.match(textMatch)) return false;
            if (statusMatch && !iteration.status.match(statusMatch)) return false;

            if (opts.team) {
                const teamMatch = new RegExp(opts.team, 'i');
                const group = iteration.group_ids
                    ?.map((id) => groupsById.get(id))
                    .find((g) => g && (g.id.match(teamMatch) || g.name.match(teamMatch)));
                if (!group) return false;
            }

            if (opts.current) {
                const start = new Date(iteration.start_date);
                const end = new Date(iteration.end_date);
                if (now < start || now > end) return false;
            }

            return true;
        })
        .sort((a: IterationSlim, b: IterationSlim) => {
            return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        })
        .forEach((iteration: IterationSlim) => printItem(iteration, groupsById));
};

const printItem = (
    iteration: IterationSlim,
    groupsById: Map<string, { id: string; name: string }>
) => {
    const stats = iteration.stats;
    const groups = iteration.group_ids?.map((id) => groupsById.get(id)?.name).filter(Boolean) ?? [];
    const totalStories =
        stats.num_stories_done +
        stats.num_stories_started +
        stats.num_stories_unstarted +
        stats.num_stories_backlog;

    let defaultFormat = `#%id %t\nStatus:\t\t%s\nStart:\t\t%start\nEnd:\t\t%end\n`;
    defaultFormat += `Teams:\t\t%teams\n`;
    defaultFormat += `Stories:\t%stories (%done done)\nPoints:\t\t%points (%pdone done)\n`;

    if (opts.detailed) {
        defaultFormat += `Completion:\t%completion%\n`;
        defaultFormat += `URL:\t\t%url\n`;
    }

    const format = opts.format || defaultFormat;

    const url = `https://app.shortcut.com/${config.urlSlug}/iteration/${iteration.id}`;

    const completionPct =
        stats.num_points > 0 ? Math.round((stats.num_points_done / stats.num_points) * 100) : 0;

    log(
        format
            .replace(/%id/, chalk.bold(`${iteration.id}`))
            .replace(/%t/, chalk.blue(`${iteration.name}`))
            .replace(/%s/, formatStatus(iteration.status))
            .replace(/%start/, `${iteration.start_date}`)
            .replace(/%end/, `${iteration.end_date}`)
            .replace(/%teams/, groups.join(', ') || '_')
            .replace(/%stories/, `${totalStories}`)
            .replace(/%done/, `${stats.num_stories_done}`)
            .replace(/%points/, `${stats.num_points}`)
            .replace(/%pdone/, `${stats.num_points_done}`)
            .replace(/%completion/, `${completionPct}`)
            .replace(/%url/, url)
    );
};

const formatStatus = (status: string): string => {
    switch (status) {
        case 'started':
            return chalk.green(status);
        case 'done':
            return chalk.gray(status);
        case 'unstarted':
        default:
            return chalk.yellow(status);
    }
};

main();
