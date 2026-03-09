#!/usr/bin/env node
import type { CustomField } from '@shortcut/client';
import chalk from 'chalk';
import { Command } from 'commander';

import client from '../lib/client';
import spinner from '../lib/spinner';

interface CustomFieldsOptions {
    disabled?: boolean;
    search?: string;
}

const spin = spinner();
const log = console.log;

const program = new Command()
    .description('Display custom fields available for stories')
    .option('-d, --disabled', 'List custom fields including disabled', '')
    .option('-s, --search [query]', 'List custom fields with name containing query', '')
    .parse(process.argv);

const opts = program.opts<CustomFieldsOptions>();

async function main() {
    spin.start();
    const fields = await client.listCustomFields().then((r) => r.data);
    spin.stop(true);

    const searchMatch = new RegExp(opts.search ?? '', 'i');
    fields
        .filter(
            (field) => !!`${field.id} ${field.name} ${field.description || ''}`.match(searchMatch)
        )
        .forEach(printFieldSummary);
}

function printFieldSummary(field: CustomField) {
    if (!field.enabled && !opts.disabled) return;
    log(chalk.bold(field.id) + chalk.blue(` ${field.name}`));
    log(chalk.bold('Type:          ') + ` ${field.field_type}`);
    log(chalk.bold('Enabled:       ') + ` ${field.enabled}`);
    log(chalk.bold('Story Types:   ') + ` ${(field.story_types || []).join(', ') || '_'}`);
    log(chalk.bold('Values:        ') + ` ${field.values?.length || 0}`);
    if (field.description) {
        log(chalk.bold('Description:   ') + ` ${field.description}`);
    }
    log();
}

main();
