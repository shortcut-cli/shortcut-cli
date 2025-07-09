import commander from 'commander';
import debugging from 'debug';

import spinner from '../lib/spinner';
import client from '../lib/client';

const debug = debugging('short-api');
const log = console.log;
const logError = console.error;
const spin = spinner();

const parseKeyVal = (input: string, separator = '='): [string, string] => {
    const parts = input.split(separator);
    const key = parts.shift();
    const value = parts.join(separator);
    return [key, value];
};

const collect = (val: string, memo: string[]) => {
    memo.push(val);
    return memo;
};

const program = commander
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

const main = async () => {
    const [path] = program.args;
    if (!path) {
        logError('Error path argument is required');
        program.help();
        process.exit(1);
    }

    const method = (program.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {};
    const params: Record<string, any> = {};

    if (program.header) {
        program.header.forEach((h: string) => {
            const [key, value] = parseKeyVal(h, ':');
            headers[key] = value;
            debug(`adding header: ${key}: ${value}`);
        });
    }

    if (program.rawField) {
        program.rawField.forEach((f: string) => {
            const [key, value] = parseKeyVal(f);
            params[key] = value;
            debug(`adding raw field: ${key}: ${value}`);
        });
    }

    const requestOptions: any = {
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
    } catch (err: any) {
        spin.stop(true);
        logError(
            'Error calling API:',
            err.response ? JSON.stringify(err.response.data, null, 2) : err.message
        );
        process.exit(1);
    }
};

main();
