#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';

import type { CustomField } from '@shortcut/client';

const spin = spinner();
const log = console.log;

const program = new Command()
    .usage('<id> [options]')
    .description('view a custom field by id')
    .parse(process.argv);

const id = program.args[0];

if (!id) {
    program.outputHelp();
    process.exit(1);
}

async function main() {
    spin.start();
    try {
        const field = await client.getCustomField(id).then((r) => r.data);
        spin.stop(true);
        printField(field);
    } catch (e: unknown) {
        spin.stop(true);
        const error = e as { response?: { status?: number }; message?: string };
        if (error.response?.status === 404) {
            log(`Custom field ${id} not found`);
        } else {
            log(`Error fetching custom field: ${error.message ?? String(e)}`);
        }
        process.exit(1);
    }
}

function printField(field: CustomField) {
    log(chalk.bold(field.id) + chalk.blue(` ${field.name}`));
    log(chalk.bold('Type:          ') + ` ${field.field_type}`);
    log(chalk.bold('Enabled:       ') + ` ${field.enabled}`);
    log(chalk.bold('Story Types:   ') + ` ${(field.story_types || []).join(', ') || '_'}`);
    log(chalk.bold('Position:      ') + ` ${field.position}`);
    log(chalk.bold('Fixed:         ') + ` ${field.fixed_position || false}`);
    if (field.canonical_name) {
        log(chalk.bold('Canonical:     ') + ` ${field.canonical_name}`);
    }
    if (field.description) {
        log(chalk.bold('Description:   ') + ` ${field.description}`);
    }
    if (field.values?.length) {
        log(chalk.bold('Values:'));
        field.values.forEach((value) => {
            log(
                `  - ${value.value} (${value.id}) enabled=${value.enabled} position=${value.position}${value.color_key ? ` color=${value.color_key}` : ''}`
            );
        });
    }
    log(chalk.bold('Created:       ') + ` ${field.created_at}`);
    log(chalk.bold('Updated:       ') + ` ${field.updated_at}`);
}

main();
