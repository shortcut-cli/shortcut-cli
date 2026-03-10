import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-objective', () => {
    it('should exit 1 with no args', async () => {
        const result = await runBin('short-objective');
        expect(result.output.exitCode).toBe(1);
    });

    describe('view', () => {
        it('should view an objective by id', async () => {
            const result = await runBin('short-objective', ['view', '123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              State:		string
              Started:	yes
              Completed:	yes
              Archived:	yes
              Description:	string
              Categories:	string
              Started At:	2019-08-24T14:15:22Z
              Completed At:	2019-08-24T14:15:22Z
              Updated:	2019-08-24T14:15:22Z
              URL:		string",
              }
            `);
        });

        it('should treat a numeric arg without "view" as view', async () => {
            const result = await runBin('short-objective', ['123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              State:		string
              Started:	yes
              Completed:	yes
              Archived:	yes
              Description:	string
              Categories:	string
              Started At:	2019-08-24T14:15:22Z
              Completed At:	2019-08-24T14:15:22Z
              Updated:	2019-08-24T14:15:22Z
              URL:		string",
              }
            `);
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-objective', ['view', '123', '--open']);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('create', () => {
        it('should exit 1 when --name is not provided', async () => {
            const result = await runBin('short-objective', ['create']);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('Must provide --name');
        });

        it('should create an objective with --name', async () => {
            const result = await runBin('short-objective', ['create', '--name', 'Test Objective']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              State:		string
              Started:	yes
              Completed:	yes
              Archived:	yes
              Description:	string
              Categories:	string
              Started At:	2019-08-24T14:15:22Z
              Completed At:	2019-08-24T14:15:22Z
              Updated:	2019-08-24T14:15:22Z
              URL:		string",
              }
            `);
        });

        it('should print only the id with --idonly', async () => {
            const result = await runBin('short-objective', [
                'create',
                '--name',
                'ID Only Objective',
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
                'all options',
                [
                    'create',
                    '--name',
                    'Full',
                    '--description',
                    'desc',
                    '--state',
                    'in progress',
                    '--started-at',
                    '2025-01-01',
                    '--completed-at',
                    '2025-12-31',
                ],
            ],
            ['state "done"', ['create', '--name', 'Done', '--state', 'done']],
            ['state "to do"', ['create', '--name', 'Todo', '--state', 'to do']],
            [
                'ISO --started-at',
                ['create', '--name', 'ISO', '--started-at', '2025-06-15T10:00:00Z'],
            ],
        ])('should create with %s without crashing', async (_label, args) => {
            const result = await runBin('short-objective', args);
            expect(result.output.exitCode).toBeUndefined();
            expect(result.output.stdout).toBeTruthy();
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-objective', [
                'create',
                '--name',
                'Open Objective',
                '--open',
            ]);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('update', () => {
        it('should exit 1 when no update options provided', async () => {
            const result = await runBin('short-objective', ['update', '123']);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('No updates provided');
        });

        it.each([
            ['--name', ['update', '123', '--name', 'New Name']],
            ['--description', ['update', '123', '--description', 'Updated desc']],
            ['--state', ['update', '123', '--state', 'done']],
            [
                '--started-at and --completed-at',
                ['update', '123', '--started-at', '2025-01-01', '--completed-at', '2025-12-31'],
            ],
            ['--archived', ['update', '123', '--archived']],
        ])('should update with %s without crashing', async (_label, args) => {
            const result = await runBin('short-objective', args);
            expect(result.output.exitCode).toBeUndefined();
            expect(result.output.stdout).toBeTruthy();
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-objective', [
                'update',
                '123',
                '--name',
                'Open Objective',
                '--open',
            ]);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('epics', () => {
        it('should list epics in an objective', async () => {
            const result = await runBin('short-objective', ['epics', '123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "Epics in objective #123:

              #1 string
                State: string | Started: yes | Completed: yes
                URL: string
              ",
              }
            `);
        });
    });
});
