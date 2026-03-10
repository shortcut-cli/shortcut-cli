import { describe, it, expect } from 'vitest';

import { runBin } from '../helpers/run-bin';

// Prism mock returns labels with name "string"
const MOCK_LABEL_NAME = 'string';

describe('short-label', () => {
    describe('create', () => {
        it('should create a label with --name', async () => {
            const result = await runBin('short-label', ['create', '--name', 'Test Label']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              Color:          string
              Description:    string
              Archived:       true
              ",
              }
            `);
        });

        it('should exit 1 when --name is not provided', async () => {
            const result = await runBin('short-label', ['create']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": 1,
                "stderr": "",
                "stdout": "Must provide --name",
              }
            `);
        });

        it('should print only the id with --idonly', async () => {
            const result = await runBin('short-label', [
                'create',
                '--name',
                'ID Label',
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

        it('should create with --description and --color (same format as plain create)', async () => {
            const result = await runBin('short-label', [
                'create',
                '--name',
                'Styled Label',
                '--description',
                'A test label',
                '--color',
                '#3366cc',
            ]);
            expect(result.exitCode).toBeUndefined();
            expect(result.stdout).toBeTruthy();
        });
    });

    describe('update', () => {
        // All successful update flags produce the same Prism response
        it.each([
            ['--name', 'New Label Name'],
            ['--description', 'Updated description'],
            ['--color', '#ff0000'],
            ['--archived'],
        ])('should update a label with %s', async (...flag) => {
            const result = await runBin('short-label', ['update', MOCK_LABEL_NAME, ...flag]);
            expect(result.exitCode).toBeUndefined();
            expect(result.stdout).toBeTruthy();
        });

        it('should exit 1 when no update options provided', async () => {
            const result = await runBin('short-label', ['update', MOCK_LABEL_NAME]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": 1,
                "stderr": "",
                "stdout": "No updates provided. Use --name, --description, --color, or --archived
              Error updating label: process.exit(1)",
              }
            `);
        });

        it('should exit 1 when label not found', async () => {
            const result = await runBin('short-label', [
                'update',
                'nonexistent-label-xyz',
                '--name',
                'New Name',
            ]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": 1,
                "stderr": "",
                "stdout": "Label nonexistent-label-xyz not found
              Error updating label: process.exit(1)",
              }
            `);
        });
    });

    describe('stories', () => {
        it('should list stories for a label', async () => {
            const result = await runBin('short-label', ['stories', MOCK_LABEL_NAME]);
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
            const result = await runBin('short-label', ['stories', MOCK_LABEL_NAME, '--detailed']);
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
            const result = await runBin('short-label', [
                'stories',
                MOCK_LABEL_NAME,
                '--format',
                '%id %t',
            ]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "1 string",
              }
            `);
        });

        it('should exit 1 when label not found for stories', async () => {
            const result = await runBin('short-label', ['stories', 'nonexistent-label-xyz']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": 1,
                "stderr": "",
                "stdout": "Label nonexistent-label-xyz not found
              Error fetching label stories: process.exit(1)",
              }
            `);
        });
    });

    describe('epics', () => {
        it('should list epics for a label', async () => {
            const result = await runBin('short-label', ['epics', MOCK_LABEL_NAME]);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": undefined,
                "stderr": "",
                "stdout": "#1 string
              State:          string
              Started:        true
              Completed:      true
              URL:            string
              ",
              }
            `);
        });

        it('should exit 1 when label not found for epics', async () => {
            const result = await runBin('short-label', ['epics', 'nonexistent-label-xyz']);
            expect(result.output).toMatchInlineSnapshot(`
              {
                "exitCode": 1,
                "stderr": "",
                "stdout": "Label nonexistent-label-xyz not found
              Error fetching label epics: process.exit(1)",
              }
            `);
        });
    });
});
