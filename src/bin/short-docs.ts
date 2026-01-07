#!/usr/bin/env node
import commander from 'commander';
import type { DocSlim } from '@shortcut/client';

import client from '../lib/client';
import spinner from '../lib/spinner';

const spin = spinner('Loading docs... %s ');
const log = console.log;

const program = commander
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

const main = async () => {
    if (!program.quiet) spin.start();

    let docs: DocSlim[] = [];

    try {
        // Use search endpoint if title is provided
        if (program.title) {
            const searchParams: {
                title: string;
                archived?: boolean;
                created_by_me?: boolean;
                followed_by_me?: boolean;
            } = {
                title: program.title,
            };

            if (program.archived !== undefined) {
                searchParams.archived = !!program.archived;
            }
            if (program.mine) {
                searchParams.created_by_me = true;
            }
            if (program.following) {
                searchParams.followed_by_me = true;
            }

            const result = await client.searchDocuments(searchParams);
            docs = result.data.data;
        } else {
            // Warn if search filters are used without title
            if (program.archived || program.mine || program.following) {
                if (!program.quiet) spin.stop(true);
                log('Note: --archived, --mine, and --following require --title for searching.');
                log('Listing all docs instead...');
                if (!program.quiet) spin.start();
            }
            // List all docs
            const result = await client.listDocs();
            docs = result.data;
        }
    } catch (e: any) {
        if (!program.quiet) spin.stop(true);
        log('Error fetching docs:', e.message || e);
        process.exit(1);
    }

    if (!program.quiet) spin.stop(true);

    if (docs.length === 0) {
        log('No docs found.');
        return;
    }

    docs.forEach((doc) => printDoc(doc));
};

const printDoc = (doc: DocSlim) => {
    if (program.idonly) {
        return log(doc.id);
    }
    log(`${doc.id} ${doc.title || '(Untitled)'}`);
    log(`\tURL: ${doc.app_url}`);
};

main();
