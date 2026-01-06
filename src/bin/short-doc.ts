#!/usr/bin/env node
import { exec } from 'child_process';
import os from 'os';

import type { Doc, CreateDoc, UpdateDoc } from '@shortcut/client';
import commander from 'commander';
import chalk from 'chalk';

import client from '../lib/client';
import spinner from '../lib/spinner';

const spin = spinner();
const log = console.log;

const program = commander.usage('[command] [options]').description('view, create, or update a doc');

program
    .command('view <id>')
    .description('view a doc by ID')
    .option('--html', 'Include HTML content in output')
    .option('-O, --open', 'Open doc in browser')
    .option('-q, --quiet', 'Print only doc content, no metadata')
    .action(viewDoc);

program
    .command('create')
    .description('create a new doc')
    .option('-t, --title <text>', 'Set title of doc (required)')
    .option('-c, --content <text>', 'Set content of doc (required)')
    .option('--markdown', 'Treat content as markdown (default is HTML)')
    .option('-I, --idonly', 'Print only ID of doc result')
    .option('-O, --open', 'Open doc in browser')
    .action(createDoc);

program
    .command('update <id>')
    .description('update an existing doc')
    .option('-t, --title <text>', 'Update title of doc')
    .option('-c, --content <text>', 'Update content of doc')
    .option('--markdown', 'Treat content as markdown (default is HTML)')
    .option('-O, --open', 'Open doc in browser')
    .action(updateDoc);

program
    .command('delete <id>')
    .description('delete a doc')
    .option('--confirm', 'Confirm deletion without prompting')
    .action(deleteDoc);

// If first argument looks like a UUID, treat it as view command
const args = process.argv.slice(2);
if (args.length > 0 && isUUID(args[0])) {
    // Insert 'view' command before the ID
    process.argv.splice(2, 0, 'view');
}

program.parse(process.argv);

// Show help and exit with error if no command provided
if (args.length === 0) {
    program.outputHelp();
    process.exit(1);
} else if (args.length > 0 && !isUUID(args[0])) {
    const validCommands = ['view', 'create', 'update', 'delete'];
    if (!validCommands.includes(args[0]) && !args[0].startsWith('-')) {
        console.error(`Error: Unknown command or invalid doc ID: ${args[0]}`);
        console.error('Run "short doc --help" for usage information.');
        process.exit(1);
    }
}

function isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

async function viewDoc(id: string, options: any) {
    if (!options.quiet) spin.start();

    let doc: Doc;
    try {
        const params: { content_format?: 'markdown' | 'html' } = {};
        if (options.html) {
            params.content_format = 'html';
        }
        doc = await client.getDoc(id, params).then((r) => r.data);
    } catch (e: any) {
        if (!options.quiet) spin.stop(true);
        log('Error fetching doc:', e.message || e);
        process.exit(1);
    }

    if (!options.quiet) spin.stop(true);

    if (options.quiet) {
        // Just print the content
        log(doc.content_markdown || doc.content_html || '(No content)');
    } else {
        printDoc(doc, options.html);
    }

    if (options.open) {
        openURL(doc.app_url);
    }
}

async function createDoc(options: any) {
    if (!options.title) {
        log('Must provide --title');
        process.exit(1);
    }
    if (!options.content) {
        log('Must provide --content');
        process.exit(1);
    }

    if (!options.idonly) spin.start();

    const docData: CreateDoc = {
        title: options.title,
        content: options.content,
        content_format: options.markdown ? 'markdown' : 'html',
    };

    let doc: Doc;
    try {
        const result = await client.createDoc(docData);
        // createDoc returns DocSlim, so we need to fetch the full doc
        doc = await client.getDoc(result.data.id).then((r) => r.data);
    } catch (e: any) {
        if (!options.idonly) spin.stop(true);
        log('Error creating doc:', e.message || e);
        process.exit(1);
    }

    if (!options.idonly) spin.stop(true);

    if (options.idonly) {
        log(doc.id);
    } else {
        log(chalk.green('Doc created successfully!'));
        printDoc(doc);
    }

    if (options.open) {
        openURL(doc.app_url);
    }
}

async function updateDoc(id: string, options: any) {
    if (!options.title && !options.content) {
        log('Must provide --title and/or --content to update');
        process.exit(1);
    }

    spin.start();

    const docData: UpdateDoc = {};
    if (options.title) {
        docData.title = options.title;
    }
    if (options.content) {
        docData.content = options.content;
        docData.content_format = options.markdown ? 'markdown' : 'html';
    }

    let doc: Doc;
    try {
        doc = await client.updateDoc(id, docData).then((r) => r.data);
    } catch (e: any) {
        spin.stop(true);
        log('Error updating doc:', e.message || e);
        process.exit(1);
    }

    spin.stop(true);

    log(chalk.green('Doc updated successfully!'));
    printDoc(doc);

    if (options.open) {
        openURL(doc.app_url);
    }
}

async function deleteDoc(id: string, options: any) {
    if (!options.confirm) {
        log('Deletion requires --confirm flag');
        log('Usage: short doc delete <id> --confirm');
        process.exit(1);
    }

    spin.start();

    try {
        await client.deleteDoc(id, {});
    } catch (e: any) {
        spin.stop(true);
        log('Error deleting doc:', e.message || e);
        process.exit(1);
    }

    spin.stop(true);

    log(chalk.green(`Doc ${id} deleted successfully.`));
}

function printDoc(doc: Doc, includeHtml = false) {
    log(chalk.blue.bold(doc.title || '(Untitled)'));
    log(chalk.bold('ID:') + `       ${doc.id}`);
    log(chalk.bold('URL:') + `      ${doc.app_url}`);
    log(chalk.bold('Created:') + `  ${doc.created_at}`);
    if (doc.created_at !== doc.updated_at) {
        log(chalk.bold('Updated:') + `  ${doc.updated_at}`);
    }
    if (doc.archived) {
        log(chalk.bold('Archived:') + ` ${doc.archived}`);
    }
    log();
    if (doc.content_markdown) {
        log(chalk.bold('Content (Markdown):'));
        log(doc.content_markdown);
    }
    if (includeHtml && doc.content_html) {
        log();
        log(chalk.bold('Content (HTML):'));
        log(doc.content_html);
    }
}

function openURL(url: string) {
    const open = os.platform() === 'darwin' ? 'open' : 'xdg-open';
    exec(`${open} '${url}'`);
}
