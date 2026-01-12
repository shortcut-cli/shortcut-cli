#!/usr/bin/env node
import { Command } from 'commander';
import debugging from 'debug';

import spinner from '../lib/spinner';
import client from '../lib/client';

interface ApiOptions {
    method?: string;
    header?: string[];
    rawField?: string[];
}

const debug = debugging('short-api');
const log = console.log;
const logError = console.error;
const spin = spinner();

const parseKeyVal = (input: string, separator = '='): [string, string] => {
    const parts = input.split(separator);
    const key = parts.shift() ?? '';
    const value = parts.join(separator);
    return [key, value];
};

const collect = (val: string, memo: string[]) => {
    memo.push(val);
    return memo;
};

const program = new Command()
    .description('Make a request to the Shortcut API.')
    .arguments('<path>')
    .option('-X, --method <method>', 'The HTTP method to use.', 'GET')
    .option(
        '-H, --header <header>',
        'Add a header to the request (e.g., "Content-Type: application/json"). Can be specified multiple times.',
        collect,
        []
    )
    .option(
        '-f, --raw-field <key=value>',
        'Add a string parameter. Can be specified multiple times.',
        collect,
        []
    )
    .on('--help', () => {
        log('');
        log('Examples:');
        log(`  $ short api /search/iterations -f page_size=10 -f query=123`);
        log(`  $ short api /stories -X POST -f 'name=My new story' -f project_id=123`);
        log('  # jq can be used to shorten the response output.');
        log(
            `  $ short api /search/iterations -f page_size=10 -f query=123 | jq '.data[] | {id, name}'`
        );
    })
    .parse(process.argv);

const opts = program.opts<ApiOptions>();

const main = async () => {
    const [path] = program.args;
    if (!path) {
        logError('Error path argument is required');
        program.help();
        process.exit(1);
    }

    const method = (opts.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {};
    const params: Record<string, string> = {};

    if (opts.header) {
        opts.header.forEach((h: string) => {
            const [key, value] = parseKeyVal(h, ':');
            headers[key] = value;
            debug(`adding header: ${key}: ${value}`);
        });
    }

    if (opts.rawField) {
        opts.rawField.forEach((f: string) => {
            const [key, value] = parseKeyVal(f);
            params[key] = value;
            debug(`adding raw field: ${key}: ${value}`);
        });
    }

    interface RequestOptions {
        path: string;
        method: string;
        headers: Record<string, string>;
        body?: Record<string, string>;
        query?: Record<string, string>;
    }

    const requestOptions: RequestOptions = {
        path: '/api/v3' + (path.startsWith('/') ? '' : '/') + path,
        method,
        headers,
    };

    const bodyMethods = ['POST', 'PUT', 'PATCH'];
    if (bodyMethods.includes(method)) {
        requestOptions.body = params;
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    } else {
        requestOptions.query = params;
    }

    try {
        debug('request options:', requestOptions);
        spin.start();
        const response = await client.request(requestOptions);
        spin.stop(true);
        log(JSON.stringify(response.data, null, 2));
    } catch (err: unknown) {
        spin.stop(true);
        const error = err as { response?: { data: unknown }; message?: string };
        logError(
            'Error calling API:',
            error.response ? JSON.stringify(error.response.data, null, 2) : error.message
        );
        process.exit(1);
    }
};

main();
