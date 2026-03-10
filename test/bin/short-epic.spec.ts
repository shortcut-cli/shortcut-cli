import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

describe('short-epic', () => {
    describe('create', () => {
        it('should exit 1 when --name is not provided', async () => {
            const result = await runBin('short-epic', ['create']);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('Must provide --name');
        });

        it('should create an epic with --name', async () => {
            const result = await runBin('short-epic', ['create', '--name', 'Test Epic']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Description:	string
              State:		string
              Archived:	yes
              Milestone:	1
              Objectives:	1
              Deadline:	2019-08-24T14:15:22Z
              Planned Start:	2019-08-24T14:15:22Z
              Owners:		497f6eca-6276-4993-bfeb-53cbbbba6f08
              Teams:		497f6eca-6276-4993-bfeb-53cbbbba6f08
              Labels:		string
              URL:		string",
              }
            `);
        });

        it('should print only the id with --idonly', async () => {
            const result = await runBin('short-epic', [
                'create',
                '--name',
                'ID Only Epic',
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
                    '--deadline',
                    '2025-12-31',
                    '--planned-start',
                    '2025-01-01',
                    '--owners',
                    'u',
                    '--team',
                    't',
                    '--label',
                    'l',
                    '--milestone',
                    '123',
                    '--objectives',
                    '456',
                ],
            ],
            ['--description only', ['create', '--name', 'Desc', '--description', 'A desc']],
        ])('should create with %s without crashing', async (_label, args) => {
            const result = await runBin('short-epic', args);
            expect(result.output.exitCode).toBeUndefined();
            expect(result.output.stdout).toBeTruthy();
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-epic', ['create', '--name', 'Open Epic', '--open']);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('view', () => {
        it('should view an epic by id', async () => {
            const result = await runBin('short-epic', ['view', '123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Description:	string
              State:		string
              Archived:	yes
              Milestone:	1
              Objectives:	1
              Deadline:	2019-08-24T14:15:22Z
              Planned Start:	2019-08-24T14:15:22Z
              Owners:		497f6eca-6276-4993-bfeb-53cbbbba6f08
              Teams:		497f6eca-6276-4993-bfeb-53cbbbba6f08
              Labels:		string
              URL:		string",
              }
            `);
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-epic', ['view', '123', '--open']);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('update', () => {
        it('should exit 1 when no update options provided', async () => {
            const result = await runBin('short-epic', ['update', '123']);
            expect(result.output.exitCode).toBe(1);
            expect(result.output.stdout).toContain('No updates provided');
        });

        it.each([
            ['--name', ['update', '123', '--name', 'New Name']],
            ['--description', ['update', '123', '--description', 'New desc']],
            [
                'many options',
                [
                    'update',
                    '123',
                    '--state',
                    'done',
                    '--deadline',
                    '2025-12-31',
                    '--planned-start',
                    '2025-06-01',
                    '--owners',
                    'u',
                    '--team',
                    't',
                    '--label',
                    'l',
                    '--milestone',
                    '456',
                    '--objectives',
                    '789',
                    '--archived',
                ],
            ],
        ])('should update with %s without crashing', async (_label, args) => {
            const result = await runBin('short-epic', args);
            expect(result.output.exitCode).toBeUndefined();
            expect(result.output.stdout).toBeTruthy();
        });

        it('should open browser with --open', async () => {
            const result = await runBin('short-epic', [
                'update',
                '123',
                '--name',
                'Open Epic',
                '--open',
            ]);
            expect(result.execCalls.length).toBeGreaterThan(0);
            expect(String(result.execCalls[0][0])).toContain('open ');
        });
    });

    describe('stories', () => {
        it('should list stories in an epic', async () => {
            const result = await runBin('short-epic', ['stories', '123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
                  	Type:       string/_
                  	Team:       _
                  	Project:    string (#1)
                  	Epic:       string (#1)
                  	Iteration:  string (#1)
                  	Requester:  _
                  	Owners:     string (string)
                  	State:      string (#1)
                  	Labels:     string (#1)
                  	URL:        https://app.shortcut.com/test-workspace/story/1
                  	Created:    2019-08-24T14:15:22Z
                  	Updated:    _
                  	Archived:   true
                  ",
              }
            `);
        });

        it('should list detailed stories with --detailed', async () => {
            const result = await runBin('short-epic', ['stories', '123', '--detailed']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Desc:      string
              Team:      _
              Owners:    string (string)
              Requester: _
              Type:      string/_
              Label:     #1 string
              Project:   #1 string
              Epic:      #1 string
              Iteration: #1 string
              State:     #1 string
              Created:   2019-08-24T14:15:22Z
              URL:       https://app.shortcut.com/test-workspace/story/1
              Archived:  true
              Completed:  2019-08-24T14:15:22Z
              ",
              }
            `);
        });

        it('should list stories with --format', async () => {
            const result = await runBin('short-epic', ['stories', '123', '--format', '%id %t']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "1 string",
              }
            `);
        });
    });

    describe('comments', () => {
        it('should list comments on an epic', async () => {
            const result = await runBin('short-epic', ['comments', '123']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 78424c75-5c41-4b25-9735-3c9f7d05c59e
              Created: 2019-08-24T14:15:22Z
              [deleted]
              URL: string
              ",
              }
            `);
        });
    });
});
