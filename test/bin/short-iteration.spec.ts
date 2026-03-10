import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-iteration', () => {
    describe('view', () => {
        it('should view an iteration by id', async () => {
            const result = await runBin('short-iteration', ['view', '123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Description: string
              Status:      string
              Start Date:  2019-08-24T14:15:22Z
              End Date:    2019-08-24T14:15:22Z
              Teams:       497f6eca-6276-4993-bfeb-53cbbbba6f08
              Stories:     0 (0 done)
              Points:      0 (0 done)
              Completion:  0%
              URL:         string
              ",
              }
            `);
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-iteration', ['view', '123', '--open']);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('create', () => {
        it('should exit 1 when --name is missing', async () => {
            const result = await runBin('short-iteration', [
                'create',
                '--start-date',
                '2025-01-01',
                '--end-date',
                '2025-01-14',
            ]);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('Must provide --name');
        });

        it('should exit 1 when --start-date is missing', async () => {
            const result = await runBin('short-iteration', [
                'create',
                '--name',
                'Sprint 1',
                '--end-date',
                '2025-01-14',
            ]);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('Must provide --start-date');
        });

        it('should exit 1 when --end-date is missing', async () => {
            const result = await runBin('short-iteration', [
                'create',
                '--name',
                'Sprint 1',
                '--start-date',
                '2025-01-01',
            ]);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('Must provide --end-date');
        });

        it('should create an iteration with required options', async () => {
            const result = await runBin('short-iteration', [
                'create',
                '--name',
                'Sprint 1',
                '--start-date',
                '2025-01-01',
                '--end-date',
                '2025-01-14',
            ]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Description: string
              Status:      string
              Start Date:  2019-08-24T14:15:22Z
              End Date:    2019-08-24T14:15:22Z
              Teams:       497f6eca-6276-4993-bfeb-53cbbbba6f08
              Stories:     0 (0 done)
              Points:      0 (0 done)
              Completion:  0%
              URL:         string
              ",
              }
            `);
        });

        it('should print only the id with --idonly', async () => {
            const result = await runBin('short-iteration', [
                'create',
                '--name',
                'Sprint ID',
                '--start-date',
                '2025-01-01',
                '--end-date',
                '2025-01-14',
                '--idonly',
            ]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "1",
              }
            `);
        });

        it.each([
            [
                '--description and --team',
                [
                    'create',
                    '--name',
                    'S',
                    '--start-date',
                    '2025-01-01',
                    '--end-date',
                    '2025-01-14',
                    '--description',
                    'desc',
                    '--team',
                    'test-team',
                ],
            ],
        ])('should create with %s without crashing', async (_label, args) => {
            const result = await runBin('short-iteration', args);
            expect(result.output.exitCode).toBeUndefined();
            expect(result.output.stdout).toBeTruthy();
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-iteration', [
                'create',
                '--name',
                'Open Sprint',
                '--start-date',
                '2025-01-01',
                '--end-date',
                '2025-01-14',
                '--open',
            ]);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('update', () => {
        it('should exit 1 when no update options provided', async () => {
            const result = await runBin('short-iteration', ['update', '123']);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('No updates provided');
        });

        it.each([
            ['--name', ['update', '123', '--name', 'New Sprint Name']],
            ['--description', ['update', '123', '--description', 'Updated description']],
            [
                '--start-date and --end-date',
                ['update', '123', '--start-date', '2025-02-01', '--end-date', '2025-02-14'],
            ],
            ['--team', ['update', '123', '--team', 'string']],
        ])('should update with %s without crashing', async (_label, args) => {
            const result = await runBin('short-iteration', args);
            expect(result.output.exitCode).toBeUndefined();
            expect(result.output.stdout).toBeTruthy();
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-iteration', [
                'update',
                '123',
                '--name',
                'Open Sprint',
                '--open',
            ]);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('delete', () => {
        it('should delete an iteration by id', async () => {
            const result = await runBin('short-iteration', ['delete', '123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "Iteration #123 deleted successfully",
              }
            `);
        });
    });

    describe('stories', () => {
        it('should list stories in an iteration', async () => {
            const result = await runBin('short-iteration', ['stories', '123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "Stories in iteration #123:

              #1 string
                Type: string | State: string | Owners: string
                Points: 0
              ",
              }
            `);
        });

        it('should list stories with custom format', async () => {
            const result = await runBin('short-iteration', [
                'stories',
                '123',
                '--format',
                '%id %t',
            ]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "Stories in iteration #123:

              1 string",
              }
            `);
        });
    });
});
