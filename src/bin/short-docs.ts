#!/usr/bin/env node
import { Command } from 'commander';
import type { DocSlim } from '@shortcut/client';

import client from '../lib/client';
import spinner from '../lib/spinner';

interface DocsOptions {
    archived?: boolean;
    mine?: boolean;
    following?: boolean;
    title?: string;
    quiet?: boolean;
    idonly?: boolean;
}

const spin = spinner('Loading docs... %s ');
const log = console.log;

const program = new Command()
    .description(
        `List and search Shortcut Docs. By default, lists all docs you have access to.
  Use --title to search docs by title.`
    )
    .usage('[options]')
    .option('-a, --archived', 'Search for archived docs (requires --title)')
    .option('-m, --mine', 'Search for docs created by me (requires --title)')
    .option('-f, --following', 'Search for docs I am following (requires --title)')
    .option('-t, --title [text]', 'Search docs by title (required for search filters)')
    .option('-q, --quiet', 'Print only doc output, no loading dialog')
    .option('-I, --idonly', 'Print only IDs of doc results')
    .parse(process.argv);

const opts = program.opts<DocsOptions>();

const main = async () => {
    if (!opts.quiet) spin.start();

    let docs: DocSlim[] = [];

    try {
        // Use search endpoint if title is provided
        if (opts.title) {
            const searchParams: {
                title: string;
                archived?: boolean;
                created_by_me?: boolean;
                followed_by_me?: boolean;
            } = {
                title: opts.title,
            };

            if (opts.archived !== undefined) {
                searchParams.archived = !!opts.archived;
            }
            if (opts.mine) {
                searchParams.created_by_me = true;
            }
            if (opts.following) {
                searchParams.followed_by_me = true;
            }

            const result = await client.searchDocuments(searchParams);
            docs = result.data.data;
        } else {
            // Warn if search filters are used without title
            if (opts.archived || opts.mine || opts.following) {
                if (!opts.quiet) spin.stop(true);
                log('Note: --archived, --mine, and --following require --title for searching.');
                log('Listing all docs instead...');
                if (!opts.quiet) spin.start();
            }
            // List all docs
            const result = await client.listDocs();
            docs = result.data;
        }
    } catch (e: unknown) {
        if (!opts.quiet) spin.stop(true);
        const error = e as { message?: string };
        log('Error fetching docs:', error.message ?? String(e));
        process.exit(1);
    }

    if (!opts.quiet) spin.stop(true);

    if (docs.length === 0) {
        log('No docs found.');
        return;
    }

    docs.forEach((doc) => printDoc(doc));
};

const printDoc = (doc: DocSlim) => {
    if (opts.idonly) {
        return log(doc.id);
    }
    log(`${doc.id} ${doc.title || '(Untitled)'}`);
    log(`\tURL: ${doc.app_url}`);
};

main();
