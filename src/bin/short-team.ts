#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';
import storyLib from '../lib/stories';

import type { Group } from '@shortcut/client';

const spin = spinner();
const log = console.log;

const program = new Command()
    .usage('[command] [options]')
    .description('view a team or list its stories');

program.command('view <idOrName>').description('view a team by id or name').action(viewTeam);

program
    .command('stories <idOrName>')
    .description('list stories for a team by id or name')
    .option('-d, --detailed', 'Show more details for each story')
    .option('-f, --format [template]', 'Format each story output by template', '')
    .action(listTeamStories);

const args = process.argv.slice(2);
if (args.length > 0 && args[0] !== 'view' && args[0] !== 'stories') {
    process.argv.splice(2, 0, 'view');
}

program.parse(process.argv);

if (args.length === 0) {
    program.outputHelp();
    process.exit(1);
}

async function viewTeam(idOrName: string) {
    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const team = storyLib.findGroup(entities, idOrName);
        if (!team) {
            spin.stop(true);
            log(`Team ${idOrName} not found`);
            process.exit(1);
        }

        const fullTeam = await client.getGroup(team.id).then((r) => r.data);
        spin.stop(true);
        printTeam(fullTeam);
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { message?: string };
        log(`Error fetching team: ${error.message ?? String(e)}`);
        process.exit(1);
    }
}

async function listTeamStories(
    idOrName: string,
    options: {
        detailed?: boolean;
        format?: string;
    }
) {
    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const team = storyLib.findGroup(entities, idOrName);
        if (!team) {
            spin.stop(true);
            log(`Team ${idOrName} not found`);
            process.exit(1);
        }

        const stories = await client.listGroupStories(team.id).then((r) => r.data);
        spin.stop(true);

        if (stories.length === 0) {
            log(`No stories found for team #${team.id} ${team.name}`);
            return;
        }

        stories
            .map((story) => storyLib.hydrateStory(entities, story))
            .forEach(
                options.detailed
                    ? (story) => storyLib.printDetailedStory(story, entities)
                    : storyLib.printFormattedStory({ format: options.format })
            );
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { message?: string };
        log(`Error fetching team stories: ${error.message ?? String(e)}`);
        process.exit(1);
    }
}

function printTeam(team: Group) {
    log(chalk.bold(`#${team.id}`) + chalk.blue(` ${team.name}`));
    log(chalk.bold('Mention:       ') + ` ${team.mention_name}`);
    log(chalk.bold('Stories:       ') + ` ${team.num_stories}`);
    log(chalk.bold('Started:       ') + ` ${team.num_stories_started}`);
    log(chalk.bold('Backlog:       ') + ` ${team.num_stories_backlog}`);
    log(chalk.bold('Epics Started: ') + ` ${team.num_epics_started}`);
    log(chalk.bold('Members:       ') + ` ${team.member_ids.length}`);
    log(chalk.bold('Workflows:     ') + ` ${team.workflow_ids.length}`);
    log(chalk.bold('Archived:      ') + ` ${team.archived}`);
    if (team.description) {
        log(chalk.bold('Description:   ') + ` ${team.description}`);
    }
    if (team.color) {
        log(chalk.bold('Color:         ') + ` ${team.color}`);
    }
    log(chalk.bold('URL:           ') + ` ${team.app_url}`);
    log();
}
