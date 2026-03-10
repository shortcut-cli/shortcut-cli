import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

const TEST_UUID = '12345678-1234-1234-1234-123456789012';

describe('short-doc', () => {
    it.each([
        ['no args', []],
        ['unknown command', ['foobar']],
        ['invalid non-UUID argument', ['not-a-uuid-and-not-a-command']],
    ])('should exit 1 with %s', async (_label, args) => {
        const result = await runBin('short-doc', args);
        expect(result.output.exitCode).toBe(1);
    });

    describe('view', () => {
        it('should view a doc by uuid', async () => {
            const result = await runBin('short-doc', ['view', TEST_UUID]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "string
              ID:       497f6eca-6276-4993-bfeb-53cbbbba6f08
              URL:      string
              Created:  2019-08-24T14:15:22Z
              Archived: true

              Content (Markdown):
              string",
              }
            `);
        });

        it('should treat a UUID arg without "view" as view', async () => {
            const result = await runBin('short-doc', [TEST_UUID]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "string
              ID:       497f6eca-6276-4993-bfeb-53cbbbba6f08
              URL:      string
              Created:  2019-08-24T14:15:22Z
              Archived: true

              Content (Markdown):
              string",
              }
            `);
        });

        it('should view a doc with --quiet', async () => {
            const result = await runBin('short-doc', ['view', TEST_UUID, '--quiet']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "string",
              }
            `);
        });

        it('should view a doc with --html', async () => {
            const result = await runBin('short-doc', ['view', TEST_UUID, '--html']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "string
              ID:       497f6eca-6276-4993-bfeb-53cbbbba6f08
              URL:      string
              Created:  2019-08-24T14:15:22Z
              Archived: true

              Content (Markdown):
              string

              Content (HTML):
              string",
              }
            `);
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-doc', ['view', TEST_UUID, '--open']);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('create', () => {
        it('should exit 1 when --title is not provided', async () => {
            const result = await runBin('short-doc', ['create', '--content', '<p>Hello</p>']);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('Must provide --title');
        });

        it('should exit 1 when --content is not provided', async () => {
            const result = await runBin('short-doc', ['create', '--title', 'Test Doc']);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('Must provide --content');
        });

        it('should create a doc with --title and --content', async () => {
            const result = await runBin('short-doc', [
                'create',
                '--title',
                'Test Doc',
                '--content',
                '<p>Hello</p>',
            ]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "Doc created successfully!
              string
              ID:       497f6eca-6276-4993-bfeb-53cbbbba6f08
              URL:      string
              Created:  2019-08-24T14:15:22Z
              Archived: true

              Content (Markdown):
              string",
              }
            `);
        });

        it('should print only the id with --idonly', async () => {
            const result = await runBin('short-doc', [
                'create',
                '--title',
                'ID Only Doc',
                '--content',
                '<p>Hello</p>',
                '--idonly',
            ]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "497f6eca-6276-4993-bfeb-53cbbbba6f08",
              }
            `);
        });

        it('should create with --markdown flag without crashing', async () => {
            const result = await runBin('short-doc', [
                'create',
                '--title',
                'Markdown Doc',
                '--content',
                '# Hello World',
                '--markdown',
            ]);
            expect(result.output.exitCode).toBeUndefined();
            expect(result.output.stdout).toBeTruthy();
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-doc', [
                'create',
                '--title',
                'Open Doc',
                '--content',
                '<p>Hello</p>',
                '--open',
            ]);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('update', () => {
        it('should exit 1 when no update options provided', async () => {
            const result = await runBin('short-doc', ['update', TEST_UUID]);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain(
                'Must provide --title and/or --content to update'
            );
        });

        it('should update a doc with --title', async () => {
            const result = await runBin('short-doc', ['update', TEST_UUID, '--title', 'New Title']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "Doc updated successfully!
              string
              ID:       497f6eca-6276-4993-bfeb-53cbbbba6f08
              URL:      string
              Created:  2019-08-24T14:15:22Z
              Archived: true

              Content (Markdown):
              string",
              }
            `);
        });

        it('should update with --content and --markdown without crashing', async () => {
            const result = await runBin('short-doc', [
                'update',
                TEST_UUID,
                '--content',
                '# Updated Content',
                '--markdown',
            ]);
            expect(result.output.exitCode).toBeUndefined();
            expect(result.output.stdout).toBeTruthy();
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-doc', [
                'update',
                TEST_UUID,
                '--title',
                'Open Doc',
                '--open',
            ]);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('delete', () => {
        it('should exit 1 when --confirm is not provided', async () => {
            const result = await runBin('short-doc', ['delete', TEST_UUID]);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('Deletion requires --confirm flag');
        });

        it('should delete a doc with --confirm', async () => {
            const result = await runBin('short-doc', ['delete', TEST_UUID, '--confirm']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "Doc 12345678-1234-1234-1234-123456789012 deleted successfully.",
              }
            `);
        });
    });
});
