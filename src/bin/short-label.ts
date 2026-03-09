#!/usr/bin/env node
import { Command } from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';
import storyLib from '../lib/stories';

const spin = spinner();
const log = console.log;

const program = new Command()
    .usage('[command] [options]')
    .description('view related stories for a label');

program
    .command('stories <idOrName>')
    .description('list stories for a label by id or name')
    .option('-d, --detailed', 'Show more details for each story')
    .option('-f, --format [template]', 'Format each story output by template', '')
    .action(listLabelStories);

program.parse(process.argv);

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
