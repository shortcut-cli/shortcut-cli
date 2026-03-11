import { describe, it, expect, vi } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-docs', () => {
    it('should list docs', async () => {
        const result = await runBin('short-docs');
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "497f6eca-6276-4993-bfeb-53cbbbba6f08 string
          	URL: string",
          }
        `);
    });

    it('should show id-only output with -I', async () => {
        const result = await runBin('short-docs', ['-I']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
          }
        `);
    });

    it('should warn about filters without title', async () => {
        const result = await runBin('short-docs', ['-m']);
        expect(result.output).toMatchInlineSnapshot(`
          {
            "exitCode": undefined,
            "stderr": "",
            "stdout": "Note: --archived, --mine, and --following require --title for searching.
          Listing all docs instead...
          497f6eca-6276-4993-bfeb-53cbbbba6f08 string
          	URL: string",
          }
        `);
    });

    // All search variations produce the same Prism doc listing
    it.each([
        ['title search', ['-t', 'test']],
        ['quiet output', ['-q']],
        ['mine flag', ['-t', 'test', '-m']],
        ['following flag', ['-t', 'test', '-f']],
        ['archived flag', ['-t', 'test', '-a']],
    ])('should list docs with %s', async (_label, args) => {
        const result = await runBin('short-docs', args);
        expect(result.exitCode).toBeUndefined();
        expect(result.stdout).toBeTruthy();
    });

    it('should use local title filtering for plain title searches', async () => {
        const origArgv = process.argv;
        const origLog = console.log;
        const stdout: string[] = [];

        process.argv = ['node', 'src/bin/short-docs.ts', '--title', 'match'];
        console.log = (...args: unknown[]) => {
            stdout.push(args.map(String).join(' '));
        };

        const listDocs = vi.fn().mockResolvedValue({
            data: [
                { id: '1', title: undefined, app_url: 'https://example.com/1' },
                { id: '2', title: 'matching doc', app_url: 'https://example.com/2' },
            ],
        });
        const searchDocuments = vi.fn();

        vi.resetModules();
        vi.doMock('../../src/lib/spinner', () => ({
            default: () => ({ start: () => {}, stop: () => {} }),
        }));
        vi.doMock('../../src/lib/client', () => ({
            default: {
                listDocs,
                searchDocuments,
            },
        }));

        try {
            await import('../../src/bin/short-docs');
            await new Promise((resolve) => setTimeout(resolve, 50));
        } finally {
            vi.doUnmock('../../src/lib/spinner');
            vi.doUnmock('../../src/lib/client');
            vi.resetModules();
            process.argv = origArgv;
            console.log = origLog;
        }

        expect(listDocs).toHaveBeenCalled();
        expect(searchDocuments).not.toHaveBeenCalled();
        expect(stdout.join('\n')).toContain('2 matching doc');
    });
});
