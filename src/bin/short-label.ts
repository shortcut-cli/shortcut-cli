#!/usr/bin/env node
import type { CreateLabelParams, Label, UpdateLabel } from '@shortcut/client';
import { Command } from 'commander';
import chalk from 'chalk';

import client from '../lib/client';
import spinner from '../lib/spinner';
import storyLib from '../lib/stories';

const spin = spinner();
const log = console.log;

const program = new Command()
    .usage('[command] [options]')
    .description('create labels or view stories for a label');

program
    .command('create')
    .description('create a new label')
    .option('-n, --name [text]', 'Set name of label, required', '')
    .option('-d, --description [text]', 'Set description of label', '')
    .option('-c, --color [hex]', 'Set label color in hex format like #3366cc', '')
    .option('-I, --idonly', 'Print only ID of label result')
    .action(createLabel);

program
    .command('update <idOrName>')
    .description('update an existing label')
    .option('-n, --name [text]', 'Set name of label', '')
    .option('-d, --description [text]', 'Set description of label', '')
    .option('-c, --color [hex]', 'Set label color in hex format like #3366cc', '')
    .option('-a, --archived', 'Archive label')
    .action(updateLabel);

program
    .command('stories <idOrName>')
    .description('list stories for a label by id or name')
    .option('-d, --detailed', 'Show more details for each story')
    .option('-f, --format [template]', 'Format each story output by template', '')
    .action(listLabelStories);

program.parse(process.argv);

async function createLabel(options: {
    name?: string;
    description?: string;
    color?: string;
    idonly?: boolean;
}) {
    if (!options.name) {
        log('Must provide --name');
        process.exit(1);
    }

    if (!options.idonly) spin.start();
    try {
        const input: CreateLabelParams = {
            name: options.name,
        };
        if (options.description) {
            input.description = options.description;
        }
        if (options.color) {
            input.color = options.color;
        }

        const label = await client.createLabel(input).then((r) => r.data);
        if (!options.idonly) spin.stop(true);

        if (options.idonly) {
            log(label.id);
            return;
        }
        printLabel(label);
    } catch (e: unknown) {
        if (!options.idonly) spin.stop(true);
        const error = e as { message?: string };
        log(`Error creating label: ${error.message ?? String(e)}`);
        process.exit(1);
    }
}

async function updateLabel(
    idOrName: string,
    options: {
        name?: string;
        description?: string;
        color?: string;
        archived?: boolean;
    }
) {
    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const label = storyLib.findLabel(entities, idOrName);
        if (!label) {
            spin.stop(true);
            log(`Label ${idOrName} not found`);
            process.exit(1);
        }

        const input: UpdateLabel = {};
        if (options.name) {
            input.name = options.name;
        }
        if (options.description) {
            input.description = options.description;
        }
        if (options.color) {
            input.color = options.color;
        }
        if (options.archived) {
            input.archived = true;
        }

        if (Object.keys(input).length === 0) {
            spin.stop(true);
            log('No updates provided. Use --name, --description, --color, or --archived');
            process.exit(1);
        }

        const updatedLabel = await client.updateLabel(label.id, input).then((r) => r.data);
        spin.stop(true);
        printLabel(updatedLabel);
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { message?: string };
        log(`Error updating label: ${error.message ?? String(e)}`);
        process.exit(1);
    }
}

async function listLabelStories(
    idOrName: string,
    options: {
        detailed?: boolean;
        format?: string;
    }
) {
    spin.start();
    try {
        const entities = await storyLib.fetchEntities();
        const label = storyLib.findLabel(entities, idOrName);
        if (!label) {
            spin.stop(true);
            log(`Label ${idOrName} not found`);
            process.exit(1);
        }

        const stories = await client.listLabelStories(label.id).then((r) => r.data);
        spin.stop(true);

        if (stories.length === 0) {
            log(`No stories found for label #${label.id} ${label.name}`);
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
        log(`Error fetching label stories: ${error.message ?? String(e)}`);
        process.exit(1);
    }
}

function printLabel(label: Label) {
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
